const axios = require('axios');

// HTTPS-only base for OpenFDA (drugs)
const FDA_DRUG_BASE = 'https://api.fda.gov/drug/';
const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY;

// Build URL with api_key as the first query parameter (when available)
function buildFDAUrl(path, params = {}) {
  const cleanPath = String(path || '').replace(/^\//, '');
  const url = new URL(cleanPath, FDA_DRUG_BASE); // results in https://api.fda.gov/drug/<path>
  if (OPENFDA_API_KEY) {
    // api_key first
    url.searchParams.append('api_key', OPENFDA_API_KEY);
  }
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.append(k, v);
  }
  return url.toString();
}

// Fetch JSON with safe error handling
async function fetchJson(url) {
  try {
    // If caller did not use buildFDAUrl, still ensure api_key precedence
    let finalUrl = url;
    if (OPENFDA_API_KEY && !/([?&])api_key=/.test(finalUrl)) {
      const u = new URL(finalUrl);
      // Rebuild with api_key first
      const rebuilt = new URL(u.pathname, u.origin + u.search);
      rebuilt.search = '';
      rebuilt.searchParams.append('api_key', OPENFDA_API_KEY);
      // Append existing params after
      for (const [k, v] of u.searchParams.entries()) {
        if (k !== 'api_key') rebuilt.searchParams.append(k, v);
      }
      finalUrl = rebuilt.toString();
    }
    const headers = { Accept: 'application/json' };
    const resp = await axios.get(finalUrl, { headers });
    return { ok: true, data: resp.data };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    return { ok: false, status, error: data?.error?.message || err.message };
  }
}

// Build a search string that matches brand or generic names
function buildNameQuery(q) {
  const esc = (s) => String(s || '').replace(/"/g, '\\"');
  const term = esc(q);
  // Let URLSearchParams handle encoding; we construct a readable query here
  return `openfda.brand_name:"${term}" OR openfda.generic_name:"${term}" OR description:"${term}"`;
}

// Helper to normalize text fields that can be arrays or strings
function pickText(obj, key) {
  const v = obj?.[key];
  if (Array.isArray(v)) return v.join('\n\n');
  if (typeof v === 'string') return v;
  return undefined;
}

// Label information
async function getLabel(q) {
  const search = buildNameQuery(q);
  const url = buildFDAUrl('label.json', { search, limit: 1 });
  const res = await fetchJson(url);
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  const result = res.data?.results?.[0];
  if (!result) return { ok: false, error: 'No label found' };

  return {
    ok: true,
    data: {
      id: result.id,
      effective_time: result.effective_time,
      brand_names: result.openfda?.brand_name || [],
      generic_names: result.openfda?.generic_name || [],
      route: result.openfda?.route || [],
      substance_name: result.openfda?.substance_name || [],
      pharmacologic_class: result.openfda?.pharm_class_epc || result.openfda?.pharm_class_cs || [],
      indications_and_usage: pickText(result, 'indications_and_usage'),
      dosage_and_administration: pickText(result, 'dosage_and_administration'),
      inactive_ingredient: pickText(result, 'inactive_ingredient'),
      warnings: pickText(result, 'warnings') || pickText(result, 'warnings_and_cautions'),
      boxed_warning: pickText(result, 'boxed_warning'),
      adverse_reactions: pickText(result, 'adverse_reactions'),
      contraindications: pickText(result, 'contraindications'),
      drug_interactions: pickText(result, 'drug_interactions'),
      clinical_pharmacology: pickText(result, 'clinical_pharmacology'),
      pregnancy: pickText(result, 'pregnancy'),
      nursing_mothers: pickText(result, 'nursing_mothers'),
      labor_and_delivery: pickText(result, 'labor_and_delivery'),
      pediatric_use: pickText(result, 'pediatric_use'),
      geriatric_use: pickText(result, 'geriatric_use'),
      storage_and_handling: pickText(result, 'storage_and_handling'),
    }
  };
}

// NDC dataset
async function getNdc(q) {
  const esc = (s) => String(s || '').replace(/"/g, '\\"');
  const term = esc(q);
  const search = `brand_name:"${term}" OR generic_name:"${term}"`;
  const url = buildFDAUrl('ndc.json', { search, limit: 5 });
  const res = await fetchJson(url);
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  const results = res.data?.results || [];
  if (!results.length) return { ok: false, error: 'No NDC data found' };

  const first = results[0];
  return {
    ok: true,
    data: {
      marketing_category: first.marketing_category,
      dosage_form: first.dosage_form,
      route: first.route,
      active_ingredients: first.active_ingredients || [],
      packaging: first.packaging || [],
      ndc_match_count: results.length,
    }
  };
}

// Drugs@FDA dataset
async function getDrugsFda(q) {
  const esc = (s) => String(s || '').replace(/"/g, '\\"');
  const term = esc(q);
  const search = `products.brand_name:"${term}" OR products.generic_name:"${term}"`;
  const url = buildFDAUrl('drugsfda.json', { search, limit: 1 });
  const res = await fetchJson(url);
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  const r = res.data?.results?.[0];
  if (!r) return { ok: false, error: 'No Drugs@FDA data found' };

  const product = r.products?.[0] || {};
  return {
    ok: true,
    data: {
      application_number: r.application_number,
      sponsor_name: r.sponsor_name,
      product_type: product.product_type,
      form: product.form,
      route: product.route,
      strength: product.strength,
    }
  };
}

// Aggregate and normalize across endpoints
async function searchDrugDetails(query) {
  const [label, ndc, drugsfda] = await Promise.allSettled([
    getLabel(query),
    getNdc(query),
    getDrugsFda(query)
  ]);

  const read = (r) => (r.status === 'fulfilled' && r.value?.ok ? r.value.data : null);
  const labelData = read(label);
  const ndcData = read(ndc);
  const fdaData = read(drugsfda);

  if (!labelData && !ndcData && !fdaData) {
    return { ok: false, error: 'No data found for the requested medicine in OpenFDA' };
  }

  const marketing = ndcData?.marketing_category || '';
  const prescriptionRequired = /prescription/i.test(marketing);

  const brandNames = labelData?.brand_names || [];
  const genericNames = labelData?.generic_names || [];

  const activeIngredients = ndcData?.active_ingredients || [];
  const ingredientsText = labelData?.active_ingredient;

  const summaryParts = [];
  if (labelData?.indications_and_usage) summaryParts.push('Uses: ' + labelData.indications_and_usage.split('\n')[0]);
  if (labelData?.warnings) summaryParts.push('Warning: ' + labelData.warnings.split('\n')[0]);
  const summary = summaryParts.join('\n\n');

  return {
    ok: true,
    data: {
      query,
      names: { brand: brandNames, generic: genericNames },
      regulatory: {
        prescriptionRequired,
        marketingCategory: marketing,
        applicationNumber: fdaData?.application_number,
        sponsorName: fdaData?.sponsor_name,
        productType: fdaData?.product_type,
      },
      composition: {
        activeIngredients,
        activeIngredientLabel: ingredientsText,
        route: ndcData?.route || labelData?.route || [],
        dosageForm: ndcData?.dosage_form || fdaData?.form,
      },
      label: {
        indications_and_usage: labelData?.indications_and_usage,
        dosage_and_administration: labelData?.dosage_and_administration,
        warnings: labelData?.warnings,
        boxed_warning: labelData?.boxed_warning,
        adverse_reactions: labelData?.adverse_reactions,
        contraindications: labelData?.contraindications,
        drug_interactions: labelData?.drug_interactions,
        clinical_pharmacology: labelData?.clinical_pharmacology,
        pregnancy: labelData?.pregnancy,
        nursing_mothers: labelData?.nursing_mothers,
        storage_and_handling: labelData?.storage_and_handling,
      },
      meta: {
        sources: {
          label: 'openFDA drug/label',
          ndc: 'openFDA drug/ndc',
          drugsfda: 'openFDA drug/drugsfda',
        },
      },
      summary,
    },
  };
}

// Adverse events summary and latest examples
async function searchDrugEvents(query) {
  const esc = (s) => String(s || '').replace(/"/g, '\\"');
  const term = esc(query);
  const reactionsSearch = `patient.drug.medicinalproduct:"${term}"`;

  const reactionsUrl = buildFDAUrl('event.json', {
    search: reactionsSearch,
    count: 'patient.reaction.reactionmeddrapt.exact',
    limit: 20,
  });
  const recentUrl = buildFDAUrl('event.json', {
    search: reactionsSearch,
    limit: 10,
    sort: 'receiptdate:desc',
  });

  const [reactionsRes, recentRes] = await Promise.allSettled([
    fetchJson(reactionsUrl),
    fetchJson(recentUrl),
  ]);

  const get = (r) => (r.status === 'fulfilled' && r.value?.ok ? r.value.data : null);
  const reactionsData = get(reactionsRes)?.results || [];
  const recentData = get(recentRes)?.results || [];

  if (!reactionsData.length && !recentData.length) {
    return { ok: false, error: 'No adverse event data found for this medicine' };
  }

  const recent = recentData.map((e) => ({
    safetyReportId: e.safetyreportid,
    received: e.receiptdate,
    reactions: (e.patient?.reaction || []).map((r) => r.reactionmeddrapt).filter(Boolean),
    seriousness: {
      death: e.seriousnessdeath === '1',
      hospitalization: e.seriousnesshospitalization === '1',
      lifeThreatening: e.seriousnesslifethreatening === '1',
    },
  }));

  return {
    ok: true,
    data: {
      query,
      reactions: reactionsData.map((r) => ({ term: r.term, count: r.count })),
      recent,
    },
  };
}

module.exports = {
  getLabel,
  getNdc,
  getDrugsFda,
  searchDrugDetails,
  searchDrugEvents,
};
