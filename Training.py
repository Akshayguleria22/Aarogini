import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import os
import json
from typing import Dict, List, Tuple
from dataclasses import dataclass

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.neighbors import NearestNeighbors

print("🏥 Aarogini - Women's Health ML Model Training")
print("=" * 60)

# Create models directory if it doesn't exist
if not os.path.exists('./models'):
    os.makedirs('./models')
    print("✓ Created ./models directory")

# List of CSV files to train on
files = [
    'pcos_dataset.csv',
    'Maternal Health Risk Data Set.csv',
    'kag_risk_factors_cervical_cancer.csv',
    'Training Data.csv'
]

# Dictionary to map each file to its target column
target_columns = {
    'pcos_dataset.csv': 'PCOS_Diagnosis',  # fallback to any column containing 'pcos'
    'Maternal Health Risk Data Set.csv': 'RiskLevel',
    'kag_risk_factors_cervical_cancer.csv': 'Biopsy',
    'Training Data.csv': 'prognosis'  # Training Data.csv is a Q&A dataset; handled separately (no classification target)
}

model_paths = {}

# ---- Helpers and simple components ----
def coerce_question_mark_to_nan(df: pd.DataFrame) -> pd.DataFrame:
    """Replace common missing markers like '?' with NaN."""
    return df.replace({"?": pd.NA, " ?": pd.NA})


def build_preprocessor(df: pd.DataFrame, target: str):
    """Build a ColumnTransformer that imputes and encodes features based on inferred dtypes."""
    X = df.drop(columns=[target])

    # Try to coerce numeric-looking object columns strictly to numeric (np.nan where not numeric)
    for col in X.columns:
        if X[col].dtype == 'object':
            coerced = pd.to_numeric(X[col], errors='coerce')
            # If we got some numeric values (not all NaN), use it; else keep as object
            if coerced.notna().any():
                X[col] = coerced

    numeric_features = X.select_dtypes(include=['number', 'float', 'int']).columns.tolist()
    categorical_features = [c for c in X.columns if c not in numeric_features]

    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore')),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features),
        ]
    )
    return preprocessor, numeric_features, categorical_features


from dataclasses import dataclass
from typing import List


@dataclass
class QARetriever:
    """Simple QA retriever using TF-IDF + Nearest Neighbors (cosine)."""
    vectorizer: any
    nn: any
    questions: List[str]
    answers: List[str]

    def predict(self, queries: List[str]) -> List[str]:
        Xq = self.vectorizer.transform(queries)
        distances, indices = self.nn.kneighbors(Xq, n_neighbors=1)
        return [self.answers[idx[0]] for idx in indices]

for file in files:
    print(f"\n{'='*60}")
    print(f"📊 Training model for: {file}")
    print(f"{'='*60}")
    
    try:
        # Load dataset
        df = pd.read_csv(file)
        print(f"✓ Loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        # Special handling: Q&A dataset (training a TF-IDF retriever)
        if file == 'Training Data.csv':
            expected_cols = [c for c in df.columns]
            q_col = next((c for c in expected_cols if 'instruction' in c.lower() or 'question' in c.lower()), None)
            a_col = next((c for c in expected_cols if 'output' in c.lower() or 'answer' in c.lower() or 'response' in c.lower()), None)
            if not q_col or not a_col:
                print(f"❌ Skipping {file} - couldn't identify question/answer columns. Found: {list(df.columns)}")
                continue

            from sklearn.feature_extraction.text import TfidfVectorizer
            print("🔧 Building QA retriever (TF-IDF + cosine NN)...")
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
            questions = df[q_col].astype(str).fillna("").tolist()
            answers = df[a_col].astype(str).fillna("").tolist()

            X_mat = vectorizer.fit_transform(questions)
            nn = NearestNeighbors(n_neighbors=1, metric='cosine')
            nn.fit(X_mat)

            qa_model = QARetriever(vectorizer=vectorizer, nn=nn, questions=questions, answers=answers)

            name = file.replace('.csv', '').replace(' ', '_')
            path = os.path.join('./models', f"{name}_retriever.pkl")
            joblib.dump(qa_model, path)
            model_paths[name] = path
            print(f"✅ Trained and saved Q&A retriever to {path}")
            continue

        # Otherwise, classification datasets
        # Clean common missing markers and build preprocessing
        df = coerce_question_mark_to_nan(df)

        # Determine target column
        target = target_columns.get(file)
        if not target or target not in df.columns:
            print(f"⚠️  Target column '{target}' not found. Available columns:")
            print(f"   {list(df.columns)}")
            # Auto-detect target
            for col in df.columns:
                low = col.lower()
                if any(k in low for k in ['target', 'label', 'class', 'risk', 'pcos', 'biopsy', 'diagnosis', 'prognosis']):
                    target = col
                    print(f"   → Auto-detected target: {target}")
                    break
        if not target or target not in df.columns:
            print(f"❌ Skipping {file} - couldn't identify target column")
            continue

        print("🔧 Building preprocessing pipeline...")
        # Coerce numeric-like feature columns to numeric (excluding target)
        for c in df.columns:
            if c == target:
                continue
            if df[c].dtype == 'object':
                coerced = pd.to_numeric(df[c], errors='coerce')
                if coerced.notna().any():
                    df[c] = coerced
        preprocessor, num_cols, cat_cols = build_preprocessor(df, target)
        if num_cols:
            print(f"✓ Numeric features: {len(num_cols)}")
        if cat_cols:
            print(f"✓ Categorical features: {len(cat_cols)}")

        clf = Pipeline(steps=[
            ('preprocess', preprocessor),
            ('model', RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1))
        ])

        X = df.drop(columns=[target])
        y = df[target]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if getattr(y, 'nunique', lambda: 2)() > 1 else None
        )
        print(f"✓ Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples")

        print("🤖 Training Random Forest (with preprocessing)...")
        clf.fit(X_train, y_train)

        train_acc = accuracy_score(y_train, clf.predict(X_train))
        test_acc = accuracy_score(y_test, clf.predict(X_test))
        print(f"✓ Train Accuracy: {train_acc*100:.2f}%")
        print(f"✓ Test Accuracy: {test_acc*100:.2f}%")

        name = file.replace('.csv', '').replace(' ', '_')
        path = os.path.join('./models', f"{name}_model.pkl")
        joblib.dump(clf, path)
        model_paths[name] = path
        print(f"✅ Trained and saved {name} model to {path}")
        
    except Exception as e:
        print(f"❌ Error training {file}: {str(e)}")
        import traceback
        traceback.print_exc()
        continue

# Summary
print(f"\n\n{'='*60}")
print("🎉 TRAINING COMPLETE!")
print(f"{'='*60}")
print(f"\nSuccessfully trained {len(model_paths)} models:")
for name, path in model_paths.items():
    print(f"  ✓ {name}: {path}")

print("\n" + "="*60)
print("Models are ready to use! 🚀")
