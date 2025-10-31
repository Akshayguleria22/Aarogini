const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    required: [true, 'Please specify report type'],
    enum: ['blood_test', 'urine_test', 'stool_test', 'ultrasound', 'x-ray', 'mri', 'ct_scan', 'prescription', 'diagnosis', 'hormone_test', 'general', 'other']
  },
  reportName: {
    type: String,
    required: [true, 'Please provide report name'],
    trim: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  dateOfTest: {
    type: Date
  },
  doctorName: {
    type: String,
    trim: true
  },
  hospital: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  filePath: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  extractedText: {
    type: String
  },
  // AI Analysis results from Gemini
  analysis: {
    patient_info: {
      name: String,
      age: String,
      gender: String,
      report_date: String,
    },
    tests: [{
      test_name: String,
      value: String,
      unit: String,
      reference_range: String,
      status: {
        type: String,
        enum: ['NORMAL', 'HIGH', 'LOW', 'ABNORMAL']
      },
      category: String,
    }],
    abnormal_findings: [{
      test: String,
      value: String,
      concern: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
    }],
    health_concerns: [String],
    tracking_recommendations: [String],
    womens_health_indicators: [String],
    summary: String,
    detected_conditions: [String],
  },
  // Comparison with previous reports
  comparison: {
    trends: [{
      parameter: String,
      trend: {
        type: String,
        enum: ['improving', 'worsening', 'stable']
      },
      recommendation: String,
    }],
    overall_assessment: String,
  },
  // WHO Guidelines
  whoGuidelines: [{
    title: String,
    recommendations: [String],
    source: String,
    note: String,
  }],
  testResults: [{
    testName: String,
    value: String,
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['normal', 'abnormal', 'critical']
    }
  }],
  tags: [{
    type: String
  }],
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for faster queries
medicalReportSchema.index({ user: 1, uploadDate: -1 });
medicalReportSchema.index({ 'analysis.detected_conditions': 1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
