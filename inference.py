#!/usr/bin/env python3
import sys
import os
import json
import traceback
from typing import Dict, Any

import joblib
import pandas as pd


MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')


def load_model(path: str):
    return joblib.load(path)


def build_input_df(pipeline, features: Dict[str, Any]) -> pd.DataFrame:
    # Ensure expected columns exist per the saved ColumnTransformer
    try:
        preprocess = pipeline.named_steps.get('preprocess')
        if preprocess is None:
            # Model saved without preprocess (shouldn't happen here)
            cols = list(features.keys())
        else:
            cols_num = list(preprocess.transformers_[0][2]) if len(preprocess.transformers_) > 0 else []
            cols_cat = list(preprocess.transformers_[1][2]) if len(preprocess.transformers_) > 1 else []
            cols = cols_num + cols_cat
    except Exception:
        cols = list(features.keys())

    # Create a DataFrame with exactly expected columns
    row = {}
    for c in cols:
        row[c] = features.get(c, None)
    df = pd.DataFrame([row])
    return df


def handle_classify(payload: Dict[str, Any]):
    model_key = payload.get('model')
    features = payload.get('features') or {}

    if not model_key:
        return {"success": False, "error": "model is required"}

    # Map friendly keys to file names
    model_filename_map = {
        'pcos_dataset': 'pcos_dataset_model.pkl',
        'Maternal_Health_Risk_Data_Set': 'Maternal_Health_Risk_Data_Set_model.pkl',
        'kag_risk_factors_cervical_cancer': 'kag_risk_factors_cervical_cancer_model.pkl',
    }

    model_file = model_filename_map.get(model_key)
    if not model_file:
        return {"success": False, "error": f"unknown model '{model_key}'"}

    path = os.path.join(MODELS_DIR, model_file)
    if not os.path.exists(path):
        return {"success": False, "error": f"model file not found: {path}"}

    clf = load_model(path)
    X = build_input_df(clf, features)
    pred = clf.predict(X)[0]

    proba = None
    try:
        if hasattr(clf, 'predict_proba'):
            probs = clf.predict_proba(X)[0]
            classes = getattr(clf, 'classes_', None)
            if classes is None and hasattr(clf, 'named_steps') and 'model' in clf.named_steps:
                classes = getattr(clf.named_steps['model'], 'classes_', None)
            if classes is not None:
                proba = {str(cls): float(prob) for cls, prob in zip(classes, probs)}
    except Exception:
        proba = None

    return {"success": True, "prediction": (pred.item() if hasattr(pred, 'item') else pred), "proba": proba}


def handle_qa(payload: Dict[str, Any]):
    query = (payload.get('query') or '').strip()
    if not query:
        return {"success": False, "error": "query is required"}

    retr_path = os.path.join(MODELS_DIR, 'Training_Data_retriever.pkl')
    if not os.path.exists(retr_path):
        return {"success": False, "error": "QA retriever model not found"}

    qa = load_model(retr_path)
    try:
        answer = qa.predict([query])[0]
    except Exception:
        return {"success": False, "error": "prediction failed"}

    return {"success": True, "answer": answer}


def main():
    try:
        payload = json.loads(sys.stdin.read() or '{}')
        task = payload.get('task')
        if task == 'classify':
            out = handle_classify(payload)
        elif task == 'qa':
            out = handle_qa(payload)
        else:
            out = {"success": False, "error": "unknown task"}
    except Exception as e:
        out = {"success": False, "error": str(e), "trace": traceback.format_exc()}

    sys.stdout.write(json.dumps(out, ensure_ascii=False))


if __name__ == '__main__':
    main()
