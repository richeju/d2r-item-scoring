# d2r-item-scoring

This project scores Diablo II Resurrected equipment using OCR.

The page relies on Tesseract.js served from jsDelivr. The worker is configured with
`corePath` set to `https://cdn.jsdelivr.net/npm/tesseract.js-core@5/`, allowing it
to fetch either `tesseract-core.wasm.js` or `tesseract-core-simd.wasm.js` depending on
SIMD support in the browser. OCR now loads both English and French languages to
better handle localized screenshots.

Open `index.html` in a modern browser to use the tool.
