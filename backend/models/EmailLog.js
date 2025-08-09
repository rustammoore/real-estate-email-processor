const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  email_id: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // User who processed this email
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  processed_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['processed', 'failed', 'skipped'],
    default: 'processed'
  },
  error_message: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
emailLogSchema.index({ processed_at: -1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ user: 1, processed_at: -1 });

// Compound unique index for email_id and user
emailLogSchema.index({ email_id: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EmailLog', emailLogSchema); 