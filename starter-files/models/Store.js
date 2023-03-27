const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'Please enter a store name',
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: [{ type: Number, required: 'You must supply coordinates!' }],
      address: { type: String, required: 'You must supply an address!' },
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: 'You must link to a user',
    },
  },
  {
    // These options ask that virtual fields (like: reviews) to be visibly available in the store object instance anytime its being called, without the need to call the virtual field itself to show its content (like with: store.reviews)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Defining indexing Logic
storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this pre-save function from running
  }
  this.slug = slug(this.name);

  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });

  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  next();

  // TODO: make more resilient against duplications
});

// you should use a proper "function" definition whenever you need to bind to the model so you can use "this"
storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    // what this essentialy is doing is; duplicating entries or records, one for each tag
    { $unwind: '$tags' },
    // what this essentialy means is; group the unwind items into groups based on the TAGS field, and give me the count of that. Considiring each occurence to equal 1. And make an object with the tag as the ID for each tag
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    // 1 for ascending , -1 for descending sort
    { $sort: { count: -1 } },
  ]);
};

storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the store?
  foreignField: 'store', // which field on the review
});

module.exports = mongoose.model('Store', storeSchema);
