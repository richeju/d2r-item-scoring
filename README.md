# D2R Item Scoring

This project provides a simple HTML page (`index.html`) that scores Diablo II: Resurrected equipment based on OCR-detected stats.

## Prerequisites
- A modern web browser.
- Internet access to load scripts from the jsDelivr CDN.

## Usage
1. Open `index.html` in your browser.
2. Upload an item screenshot when prompted.
3. Review the detected text and the scoring table.

## Troubleshooting
- If OCR does not start or the page looks broken, your network may be blocking the CDN used for Tesseract.js. Try allowing access to `cdn.jsdelivr.net` or host the dependencies locally.
