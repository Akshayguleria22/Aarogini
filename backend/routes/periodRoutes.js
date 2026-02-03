import express from 'express';
const router = express.Router();
import PeriodTracker from '../models/PeriodTracker.js';
import { protect } from '../middleware/auth.js';
import { chatFlow } from '../services/groqClient.js';

const toDateOnly = (d) => new Date(new Date(d).toISOString().split('T')[0]);
const diffDays = (a, b) => Math.round((toDateOnly(a) - toDateOnly(b)) / (1000 * 60 * 60 * 24));
const mean = (arr) => arr.reduce((s, n) => s + n, 0) / (arr.length || 1);
const std = (arr) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = mean(arr.map(x => (x - m) ** 2));
  return Math.sqrt(v);
};

const getCycleStats = (periods) => {
  const sorted = (periods || [])
    .filter(p => p.cycleStartDate)
    .sort((a, b) => new Date(a.cycleStartDate) - new Date(b.cycleStartDate));

  const cycleLengths = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const len = diffDays(sorted[i].cycleStartDate, sorted[i - 1].cycleStartDate);
    if (len >= 20 && len <= 45) cycleLengths.push(len);
  }

  const periodLengths = (periods || [])
    .map(p => Number(p.periodLength))
    .filter(n => Number.isFinite(n) && n >= 2 && n <= 10);

  const avgCycle = cycleLengths.length ? Math.round(mean(cycleLengths)) : 28;
  const avgPeriod = periodLengths.length ? Math.round(mean(periodLengths)) : 5;
  const isRegular = cycleLengths.length >= 3 ? std(cycleLengths) <= 3 : true;

  return { avgCycle, avgPeriod, isRegular };
};

// @route   POST /api/periods
// @desc    Create a new period entry
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    if (!req.body?.cycleStartDate) {
      return res.status(400).json({ success: false, message: 'cycleStartDate is required' });
    }

    const startDate = new Date(req.body.cycleStartDate);
    const previousPeriods = await PeriodTracker.find({ user: req.user.id }).sort({ cycleStartDate: -1 }).limit(12);

    // Close any active cycle if a new start date is logged
    const active = previousPeriods.find(p => !p.cycleEndDate);
    if (active && new Date(active.cycleStartDate) < startDate) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() - 1);
      const computedLength = diffDays(startDate, active.cycleStartDate);
      await PeriodTracker.updateOne(
        { _id: active._id },
        { $set: { cycleEndDate: endDate, cycleLength: computedLength } }
      );
    }

    const stats = getCycleStats(previousPeriods);
    const cycleLength = Number(req.body.cycleLength || stats.avgCycle || 28);
    const periodLength = Number(req.body.periodLength || stats.avgPeriod || 5);

    const periodEntry = await PeriodTracker.create({
      user: req.user.id,
      cycleStartDate: startDate,
      cycleLength,
      periodLength,
      isRegular: stats.isRegular,
      flow: req.body.flow || 'medium',
      symptoms: req.body.symptoms || [],
      mood: req.body.mood,
      notes: req.body.notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Period entry created successfully',
      data: periodEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/periods
// @desc    Get all period entries for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const periods = await PeriodTracker.find({ user: req.user.id }).sort({ cycleStartDate: -1 });

    res.status(200).json({
      success: true,
      count: periods.length,
      data: periods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/periods/:id
// @desc    Get single period entry
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const period = await PeriodTracker.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period entry not found'
      });
    }

    // Make sure user owns the period entry
    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: period
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/periods/:id
// @desc    Update period entry
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let period = await PeriodTracker.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period entry not found'
      });
    }

    // Make sure user owns the period entry
    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    period = await PeriodTracker.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Period entry updated successfully',
      data: period
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/periods/:id/track-daily
// @desc    Add daily tracking data for a specific date and time slot
// @access  Private
router.post('/:id/track-daily', protect, async (req, res) => {
  try {
    const { date, timeSlot, flow, cramps, mood, symptoms, energyLevel, notes } = req.body;

    const period = await PeriodTracker.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period cycle not found'
      });
    }

    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const dateStr = new Date(date).toISOString().split('T')[0];

    // Find or create daily tracking entry for this date
    let dailyEntry = period.dailyTracking.find(d =>
      new Date(d.date).toISOString().split('T')[0] === dateStr
    );

    if (!dailyEntry) {
      dailyEntry = {
        date: new Date(dateStr),
        timeSlots: [],
        dailyAverages: {}
      };
      period.dailyTracking.push(dailyEntry);
    }

    // Add or update time slot
    const existingSlotIndex = dailyEntry.timeSlots.findIndex(s => s.time === timeSlot);
    const slotData = {
      time: timeSlot,
      timestamp: new Date(),
      flow: flow || 'none',
      cramps: cramps || 0,
      mood: mood || 'neutral',
      symptoms: symptoms || [],
      energyLevel: energyLevel || 5,
      notes: notes || ''
    };

    if (existingSlotIndex >= 0) {
      dailyEntry.timeSlots[existingSlotIndex] = slotData;
    } else {
      dailyEntry.timeSlots.push(slotData);
    }

    // Update last tracked date
    period.lastTrackedDate = new Date();
    period.missedTrackingDays = 0;

    await period.save();

    // Calculate daily averages
    const averages = period.calculateDailyAverages(dateStr);

    res.status(200).json({
      success: true,
      message: 'Daily tracking data saved successfully',
      data: {
        period,
        dailyAverages: averages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/periods/:id/daily/:date
// @desc    Get daily tracking data for a specific date
// @access  Private
router.get('/:id/daily/:date', protect, async (req, res) => {
  try {
    const period = await PeriodTracker.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period cycle not found'
      });
    }

    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const dateStr = new Date(req.params.date).toISOString().split('T')[0];
    const dailyEntry = period.dailyTracking.find(d =>
      new Date(d.date).toISOString().split('T')[0] === dateStr
    );

    res.status(200).json({
      success: true,
      data: dailyEntry || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/periods/:id/recommendations
// @desc    Get AI recommendations for a period cycle
// @access  Private
router.get('/:id/recommendations', protect, async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service is not configured' });
    }

    const period = await PeriodTracker.findById(req.params.id).lean();
    if (!period) {
      return res.status(404).json({ success: false, message: 'Period cycle not found' });
    }

    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const lastTracking = (period.dailyTracking || []).slice(-7);
    const summary = lastTracking.map(d => {
      const date = new Date(d.date).toISOString().split('T')[0];
      const avg = d.dailyAverages || {};
      return `Date: ${date}, avgCramps: ${avg.avgCramps ?? 'n/a'}, avgEnergy: ${avg.avgEnergyLevel ?? 'n/a'}, dominantFlow: ${avg.dominantFlow ?? 'n/a'}, dominantMood: ${avg.dominantMood ?? 'n/a'}`;
    }).join('\n');

    const prompt = `You are a women's health assistant. Based on the user's recent period tracking summary, provide a short summary and 4 concise recommendations. Return JSON:
{
  "summary": "...",
  "recommendations": [
    {"title": "", "detail": ""}
  ]
}

Tracking Summary:
${summary || 'No recent tracking data available.'}`;

    const resp = await chatFlow({ message: prompt });

    let data = { summary: '', recommendations: [] };
    try {
      const cleaned = String(resp.response || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      data = JSON.parse(cleaned);
    } catch {
      data = { summary: 'Recommendations generated.', recommendations: [resp.response] };
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/periods/check-reminder
// @desc    Check if user needs a reminder to track
// @access  Private
router.get('/check-reminder', protect, async (req, res) => {
  try {
    // Get the latest active period cycle
    const activePeriod = await PeriodTracker.findOne({
      user: req.user.id,
      cycleEndDate: null // Active cycle
    }).sort({ cycleStartDate: -1 });

    if (!activePeriod) {
      return res.status(200).json({
        success: true,
        needsReminder: false,
        message: 'No active period cycle'
      });
    }

    // Check if user is currently on their period
    const today = new Date();
    const cycleStart = new Date(activePeriod.cycleStartDate);
    const daysSinceStart = Math.floor((today - cycleStart) / (1000 * 60 * 60 * 24));
    const isOnPeriod = daysSinceStart < activePeriod.periodLength;

    if (!isOnPeriod) {
      return res.status(200).json({
        success: true,
        needsReminder: false,
        message: 'Not currently on period'
      });
    }

    // Check if they've tracked today
    const todayStr = today.toISOString().split('T')[0];
    const todayEntry = activePeriod.dailyTracking.find(d =>
      new Date(d.date).toISOString().split('T')[0] === todayStr
    );

    const needsReminder = !todayEntry || todayEntry.timeSlots.length === 0;

    res.status(200).json({
      success: true,
      needsReminder,
      isOnPeriod,
      periodDay: daysSinceStart + 1,
      message: needsReminder ? 'Please track your period today!' : 'Already tracked today'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/periods/:id
// @desc    Delete period entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const period = await PeriodTracker.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period entry not found'
      });
    }

    // Make sure user owns the period entry
    if (period.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await period.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Period entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/periods/predictions/next
// @desc    Get next period prediction
// @access  Private
router.get('/predictions/next', protect, async (req, res) => {
  try {
    const lastPeriod = await PeriodTracker.findOne({ user: req.user.id }).sort({ cycleStartDate: -1 });

    if (!lastPeriod) {
      return res.status(404).json({
        success: false,
        message: 'No period data found'
      });
    }

    const history = await PeriodTracker.find({ user: req.user.id }).sort({ cycleStartDate: -1 }).limit(12);
    const stats = getCycleStats(history);
    const cycleLength = Number(lastPeriod.cycleLength || stats.avgCycle || 28);
    const start = new Date(lastPeriod.cycleStartDate);
    const predictedNextPeriod = new Date(start);
    predictedNextPeriod.setDate(predictedNextPeriod.getDate() + cycleLength);
    const predictedOvulation = new Date(predictedNextPeriod);
    predictedOvulation.setDate(predictedOvulation.getDate() - 14);

    res.status(200).json({
      success: true,
      data: {
        predictedNextPeriod,
        predictedOvulation,
        cycleLength
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
