import { extractReportText } from "./reportExtractor.js";
import { parseMedicalData } from "./parserService.js";
import { analyzeWithML } from "./modelService.js";
import { analyzeWithGroq } from "./groqClient.js";
import Health from "../models/Health.js";
import {
    cancerPredict,
    maternalPredict,
    pcosPredict,
    samplePredict
} from "./modelService.js";
    

export async function runHealthAnalysis(file, user) {
    try {

        // 1. Extract Text
        const text = await extractReportText(file);

        // 2. Parse to Structured JSON
        const structured = await parseMedicalData(text);

        // 3. ML Analysis
        const mlResult = await analyzeWithML(structured);

        // 4. Groq Reasoning (ChatVeda)
        const aiResult = await analyzeWithGroq({
            report: structured,
            ml: mlResult,
            profile: user
        });

        // 5. Update Health Profile
        if (aiResult.healthUpdates) {
            await Health.updateOne(
                { userId: user._id },
                { $set: aiResult.healthUpdates },
                { upsert: true }
            );
        }

        return {
            extractedText: text,
            structured,
            mlResult,
            aiResult
        };

    } catch (err) {
        console.error("Health AI Engine Error:", err);
        throw err;
    }
}
