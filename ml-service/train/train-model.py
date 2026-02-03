import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

import os

# Load Data (robust path resolution)
base_dir = os.path.dirname(__file__)
dataset_path = os.path.join(base_dir, "datasets", "dataset.csv")
if not os.path.exists(dataset_path):
    raise FileNotFoundError(f"Dataset not found at {dataset_path}. Place dataset.csv in ml-service/train/datasets/")
data = pd.read_csv(dataset_path)

X = data.drop("risk", axis=1)
y = data["risk"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train Model
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=6,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
pred = model.predict(X_test)
acc = accuracy_score(y_test, pred)

print("Model Accuracy:", acc)

# Save Model
os.makedirs("../model", exist_ok=True)

joblib.dump(model, "../model/health_model.pkl")

print("Model saved → model/health_model.pkl")
