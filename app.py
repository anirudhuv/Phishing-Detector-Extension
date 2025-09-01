from flask import Flask, request, jsonify
from flask_cors import CORS
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
CORS(app)  # Enable CORS for Chrome extension

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    
    # Handle batch requests (multiple URLs)
    if 'urls' in data:
        urls = data['urls']
        
        if not urls or len(urls) == 0:
            return jsonify({"error": "No URLs provided"}), 400
        
        print(f"Processing batch of {len(urls)} URLs...")
        results = []
        
        for url in urls:
            try:
                print(f"Checking URL: {url}")
                obj = FeatureExtraction(url)
                features = obj.getFeaturesList()
                x = np.array(features).reshape(1, -1)
                
                y_pred = forest.predict(x)[0]
                result = convertion(url, y_pred)
                
                results.append({
                    "url": url,
                    "raw_prediction": int(y_pred),
                    "result": result
                })
                
            except Exception as e:
                print(f"Error processing URL {url}: {str(e)}")
                # Add error result for this URL
                results.append({
                    "url": url,
                    "raw_prediction": 0,
                    "result": [url, "Not Safe", "Error in processing"]
                })
        
        print(f"Batch processing complete. Returning {len(results)} results.")
        return jsonify(results)
    
    # Handle single URL requests (for popup and fallback)
    elif 'url' in data:
        url = data['url']
        
        if not url:
            return jsonify({"error": "No URL provided"}), 400
        
        try:
            print(f"Processing single URL: {url}")
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
            print(f"Error processing URL {url}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    else:
        return jsonify({"error": "Invalid request format. Provide 'url' or 'urls'"}), 400

if __name__ == '__main__':
    app.run(debug=True)