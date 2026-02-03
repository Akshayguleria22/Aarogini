from fastapi import FastAPI
import pandas as pd
import joblib

app = FastAPI(title="Aarogini AI Health Engine")

# Load Models
cancer_model = joblib.load("model/cancer.pkl")
maternal_model, maternal_encoder = joblib.load("model/maternal.pkl")
pcos_model = joblib.load("model/pcos.pkl")
sample=joblib.load("model/health_model.pkl")


# ---------------- CERVICAL ----------------
@app.post("/predict/cancer")
def predict_cancer(data: dict):

    df = pd.DataFrame([data])

    prob = cancer_model.predict_proba(df)[0][1]

    return {
        "cancerRisk": prob > 0.5,
        "probability": round(float(prob),3)
    }


# ---------------- MATERNAL ----------------
@app.post("/predict/maternal")
def predict_maternal(data: dict):

    df = pd.DataFrame([data])

    pred = maternal_model.predict(df)[0]
    risk = maternal_encoder.inverse_transform([pred])[0]

    return {
        "riskLevel": risk
    }


# ---------------- PCOS ----------------
@app.post("/predict/pcos")
def predict_pcos(data: dict):

    df = pd.DataFrame([data])

    prob = pcos_model.predict_proba(df)[0][1]

    return {
        "pcosRisk": prob > 0.5,
        "probability": round(float(prob),3)
    }

# ---------------- GENERIC ANALYSIS ----------------
@app.post("/analyze")
def analyze_report(data: dict):
    tests = data.get("tests", []) or []

    def find_value(keys):
        # direct fields first
        for k in keys:
            v = data.get(k)
            if v is not None:
                try:
                    return float(v)
                except Exception:
                    pass
        # then scan tests list
        for t in tests:
            name = str(t.get("test_name") or "").lower()
            for k in keys:
                if k in name:
                    try:
                        return float(t.get("value"))
                    except Exception:
                        continue
        return None

    hb = find_value(["hemoglobin", "hb"])
    sugar = find_value(["glucose", "sugar", "fbs", "rbs"])
    sys_bp = find_value(["systolic", "sbp", "systolic bp"])

    anemia = hb is not None and hb < 12
    diabetes = sugar is not None and sugar > 140
    bp_risk = sys_bp is not None and sys_bp > 130

    risk_score = 0
    if anemia:
        risk_score += 20
    if diabetes:
        risk_score += 30
    if bp_risk:
        risk_score += 20

    return {
        "risk": "elevated" if risk_score >= 40 else "low",
        "riskScore": risk_score,
        "anemia": anemia,
        "diabetes": diabetes,
        "bpRisk": bp_risk
    }
