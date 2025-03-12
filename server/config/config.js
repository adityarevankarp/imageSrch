require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-image-search'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS
  },
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:3001'
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50') * 1024 * 1024 // Convert MB to bytes
  }
};

module.exports = config; 