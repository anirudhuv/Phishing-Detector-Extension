import pickle
import numpy as np
from feature import FeatureExtraction

# Load the trained RandomForest model
with open("newmodel.pkl", "rb") as f:
    forest = pickle.load(f)

# Test URL (from PhishTank)
url = "https://mail.google.com"
obj = FeatureExtraction(url)
x = np.array(obj.getFeaturesList()).reshape(1, -1)

print("Feature Array: ", x)

# Prediction probabilities
# index 0 -> class 0 (Legitimate), index 1 -> class 1 (Phishing)
y_pro_legit = forest.predict_proba(x)[0, 0]
y_pro_phish = forest.predict_proba(x)[0, 1]

print("Probability Legitimate:", y_pro_legit)
print("Probability Phishing  :", y_pro_phish, "\n")

# Final prediction
y_pred = forest.predict(x)[0]
print("Prediction =", y_pred)

if y_pred == 0:
    print("✅ It is a safe website")
else:
    print("⚠️  Caution! Suspicious website detected")
