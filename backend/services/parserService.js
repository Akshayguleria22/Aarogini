// Simple parser to extract tests and values from raw report text
// Matches patterns like "Hemoglobin: 10.5 g/dL" or "TSH : 6.2 µIU/mL"

const TEST_ALIAS = {
  hemoglobin: ['hb', 'hemoglobin'],
  rbc: ['rbc', 'red blood cell'],
  hct: ['hct', 'hematocrit'],
  tsh: ['tsh', 'thyroid stimulating hormone'],
  t3: ['t3', 'triiodothyronine'],
  t4: ['t4', 'thyroxine'],
  glucose_fasting: ['glucose fasting', 'fasting glucose', 'fbs', 'blood sugar fasting'],
  glucose_postprandial: ['glucose postprandial', 'ppbs', 'post prandial glucose'],
  systolicbp: ['systolic', 'systolic bp', 'sbp'],
  diastolicbp: ['diastolic', 'diastolic bp', 'dbp'],
  bodytemp: ['body temperature', 'temperature', 'temp'],
  heartrate: ['heart rate', 'pulse', 'hr'],
  bmi: ['bmi', 'body mass index'],
  testosterone: ['testosterone', 'testosterone level'],
  afc: ['antral follicle count', 'afc'],
  age: ['age']
};

function canonicalizeName(name) {
  const low = name.toLowerCase().trim().replace(/\s+/g, ' ');
  for (const [canon, list] of Object.entries(TEST_ALIAS)) {
    if (list.some(a => low.includes(a))) return canon;
  }
  return low;
}

function parseTestsFromText(text) {
  if (!text) return { map: {}, tests: [] };
  const lines = text.split(/\r?\n/);
  const map = {};
  const tests = [];

  const re = /([A-Za-z][A-Za-z \-/()%]*?)\s*[:\-]\s*([\d.]+)\s*([^\s\d][^\n]*)?/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const m = line.match(re);
    if (!m) continue;
    const name = m[1].trim();
    const valueNum = parseFloat(m[2]);
    const unit = (m[3] || '').trim();
    if (!Number.isFinite(valueNum)) continue;

    const canon = canonicalizeName(name);
    if (map[canon] === undefined) {
      map[canon] = valueNum;
    }
    tests.push({
      test_name: name,
      value: String(valueNum),
      unit: unit,
      reference_range: '',
      // status intentionally omitted to satisfy schema enum constraints
      category: 'general'
    });
  }

  return { map, tests };
}

module.exports = {
  parseTestsFromText,
  canonicalizeName,
};
