import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import accuracy_score
import joblib
import os

# Load Data
data = pd.read_csv("datasets/cervical.csv")

# Replace common placeholder for missing values
data.replace('?', np.nan, inplace=True)

# Target
y = data["Biopsy"]
X = data.drop(["Biopsy"], axis=1)

# Convert target to numeric labels if necessary
if y.dtype == 'object' or y.dtype.name == 'category':
    y = pd.factorize(y)[0]

# Determine numeric vs categorical columns robustly
numeric_cols = []
categorical_cols = []
for col in X.columns:
    converted = pd.to_numeric(X[col], errors='coerce')
    non_null_fraction = converted.notna().mean()
    if non_null_fraction > 0.5:
        X[col] = converted
        numeric_cols.append(col)
    else:
        categorical_cols.append(col)

# Preprocessing for numeric and categorical features
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
])

categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown='ignore')),
])

preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_cols),
    ("cat", categorical_transformer, categorical_cols),
], remainder='drop')

# Full pipeline
pipe = Pipeline([
    ("preprocessor", preprocessor),
    ("model", RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        random_state=42
    ))
])

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

pipe.fit(X_train, y_train)

pred = pipe.predict(X_test)

print("Cancer Accuracy:", accuracy_score(y_test, pred))

os.makedirs("../model", exist_ok=True)

joblib.dump(pipe, "../model/cancer.pkl")
