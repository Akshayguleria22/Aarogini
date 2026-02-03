// Enhanced parser to extract tests and values from raw report text
// Matches patterns like "Hemoglobin: 10.5 g/dL" or "TSH : 6.2 uIU/mL"

const TEST_ALIAS = {
  hemoglobin: ['hb', 'hemoglobin', 'haemoglobin'],
  rbc: ['rbc', 'red blood cell', 'red blood cells', 'erythrocytes'],
  wbc: ['wbc', 'white blood cell', 'white blood cells', 'leukocytes'],
  platelets: ['platelets', 'platelet count', 'plt'],
  hct: ['hct', 'hematocrit', 'haematocrit', 'pcv'],
  mcv: ['mcv', 'mean corpuscular volume'],
  mch: ['mch', 'mean corpuscular hemoglobin'],
  mchc: ['mchc', 'mean corpuscular hemoglobin concentration'],
  tsh: ['tsh', 'thyroid stimulating hormone', 'thyroid-stimulating hormone'],
  t3: ['t3', 'triiodothyronine', 'tri-iodothyronine'],
  t4: ['t4', 'thyroxine'],
  glucose_fasting: ['glucose fasting', 'fasting glucose', 'fbs', 'blood sugar fasting', 'fasting blood sugar'],
  glucose_postprandial: ['glucose postprandial', 'ppbs', 'post prandial glucose', 'postprandial blood sugar'],
  glucose_random: ['glucose random', 'random blood sugar', 'rbs'],
  hba1c: ['hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin', 'a1c'],
  systolicbp: ['systolic', 'systolic bp', 'sbp', 'systolic blood pressure'],
  diastolicbp: ['diastolic', 'diastolic bp', 'dbp', 'diastolic blood pressure'],
  bodytemp: ['body temperature', 'temperature', 'temp'],
  heartrate: ['heart rate', 'pulse', 'hr', 'pulse rate'],
  bmi: ['bmi', 'body mass index'],
  testosterone: ['testosterone', 'testosterone level'],
  estrogen: ['estrogen', 'estradiol', 'e2'],
  progesterone: ['progesterone'],
  lh: ['lh', 'luteinizing hormone'],
  fsh: ['fsh', 'follicle stimulating hormone'],
  prolactin: ['prolactin', 'prl'],
  afc: ['antral follicle count', 'afc'],
  creatinine: ['creatinine', 'serum creatinine'],
  urea: ['urea', 'blood urea', 'bun'],
  uric_acid: ['uric acid', 'uric-acid'],
  cholesterol_total: ['cholesterol total', 'total cholesterol', 'cholesterol'],
  hdl: ['hdl', 'hdl cholesterol', 'high density lipoprotein'],
  ldl: ['ldl', 'ldl cholesterol', 'low density lipoprotein'],
  triglycerides: ['triglycerides', 'tg'],
  vldl: ['vldl', 'very low density lipoprotein'],
  alt: ['alt', 'sgpt', 'alanine aminotransferase'],
  ast: ['ast', 'sgot', 'aspartate aminotransferase'],
  alp: ['alp', 'alkaline phosphatase'],
  bilirubin_total: ['bilirubin total', 'total bilirubin'],
  bilirubin_direct: ['bilirubin direct', 'direct bilirubin'],
  vitamin_d: ['vitamin d', 'vitamin-d', '25-oh vitamin d', '25(oh)d'],
  vitamin_b12: ['vitamin b12', 'b12', 'cobalamin'],
  iron: ['iron', 'serum iron'],
  calcium: ['calcium', 'serum calcium'],
  sodium: ['sodium', 'na'],
  potassium: ['potassium', 'k'],
  age: ['age']
};

function canonicalizeName(name) {
  const low = name.toLowerCase().trim().replace(/\s+/g, ' ');
  for (const [canon, list] of Object.entries(TEST_ALIAS)) {
    if (list.some(a => low.includes(a))) return canon;
  }
  return low;
}

function normalizeText(text) {
  return String(text || '')
    .replace(/[–—]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ');
}

function parseRange(refRange = '') {
  const cleaned = String(refRange || '').replace(/[–—]/g, '-');
  const m = cleaned.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (!m) return null;
  const min = parseFloat(m[1]);
  const max = parseFloat(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

function parseValue(valueStr) {
  const cleaned = String(valueStr || '').replace(/[<>]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseTestsFromText(text) {
  if (!text) return { map: {}, tests: [] };
  const lines = String(text).split(/\r?\n/);
  const map = {};
  const tests = [];

  const patterns = [
    /([A-Za-z][A-Za-z0-9 \-/()%]*?)\s*[:\-]\s*([\d.]+)\s*([^\s\d|(\n][^|(\n]*?)?\s*(?:\(([^\)]+)\)|[|]\s*(.+?))?$/,
    /([A-Za-z][A-Za-z0-9 \-/()%]{2,})\s{2,}([\d.]+)\s+([^\s\d][^\n\t]*?)\s+([^\n]+)?$/,
    /([A-Za-z][A-Za-z0-9 \-/()%]{2,})\s+([<>]?\s*[\d.]+)\s*([A-Za-z/%]+)?\s*(H|L|HIGH|LOW)?\s*(\d+\.?\d*\s*-\s*\d+\.?\d*)?$/i,
  ];

  for (const rawLine of lines) {
    const line = normalizeText(rawLine).trim();
    if (line.length === 0) continue;

    let matched = false;
    for (const re of patterns) {
      const m = line.match(re);
      if (!m) continue;

      const name = m[1].trim();
      const valueNum = parseValue(m[2]);
      if (!Number.isFinite(valueNum)) continue;

      const unit = (m[3] || '').trim();
      const refRange = (m[4] || m[5] || '').trim();
      const flagRaw = (m[4] || m[5] || m[6] || '').toString().toUpperCase();
      const flag = flagRaw.includes('HIGH') || flagRaw === 'H'
        ? 'H'
        : (flagRaw.includes('LOW') || flagRaw === 'L' ? 'L' : '');

      const canon = canonicalizeName(name);
      if (map[canon] === undefined) {
        map[canon] = valueNum;
      }

      let status = 'normal';
      const range = parseRange(refRange);
      if (range) {
        if (valueNum < range.min) status = 'low';
        else if (valueNum > range.max) status = 'high';
      } else if (flag === 'H') {
        status = 'high';
      } else if (flag === 'L') {
        status = 'low';
      }

      const statusMap = { normal: 'NORMAL', low: 'LOW', high: 'HIGH', abnormal: 'ABNORMAL' };
      const normalizedStatus = statusMap[status] || 'ABNORMAL';

      tests.push({
        test_name: name,
        value: String(valueNum),
        unit: unit,
        reference_range: refRange,
        status: normalizedStatus,
        category: getCategoryForTest(canon)
      });

      matched = true;
      break;
    }
  }

  return { map, tests };
}

function getCategoryForTest(canonicalName) {
  const categories = {
    complete_blood_count: ['hemoglobin', 'rbc', 'wbc', 'platelets', 'hct', 'mcv', 'mch', 'mchc'],
    thyroid: ['tsh', 't3', 't4'],
    diabetes: ['glucose_fasting', 'glucose_postprandial', 'glucose_random', 'hba1c'],
    vitals: ['systolicbp', 'diastolicbp', 'bodytemp', 'heartrate', 'bmi'],
    hormones: ['testosterone', 'estrogen', 'progesterone', 'lh', 'fsh', 'prolactin'],
    kidney: ['creatinine', 'urea', 'uric_acid'],
    lipid: ['cholesterol_total', 'hdl', 'ldl', 'triglycerides', 'vldl'],
    liver: ['alt', 'ast', 'alp', 'bilirubin_total', 'bilirubin_direct'],
    vitamins: ['vitamin_d', 'vitamin_b12', 'iron', 'calcium'],
    electrolytes: ['sodium', 'potassium']
  };

  for (const [category, tests] of Object.entries(categories)) {
    if (tests.includes(canonicalName)) return category;
  }
  return 'general';
}

function parseMedicalData(text) {
  const { map, tests } = parseTestsFromText(text);

  return {
    hb: map.hemoglobin || null,
    rbc: map.rbc || null,
    wbc: map.wbc || null,
    platelets: map.platelets || null,
    hct: map.hct || null,
    sugar: map.glucose_fasting || map.glucose_random || null,
    glucose_fasting: map.glucose_fasting || null,
    glucose_postprandial: map.glucose_postprandial || null,
    hba1c: map.hba1c || null,
    cholesterol: map.cholesterol_total || null,
    hdl: map.hdl || null,
    ldl: map.ldl || null,
    triglycerides: map.triglycerides || null,
    tsh: map.tsh || null,
    t3: map.t3 || null,
    t4: map.t4 || null,
    bp_sys: map.systolicbp || null,
    bp_dia: map.diastolicbp || null,
    vitaminD: map.vitamin_d || null,
    vitaminB12: map.vitamin_b12 || null,
    testosterone: map.testosterone || null,
    estrogen: map.estrogen || null,
    progesterone: map.progesterone || null,
    lh: map.lh || null,
    fsh: map.fsh || null,
    prolactin: map.prolactin || null,
    creatinine: map.creatinine || null,
    urea: map.urea || null,
    alt: map.alt || null,
    ast: map.ast || null,
    iron: map.iron || null,
    calcium: map.calcium || null,
    tests: tests,
    testMap: map
  };
}

export {
  parseTestsFromText,
  canonicalizeName,
  parseMedicalData,
  parseRange
};
