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
