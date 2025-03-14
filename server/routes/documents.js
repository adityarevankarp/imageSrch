const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const Document = require('../models/Document');
const queueService = require('../services/queueService');
const fs = require('fs').promises;

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
  const dirs = ['uploads/documents', 'uploads/images'];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Ensure upload directories exist
createUploadsDir();

// Configure multer for PDF upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Upload a new document
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      pageCount: 0, // Will be updated during processing
      status: 'pending'
    });

    await document.save();
    
    // Add document to processing queue
    console.log('Adding document to queue:', document._id, req.file.filename);
    await queueService.addDocument(document._id, req.file.filename);
    
    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        filename: document.originalName,
        status: document.status
      }
    });
  } catch (error) {
    console.error('Error in document upload:', error);
    next(error);
  }
});

// Get document by ID
router.get('/:id', async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Get all documents (with pagination)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const documents = await Document.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments();

    res.json({
      documents,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete document
router.delete('/:id', async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete the document file
    const filePath = path.join('uploads/documents', document.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete the document from database
    await document.deleteOne();
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get PDF file
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join('uploads/documents', document.filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 