const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  // User who owns this property listing (optional for now during migration)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: String,
    trim: true
  },
  cap_rate: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  property_type: {
    type: String,
    trim: true
  },
  sub_type: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2,
  },
  square_feet: {
    type: String,
    trim: true
  },
  acre: {
    type: String,
    trim: true
  },
  year_built: {
    type: String,
    trim: true
  },
  bedrooms: {
    type: String,
    trim: true
  },
  bathrooms: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  property_url: {
    type: String,
    trim: true
  },
  for_lease_info: {
    type: String,
    trim: true
  },
  other: {
    type: String,
    trim: true
  },
  procured: {
    type: String,
    trim: true
  },
  email_source: {
    type: String,
    trim: true
  },
  email_subject: {
    type: String,
    trim: true
  },
  email_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'sold', 'archived'],
    default: 'active'
  },
  duplicate_of: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  address_hash: {
    type: String,
    trim: true
  },
  liked: {
    type: Boolean,
    default: false
  },
  loved: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  archived: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date,
    default: null
  },
  followUpSet: {
    type: Date,
    default: null
  },
  lastFollowUpDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for better query performance
propertySchema.index({ status: 1, archived: 1 });
propertySchema.index({ email_date: -1 });
// Make address_hash index sparse to allow null values
propertySchema.index({ address_hash: 1 }, { sparse: true });

// Virtual for id field (maps _id to id)
propertySchema.virtual('id').get(function() {
  return this._id;
});

// Ensure virtual fields are serialized
propertySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Property', propertySchema); 