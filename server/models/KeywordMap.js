const mongoose = require('mongoose');

const keywordMapSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  pageNumber: {
    type: Number,
    required: true
  },
  keywords: [{
    type: String,
    lowercase: true, // Store keywords in lowercase for case-insensitive search
    trim: true
  }],
  // Store additional metadata about the keywords
  keywordMeta: [{
    keyword: {
      type: String,
      required: true,
      lowercase: true
    },
    type: {
      type: String,
      enum: ['label', 'object', 'text'],
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound indexes for efficient searching
keywordMapSchema.index({ documentId: 1, pageNumber: 1 });
keywordMapSchema.index({ keywords: 1 });
keywordMapSchema.index({ 'keywordMeta.keyword': 1 });

const KeywordMap = mongoose.model('KeywordMap', keywordMapSchema);

module.exports = KeywordMap; 