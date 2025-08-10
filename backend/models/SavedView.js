const mongoose = require('mongoose');

const savedViewSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pageKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    searchTerm: {
      type: String,
      trim: true,
      default: '',
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sortBy: {
      type: String,
      trim: true,
      default: 'createdAt',
    },
    sortOrder: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'desc',
    },
    groupBy: {
      type: mongoose.Schema.Types.Mixed, // { field: String, order: 'asc'|'desc' }
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// A user cannot have two views with the same name on the same page
savedViewSchema.index({ owner: 1, pageKey: 1, name: 1 }, { unique: true });

// Virtual id and JSON cleanup
savedViewSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

savedViewSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const SavedView = mongoose.model('SavedView', savedViewSchema);
module.exports = SavedView;


