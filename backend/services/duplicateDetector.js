const Property = require('../models/Property');

class DuplicateDetector {

  /**
   * Check if a property already exists based on address
   */
  async checkForDuplicates(property) {
    if (!property.location) {
      return {
        isDuplicate: false,
        existingProperties: []
      };
    }
    
    // Check for exact address match (case-insensitive)
    const existingProperties = await Property.find({
      location: { $regex: `^${property.location.trim()}$`, $options: 'i' },
      archived: false,
      _id: { $ne: property._id } // Exclude self if property has an ID
    });

    return {
      isDuplicate: existingProperties.length > 0,
      existingProperties
    };
  }

  /**
   * Find properties with similar addresses
   */
  async findSimilarAddresses(property) {
    if (!property.location) return [];

    const location = property.location.toLowerCase();
    const words = location.split(/\s+/).filter(word => word.length > 2);
    
    if (words.length === 0) return [];

    // Build a query to find properties with similar address words
    const conditions = words.map(word => ({
      location: { $regex: word, $options: 'i' }
    }));

    const similarProperties = await Property.find({
      $and: conditions,
      archived: false,
      _id: { $ne: property._id }
    });

    return similarProperties;
  }

  /**
   * Get all pending review properties
   */
  async getPendingReviewProperties() {
    return await Property.find({ 
      status: 'pending',
      archived: false 
    }).sort({ createdAt: -1 });
  }

  /**
   * Approve a duplicate property (replace original)
   */
  async approveDuplicate(duplicateId, originalId) {
    // Get the duplicate property
    const duplicate = await Property.findById(duplicateId);
    if (!duplicate) throw new Error('Duplicate property not found');

    // Update the original property with duplicate data
    await this.updateProperty(originalId, duplicate.toObject());
    
    // Delete the duplicate
    await this.deleteProperty(duplicateId);
  }

  /**
   * Reject a duplicate property (delete it)
   */
  async rejectDuplicate(duplicateId) {
    await this.deleteProperty(duplicateId);
  }

  /**
   * Update property data
   */
  async updateProperty(propertyId, newData) {
    const updateData = {
      title: newData.title,
      description: newData.description,
      price: newData.price,
      location: newData.location,
      property_type: newData.property_type,
      square_feet: newData.square_feet,
      bedrooms: newData.bedrooms,
      bathrooms: newData.bathrooms,
      images: newData.images,
      property_url: newData.property_url,
      email_source: newData.email_source,
      email_subject: newData.email_subject,
      email_date: newData.email_date
    };

    await Property.findByIdAndUpdate(propertyId, updateData, { new: true });
  }

  /**
   * Soft delete a property
   */
  async deleteProperty(propertyId) {
    await Property.findByIdAndUpdate(propertyId, { deleted: true });
  }

  /**
   * Check and handle duplicate for an existing property
   * This is the centralized function to detect and handle duplicates
   * @param {String} propertyId - ID of the property to check
   * @returns {Object} Result with isDuplicate flag and updated property
   */
  async checkAndHandleDuplicateForExisting(propertyId) {
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    // Skip if no location
    if (!property.location) {
      return {
        isDuplicate: false,
        property: property,
        message: 'No address to check'
      };
    }

    // Skip if property already marked as duplicate
    if (property.status === 'pending' && property.duplicate_of) {
      return {
        isDuplicate: true,
        property: property,
        message: 'Property is already marked as duplicate'
      };
    }

    // Find other properties with the same address (case-insensitive)
    const duplicates = await Property.find({
      location: { $regex: `^${property.location.trim()}$`, $options: 'i' },
      archived: false,
      _id: { $ne: propertyId }
    }).sort({ createdAt: 1 }); // Sort by creation date, oldest first

    if (duplicates.length > 0) {
      // Find the oldest property (original)
      const allProperties = [...duplicates, property].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      const original = allProperties[0];
      
      // If this property is not the original, mark it as duplicate
      if (property._id.toString() !== original._id.toString()) {
        property.status = 'pending';
        property.duplicate_of = original._id;
        await property.save();
        
        return {
          isDuplicate: true,
          property: property,
          original: original,
          message: `Property marked as duplicate of "${original.title}"`
        };
      }
    }

    return {
      isDuplicate: false,
      property: property,
      message: 'No duplicates found'
    };
  }
}

module.exports = new DuplicateDetector(); 