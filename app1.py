from flask import Flask, request , jsonify
import numpy as np
import pickle
from feature import FeatureExtraction
from convert import convertion
import warnings
warnings.filterwarnings("ignore")
from sklearn import metrics


with open("newmodel.pkl", "rb") as f:
    forest = pickle.load(f)
    
app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    url = data['url']
    
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    
    try:
        obj = FeatureExtraction(url)
        features = obj.getFeaturesList()
        x = np.array(features).reshape(1, -1)
        
        y_pred = forest.predict(x)[0]
        result = convertion(url, y_pred)    
        
        return jsonify({
            "url": url,
            "raw_prediction": int(y_pred),
            "result": result
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True) 