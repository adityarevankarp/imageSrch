const Queue = require('bull');
const config = require('../config/config');
const pdfService = require('./pdfService');
const visionService = require('./visionService');
const Document = require('../models/Document');
const Image = require('../models/Image');

// Create processing queues
const documentQueue = new Queue('document-processing', config.redis.url, {
  settings: {
    lockDuration: 300000, // 5 minutes
    stalledInterval: 30000, // 30 seconds
  }
});

const imageQueue = new Queue('image-analysis', config.redis.url, {
  settings: {
    lockDuration: 300000,
    stalledInterval: 30000,
  }
});

// Process documents
documentQueue.process(async (job) => {
  const { documentId, filename } = job.data;
  console.log(`Starting document processing for ${documentId}, filename: ${filename}`);
  
  try {
    // Update document status
    await Document.findByIdAndUpdate(documentId, {
      status: 'processing',
      processingProgress: 0
    });
    console.log(`Updated document ${documentId} status to processing`);

    // Extract images from PDF
    console.log(`Extracting images from document ${documentId}`);
    const { pageCount, images } = await pdfService.extractImages(documentId, filename);
    console.log(`Extracted ${images.length} images from document ${documentId}`);
    
    // Update document with page count
    await Document.findByIdAndUpdate(documentId, {
      pageCount,
      processingProgress: 50
    });
    console.log(`Updated document ${documentId} with page count ${pageCount}`);

    // Add each image to analysis queue
    for (const image of images) {
      const imageDoc = new Image({
        documentId,
        ...image
      });
      await imageDoc.save();
      console.log(`Saved image ${imageDoc._id} for document ${documentId}`);
      
      // Add to image analysis queue
      await imageQueue.add({
        imageId: imageDoc._id,
        filename: image.filename
      });
      console.log(`Added image ${imageDoc._id} to analysis queue`);
    }

    return { success: true, pageCount, imageCount: images.length };
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      error: error.message
    });
    throw error;
  }
});

// Process images
imageQueue.process(async (job) => {
  const { imageId, filename } = job.data;
  console.log(`Starting image analysis for ${imageId}, filename: ${filename}`);

  try {
    // Analyze image with Vision API
    console.log(`Analyzing image ${imageId} with Vision API`);
    const analysis = await visionService.analyzeImage(filename);
    
    // Update image with analysis results
    await Image.findByIdAndUpdate(imageId, {
      analysis,
      status: 'analyzed'
    });
    console.log(`Updated image ${imageId} with analysis results`);

    // Check if all images for the document are processed
    const image = await Image.findById(imageId);
    const pendingImages = await Image.countDocuments({
      documentId: image.documentId,
      status: 'pending'
    });

    console.log(`Document ${image.documentId} has ${pendingImages} pending images`);

    if (pendingImages === 0) {
      // All images processed, update document status
      await Document.findByIdAndUpdate(image.documentId, {
        status: 'completed',
        processingProgress: 100
      });
      console.log(`Completed processing for document ${image.documentId}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Error analyzing image ${imageId}:`, error);
    await Image.findByIdAndUpdate(imageId, {
      status: 'failed',
      error: error.message
    });
    throw error;
  }
});

// Handle queue events
documentQueue.on('completed', (job, result) => {
  console.log(`Document job ${job.id} completed:`, result);
});

documentQueue.on('failed', async (job, error) => {
  console.error(`Document processing failed for job ${job.id}:`, error);
  if (job.data.documentId) {
    await Document.findByIdAndUpdate(job.data.documentId, {
      status: 'failed',
      error: error.message
    });
  }
});

imageQueue.on('completed', (job, result) => {
  console.log(`Image analysis job ${job.id} completed:`, result);
});

imageQueue.on('failed', async (job, error) => {
  console.error(`Image analysis failed for job ${job.id}:`, error);
  if (job.data.imageId) {
    await Image.findByIdAndUpdate(job.data.imageId, {
      status: 'failed',
      error: error.message
    });
  }
});

// Monitor queue health
async function checkQueueHealth() {
  const docStats = await documentQueue.getJobCounts();
  const imgStats = await imageQueue.getJobCounts();
  console.log('Queue Stats:', {
    documents: docStats,
    images: imgStats
  });
}

// Check queue health every minute
setInterval(checkQueueHealth, 60000);

// Clean up completed and failed jobs
async function cleanupQueues() {
  try {
    // Remove jobs older than 1 hour
    const oneHourAgo = Date.now() - 3600000;
    
    // Clean up completed jobs
    await documentQueue.clean(oneHourAgo, 'completed');
    await imageQueue.clean(oneHourAgo, 'completed');
    
    // Clean up failed jobs
    await documentQueue.clean(oneHourAgo, 'failed');
    await imageQueue.clean(oneHourAgo, 'failed');
    
    console.log('Queue cleanup completed');
  } catch (error) {
    console.error('Error cleaning up queues:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupQueues, 3600000);

module.exports = {
  addDocument: async (documentId, filename) => {
    console.log(`Adding document to queue: ${documentId}, ${filename}`);
    const job = await documentQueue.add({ documentId, filename });
    console.log(`Added document to queue with job id: ${job.id}`);
    return job;
  },
  getDocumentQueue: () => documentQueue,
  getImageQueue: () => imageQueue,
  cleanupQueues // Export the cleanup function
}; 