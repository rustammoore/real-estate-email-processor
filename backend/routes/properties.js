const express = require('express');
const Property = require('../models/Property');
const router = express.Router();

// Get all properties
router.get('/', async (req, res) => {
  try {
    const { status, archived } = req.query;
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (archived !== undefined) {
      filter.archived = archived === 'true';
    }
    
    const properties = await Property.find(filter)
      .sort({ createdAt: -1 });
    
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const {
      title, description, price, location, property_type,
      square_feet, bedrooms, bathrooms, status
    } = req.body;

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      {
        title, description, price, location, property_type,
        square_feet, bedrooms, bathrooms, status
      },
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

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

module.exports = router; 