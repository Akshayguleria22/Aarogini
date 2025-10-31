const axios = require('axios');

// WHO API Configuration
// WHO provides several APIs for health data
const WHO_BASE_URL = 'https://ghoapi.azureedge.net/api';

/**
 * WHO Global Health Observatory (GHO) API Service
 * Provides access to WHO's health statistics and indicators
 */

// Get health indicators/topics from WHO
const getHealthIndicators = async (topic = null) => {
  try {
    let url = `${WHO_BASE_URL}/Indicator`;
    
    if (topic) {
      url += `?$filter=contains(IndicatorName,'${topic}')`;
    }

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data.value || []
    };
  } catch (error) {
    console.error('WHO API Error (Indicators):', error.message);
    return {
      success: false,
      error: 'Failed to fetch WHO health indicators'
    };
  }
};

// Get specific health data by indicator code
const getHealthData = async (indicatorCode, filters = {}) => {
  try {
    let url = `${WHO_BASE_URL}/${indicatorCode}`;
    
    // Add filters if provided
    const filterParams = [];
    if (filters.country) {
      filterParams.push(`SpatialDim eq '${filters.country}'`);
    }
    if (filters.year) {
      filterParams.push(`TimeDim eq ${filters.year}`);
    }
    
    if (filterParams.length > 0) {
      url += `?$filter=${filterParams.join(' and ')}`;
    }

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data.value || []
    };
  } catch (error) {
    console.error('WHO API Error (Data):', error.message);
    return {
      success: false,
      error: 'Failed to fetch WHO health data'
    };
  }
};

// Search for health information related to women's health topics
const searchWomenHealthInfo = async (query) => {
  try {
    // Common WHO indicators related to women's health
    const womenHealthIndicators = {
      'maternal': 'MATERNAL_MORTALITY_RATIO',
      'pregnancy': 'ANTENATAL_CARE_COVERAGE',
      'contraception': 'CONTRACEPTIVE_PREVALENCE',
      'birth': 'BIRTHS_ATTENDED_BY_SKILLED_HEALTH_PERSONNEL',
      'fertility': 'ADOLESCENT_BIRTH_RATE',
      'reproductive': 'FAMILY_PLANNING_NEEDS_SATISFIED'
    };

    // Find relevant indicator based on query
    const lowerQuery = query.toLowerCase();
    let relevantIndicator = null;
    
    for (const [keyword, indicator] of Object.entries(womenHealthIndicators)) {
      if (lowerQuery.includes(keyword)) {
        relevantIndicator = indicator;
        break;
      }
    }

    if (!relevantIndicator) {
      // Return general women's health information
      return {
        success: true,
        data: {
          message: 'No specific WHO data found for this query',
          suggestion: 'Try asking about: maternal health, pregnancy care, contraception, or reproductive health'
        }
      };
    }

    // Fetch data for the relevant indicator
    const result = await getHealthData(relevantIndicator);
    
    return result;
  } catch (error) {
    console.error('WHO Search Error:', error.message);
    return {
      success: false,
      error: 'Failed to search WHO health information'
    };
  }
};

// Get women's health recommendations from WHO
const getWomenHealthGuidelines = async (topic) => {
  try {
    // Predefined WHO guidelines for common women's health topics
    const guidelines = {
      'maternal_health': {
        title: 'WHO Maternal Health Guidelines',
        recommendations: [
          'At least 8 antenatal care contacts throughout pregnancy',
          'Skilled health personnel should attend all births',
          'Postnatal care for mother and baby within 24 hours of birth',
          'Iron and folic acid supplementation during pregnancy',
          'Tetanus vaccination during pregnancy'
        ],
        source: 'WHO Recommendations on Antenatal Care for a Positive Pregnancy Experience'
      },
      'reproductive_health': {
        title: 'WHO Reproductive Health Guidelines',
        recommendations: [
          'Access to contraceptive information and services',
          'Safe and effective family planning methods',
          'Prevention and treatment of sexually transmitted infections',
          'Safe abortion care where legal',
          'Prevention and management of infertility'
        ],
        source: 'WHO Sexual and Reproductive Health Guidelines'
      },
      'menstrual_health': {
        title: 'WHO Menstrual Health Guidelines',
        recommendations: [
          'Access to clean, safe menstrual hygiene products',
          'Education about menstruation and menstrual health',
          'Access to private facilities for menstrual hygiene management',
          'Pain management options for menstrual discomfort',
          'Recognition of abnormal menstrual patterns requiring medical attention'
        ],
        source: 'WHO Guidelines on Menstrual Health and Hygiene'
      },
      'nutrition': {
        title: 'WHO Nutrition Guidelines for Women',
        recommendations: [
          'Adequate iron intake to prevent anemia (18mg/day for women of reproductive age)',
          'Folic acid supplementation (400μg daily) for women planning pregnancy',
          'Adequate calcium intake (1000mg/day) for bone health',
          'Balanced diet with fruits, vegetables, whole grains, and lean proteins',
          'Vitamin D supplementation if deficient'
        ],
        source: 'WHO Nutrition Guidelines'
      },
      'pregnancy': {
        title: 'WHO Pregnancy Care Guidelines',
        recommendations: [
          'First antenatal care visit within 12 weeks of pregnancy',
          'Minimum of 8 antenatal care contacts throughout pregnancy',
          'Daily iron and folic acid supplementation',
          'Ultrasound scan before 24 weeks of gestation',
          'Counseling on healthy eating, physical activity, and birth preparedness'
        ],
        source: 'WHO Antenatal Care Recommendations'
      },
      'mental_health': {
        title: 'WHO Mental Health Guidelines for Women',
        recommendations: [
          'Screening for depression and anxiety during and after pregnancy',
          'Psychosocial support for maternal mental health',
          'Access to mental health services without stigma',
          'Support for women experiencing gender-based violence',
          'Workplace mental health support for pregnant and postpartum women'
        ],
        source: 'WHO Mental Health Guidelines'
      }
    };

    const lowerTopic = topic.toLowerCase().replace(/\s+/g, '_');
    
    // Find matching guideline
    for (const [key, guideline] of Object.entries(guidelines)) {
      if (lowerTopic.includes(key) || key.includes(lowerTopic)) {
        return {
          success: true,
          data: guideline
        };
      }
    }

    // Return general information if no specific match
    return {
      success: true,
      data: {
        title: 'WHO Women\'s Health Guidelines',
        recommendations: [
          'Regular health check-ups and screenings',
          'Balanced nutrition and physical activity',
          'Mental health awareness and support',
          'Access to reproductive health services',
          'Prevention and management of chronic diseases'
        ],
        source: 'WHO General Women\'s Health Guidelines',
        note: 'For specific guidance on your topic, consult with a healthcare professional'
      }
    };
  } catch (error) {
    console.error('WHO Guidelines Error:', error.message);
    return {
      success: false,
      error: 'Failed to fetch WHO guidelines'
    };
  }
};

// Format WHO data for chatbot consumption
const formatWHODataForChat = (whoData) => {
  if (!whoData.success) {
    return "I couldn't retrieve WHO data at the moment. However, I can still help you with general health information.";
  }

  if (whoData.data.title) {
    // Format guidelines
    let response = `📋 **${whoData.data.title}**\n\n`;
    response += `${whoData.data.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}\n\n`;
    response += `*Source: ${whoData.data.source}*`;
    
    if (whoData.data.note) {
      response += `\n\n📌 Note: ${whoData.data.note}`;
    }
    
    return response;
  }

  return "WHO data retrieved successfully.";
};

// Analyze medical report with WHO guidelines
const analyzeReportWithWHO = async (reportData) => {
  try {
    const findings = [];
    
    // Extract key health indicators from report
    const reportText = reportData.findings || reportData.notes || '';
    const lowerReport = reportText.toLowerCase();

    // Check for pregnancy-related information
    if (lowerReport.includes('pregnant') || lowerReport.includes('pregnancy')) {
      const pregnancyGuidelines = await getWomenHealthGuidelines('pregnancy');
      if (pregnancyGuidelines.success) {
        findings.push({
          category: 'Pregnancy Care',
          whoGuidelines: pregnancyGuidelines.data
        });
      }
    }

    // Check for maternal health indicators
    if (lowerReport.includes('maternal') || lowerReport.includes('postnatal') || lowerReport.includes('antenatal')) {
      const maternalGuidelines = await getWomenHealthGuidelines('maternal_health');
      if (maternalGuidelines.success) {
        findings.push({
          category: 'Maternal Health',
          whoGuidelines: maternalGuidelines.data
        });
      }
    }

    // Check for nutrition/anemia
    if (lowerReport.includes('anemia') || lowerReport.includes('iron') || lowerReport.includes('hemoglobin')) {
      const nutritionGuidelines = await getWomenHealthGuidelines('nutrition');
      if (nutritionGuidelines.success) {
        findings.push({
          category: 'Nutrition',
          whoGuidelines: nutritionGuidelines.data
        });
      }
    }

    // Check for mental health
    if (lowerReport.includes('depression') || lowerReport.includes('anxiety') || lowerReport.includes('mental')) {
      const mentalHealthGuidelines = await getWomenHealthGuidelines('mental_health');
      if (mentalHealthGuidelines.success) {
        findings.push({
          category: 'Mental Health',
          whoGuidelines: mentalHealthGuidelines.data
        });
      }
    }

    return {
      success: true,
      findings: findings,
      summary: findings.length > 0 
        ? `Found ${findings.length} relevant WHO guideline(s) for your report`
        : 'No specific WHO guidelines matched your report content'
    };
  } catch (error) {
    console.error('Report Analysis Error:', error.message);
    return {
      success: false,
      error: 'Failed to analyze report with WHO guidelines'
    };
  }
};

module.exports = {
  getHealthIndicators,
  getHealthData,
  searchWomenHealthInfo,
  getWomenHealthGuidelines,
  formatWHODataForChat,
  analyzeReportWithWHO
};
