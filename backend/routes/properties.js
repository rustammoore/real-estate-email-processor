const express = require('express');
const Property = require('../models/Property');
const { protect, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Small helper to escape regex special chars in user input
const escapeRegExp = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Create property (requires auth) with basic duplicate detection
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      property_type,
      square_feet,
      bedrooms,
      bathrooms,
      images,
      property_url,
      email_source,
      email_subject,
      email_date
    } = req.body || {};

    if (!title || !location) {
      return res.status(400).json({ error: 'Both title and location are required' });
    }

    // Normalize/prepare create payload
    const createPayload = {
      title,
      description,
      price,
      location,
      property_type,
      square_feet,
      bedrooms,
      bathrooms,
      images: Array.isArray(images) ? images : (images ? [images] : []),
      property_url,
      email_source,
      email_subject,
      // If client passes email_date string, coerce to Date
      email_date: email_date ? new Date(email_date) : undefined,
      user: req.user ? req.user._id : undefined
    };

    // Basic duplicate detection by location (case-insensitive exact match), excluding deleted
    const normalizedLocation = String(location).trim();
    let originalProperty = null;
    if (normalizedLocation) {
      originalProperty = await Property.findOne({
        location: { $regex: new RegExp(`^${escapeRegExp(normalizedLocation)}$`, 'i') },
        deleted: false,
      }).select('-__v');
    }

    let isDuplicate = false;
    if (originalProperty) {
      isDuplicate = true;
      createPayload.status = 'pending';
      createPayload.duplicate_of = originalProperty._id;
    } else {
      createPayload.status = 'active';
    }

    const property = await Property.create(createPayload);

    return res.status(201).json({
      success: true,
      message: isDuplicate
        ? 'Property created and marked as duplicate for review'
        : 'Property created successfully',
      isDuplicate,
      originalProperty: originalProperty || null,
      property,
    });
  } catch (error) {
    console.error('Error creating property:', error);
    return res.status(500).json({ error: 'Failed to create property' });
  }
});

// Get all properties (optional auth) with pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, archived, deleted, page = 1, limit = 25 } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (archived !== undefined) {
      filter.archived = archived === 'true';
    }
    
    // Exclude deleted by default unless explicitly requested
    if (deleted !== undefined) {
      filter.deleted = deleted === 'true';
    } else {
      filter.deleted = false;
    }
    
    const query = Property.find(filter)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .select('-__v')
      .lean();

    const [rawItems, total] = await Promise.all([
      query,
      Property.countDocuments(filter)
    ]);

    const items = rawItems.map((doc) => {
      const { _id, ...rest } = doc;
      return { id: String(_id || rest.id), ...rest };
    });

    res.json({
      items,
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit)
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property (optional auth)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).select('-__v');
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Update property (requires auth) with input filtering
router.put('/:id', protect, async (req, res) => {
  try {
    // Allow updates to both core fields and interaction/follow-up fields
    const allowedFields = [
      'title', 'description', 'price', 'location', 'property_type',
      'square_feet', 'bedrooms', 'bathrooms', 'status',
      'liked', 'loved', 'rating', 'archived', 'deleted',
      'followUpDate', 'followUpSet', 'lastFollowUpDate'
    ];

    const update = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        update[field] = req.body[field];
      }
    }

    // Basic server-side validation for rating and date formats
    if (Object.prototype.hasOwnProperty.call(update, 'rating')) {
      const rating = Number(update.rating);
      if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
        return res.status(400).json({ error: 'Rating must be a number between 0 and 10' });
      }
      update.rating = rating;
    }

    const dateFields = ['followUpDate', 'followUpSet', 'lastFollowUpDate'];
    for (const df of dateFields) {
      if (Object.prototype.hasOwnProperty.call(update, df) && update[df] !== null) {
        const dateValue = new Date(update[df]);
        if (Number.isNaN(dateValue.getTime())) {
          return res.status(400).json({ error: `${df} must be a valid date` });
        }
        update[df] = dateValue;
      }
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ success: true, message: 'Property updated successfully', property });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property (requires auth)
// Soft delete: mark as deleted
router.delete('/:id', protect, async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { deleted: true },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ success: true, message: 'Property moved to deleted', property });
  } catch (error) {
    console.error('Error soft-deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Permanent delete: actually remove document (requires auth)
router.delete('/:id/permanent', protect, async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ success: true, message: 'Property permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting property:', error);
    res.status(500).json({ error: 'Failed to permanently delete property' });
  }
});

module.exports = router; 