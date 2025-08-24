# K-Means Clustering — Interactive Demo

A small single-page web application that demonstrates the K‑Means clustering algorithm step-by-step.

Files in this folder:
- `index.html` — single-page UI and canvas
- `styles.css` — lightweight modern styling
- `app.js` — interactive K‑Means implementation and controls

Quick start (open locally):

Option A — Open directly
- Double-click `index.html` in your file manager or open it in a browser.

Option B — Serve with a local HTTP server (recommended)

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

How to use:
- Choose the number of clusters (`k`) and number of points.
- Click `Generate` to create a set of points.
- Click `Init Centroids` to initialize centroids (random selection).
- Use `Step` to walk through the algorithm: assign → update.
- Click `Run` to animate iterations until centroids stop moving.
- `Reset` clears the state.

Notes:
- Click on the canvas to add a point interactively.
- This demo is client-side only, intended for teaching and exploration.
- Feel free to tweak `app.js` to change initialization, distance metrics, or visualization details.

License: MIT (you can reuse and adapt the files for educational purposes)