import pickle
import numpy as np
import pandas as pd
from feature import FeatureExtraction
from convert import convertion   # brings in shortlink + label formatting

# Load trained model
with open("phish_detect.pkl", "rb") as f:
    forest = pickle.load(f)

def check_url(url):
    # Step 1: Extract features
    obj = FeatureExtraction(url)
    features = obj.getFeaturesList()
    x = np.array(features).reshape(1, -1)

    # Step 2: Predict with trained model
    y_pred = forest.predict(x)[0]

    # Step 3: Convert prediction into user-friendly output
    result = convertion(url, y_pred)

    # Display details
    print("Feature Array (30 values):", features)
    print("Raw Prediction:", y_pred)
    print("Final Output:", result)

    return result

# -----------------------------
# Example tests
# -----------------------------
if __name__ == "__main__":
    # Known phishing link
    test_url1 = "http://8csdg3iejj.lilagoraj.pl/"
    check_url(test_url1)

    # Known safe link
    test_url2 = "https://www.google.com"
    check_url(test_url2)
