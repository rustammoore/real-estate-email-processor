const express = require('express');
const mongoose = require('mongoose');
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
      cap_rate,
      location,
      property_type,
      sub_type,
      state,
      square_feet,
      acre,
      year_built,
      bedrooms,
      bathrooms,
      images,
      property_url,
      for_lease_info,
      other,
      procured,
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
      cap_rate,
      location,
      property_type,
      sub_type,
      state,
      square_feet,
      acre,
      year_built,
      bedrooms,
      bathrooms,
      images: Array.isArray(images) ? images : (images ? [images] : []),
      property_url,
      for_lease_info,
      other,
      procured,
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
      const id = String(_id || rest.id);
      // Compute price per ft if possible
      let price_per_ft = null;
      const priceNum = parseFloat(rest.price);
      const sqftNum = parseFloat(rest.square_feet);
      if (Number.isFinite(priceNum) && Number.isFinite(sqftNum) && sqftNum > 0) {
        price_per_ft = priceNum / sqftNum;
      }
      return { id, ...rest, price_per_ft };
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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const property = await Property.findById(id).select('-__v');
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const data = property.toObject();
    const priceNum = parseFloat(data.price);
    const sqftNum = parseFloat(data.square_feet);
    let price_per_ft = null;
    if (Number.isFinite(priceNum) && Number.isFinite(sqftNum) && sqftNum > 0) {
      price_per_ft = priceNum / sqftNum;
    }
    res.json({ ...data, price_per_ft });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Update property (requires auth) with input filtering
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    // Allow updates to both core fields and interaction/follow-up fields
    const allowedFields = [
      'title', 'description', 'price', 'location', 'property_type', 'sub_type',
      'state', 'square_feet', 'acre', 'year_built', 'bedrooms', 'bathrooms', 'status', 'cap_rate',
      'liked', 'loved', 'rating', 'archived', 'deleted',
      'followUpDate', 'followUpSet', 'lastFollowUpDate',
      'for_lease_info', 'other', 'procured', 'property_url'
    ];

    const update = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        update[field] = req.body[field];
      }
    }
    // Allow images updates as well when editing
    if (Object.prototype.hasOwnProperty.call(req.body, 'images')) {
      update.images = Array.isArray(req.body.images)
        ? req.body.images
        : (req.body.images ? [req.body.images] : []);
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
      id,
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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const property = await Property.findByIdAndUpdate(
      id,
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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const property = await Property.findByIdAndDelete(id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ success: true, message: 'Property permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting property:', error);
    res.status(500).json({ error: 'Failed to permanently delete property' });
  }
});

// Pending review: list ALL pending properties regardless of deleted flag
router.get('/pending-review/all', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 1000 } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 1000, 1), 2000);

    const filter = { status: 'pending' };

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
    console.error('Error fetching pending review properties:', error);
    res.status(500).json({ error: 'Failed to fetch pending review properties' });
  }
});

// Pending review: approve duplicate (promote one, demote the other)
router.post('/pending-review/:duplicateId/approve', protect, async (req, res) => {
  try {
    const { originalId, promote = 'duplicate' } = req.body || {};
    const { duplicateId } = req.params;

    if (!originalId) {
      return res.status(400).json({ error: 'originalId is required' });
    }

    const [duplicate, original] = await Promise.all([
      Property.findById(duplicateId),
      Property.findById(originalId)
    ]);

    if (!duplicate || !original) {
      return res.status(404).json({ error: 'Duplicate or original property not found' });
    }

    // Validate relation when promoting duplicate
    if (promote === 'duplicate') {
      const dupOf = String(duplicate.duplicate_of || '');
      if (dupOf && dupOf !== String(original._id)) {
        return res.status(400).json({ error: 'Duplicate does not reference the provided original property' });
      }
    }

    let promoted, demoted;
    if (promote === 'duplicate') {
      // Promote duplicate to active, clear duplicate_of, ensure not deleted
      duplicate.status = 'active';
      duplicate.deleted = false;
      duplicate.archived = false;
      duplicate.duplicate_of = undefined;
      promoted = await duplicate.save();

      // Demote original: pending review but in deleted bucket
      original.status = 'pending';
      original.deleted = true;
      // Link demoted original to the promoted duplicate for comparison flow
      original.duplicate_of = promoted._id;
      demoted = await original.save();
    } else if (promote === 'original') {
      // Promote original to active
      original.status = 'active';
      original.deleted = false;
      original.archived = false;
      const savedOriginal = await original.save();

      // Demote duplicate to pending + deleted, reference original
      duplicate.status = 'pending';
      duplicate.deleted = true;
      duplicate.duplicate_of = savedOriginal._id;
      const savedDuplicate = await duplicate.save();

      promoted = savedOriginal;
      demoted = savedDuplicate;
    } else {
      return res.status(400).json({ error: "Invalid 'promote' value. Use 'duplicate' or 'original'" });
    }

    return res.json({
      success: true,
      message: 'Duplicate approval processed',
      promoted,
      demoted,
    });
  } catch (error) {
    console.error('Error approving duplicate:', error);
    return res.status(500).json({ error: 'Failed to approve duplicate' });
  }
});

// Pending review: reject duplicate (archive/delete the duplicate)
router.post('/pending-review/:duplicateId/reject', protect, async (req, res) => {
  try {
    const { duplicateId } = req.params;
    const duplicate = await Property.findById(duplicateId);
    if (!duplicate) {
      return res.status(404).json({ error: 'Duplicate property not found' });
    }

    // Move duplicate to deleted (soft delete) and keep status as pending for traceability
    duplicate.deleted = true;
    const saved = await duplicate.save();

    return res.json({ success: true, message: 'Duplicate rejected and moved to deleted', property: saved });
  } catch (error) {
    console.error('Error rejecting duplicate:', error);
    return res.status(500).json({ error: 'Failed to reject duplicate' });
  }
});

module.exports = router; 