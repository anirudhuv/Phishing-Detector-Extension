// Popup script for manual URL checking
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const checkButton = document.getElementById('checkButton');
    const resultDiv = document.getElementById('result');
    const pageStatusDiv = document.getElementById('pageStatus');

    const API_URL = 'http://127.0.0.1:5000/predict';

    // Add enter key support
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkUrl();
        }
    });

    checkButton.addEventListener('click', checkUrl);

    async function checkUrl() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showResult('Please enter a URL', 'error');
            return;
        }

        // Basic URL validation
        if (!isValidUrl(url)) {
            showResult('Please enter a valid URL (include http:// or https://)', 'error');
            return;
        }

        // Show loading state
        checkButton.disabled = true;
        checkButton.textContent = 'Checking...';
        showResult('Analyzing URL...', 'loading');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            displayResult(data);

        } catch (error) {
            console.error('Error checking URL:', error);
            showResult('Error: Unable to check URL. Make sure the API is running.', 'error');
        } finally {
            // Reset button state
            checkButton.disabled = false;
            checkButton.textContent = 'Check URL';
        }
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return string.startsWith('http://') || string.startsWith('https://');
        } catch (_) {
            return false;
        }
    }

    function displayResult(data) {
        // Extract safety status from result array
        // API response format: {"url": "...", "raw_prediction": 0/1, "result": [url, "Safe"/"Not Safe", ...]}
        const isSafe = data.result[1] === "Safe";
        const resultText = data.result[1]; // "Safe" or "Not Safe"
        const resultClass = isSafe ? 'result-safe' : 'result-unsafe';
        
        resultDiv.innerHTML = `
            <div class="${resultClass}">
                ${isSafe ? '✅' : '❌'} ${resultText}
            </div>
            <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
                ${data.url}
            </div>
        `;
        
        // Update status
        pageStatusDiv.textContent = `Result: ${resultText}`;
    }

    function showResult(message, type) {
        resultDiv.className = type;
        resultDiv.textContent = message;
    }

    // Get current tab info
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            pageStatusDiv.textContent = `Current page: ${new URL(tabs[0].url).hostname}`;
        }
    });
});