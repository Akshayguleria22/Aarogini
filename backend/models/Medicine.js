const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide medicine name'],
    trim: true,
    unique: true
  },
  genericName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please specify medicine category'],
    enum: ['pain_relief', 'antibiotic', 'vitamin', 'hormone', 'contraceptive', 'antidepressant', 'antihistamine', 'other']
  },
  manufacturer: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide medicine description']
  },
  uses: [{
    type: String
  }],
  sideEffects: [{
    type: String
  }],
  dosage: {
    adult: String,
    children: String,
    elderly: String
  },
  precautions: [{
    type: String
  }],
  contraindications: [{
    type: String
  }],
  pregnancyCategory: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'X', 'N/A'],
    default: 'N/A'
  },
  breastfeedingSafe: {
    type: Boolean,
    default: false
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number
  },
  availability: {
    type: String,
    enum: ['available', 'out_of_stock', 'discontinued'],
    default: 'available'
  },
  imageUrl: {
    type: String
  },
  searchCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for search
medicineSchema.index({ name: 'text', genericName: 'text', description: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
