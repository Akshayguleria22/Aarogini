const { spawn } = require('child_process');
const path = require('path');

const PYTHON_EXE = process.env.PYTHON_EXE || 'python';
const INFERENCE_SCRIPT = path.join(__dirname, '..', '..', 'inference.py');

function runInference(payload) {
  return new Promise((resolve, reject) => {
    try {
      const py = spawn(PYTHON_EXE, [INFERENCE_SCRIPT], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let out = '';
      let err = '';

      py.stdout.on('data', (d) => (out += d.toString()))
      py.stderr.on('data', (d) => (err += d.toString()))

      py.on('error', (e) => reject(e));
      py.on('close', (code) => {
        if (code !== 0 && err) return reject(new Error(err.trim()))
        try {
          const parsed = JSON.parse(out || '{}');
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Invalid JSON from inference: ${out || ''} ${err || ''}`));
        }
      });

      py.stdin.write(JSON.stringify(payload));
      py.stdin.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function qaAnswer(query) {
  const res = await runInference({ task: 'qa', query });
  if (!res.success) throw new Error(res.error || 'QA failed');
  return res.answer;
}

async function classify(modelKey, features) {
  const res = await runInference({ task: 'classify', model: modelKey, features });
  if (!res.success) throw new Error(res.error || 'Classification failed');
  return res;
}

function pickTestValue(tests, nameIncludes) {
  if (!Array.isArray(tests)) return undefined;
  const idx = tests.findIndex(t => (t.test_name || '').toLowerCase().includes(nameIncludes));
  if (idx === -1) return undefined;
  const val = parseFloat(tests[idx].value);
  return Number.isFinite(val) ? val : undefined;
}

async function derivePredictionsFromAnalysis(analysis) {
  const tests = analysis?.tests || [];
  const patientAge = parseFloat(analysis?.patient_info?.age);

  const predictions = [];

  // Maternal Health Risk (if we have required fields)
  const mFeatures = {
    Age: Number.isFinite(patientAge) ? patientAge : undefined,
    SystolicBP: pickTestValue(tests, 'systolic'),
    DiastolicBP: pickTestValue(tests, 'diastolic'),
    BS: pickTestValue(tests, 'blood sugar') ?? pickTestValue(tests, 'glucose') ?? pickTestValue(tests, 'bs'),
    BodyTemp: pickTestValue(tests, 'temperature'),
    HeartRate: pickTestValue(tests, 'heart rate') ?? pickTestValue(tests, 'pulse')
  };
  const mHas = Object.values(mFeatures).filter(v => v !== undefined).length >= 4; // tolerate missing
  if (mHas) {
    try {
      const res = await classify('Maternal_Health_Risk_Data_Set', mFeatures);
      predictions.push({ model: 'maternal_health_risk', prediction: res.prediction, proba: res.proba, features: mFeatures });
    } catch (e) { /* ignore */ }
  }

  // PCOS (if some fields exist)
  const pFeatures = {
    Age: Number.isFinite(patientAge) ? patientAge : undefined,
    BMI: pickTestValue(tests, 'bmi'),
    'Testosterone_Level(ng/dL)': pickTestValue(tests, 'testosterone'),
    Antral_Follicle_Count: pickTestValue(tests, 'follicle'),
    Menstrual_Irregularity: undefined // can't infer from report tests easily
  };
  const pHas = Object.values(pFeatures).filter(v => v !== undefined).length >= 3;
  if (pHas) {
    try {
      const res = await classify('pcos_dataset', pFeatures);
      predictions.push({ model: 'pcos', prediction: res.prediction, proba: res.proba, features: pFeatures });
    } catch (e) { /* ignore */ }
  }

  // Cervical Cancer risk (dataset uses many lifestyle features; not usually in lab reports)
  // We will skip unless we explicitly get matching fields (unlikely from report analysis)

  return predictions;
}

module.exports = {
  qaAnswer,
  classify,
  derivePredictionsFromAnalysis,
};
