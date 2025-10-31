const { googleAI } = require('@genkit-ai/google-genai');
const { genkit, z } = require('genkit');

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  Warning: GEMINI_API_KEY is not set. AI features will not work.');
}

// Initialize Genkit with Google AI plugin
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy-key' })],
  model: 'gemini-2.0-flash-exp',
  logLevel: 'error', // Reduce logging noise
  enableTracingAndMetrics: false, // Disable telemetry
});

// Medical Report Analysis Schema
const MedicalReportSchema = z.object({
  patient_info: z.object({
    name: z.string().nullable(),
    age: z.string().nullable(),
    gender: z.string().nullable(),
    report_date: z.string().nullable(),
  }),
  tests: z.array(z.object({
    test_name: z.string(),
    value: z.string(),
    unit: z.string(),
    reference_range: z.string(),
    status: z.enum(['NORMAL', 'HIGH', 'LOW', 'ABNORMAL']),
    category: z.string(),
  })),
  abnormal_findings: z.array(z.object({
    test: z.string(),
    value: z.string(),
    concern: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']),
  })),
  health_concerns: z.array(z.string()),
  tracking_recommendations: z.array(z.string()),
  womens_health_indicators: z.array(z.string()),
  summary: z.string(),
  detected_conditions: z.array(z.string()).optional(),
});

// Chat Response Schema
const ChatResponseSchema = z.object({
  response: z.string(),
  suggestions: z.array(z.string()).optional(),
});

// Define Medical Report Analyzer Flow (supports both text and images)
const analyzeReportFlow = ai.defineFlow(
  {
    name: 'analyzeReportFlow',
    inputSchema: z.object({
      reportText: z.string().optional(),
      reportType: z.string().optional(),
      imageUrl: z.string().optional(), // For image-based reports
      imageData: z.string().optional(), // For base64 encoded images
    }),
    outputSchema: MedicalReportSchema,
  },
  async (input) => {
    const analysisPrompt = `You are an expert medical report analyzer specializing in women's health. Analyze the following ${input.reportType || 'medical'} report thoroughly.

Focus on identifying conditions related to:
- Periods & Ovulation issues
- PCOS/PCOD
- Endometriosis
- Pregnancy & Maternal Health
- Postpartum Health
- Menopause
- UTI (Urinary Tract Infection)
- Vaginal Health
- Thyroid Disorders
- Breast Cancer markers
- Cervical Cancer markers
- Anemia
- Osteoporosis
- Depression & Anxiety markers
- Stress / PTSD indicators
- Body Image Disorder signs
- Obesity/Weight Issues
- Diabetes
- Hypertension
- Vitamin D & Calcium Deficiency
- Cardiovascular Disease indicators

Extract all test results, identify abnormal values, and list any detected health conditions from the above list.
Return a comprehensive analysis in the specified JSON format.`;

    let promptInput;

    // Handle image-based reports (direct multimodal input)
    if (input.imageUrl) {
      promptInput = [
        { media: { url: input.imageUrl } },
        { text: analysisPrompt }
      ];
    } else if (input.imageData) {
      // Handle base64 encoded images
      promptInput = [
        { media: { url: `data:image/jpeg;base64,${input.imageData}` } },
        { text: analysisPrompt }
      ];
    } else if (input.reportText) {
      // Handle text-based reports
      promptInput = `${analysisPrompt}\n\nReport Text:\n${input.reportText}`;
    } else {
      throw new Error('Either reportText, imageUrl, or imageData must be provided');
    }

    const { output } = await ai.generate({
      prompt: promptInput,
      output: { schema: MedicalReportSchema },
      config: {
        temperature: 0.2,
      },
    });

    if (!output) throw new Error('Failed to generate medical report analysis');
    return output;
  }
);

// Define Chat Flow
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      message: z.string(),
      conversationHistory: z.string().optional(),
      userContext: z.string().optional(),
    }),
    outputSchema: ChatResponseSchema,
  },
  async (input) => {
    const prompt = `You are Chat Veda, an empathetic AI health assistant specialized in women's health. Provide accurate, compassionate advice while always recommending professional medical consultation for serious concerns.

${input.userContext ? `User Context: ${input.userContext}\n\n` : ''}${input.conversationHistory ? `Conversation History:\n${input.conversationHistory}\n\n` : ''}User Question: ${input.message}

Respond helpfully and include 2-3 relevant suggestions or follow-up topics if appropriate.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: ChatResponseSchema },
      config: {
        temperature: 0.7,
      },
    });

    if (!output) throw new Error('Failed to generate chat response');
    return output;
  }
);

// Compare Reports Flow
const compareReportsFlow = ai.defineFlow(
  {
    name: 'compareReportsFlow',
    inputSchema: z.object({
      reports: z.array(z.object({
        date: z.string(),
        tests: z.array(z.object({
          test_name: z.string(),
          value: z.string(),
          status: z.string(),
        })),
      })),
    }),
    outputSchema: z.object({
      trends: z.array(z.object({
        parameter: z.string(),
        trend: z.enum(['improving', 'worsening', 'stable']),
        recommendation: z.string(),
      })),
      overall_assessment: z.string(),
    }),
  },
  async (input) => {
    const prompt = `Analyze these medical reports over time and identify health trends:

${JSON.stringify(input.reports, null, 2)}

Identify which parameters are improving, worsening, or stable. Provide actionable recommendations.`;

    const { output } = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          trends: z.array(z.object({
            parameter: z.string(),
            trend: z.enum(['improving', 'worsening', 'stable']),
            recommendation: z.string(),
          })),
          overall_assessment: z.string(),
        }),
      },
      config: { temperature: 0.3 },
    });

    if (!output) throw new Error('Failed to compare reports');
    return output;
  }
);

module.exports = {
  analyzeReportFlow,
  chatFlow,
  compareReportsFlow,
  ai,
};
