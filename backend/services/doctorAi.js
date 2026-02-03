import { cancerPredict, maternalPredict, pcosPredict } from "./modelService.js";
import { analyzeWithGroq } from "./groqClient.js";

export async function runDoctorAI(symptoms, user) {

    let mlResults = {};

    // PCOS Check (female reproductive symptoms)
    if (
        symptoms.includes("irregular periods") ||
        symptoms.includes("weight gain") ||
        symptoms.includes("acne") ||
        symptoms.includes("hair loss")
    ) {
        mlResults.pcos = await pcosPredict(user.healthData || {});
    }

    // Maternal Check
    if (user.isPregnant) {
        mlResults.maternal = await maternalPredict(user.healthData || {});
    }

    // Cancer Risk Check
    if (
        symptoms.includes("bleeding") ||
        symptoms.includes("pelvic pain") ||
        symptoms.includes("discharge")
    ) {
        mlResults.cancer = await cancerPredict(user.healthData || {});
    }

    // LLM Reasoning
    const aiResult = await analyzeWithGroq({
        symptoms,
        mlResults,
        profile: user
    });

    return {
        mlResults,
        aiResult
    };
    if (symptoms.includes("chest pain") ||
        symptoms.includes("heavy bleeding") ||
        symptoms.includes("fainting")) {

        return {
            emergency: true,
            message: "Seek immediate medical help."
        };
    }

}
