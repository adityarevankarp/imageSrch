const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs').promises; // Change to promises version for async/await

class VisionService {
  constructor() {
    // Initialize with explicit credentials path using absolute path
    const credentialsPath = path.join(process.cwd(), 'server', 'config', 'pacific-formula-453317-i0-f007f2797876.json');
    
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: './config/pacific-formula-453317-i0-f007f2797876.json'
    });
    this.imagesPath = path.join(process.cwd(), 'uploads', 'images');
  }

  async analyzeImage(documentIdOrPath, filename = null) {
    try {
      let imagePath;
      let documentId;

      console.log('Input parameters:', { documentIdOrPath, filename }); // Debug log

      // Handle case where full path is passed as documentId
      if (documentIdOrPath.includes('page-') && !filename) {
        // Extract documentId and filename from the path
        const parts = documentIdOrPath.split('/');
        documentId = parts[0];
        filename = parts[1];
        console.log('Extracted from path:', { documentId, filename }); // Debug log
      } else {
        documentId = documentIdOrPath;
      }

      // Validate parameters
      if (!documentId || !filename) {
        throw new Error(`Invalid parameters: documentId=${documentId}, filename=${filename}`);
      }

      // Construct the full path
      imagePath = path.join(this.imagesPath, documentId, filename);
      console.log('Constructed image path:', imagePath); // Debug log

      // List files in the directory to debug
      try {
        const files = await fs.readdir(path.dirname(imagePath));
        console.log('Files in directory:', files); // Debug log
      } catch (error) {
        console.error('Error reading directory:', error);
      }

      // Check if file exists
      try {
        await fs.access(imagePath);
        console.log('File exists at path:', imagePath); // Debug log
      } catch (error) {
        console.error('File not found:', imagePath);
        throw new Error(`Image file not found at path: ${imagePath}`);
      }
      
      console.log('Analyzing image at path:', imagePath);
      
      // Perform multiple detection tasks in parallel
      const [
        textResult,
        labelResult,
        objectResult,
        safeSearchResult
      ] = await Promise.all([
        this.client.textDetection(imagePath),
        this.client.labelDetection(imagePath),
        this.client.objectLocalization(imagePath),
        this.client.safeSearchDetection(imagePath)
      ]);

      // Extract text
      const text = textResult[0].fullTextAnnotation
        ? textResult[0].fullTextAnnotation.text
        : '';

      // Extract labels
      const labels = labelResult[0].labelAnnotations.map(label => ({
        description: label.description,
        score: label.score
      }));

      // Extract objects
      const objects = objectResult[0].localizedObjectAnnotations.map(obj => ({
        name: obj.name,
        score: obj.score,
        boundingBox: {
          left: Math.min(...obj.boundingPoly.normalizedVertices.map(v => v.x)),
          top: Math.min(...obj.boundingPoly.normalizedVertices.map(v => v.y)),
          right: Math.max(...obj.boundingPoly.normalizedVertices.map(v => v.x)),
          bottom: Math.max(...obj.boundingPoly.normalizedVertices.map(v => v.y))
        }
      }));

      // Extract safe search
      const safeSearch = safeSearchResult[0].safeSearchAnnotation;

      return {
        text,
        labels,
        objects,
        safeSearch: {
          adult: safeSearch.adult,
          violence: safeSearch.violence,
          racy: safeSearch.racy
        }
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      console.error('Parameters:', { documentIdOrPath, filename }); // Debug log
      throw error;
    }
  }

  // Helper method to get the correct image path
  getImagePath(documentId, filename) {
    if (!documentId || !filename) {
      throw new Error(`Invalid parameters: documentId=${documentId}, filename=${filename}`);
    }
    return path.join(this.imagesPath, documentId, filename);
  }
}

module.exports = new VisionService(); 