const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chatFlow } = require('../services/geminiClient');

// @route   POST /api/medicine-search
// @desc    Search for medicine information using Gemini AI
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { medicineName, query } = req.body;

    if (!medicineName && !query) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name or search query is required'
      });
    }

    const searchQuery = medicineName || query;

    // Use Gemini AI to get comprehensive medicine information
    const prompt = `Provide comprehensive information about the medicine: "${searchQuery}"

Include the following details:
1. **Generic Name & Brand Names**: Common brand names for this medicine
2. **Category**: Type of medicine (e.g., antibiotic, pain reliever, hormone)
3. **Uses**: What conditions/symptoms this medicine treats
4. **How It Works**: Mechanism of action in simple terms
5. **Dosage**: Common dosage forms and typical dosing schedule
6. **When to Take**: Best time to take (with food, empty stomach, etc.)
7. **Side Effects**: Common and serious side effects
8. **Precautions**: Who should avoid it (pregnancy, breastfeeding, etc.)
9. **Interactions**: Important drug/food interactions
10. **Storage**: How to store the medicine properly

Format the response in a clear, organized way. If this is not a valid medicine name, suggest what they might be looking for.`;

    const response = await chatFlow({
      message: prompt,
      userContext: 'User is searching for medicine information'
    });

    res.status(200).json({
      success: true,
      data: {
        searchTerm: searchQuery,
        information: response.response,
        suggestions: response.suggestions || []
      }
    });

  } catch (error) {
    console.error('Medicine Search Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search medicine information',
      error: error.message
    });
  }
});

// @route   POST /api/medicine-search/compare
// @desc    Compare multiple medicines
// @access  Private
router.post('/compare', protect, async (req, res) => {
  try {
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 medicine names required for comparison'
      });
    }

    const prompt = `Compare these medicines: ${medicines.join(', ')}

Provide a detailed comparison including:
1. **Purpose**: What each medicine treats
2. **Effectiveness**: How they compare in treating similar conditions
3. **Side Effects**: Comparison of side effect profiles
4. **Cost**: General price range (generic vs brand)
5. **Availability**: Prescription vs over-the-counter
6. **Key Differences**: Main differences between them
7. **Which to Choose**: When to prefer one over the other

Present in a clear comparison format.`;

    const response = await chatFlow({
      message: prompt,
      userContext: 'User is comparing multiple medicines'
    });

    res.status(200).json({
      success: true,
      data: {
        medicines: medicines,
        comparison: response.response
      }
    });

  } catch (error) {
    console.error('Medicine Compare Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to compare medicines',
      error: error.message
    });
  }
});

// @route   POST /api/medicine-search/interactions
// @desc    Check medicine interactions
// @access  Private
router.post('/interactions', protect, async (req, res) => {
  try {
    const { medicines, conditions } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'At least one medicine name is required'
      });
    }

    let prompt = `Check potential interactions for: ${medicines.join(', ')}`;
    
    if (conditions && conditions.length > 0) {
      prompt += `\n\nPatient conditions: ${conditions.join(', ')}`;
    }

    prompt += `\n\nProvide:
1. **Drug-Drug Interactions**: Interactions between these medicines
2. **Severity Level**: Rate each interaction (mild, moderate, severe)
3. **Symptoms to Watch**: What symptoms indicate interaction
4. **Recommendations**: How to manage or avoid interactions
5. **Food Interactions**: Foods to avoid
6. **Condition Warnings**: Relevant warnings for patient conditions

Be specific and clear about safety concerns.`;

    const response = await chatFlow({
      message: prompt,
      userContext: 'User is checking medicine interactions for safety'
    });

    res.status(200).json({
      success: true,
      data: {
        medicines: medicines,
        conditions: conditions || [],
        interactions: response.response
      }
    });

  } catch (error) {
    console.error('Medicine Interactions Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check medicine interactions',
      error: error.message
    });
  }
});

// @route   GET /api/medicine-search/categories
// @desc    Get common medicine categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        name: 'Pain Relief',
        icon: '💊',
        examples: ['Ibuprofen', 'Paracetamol', 'Aspirin'],
        description: 'Analgesics for pain management'
      },
      {
        name: 'Antibiotics',
        icon: '🦠',
        examples: ['Amoxicillin', 'Azithromycin', 'Ciprofloxacin'],
        description: 'Treats bacterial infections'
      },
      {
        name: 'Hormonal',
        icon: '💉',
        examples: ['Birth Control Pills', 'Thyroid Medications'],
        description: 'Hormone regulation and contraception'
      },
      {
        name: 'Vitamins & Supplements',
        icon: '🌿',
        examples: ['Vitamin D', 'Iron', 'Calcium', 'Folic Acid'],
        description: 'Nutritional supplements'
      },
      {
        name: 'Antacids',
        icon: '🥛',
        examples: ['Omeprazole', 'Ranitidine', 'Pantoprazole'],
        description: 'Digestive and stomach issues'
      },
      {
        name: 'Women\'s Health',
        icon: '👩',
        examples: ['Prenatal Vitamins', 'Menstrual Pain Relief'],
        description: 'Specific to women\'s health needs'
      },
      {
        name: 'Mental Health',
        icon: '🧠',
        examples: ['Antidepressants', 'Anti-anxiety'],
        description: 'Mental health medications'
      },
      {
        name: 'Allergy Relief',
        icon: '🤧',
        examples: ['Antihistamines', 'Cetirizine', 'Loratadine'],
        description: 'Allergy and cold symptoms'
      }
    ];

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Categories Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;
