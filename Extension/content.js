// Content script for phishing link detection
(function() {
    'use strict';

    const API_URL = 'http://127.0.0.1:5000/predict';
    const BATCH_SIZE = 5;
    const BATCH_DELAY = 500; // milliseconds
    
    // Track processed links to avoid duplicates
    const processedLinks = new Set();
    
    // Style for labels
    const labelStyles = {
        safe: 'color: #28a745; font-weight: bold; margin-left: 8px; font-size: 16px; display: inline-block; vertical-align: middle;',
        unsafe: 'color: #dc3545; font-weight: bold; margin-left: 8px; font-size: 16px; display: inline-block; vertical-align: middle;'
    };

    function createLabel(isSafe) {
        const label = document.createElement('span');
        label.textContent = isSafe ? '✅' : '❌';
        label.style.cssText = isSafe ? labelStyles.safe : labelStyles.unsafe;
        label.className = 'phishing-detector-label';
        label.title = isSafe ? 'Safe Link - Verified by Phishing Detector' : 'Potentially Unsafe Link - Exercise Caution';
        return label;
    }

    async function checkUrlBatchWithAPI(urls) {
        console.log(`🔧 Checking batch of ${urls.length} URLs with API:`, urls);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ urls: urls }) // Send array of URLs
            });
            
            if (!response.ok) {
                console.error(`🔧 API Error: HTTP ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`🔧 API Batch Response:`, data);
            return data;
        } catch (error) {
            console.error('🔧 Error checking URL batch, falling back to individual requests:', error);
            // Fallback to individual URL checking if batch fails
            return await checkIndividualUrls(urls);
        }
    }

    async function checkIndividualUrls(urls) {
        console.log('🔧 Processing URLs individually');
        const results = [];
        
        for (const url of urls) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    results.push(data);
                    console.log(`🔧 Individual API Response for ${url}:`, data);
                } else {
                    console.error(`🔧 Individual API Error for ${url}: HTTP ${response.status}`);
                }
            } catch (error) {
                console.error(`🔧 Error checking individual URL ${url}:`, error);
            }
        }
        
        return results;
    }

    function addLabelToLink(linkElement, result) {
        // Remove existing label if any
        const existingLabel = linkElement.nextElementSibling;
        if (existingLabel && existingLabel.classList.contains('phishing-detector-label')) {
            existingLabel.remove();
        }

        // Extract safety status from result array
        // result format from convertion(): [url, "Safe"/"Not Safe", "Continue"/"Still want to Continue"]
        const isSafe = result.result[1] === "Safe";
        
        const label = createLabel(isSafe);
        
        // Insert label after the link
        linkElement.parentNode.insertBefore(label, linkElement.nextSibling);
    }

    async function processBatch(urls, linkElements) {
        console.log(`🔧 Processing batch of ${urls.length} URLs`);
        
        // Send entire batch to API at once
        const results = await checkUrlBatchWithAPI(urls);
        
        if (results && Array.isArray(results)) {
            // Handle batch response (array of results)
            results.forEach((result, index) => {
                if (result && linkElements[index]) {
                    addLabelToLink(linkElements[index], result);
                }
            });
        } else if (results) {
            // Handle single result (fallback case)
            if (linkElements[0]) {
                addLabelToLink(linkElements[0], results);
            }
        }
    }

    // Detect search result pages and prioritize scanning
    function isSearchResultPage() {
        const url = window.location.href.toLowerCase();
        const searchEngines = [
            'google.com/search',
            'bing.com/search',
            'duckduckgo.com',
            'yahoo.com/search',
            'search.yahoo.com',
            'yandex.com/search',
            'baidu.com/s'
        ];
        
        return searchEngines.some(engine => url.includes(engine));
    }

    // Enhanced link scanning specifically for search results
    async function scanAndCheckLinks() {
        // Get all links, with special focus on search result links
        let links = [];
        
        if (isSearchResultPage()) {
            // Google search result selectors
            const googleSelectors = [
                'a[href*="/url?"]', // Google result links
                'h3 a', // Result title links
                '.yuRUbf a', // Google result link containers
                '.g a[href^="http"]', // Direct links in search results
                'a[href^="https://"]', // All HTTPS links
                'a[href^="http://"]' // All HTTP links
            ];
            
            // Bing search result selectors
            const bingSelectors = [
                '.b_algo a',
                '.b_title a',
                'a[href^="http"]'
            ];
            
            // DuckDuckGo selectors
            const duckSelectors = [
                '.result__a',
                'a[href^="http"]'
            ];
            
            let selectors = ['a[href^="http"]']; // Fallback
            
            if (window.location.href.includes('google.com')) {
                selectors = googleSelectors;
            } else if (window.location.href.includes('bing.com')) {
                selectors = bingSelectors;
            } else if (window.location.href.includes('duckduckgo.com')) {
                selectors = duckSelectors;
            }
            
            // Collect links from all selectors
            selectors.forEach(selector => {
                const foundLinks = document.querySelectorAll(selector);
                foundLinks.forEach(link => {
                    if (!links.includes(link) && link.href && 
                        (link.href.startsWith('http://') || link.href.startsWith('https://'))) {
                        links.push(link);
                    }
                });
            });
            
            console.log(`🔧 Found ${links.length} links on search results page`);
        } else {
            // Regular page scanning
            links = Array.from(document.querySelectorAll('a[href]'));
        }

        const linksToCheck = [];
        const linkElements = [];

        // Filter and collect new links
        links.forEach(link => {
            let href = link.href;
            
            // Clean Google redirect URLs
            if (href.includes('/url?q=')) {
                const urlParams = new URLSearchParams(href.split('?')[1]);
                const actualUrl = urlParams.get('q');
                if (actualUrl) {
                    href = actualUrl;
                    link.setAttribute('data-original-href', link.href);
                    link.setAttribute('data-actual-url', href);
                }
            }
            
            // Skip if already processed, empty, or internal anchors
            if (processedLinks.has(href) || !href || href.startsWith('#') || 
                href.startsWith('javascript:') || href.includes('google.com/search')) {
                return;
            }
            
            // Skip non-HTTP protocols
            if (!href.startsWith('http://') && !href.startsWith('https://')) {
                return;
            }
            
            // Skip Google's own domains and common safe sites we don't need to check
            const skipDomains = ['google.com', 'youtube.com', 'gmail.com', 'maps.google.com'];
            const linkDomain = new URL(href).hostname.toLowerCase();
            if (skipDomains.some(domain => linkDomain.includes(domain))) {
                return;
            }
            
            processedLinks.add(href);
            linksToCheck.push(href);
            linkElements.push(link);
        });

        if (linksToCheck.length === 0) {
            console.log('🔧 No new links to check');
            return;
        }

        console.log(`🔧 Phishing Detector: Checking ${linksToCheck.length} new links`);
        linksToCheck.forEach((url, i) => console.log(`🔧 Link ${i+1}: ${url}`));

        // Process links in batches with immediate scanning for search results
        const batchDelay = isSearchResultPage() ? 200 : BATCH_DELAY;
        
        for (let i = 0; i < linksToCheck.length; i += BATCH_SIZE) {
            const batchUrls = linksToCheck.slice(i, i + BATCH_SIZE);
            const batchElements = linkElements.slice(i, i + BATCH_SIZE);
            
            console.log(`🔧 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batchUrls.length} URLs`);
            await processBatch(batchUrls, batchElements);
            
            // Delay between batches
            if (i + BATCH_SIZE < linksToCheck.length) {
                await new Promise(resolve => setTimeout(resolve, batchDelay));
            }
        }
    }

    // Observer to detect dynamically added links and search result updates
    function setupMutationObserver() {
        const observer = new MutationObserver(mutations => {
            let hasNewLinks = false;
            let isSearchUpdate = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'A' && node.href) {
                            hasNewLinks = true;
                        } else if (node.querySelectorAll && node.querySelectorAll('a[href]').length > 0) {
                            hasNewLinks = true;
                        }
                        
                        // Check if this looks like search results being updated
                        const searchResultClasses = ['g', 'b_algo', 'result', 'web-result'];
                        if (searchResultClasses.some(cls => node.classList && node.classList.contains(cls))) {
                            isSearchUpdate = true;
                        }
                    }
                });
            });
            
            if (hasNewLinks) {
                // Faster response for search result updates
                const delay = isSearchUpdate || isSearchResultPage() ? 300 : 1000;
                
                clearTimeout(window.phishingDetectorTimeout);
                window.phishingDetectorTimeout = setTimeout(scanAndCheckLinks, delay);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when DOM is ready with immediate search result detection
    function initialize() {
        console.log('🔧 Phishing Detector: Initializing...');
        console.log('🔧 Document ready state:', document.readyState);
        console.log('🔧 Is search result page:', isSearchResultPage());
        console.log('🔧 Current URL:', window.location.href);
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('🔧 DOM Content Loaded');
                setTimeout(() => {
                    scanAndCheckLinks();
                    setupMutationObserver();
                }, isSearchResultPage() ? 500 : 1000); // Faster for search results
            });
        } else {
            console.log('🔧 DOM already ready, starting scan...');
            setTimeout(() => {
                scanAndCheckLinks();
                setupMutationObserver();
            }, isSearchResultPage() ? 200 : 500); // Immediate for search results
        }
    }

    // Start the extension
    initialize();

    console.log('Phishing Link Detector: Content script loaded');
})();