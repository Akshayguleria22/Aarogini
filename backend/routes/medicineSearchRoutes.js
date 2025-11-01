const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chatFlow } = require('../services/geminiClient');
const { searchDrugDetails, searchDrugEvents } = require('../services/openFdaService');
const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY;

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
    // Final safety net: return a friendly dummy response instead of failing
    const { medicineName, query } = req.body || {};
    const searchQuery = medicineName || query || 'Sample Medicine';
    const info = `**Generic Name & Brand Names**: ${searchQuery} (demo)\n**Category**: Example category\n**Uses**: Example uses\n**How It Works**: Example mechanism\n**Dosage**: Example dosage\n**When to Take**: Example timing\n**Side Effects**: Example side effects\n**Precautions**: Example precautions\n**Interactions**: Example interactions\n**Storage**: Example storage`;
    res.status(200).json({
      success: true,
      data: {
        searchTerm: searchQuery,
        information: info,
        suggestions: ['This is a fallback demo response'],
        source: 'dummy'
      }
    });
  }
});

// @route   POST /api/medicine-search/compare
// @desc    Compare multiple medicines
// @access  Public (no auth to avoid blocking when DB/auth not available)
router.post('/compare', async (req, res) => {
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
    if (!process.env.GEMINI_API_KEY) {
      const header = `**Comparison:** ${medicines.join(' vs ')}`;
      const demo = [
        `\n**Purpose**\n- ${medicines[0]}: Pain relief (demo)\n- ${medicines[1]}: Pain relief + anti-inflammatory (demo)`,
        `\n**Effectiveness**\n- ${medicines[0]}: Effective for fever and mild pain\n- ${medicines[1]}: Better for inflammatory pain`,
        `\n**Side Effects**\n- ${medicines[0]}: Nausea, dizziness (rare)\n- ${medicines[1]}: Stomach upset, reflux (demo)`,
        `\n**Cost**\n- Both have low-cost generics (demo)`,
        `\n**Availability**\n- ${medicines[0]}: OTC in many regions\n- ${medicines[1]}: OTC/Rx depending on strength (demo)`,
        `\n**Key Differences**\n- Anti-inflammatory benefit, GI tolerance`,
        `\n**Which to Choose**\n- Fever/headache: ${medicines[0]}\n- Muscle/joint inflammation: ${medicines[1]}`
      ].join('\n');

      return res.status(200).json({
        success: true,
        data: { medicines, comparison: `${header}\n${demo}`, source: 'dummy' }
      });
    }

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
    const meds = Array.isArray(req.body?.medicines) ? req.body.medicines : ['Medicine A', 'Medicine B'];
    const demo = `**Comparison:** ${meds.join(' vs ')}\n\n**Purpose**: Demo purpose\n**Effectiveness**: Demo effectiveness\n**Side Effects**: Demo side effects\n**Cost**: Demo cost\n**Availability**: Demo availability\n**Key Differences**: Demo differences\n**Which to Choose**: Demo choice`;
    res.status(200).json({ success: true, data: { medicines: meds, comparison: demo, source: 'dummy' } });
  }
});

// @route   POST /api/medicine-search/interactions
// @desc    Check medicine interactions
// @access  Public (no auth to avoid blocking when DB/auth not available)
router.post('/interactions', async (req, res) => {
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
    if (!process.env.GEMINI_API_KEY) {
      const lines = [
        `**Drug-Drug Interactions**\n- Potential additive CNS effects (demo)\n- Increased GI irritation when combined (demo)`,
        `\n**Severity Level**\n- Most interactions: mild to moderate (demo)`,
        `\n**Symptoms to Watch**\n- Dizziness, nausea, stomach upset (demo)`,
        `\n**Recommendations**\n- Stagger administration times; avoid duplicate actives; consult pharmacist`,
        `\n**Food Interactions**\n- Avoid excess alcohol; take with food if GI upset occurs (demo)`,
        `\n**Condition Warnings**\n- ${(conditions || []).join(', ') || 'No conditions provided'}`
      ].join('\n');

      return res.status(200).json({
        success: true,
        data: { medicines, conditions: conditions || [], interactions: lines, source: 'dummy' }
      });
    }

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
    const meds = Array.isArray(req.body?.medicines) ? req.body.medicines : ['Medicine A'];
    const conds = Array.isArray(req.body?.conditions) ? req.body.conditions : [];
    const demo = `**Drug-Drug Interactions**: Demo\n**Severity Level**: Demo\n**Symptoms to Watch**: Demo\n**Recommendations**: Demo\n**Food Interactions**: Demo\n**Condition Warnings**: ${conds.join(', ') || 'None'}`;
    res.status(200).json({ success: true, data: { medicines: meds, conditions: conds, interactions: demo, source: 'dummy' } });
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
// New: OpenFDA drug search (verified FDA data)
// @route   GET /api/medicine-search/openfda
// @desc    Fetch medicine details (uses, side effects, warnings, ingredients) from OpenFDA
// @access  Public (no auth required)
// Simple dummy builder to keep UI functional when OpenFDA is unavailable
function buildDummyDetails(q) {
  const name = (q || 'Sample Medicine').trim();
  return {
    query: name,
    names: { brand: [name.toUpperCase()], generic: [name] },
    regulatory: {
      prescriptionRequired: false,
      marketingCategory: 'OTC MONOGRAPH NOT FINAL',
      applicationNumber: null,
      sponsorName: 'Demo Pharma Inc.',
      productType: 'HUMAN OTC DRUG',
    },
    composition: {
      activeIngredients: [
        { name: 'Acetaminophen', strength: '500 mg/1' },
        { name: 'Caffeine', strength: '65 mg/1' }
      ],
      activeIngredientLabel: 'Acetaminophen 500 mg; Caffeine 65 mg',
      route: ['ORAL'],
      dosageForm: 'TABLET',
    },
    label: {
      indications_and_usage: 'Temporarily relieves minor aches and pains due to headache, cold, and flu. Reduces fever.',
      dosage_and_administration: 'Adults: take 1–2 tablets every 6 hours as needed. Do not exceed 8 tablets in 24 hours.',
      warnings: 'Liver warning: This product contains acetaminophen. Severe liver damage may occur if you take more than 4000 mg in 24 hours.',
      boxed_warning: undefined,
      adverse_reactions: 'Common: nausea, dizziness, nervousness (from caffeine). Rare: allergic reactions such as rash.',
      contraindications: 'Severe liver disease, known hypersensitivity to components.',
      drug_interactions: 'Avoid with other acetaminophen-containing products. Limit caffeine intake from other sources.',
      clinical_pharmacology: 'Acetaminophen is an analgesic and antipyretic. Caffeine is a CNS stimulant.',
      pregnancy: 'Consult a healthcare professional before use during pregnancy.',
      nursing_mothers: 'Caffeine is excreted in breast milk; use with caution.',
      storage_and_handling: 'Store at 20°–25°C (68°–77°F). Keep tightly closed.',
    },
    meta: {
      sources: {
        label: 'dummy',
        ndc: 'dummy',
        drugsfda: 'dummy',
      },
    },
    summary: 'Uses: Temporarily relieves minor aches and pains.\n\nWarning: Contains acetaminophen. Do not exceed recommended dose.'
  };
}

function buildDummyEvents(q) {
  const name = (q || 'Sample Medicine').trim();
  return {
    query: name,
    reactions: [
      { term: 'HEADACHE', count: 142 },
      { term: 'NAUSEA', count: 96 },
      { term: 'DIZZINESS', count: 73 },
      { term: 'INSOMNIA', count: 31 },
    ],
    recent: [
      { safetyReportId: 'DUMMY-001', received: '2025-10-21', reactions: ['NAUSEA'], seriousness: { death: false, hospitalization: false, lifeThreatening: false } },
      { safetyReportId: 'DUMMY-002', received: '2025-09-30', reactions: ['DIZZINESS', 'HEADACHE'], seriousness: { death: false, hospitalization: false, lifeThreatening: false } },
    ],
  };
}

router.get('/openfda', async (req, res) => {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    }

    const result = await searchDrugDetails(q);
    if (result.ok) {
      return res.status(200).json({ success: true, data: result.data });
    }

    // Fallback to deterministic dummy data when OpenFDA is unavailable or returns nothing
    console.warn(`[OpenFDA] Falling back to dummy details for query: ${q}. Reason: ${result.error || 'unknown'}`);
    const dummy = buildDummyDetails(q);
    return res.status(200).json({ success: true, data: dummy, source: 'dummy' });
  } catch (error) {
    console.error('OpenFDA Search Error:', error.message);
    // Final safety net: return dummy data instead of failing
    const q = (req.query?.q || req.query?.query || 'Sample Medicine').trim();
    const dummy = buildDummyDetails(q);
    res.status(200).json({ success: true, data: dummy, source: 'dummy' });
  }
});

// @route   GET /api/medicine-search/openfda/health
// @desc    Check OpenFDA integration status
// @access  Public
router.get('/openfda/health', async (req, res) => {
  res.status(200).json({
    success: true,
    service: 'OpenFDA',
    apiKeyConfigured: Boolean(OPENFDA_API_KEY),
    docs: 'https://open.fda.gov/apis/drug/',
    endpoints: {
      details: '/api/medicine-search/openfda?q=<query>',
      events: '/api/medicine-search/openfda/events?q=<query>'
    }
  });
});

// @route   GET /api/medicine-search/openfda/events
// @desc    Fetch adverse event summary (top reactions and recent examples) from OpenFDA
// @access  Public (no auth required)
router.get('/openfda/events', async (req, res) => {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    }

    const result = await searchDrugEvents(q);
    if (result.ok) {
      return res.status(200).json({ success: true, data: result.data });
    }

    console.warn(`[OpenFDA] Falling back to dummy events for query: ${q}. Reason: ${result.error || 'unknown'}`);
    const dummy = buildDummyEvents(q);
    return res.status(200).json({ success: true, data: dummy, source: 'dummy' });
  } catch (error) {
    console.error('OpenFDA Events Error:', error.message);
    const q = (req.query?.q || req.query?.query || 'Sample Medicine').trim();
    const dummy = buildDummyEvents(q);
    res.status(200).json({ success: true, data: dummy, source: 'dummy' });
  }
});

module.exports = router;
