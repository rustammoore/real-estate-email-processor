const express = require('express');
const mongoose = require('mongoose');
const Property = require('../models/Property');
const { protect, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Address normalization helper
function normalizeAddress(input = '') {
  const str = String(input || '').toLowerCase();
  // Collapse whitespace, remove punctuation commonly found in addresses
  const cleaned = str
    .replace(/[\.,#]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')    // collapse spaces
    .trim();
  return cleaned || null;
}

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
      CustomFieldOne,
      CustomFieldTwo,
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
    // Normalize state to two-letter uppercase code; drop if invalid/empty to avoid validation errors
    const normalizedState = (typeof state === 'string')
      ? state.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase()
      : undefined;
    const stateValue = normalizedState && normalizedState.length === 2 ? normalizedState : undefined;
    const address_hash = normalizeAddress(location);

    const createPayload = {
      title,
      description,
      price,
      cap_rate,
      location,
      address_hash,
      property_type,
      sub_type,
      state: stateValue,
      square_feet,
      acre,
      year_built,
      CustomFieldOne,
      CustomFieldTwo,
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

    // Duplicate detection via normalized address hash, excluding archived/deleted
    let originalProperty = null;
    if (address_hash) {
      originalProperty = await Property.findOne({
        address_hash,
        deleted: false,
        archived: false,
      }).sort({ createdAt: 1 }).select('-__v');
    }

    let isDuplicate = false;
    if (originalProperty) {
      // Newer property should be pending review and reference the original
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
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
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
      const normalizeNumber = (val) => {
        if (typeof val === 'number') return Number.isFinite(val) ? val : NaN;
        if (typeof val !== 'string') return NaN;
        const cleaned = val.replace(/[^0-9.\-]/g, '');
        const num = parseFloat(cleaned);
        return Number.isFinite(num) ? num : NaN;
      };
      const priceNum = normalizeNumber(rest.price);
      const sqftNum = normalizeNumber(rest.square_feet);
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
    const property = await Property.findById(id).select('-__v').lean();
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const data = property;
    const priceNum = parseFloat(data.price);
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

// Get all properties that conflict by normalized address with the given property
router.get('/:id/conflicts', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const base = await Property.findById(id).select('-__v');
    if (!base) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const address_hash = base.address_hash || normalizeAddress(base.location || '');
    if (!address_hash) {
      return res.json({ items: [] });
    }
    const items = await Property.find({ address_hash }).sort({ createdAt: 1 }).select('-__v').lean();
    const normalized = items.map((doc) => {
      const { _id, ...rest } = doc;
      return { id: String(_id || rest.id), ...rest };
    });
    res.json({ items: normalized });
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    res.status(500).json({ error: 'Failed to fetch conflicts' });
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
      'state', 'square_feet', 'acre', 'year_built', 'CustomFieldOne', 'CustomFieldTwo', 'status', 'cap_rate',
      'liked', 'loved', 'rating', 'archived', 'reviewed', 'deleted',
      'followUpDate', 'followUpSet', 'lastFollowUpDate',
      'for_lease_info', 'other', 'procured', 'property_url'
    ];

    const update = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        update[field] = req.body[field];
      }
    }
    // No legacy mapping

    // Maintain address_hash when location changes
    if (Object.prototype.hasOwnProperty.call(update, 'location')) {
      const nextLocation = update.location;
      const hash = normalizeAddress(nextLocation);
      if (hash) {
        update.address_hash = hash;
        // If another active (not archived/deleted) property already has this address, mark this as pending review
        const conflicting = await Property.findOne({
          address_hash: hash,
          deleted: false,
          archived: false,
          _id: { $ne: id },
        }).select('_id');
        if (conflicting) {
          update.status = 'pending';
        }
      } else {
        // Unset if location is cleared or invalid
        update.$unset = { ...(update.$unset || {}), address_hash: '' };
      }
    }

    // Allow images updates as well when editing
    if (Object.prototype.hasOwnProperty.call(req.body, 'images')) {
      update.images = Array.isArray(req.body.images)
        ? req.body.images
        : (req.body.images ? [req.body.images] : []);
    }

    // Normalize state to two-letter uppercase or unset if invalid/empty
    if (Object.prototype.hasOwnProperty.call(update, 'state')) {
      const raw = typeof update.state === 'string' ? update.state : '';
      const normalized = raw.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
      if (normalized.length === 2) {
        update.state = normalized;
      } else {
        delete update.state;
        update.$unset = { ...(update.$unset || {}), state: '' };
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
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
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

// Pending review (computed): list properties where address_hash collides among active (not archived/deleted)
router.get('/pending-review/all', optionalAuth, async (req, res) => {
  try {
    // Step 1: find address_hash groups with >1 active property
    const groups = await Property.aggregate([
      { $match: { deleted: false, archived: false, address_hash: { $ne: null } } },
      { $group: { _id: '$address_hash', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $project: { _id: 0, address_hash: '$_id' } }
    ]);

    const hashes = groups.map((g) => g.address_hash);
    if (hashes.length === 0) {
      return res.json({ items: [], page: 1, limit: hashes.length, total: 0, totalPages: 0 });
    }

    // Step 2: return all active properties for those hashes
    const items = await Property.find({
      address_hash: { $in: hashes },
      deleted: false,
      archived: false,
    })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    const normalized = items.map((doc) => {
      const { _id, ...rest } = doc;
      return { id: String(_id || rest.id), ...rest };
    });

    res.json({ items: normalized, page: 1, limit: normalized.length, total: normalized.length, totalPages: 1 });
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

    // Cascade: for any other active properties sharing the same address_hash, move them to deleted pending and link to promoted
    try {
      const addressHash = promoted.address_hash || normalizeAddress(promoted.location || '');
      if (addressHash) {
        await Property.updateMany(
          {
            address_hash: addressHash,
            deleted: false,
            archived: false,
            _id: { $ne: promoted._id },
          },
          {
            $set: { status: 'pending', deleted: true, duplicate_of: promoted._id },
          }
        );
      }
    } catch (e) {
      // Log but do not fail the main approval action
      console.warn('Cascade demotion failed:', e?.message || e);
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

// Pending review: reject duplicate (move to deleted and keep status pending for traceability)
router.post('/pending-review/:duplicateId/reject', protect, async (req, res) => {
  try {
    const { duplicateId } = req.params;
    const duplicate = await Property.findById(duplicateId);
    if (!duplicate) {
      return res.status(404).json({ error: 'Duplicate property not found' });
    }

    // Move duplicate to deleted (soft delete) and compute address_hash for consistency
    duplicate.deleted = true;
    duplicate.archived = false;
    duplicate.status = 'pending';
    if (duplicate.location) {
      duplicate.address_hash = normalizeAddress(duplicate.location);
    }
    const saved = await duplicate.save();

    return res.json({ success: true, message: 'Duplicate rejected and moved to deleted', property: saved });
  } catch (error) {
    console.error('Error rejecting duplicate:', error);
    return res.status(500).json({ error: 'Failed to reject duplicate' });
  }
});

module.exports = router; 