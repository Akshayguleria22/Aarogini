import axios from "axios";

const ML = process.env.ML_BASE_URL || "http://127.0.0.1:8000";

export async function analyzeWithML(data) {
  try {

    const response = await axios.post(
      `${ML}/analyze`,
      data,
      {
        timeout: 10000
      }
    );

    return response.data;

  } catch (err) {

    console.error("ML Service Error:", err.message);

    // Fallback (temporary safety)
    return {
      risk: "unknown",
      anemia: data.hb < 12,
      diabetes: data.sugar > 140,
      bpRisk: data.bp_sys > 130
    };
  }
}

export async function cancerPredict(data) {
  return (await axios.post(`${ML}/predict/cancer`, data)).data;
}

export async function maternalPredict(data) {
  return (await axios.post(`${ML}/predict/maternal`, data)).data;
}

export async function pcosPredict(data) {
  return (await axios.post(`${ML}/predict/pcos`, data)).data;
}

export async function samplePredict(data) {
  return (await axios.post(`${ML}/predict/sample`, data)).data;
}

export async function qaAnswer(message) {
  // Placeholder QA implementation: returns a simple canned response or calls ML QA endpoint if available
  try {
    if (process.env.ML_QA_ENDPOINT) {
      const r = await axios.post(process.env.ML_QA_ENDPOINT, { message }, { timeout: 5000 });
      return r.data?.answer || `No answer from QA endpoint for: ${message}`;
    }
  } catch (e) {
    // ignore and fallback
  }
  return `Demo QA response: ${String(message).slice(0, 200)}`;
}

export async function derivePredictionsFromAnalysis(data) {
  try {
    const results = await analyzeWithML(data);
    // Convert ML output to an array of { model, prediction }
    const out = [];
    if (results?.pcos !== undefined) out.push({ model: 'pcos', prediction: results.pcos });
    if (results?.risk !== undefined) out.push({ model: 'maternal_health_risk', prediction: results.risk });
    if (results?.cancer !== undefined) out.push({ model: 'cancer', prediction: results.cancer });
    return out;
  } catch (e) {
    return [];
  }
}
