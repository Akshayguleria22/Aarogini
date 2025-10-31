const mongoose = require('mongoose');

const periodTrackerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cycleStartDate: {
    type: Date,
    required: [true, 'Please provide cycle start date']
  },
  cycleEndDate: {
    type: Date
  },
  cycleLength: {
    type: Number,
    default: 28
  },
  periodLength: {
    type: Number,
    default: 5
  },
  flow: {
    type: String,
    enum: ['light', 'medium', 'heavy'],
    default: 'medium'
  },
  symptoms: [{
    type: String,
    enum: ['cramps', 'headache', 'mood_swings', 'fatigue', 'bloating', 'acne', 'back_pain', 'breast_tenderness', 'nausea']
  }],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'anxious', 'neutral', 'energetic', 'tired']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  predictedNextPeriod: {
    type: Date
  },
  predictedOvulation: {
    type: Date
  },
  isRegular: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate predicted dates before saving
periodTrackerSchema.pre('save', function(next) {
  if (this.cycleStartDate && this.cycleLength) {
    // Predict next period
    this.predictedNextPeriod = new Date(this.cycleStartDate);
    this.predictedNextPeriod.setDate(this.predictedNextPeriod.getDate() + this.cycleLength);
    
    // Predict ovulation (typically 14 days before next period)
    this.predictedOvulation = new Date(this.predictedNextPeriod);
    this.predictedOvulation.setDate(this.predictedOvulation.getDate() - 14);
  }
  next();
});

module.exports = mongoose.model('PeriodTracker', periodTrackerSchema);
