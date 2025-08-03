const express = require('express');
const { query, run } = require('../database/database');
const router = express.Router();

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await query(`
      SELECT * FROM properties 
      ORDER BY created_at DESC
    `);
    
    // Parse images JSON for each property
    const formattedProperties = properties.map(property => ({
      ...property,
      images: JSON.parse(property.images || '[]')
    }));
    
    res.json(formattedProperties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const properties = await query(
      'SELECT * FROM properties WHERE id = ?',
      [req.params.id]
    );
    
    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const property = properties[0];
    property.images = JSON.parse(property.images || '[]');
    
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

    const sql = `
      UPDATE properties SET 
        title = ?, description = ?, price = ?, location = ?,
        property_type = ?, square_feet = ?, bedrooms = ?, 
        bathrooms = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await run(sql, [
      title, description, price, location, property_type,
      square_feet, bedrooms, bathrooms, status, req.params.id
    ]);

    res.json({ success: true, message: 'Property updated successfully' });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM properties WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

module.exports = router; 