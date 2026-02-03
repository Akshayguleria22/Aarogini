import mongoose from 'mongoose';

// Schema for tracking symptoms at different times of the day
const dailyTrackingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  timeSlots: [{
    time: {
      type: String, // e.g., '12am', '3am', '6am', etc.
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    flow: {
      type: String,
      enum: ['none', 'spotting', 'light', 'medium', 'heavy', 'very_heavy'],
      default: 'none'
    },
    cramps: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    mood: {
      type: String,
      enum: ['happy', 'sad', 'angry', 'anxious', 'neutral', 'energetic', 'tired', 'irritable'],
      default: 'neutral'
    },
    symptoms: [{
      type: String,
      enum: ['cramps', 'headache', 'mood_swings', 'fatigue', 'bloating', 'acne', 'back_pain', 'breast_tenderness', 'nausea', 'dizziness', 'appetite_changes']
    }],
    energyLevel: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    },
    notes: {
      type: String,
      maxlength: 200
    }
  }],
  // Daily averages (calculated from time slots)
  dailyAverages: {
    avgCramps: Number,
    avgEnergyLevel: Number,
    dominantFlow: String,
    dominantMood: String,
    allSymptoms: [String]
  }
}, { _id: false });

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
  // Overall cycle characteristics
  flow: {
    type: String,
    enum: ['light', 'medium', 'heavy'],
    default: 'medium'
  },
  symptoms: [{
    type: String,
    enum: ['cramps', 'headache', 'mood_swings', 'fatigue', 'bloating', 'acne', 'back_pain', 'breast_tenderness', 'nausea', 'dizziness', 'appetite_changes']
  }],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'anxious', 'neutral', 'energetic', 'tired', 'irritable']
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
  },
  // Daily tracking data
  dailyTracking: [dailyTrackingSchema],
  // Reminder settings
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  lastTrackedDate: {
    type: Date
  },
  missedTrackingDays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate daily averages when time slots are updated
periodTrackerSchema.methods.calculateDailyAverages = function (dateStr) {
  const dailyEntry = this.dailyTracking.find(d =>
    new Date(d.date).toISOString().split('T')[0] === dateStr
  );

  if (!dailyEntry || !dailyEntry.timeSlots || dailyEntry.timeSlots.length === 0) {
    return null;
  }

  const slots = dailyEntry.timeSlots;

  // Calculate averages
  const avgCramps = slots.reduce((sum, s) => sum + (s.cramps || 0), 0) / slots.length;
  const avgEnergyLevel = slots.reduce((sum, s) => sum + (s.energyLevel || 5), 0) / slots.length;

  // Find dominant flow (most severe)
  const flowSeverity = { 'none': 0, 'spotting': 1, 'light': 2, 'medium': 3, 'heavy': 4, 'very_heavy': 5 };
  const dominantFlow = slots.reduce((max, s) => {
    return flowSeverity[s.flow] > flowSeverity[max] ? s.flow : max;
  }, 'none');

  // Find dominant mood (most frequent)
  const moodCounts = {};
  slots.forEach(s => {
    moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1;
  });
  const dominantMood = Object.keys(moodCounts).reduce((a, b) =>
    moodCounts[a] > moodCounts[b] ? a : b
  );

  // Collect all unique symptoms
  const allSymptoms = [...new Set(slots.flatMap(s => s.symptoms || []))];

  dailyEntry.dailyAverages = {
    avgCramps: Math.round(avgCramps * 10) / 10,
    avgEnergyLevel: Math.round(avgEnergyLevel * 10) / 10,
    dominantFlow,
    dominantMood,
    allSymptoms
  };

  return dailyEntry.dailyAverages;
};

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

export default mongoose.model('PeriodTracker', periodTrackerSchema);
