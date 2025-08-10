const express = require('express');
const SavedView = require('../models/SavedView');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// List views for a pageKey (user-specific)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { pageKey } = req.query;
    if (!pageKey) {
      return res.status(400).json({ error: 'pageKey is required' });
    }

    if (!req.user) {
      return res.json({ items: [] });
    }

    const views = await SavedView.find({ owner: req.user._id, pageKey })
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean();

    // If user is authenticated, also include which one is their default for this page
    res.json({ items: views });
  } catch (error) {
    console.error('Error listing saved views:', error);
    res.status(500).json({ error: 'Failed to list saved views' });
  }
});

// Create new view (private by default)
router.post('/', protect, async (req, res) => {
  try {
    const { pageKey, name, description, searchTerm, filters, sortBy, sortOrder } = req.body || {};
    if (!pageKey || !name) {
      return res.status(400).json({ error: 'pageKey and name are required' });
    }

    const view = await SavedView.create({
      owner: req.user._id,
      pageKey,
      name,
      description: description || '',
      searchTerm: searchTerm || '',
      filters: filters || {},
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    });

    res.status(201).json(view);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'A view with this name already exists for this page' });
    }
    console.error('Error creating saved view:', error);
    res.status(500).json({ error: 'Failed to create saved view' });
  }
});

// Update a view (only owner)
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['name', 'description', 'searchTerm', 'filters', 'sortBy', 'sortOrder'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const view = await SavedView.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      { $set: update },
      { new: true }
    );
    if (!view) return res.status(404).json({ error: 'View not found' });
    res.json(view);
  } catch (error) {
    console.error('Error updating saved view:', error);
    res.status(500).json({ error: 'Failed to update saved view' });
  }
});

// Delete a view (only owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SavedView.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!result) return res.status(404).json({ error: 'View not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved view:', error);
    res.status(500).json({ error: 'Failed to delete saved view' });
  }
});

// Set default view for a page (clears previous default for this owner+page)
router.post('/:id/default', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const view = await SavedView.findOne({ _id: id, owner: req.user._id });
    if (!view) return res.status(404).json({ error: 'View not found' });

    // Clear previous default for this user and page
    await SavedView.updateMany({ owner: req.user._id, pageKey: view.pageKey, isDefault: true }, { $set: { isDefault: false } });
    view.isDefault = true;
    await view.save();

    res.json({ success: true, view });
  } catch (error) {
    console.error('Error setting default view:', error);
    res.status(500).json({ error: 'Failed to set default view' });
  }
});

// Clear default view for a page (set "None" as default)
router.post('/default/clear', protect, async (req, res) => {
  try {
    const { pageKey } = req.body || {};
    if (!pageKey) return res.status(400).json({ error: 'pageKey is required' });

    await SavedView.updateMany({ owner: req.user._id, pageKey, isDefault: true }, { $set: { isDefault: false } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error clearing default view:', error);
    res.status(500).json({ error: 'Failed to clear default view' });
  }
});

module.exports = router;


