const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const Document = require('../models/Document');
const KeywordMap = require('../models/KeywordMap');

// Keyword-based search
router.get('/keywords', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search in KeywordMap
    const results = await KeywordMap.find({
      keywords: { $regex: new RegExp(q, 'i') }
    })
    .populate('documentId', 'originalName filename status')
    .sort({ pageNumber: 1 });

    // Format results
    const formattedResults = results.map(result => {
      const matchedKeywords = result.keywordMeta
        .filter(meta => meta.keyword.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.confidence - a.confidence);

      return {
        documentId: result.documentId._id,
        documentName: result.documentId.originalName || result.documentId.filename,
        documentStatus: result.documentId.status,
        pageNumber: result.pageNumber,
        matchedKeywords: matchedKeywords.map(meta => ({
          keyword: meta.keyword,
          type: meta.type,
          confidence: Math.round(meta.confidence * 100)
        }))
      };
    });

    res.json({
      results: formattedResults,
      total: formattedResults.length
    });
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
});

// Text-based search
router.get('/text', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await Image.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .populate('documentId', 'originalName')
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Image.countDocuments({ $text: { $search: q } });

    res.json({
      results,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Search by content/objects
router.get('/content', async (req, res, next) => {
  try {
    const { object, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!object) {
      return res.status(400).json({ error: 'Object query is required' });
    }

    const results = await Image.find({
      'analysis.objects.name': { 
        $regex: new RegExp(object, 'i')
      }
    })
    .populate('documentId', 'originalName')
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Image.countDocuments({
      'analysis.objects.name': { 
        $regex: new RegExp(object, 'i')
      }
    });

    res.json({
      results,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get unique labels and objects that match the query
    const [labelSuggestions, objectSuggestions] = await Promise.all([
      Image.distinct('analysis.labels.description', {
        'analysis.labels.description': { 
          $regex: new RegExp(q, 'i')
        }
      }),
      Image.distinct('analysis.objects.name', {
        'analysis.objects.name': { 
          $regex: new RegExp(q, 'i')
        }
      })
    ]);

    const suggestions = [...new Set([...labelSuggestions, ...objectSuggestions])]
      .slice(0, 10);

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 