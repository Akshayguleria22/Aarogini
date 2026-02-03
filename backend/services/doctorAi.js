import { cancerPredict, maternalPredict, pcosPredict } from "./modelService.js";
import { doctorChat } from "./groqClient.js";

export async function runDoctorAI(symptoms, user) {

    const list = Array.isArray(symptoms)
        ? symptoms
        : String(symptoms || '')
            .split(/[,\n]/)
            .map(s => s.trim())
            .filter(Boolean);

    const normalized = list.map(s => s.toLowerCase());

    // Emergency flags
    const emergencyFlags = ['chest pain', 'heavy bleeding', 'fainting', 'severe bleeding', 'shortness of breath'];
    if (normalized.some(s => emergencyFlags.some(flag => s.includes(flag)))) {
        return {
            emergency: true,
            message: "Seek immediate medical help."
        };
    }

    let mlResults = {};
    const healthData = user?.healthProfile || user?.healthData || {};

    // PCOS Check (female reproductive symptoms)
    if (normalized.some(s =>
        s.includes("irregular period") ||
        s.includes("weight gain") ||
        s.includes("acne") ||
        s.includes("hair loss") ||
        s.includes("excess hair")
    )) {
        try {
            mlResults.pcos = await pcosPredict(healthData);
        } catch {
            // ignore ML failures, keep flow
        }
    }

    // Maternal Check
    if (user?.isPregnant) {
        try {
            mlResults.maternal = await maternalPredict(healthData);
        } catch {
            // ignore ML failures
        }
    }

    // Cancer Risk Check
    if (normalized.some(s =>
        s.includes("bleeding") ||
        s.includes("pelvic pain") ||
        s.includes("discharge")
    )) {
        try {
            mlResults.cancer = await cancerPredict(healthData);
        } catch {
            // ignore ML failures
        }
    }

    // LLM Reasoning (doctorChat expects symptoms + mlResults + profile)
    const aiResult = await doctorChat({
        symptoms: list.join(', ') || 'No symptoms provided',
        mlResults,
        profile: user || {}
    });

    return {
        emergency: false,
        mlResults,
        aiResult
    };

}
