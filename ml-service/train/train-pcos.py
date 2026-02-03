import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib,os

data = pd.read_csv("datasets/pcos_dataset.csv")

X = data.drop("PCOS_Diagnosis",axis=1)
y = data["PCOS_Diagnosis"]

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=7,
    random_state=42
)

X_train,X_test,y_train,y_test = train_test_split(
    X,y,test_size=0.2,random_state=42
)

model.fit(X_train,y_train)

print("PCOS Accuracy:",model.score(X_test,y_test))

os.makedirs("../model",exist_ok=True)

joblib.dump(model,"../model/pcos.pkl")
