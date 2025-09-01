# 🛡️ Phishing Link Detector

Chrome Extension that automatically detects phishing links using AI-powered analysis. Shows visual safety indicators (✅/❌) next to links on web pages and search results.

##  Quick Start

### Installation
1. **Start Flask API:**
   ```bash
   pip install flask flask-cors
   python app.py
   ```
   **Train model with data or use newmodel.pkl**

2. **Load Extension:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select extension folder

### Usage
- **Automatic**: Extension scans all links on web pages
- **Manual**: Click extension icon to check specific URLs
- **Visual**: ✅ = Safe, ❌ = Potentially unsafe

## Files

```
├── chrome-extension/
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   └── background.js
└── 
    └── app.py
    └── convert.py
    └── model.py
    └── feature.py
```

##  API Format

**Request:**
```json
{"url": "https://example.com"}
```

**Response:**
```json
{
  "url": "https://example.com",
  "raw_prediction": 1,
  "result": ["https://example.com", "Safe", "Continue"]
}
```

## Features

- **Search Result Protection**: Automatically scans Google/Bing search results
- **Batch Processing**: Sends 5 URLs per API request for efficiency  
- **Real-time Detection**: Monitors new links added to pages
- **Privacy Focused**: All processing done locally via your Flask API

## Troubleshooting

1. **Check Flask API**: Ensure running at `http://127.0.0.1:5000`
2. **Console Logs**: Press F12 → Look for `🔧` debug messages
3. **CORS Issues**: Add `CORS(app)` to your Flask code
4. **Extension Errors**: Check `chrome://extensions/` for red error messages
