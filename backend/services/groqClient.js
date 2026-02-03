import Groq from "groq-sdk";
import dotenv from 'dotenv';
dotenv.config();

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.warn('GROQ_API_KEY not set; GROQ features disabled.');
}

export async function analyzeWithGroq(data) {

  const prompt = `
You are ChatVeda, an advanced women's health AI assistant with expertise in medical report analysis.

User Profile:
${JSON.stringify(data.profile, null, 2)}

Medical Report Data:
${JSON.stringify(data.report, null, 2)}

ML Prediction Results:
${JSON.stringify(data.ml, null, 2)}

Your Tasks:
1. **Risk Assessment**: Analyze all test results and calculate an overall risk score (0-100)
2. **Condition Detection**: Identify any medical conditions, deficiencies, or abnormalities
3. **Detailed Explanations**: For each abnormal finding, explain what it means in simple terms
4. **Recommendations**: Provide specific, actionable health recommendations
5. **Diet Plan**: Suggest foods to eat and avoid based on findings
6. **Lifestyle Changes**: Recommend exercise, sleep, stress management strategies
7. **Follow-up Actions**: Suggest which tests to repeat and when to see a doctor
8. **Health Profile Updates**: Generate updates for the user's health profile database
9. **Trends Analysis**: If previous reports available, identify improving/declining trends
10. **Urgency Level**: Indicate if immediate medical attention is needed

Please analyze comprehensively and return STRICT JSON with this exact structure:

{
  "riskScore": number (0-100),
  "urgencyLevel": "low" | "medium" | "high" | "critical",
  "conditions": [
    {
      "name": "condition name",
      "severity": "mild" | "moderate" | "severe",
      "explanation": "what this means",
      "affectedTests": ["test names"]
    }
  ],
  "abnormalFindings": [
    {
      "test": "test name",
      "value": "current value",
      "normalRange": "expected range",
      "status": "high" | "low",
      "explanation": "what this means",
      "concern": "why this matters"
    }
  ],
  "recommendations": [
    {
      "category": "immediate" | "short-term" | "long-term",
      "action": "specific recommendation",
      "reason": "why this is important"
    }
  ],
  "dietPlan": {
    "toEat": ["food item with benefits"],
    "toAvoid": ["food item with reasons"],
    "supplements": ["recommended supplements"]
  },
  "lifestyle": {
    "exercise": ["specific exercise recommendations"],
    "sleep": "sleep recommendations",
    "stress": "stress management tips",
    "habits": ["habits to change"]
  },
  "followUp": {
    "tests": ["tests to repeat"],
    "timeline": "when to retest",
    "doctorVisit": "when to see doctor",
    "specialistNeeded": "type of specialist if needed"
  },
  "healthUpdates": {
    "detectedConditions": ["condition names to add to profile"],
    "riskFactors": ["risk factors identified"],
    "healthScore": number
  },
  "chartData": {
    "categories": ["category names for chart"],
    "values": [corresponding numeric values],
    "status": ["normal", "warning", "critical" for each category]
  },
  "summary": "Brief 2-3 sentence summary of overall health status"
}
`;

  if (!groq) {
    console.warn('Groq client not configured; returning fallback empty result');
    return {
      riskScore: 0,
      urgencyLevel: 'low',
      conditions: [],
      abnormalFindings: [],
      recommendations: [],
      dietPlan: { toEat: [], toAvoid: [], supplements: [] },
      lifestyle: { exercise: [], sleep: '', stress: '', habits: [] },
      followUp: { tests: [], timeline: '', doctorVisit: '', specialistNeeded: '' },
      healthUpdates: { detectedConditions: [], riskFactors: [], healthScore: 50 },
      chartData: { categories: [], values: [], status: [] },
      summary: 'Analysis not available - AI service not configured'
    };
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are ChatVeda, an expert medical AI assistant specializing in women's health. Always respond with valid JSON only, no additional text." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 4000
  });

  const content = completion.choices[0].message.content;

  try {
    // Remove markdown code blocks if present
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    
    // Ensure all required fields are present with defaults
    return {
      riskScore: parsed.riskScore || 0,
      urgencyLevel: parsed.urgencyLevel || 'low',
      conditions: parsed.conditions || [],
      abnormalFindings: parsed.abnormalFindings || [],
      recommendations: parsed.recommendations || [],
      dietPlan: parsed.dietPlan || { toEat: [], toAvoid: [], supplements: [] },
      lifestyle: parsed.lifestyle || { exercise: [], sleep: '', stress: '', habits: [] },
      followUp: parsed.followUp || { tests: [], timeline: '', doctorVisit: '', specialistNeeded: '' },
      healthUpdates: parsed.healthUpdates || { detectedConditions: [], riskFactors: [], healthScore: 50 },
      chartData: parsed.chartData || { categories: [], values: [], status: [] },
      summary: parsed.summary || 'Health analysis completed'
    };
  } catch (e) {
    console.warn('Groq parse error:', e.message);
    console.warn('Raw content:', content);
    return {
      riskScore: 0,
      urgencyLevel: 'low',
      conditions: [],
      abnormalFindings: [],
      recommendations: [{ category: 'immediate', action: 'Unable to parse AI response. Please try again.', reason: 'Technical error' }],
      dietPlan: { toEat: [], toAvoid: [], supplements: [] },
      lifestyle: { exercise: [], sleep: '', stress: '', habits: [] },
      followUp: { tests: [], timeline: '', doctorVisit: '', specialistNeeded: '' },
      healthUpdates: { detectedConditions: [], riskFactors: [], healthScore: 50 },
      chartData: { categories: [], values: [], status: [] },
      summary: 'Analysis failed - please try uploading the report again'
    };
  }
} 

export async function chatFlow({ message, userContext = '', conversationHistory = '' } = {}) {
  const systemPrompt = `You are ChatVeda, Aarogini's compassionate women's health AI assistant.

Your capabilities:
- Provide personalized health advice based on user's medical history and current health status
- Answer questions about menstrual health, pregnancy, PCOS, hormonal issues, and general wellness
- Explain medical test results in simple, easy-to-understand language
- Suggest lifestyle modifications, diet plans, and exercise routines
- Provide emotional support and encouragement

Guidelines:
- Be concise: 2-4 short sentences max
- Do NOT assume the user's gender, identity, or who the question is for
- Never say the user is "not experiencing" a topic; avoid partner/family assumptions
- Keep tone supportive, confident, and Aarogini-aligned
- When relevant, suggest an Aarogini feature (period tracker, report analyzer, insights) briefly
- Avoid mentioning other services or competitors
- If serious/urgent, recommend seeing a healthcare provider in one short line

${userContext ? `\nUser Context:\n${userContext}\n` : ''}
${conversationHistory ? `\nRecent Conversation:\n${conversationHistory}\n` : ''}

Remember: You have access to the user's health profile, so make responses specific to their situation and keep them brief.`;

  const userPrompt = message;

  try {
    if (!groq) {
      console.warn('Groq client not configured; chatFlow returning fallback.');
      return {
        response: 'I apologize, but the AI service is currently not configured. Please ensure your GROQ_API_KEY is set properly.',
        suggestions: []
      };
    }
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 350
    });
    
    const content = completion.choices[0].message.content;
    
    // Generate contextual suggestions
    const suggestions = generateSuggestions(message, userContext);
    
    return {
      response: content,
      suggestions: suggestions
    };
  } catch (e) {
    console.warn('chatFlow error', e.message);
    return {
      response: 'I apologize, but I encountered an error processing your request. Please try again.',
      suggestions: ['Check my health summary', 'Analyze my reports', 'Period tracking tips']
    };
  }
}

function generateSuggestions(message, userContext) {
  const suggestions = [];
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('period') || msgLower.includes('menstrual')) {
    suggestions.push('Tell me about my period patterns', 'Period pain management', 'Track my cycle');
  }
  if (msgLower.includes('pain') || msgLower.includes('cramp')) {
    suggestions.push('Natural pain relief methods', 'When to see a doctor', 'Diet for pain management');
  }
  if (msgLower.includes('diet') || msgLower.includes('food')) {
    suggestions.push('Healthy meal plan', 'Foods to avoid', 'Supplements I should take');
  }
  if (msgLower.includes('exercise') || msgLower.includes('workout')) {
    suggestions.push('Best exercises for me', 'Exercise schedule', 'Yoga recommendations');
  }
  if (msgLower.includes('report') || msgLower.includes('test')) {
    suggestions.push('Explain my latest report', 'What tests should I get', 'Track my health metrics');
  }
  
  // Default suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push('What should I know about my health?', 'Any recommendations for me?', 'How can I improve my wellness?');
  }
  
  return suggestions.slice(0, 3);
}

export async function doctorChat(data) {

  const prompt = `
You are ChatVeda, an experienced AI doctor.

User Profile:
${JSON.stringify(data.profile)}

Symptoms:
${data.symptoms}

ML Results:
${JSON.stringify(data.mlResults)}

Tasks:
1. Suggest possible conditions
2. Give severity level
3. Recommend tests
4. Suggest home care
5. When to see doctor
6. Red flags
7. Emotional support

Return STRICT JSON:

{
 "possibleConditions":[],
 "severity":"",
 "recommendations":[],
 "tests":[],
 "redFlags":[],
 "mentalSupport":""
}
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a licensed medical AI" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });

  const content = completion.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (e) {
    console.warn('Groq parse error (doctorChat):', e.message);
    return { possibleConditions: [], severity: "", recommendations: [], tests: [], redFlags: [], mentalSupport: "" };
  }
}

export async function compareReportsFlow({ reports, profile = {}, ml = {} } = {}) {
  // Combine reports into a single context for comparison
  const combined = Array.isArray(reports) ? reports.map(r => (typeof r === 'string' ? r : r.text || '')).join('\n\n') : String(reports || '');
  return analyzeWithGroq({ profile, report: { combinedReports: combined }, ml });
}
