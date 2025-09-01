import pickle
import numpy as np
from feature import FeatureExtraction

# Load trained model
with open("newmodel.pkl", "rb") as f:
    model = pickle.load(f)

# Example URL
url = "http://www.paypa1.com/login"  # taken from PhishTank
obj = FeatureExtraction(url)
x = np.array(obj.getFeaturesList()).reshape(1, -1)

print("Feature Array: ", x)

# Prediction probabilities
proba = model.predict_proba(x)[0]
y_pro_non_phishing = proba[0]   # class 0 → legitimate
y_pro_phishing = proba[1]       # class 1 → phishing

print("Probability Legitimate:", y_pro_non_phishing)
print("Probability Phishing  :", y_pro_phishing, "\n")

# Final prediction
y_pred = model.predict(x)[0]
print("Prediction =", y_pred)

if y_pred == 1:
    print("✅ It is a safe website")
else:
    print("⚠️  Caution! Suspicious website detected (Phishing)")
