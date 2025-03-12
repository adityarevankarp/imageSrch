const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const Document = require('../models/Document');

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