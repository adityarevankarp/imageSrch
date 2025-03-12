const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  pageNumber: {
    type: Number,
    required: true
  },
  format: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  analysis: {
    text: String,
    labels: [{
      description: String,
      score: Number
    }],
    objects: [{
      name: String,
      score: Number,
      boundingBox: {
        left: Number,
        top: Number,
        right: Number,
        bottom: Number
      }
    }],
    description: String,
    safeSearch: {
      adult: String,
      violence: String,
      racy: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'analyzed', 'failed'],
    default: 'pending'
  },
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
imageSchema.index({ documentId: 1, pageNumber: 1 });
imageSchema.index({ 'analysis.labels.description': 'text', 'analysis.text': 'text' });

const Image = mongoose.model('Image', imageSchema);

module.exports = Image; 