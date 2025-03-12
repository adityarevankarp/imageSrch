const fs = require('fs').promises;
const path = require('path');
const poppler = require('pdf-poppler');
const { PDFDocument } = require('pdf-lib');

class PDFService {
  constructor() {
    this.documentsPath = path.join(process.cwd(), 'uploads', 'documents');
    this.imagesPath = path.join(process.cwd(), 'uploads', 'images');
  }

  async extractImages(documentId, filename) {
    try {
      const pdfPath = path.join(this.documentsPath, filename);
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();

      // Create a directory for this document's images
      const outputDir = path.join(this.imagesPath, documentId);
      await fs.mkdir(outputDir, { recursive: true });

      // Configure pdf-poppler options
      const opts = {
        format: 'jpeg',
        out_dir: outputDir,
        out_prefix: 'page',
        scale: 1000 // Higher scale = better quality
      };

      // Convert PDF to images
      await poppler.convert(pdfPath, opts);

      // Get the generated image files
      const files = await fs.readdir(outputDir);
      const imageFiles = files.filter(file => file.endsWith('.jpg'));

      // Process each image
      const extractedImages = await Promise.all(imageFiles.map(async (file, index) => {
        const page = pdfDoc.getPages()[index];
        const { width, height } = page.getSize();

        return {
          filename: `${documentId}/${file}`,
          pageNumber: index + 1,
          format: 'jpeg',
          width,
          height,
          path: path.join(this.imagesPath, documentId, file),
          relativePath: path.join('uploads', 'images', documentId, file)
        };
      }));

      return {
        pageCount,
        images: extractedImages
      };
    } catch (error) {
      console.error('Error extracting images:', error);
      throw error;
    }
  }

  async deleteDocument(filename) {
    try {
      const filePath = path.join(this.documentsPath, filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async deleteImage(documentId, filename) {
    try {
      const filePath = path.join(this.imagesPath, documentId, filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  getImagePath(documentId, filename) {
    return path.join(this.imagesPath, documentId, filename);
  }
}

module.exports = new PDFService(); 