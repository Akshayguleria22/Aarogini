import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib,os

data = pd.read_csv("datasets/maternal.csv")

le = LabelEncoder()
data["RiskLevel"] = le.fit_transform(data["RiskLevel"])

X = data.drop("RiskLevel",axis=1)
y = data["RiskLevel"]

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    random_state=42
)

X_train,X_test,y_train,y_test = train_test_split(
    X,y,test_size=0.2,random_state=42
)

model.fit(X_train,y_train)

print("Maternal Accuracy:",model.score(X_test,y_test))

os.makedirs("../model",exist_ok=True)

joblib.dump((model,le),"../model/maternal.pkl")
