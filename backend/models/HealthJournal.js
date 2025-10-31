const mongoose = require('mongoose');

const healthJournalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['physical', 'mental', 'nutrition', 'sleep', 'exercise', 'general'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide content']
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'bad', 'terrible']
  },
  healthMetrics: {
    weight: Number,
    height: Number,
    bmi: Number,
    bloodPressureSystolic: Number,
    bloodPressureDiastolic: Number,
    heartRate: Number,
    sleepHours: Number,
    waterIntake: Number,
    exerciseMinutes: Number
  },
  tags: [{
    type: String
  }],
  attachments: [{
    type: String
  }],
  isPrivate: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate BMI before saving
healthJournalSchema.pre('save', function(next) {
  if (this.healthMetrics.weight && this.healthMetrics.height) {
    const heightInMeters = this.healthMetrics.height / 100;
    this.healthMetrics.bmi = (this.healthMetrics.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  next();
});

module.exports = mongoose.model('HealthJournal', healthJournalSchema);
