# LeetPath: Personalized Recommender & Analytical Dashboard

LeetPath is a premium, personalized problem recommender system and statistical dashboard designed for LeetCode users. By linking your profile, the system dynamically analyzes your strengths, weaknesses, and solved distributions, suggesting optimal problems to tackle next.

---

## 🚀 Key Features

* **Live GraphQL Synchronization**: Automatically pulls avatar, ranking, badges, contest ratings, language distributions, and contribution calendars in real-time from LeetCode.
* **Difficulty-Wise Auto-Seeding Engine**: Instantly solves the cold-start problem by seeding your profile with problem history matching your real Easy, Medium, and Hard solve metrics.
* **Dynamic Jupyter-Notebook Recommender Engine**: The backend runs the recommendation algorithms directly from the code cells of `recommendation.ipynb`, allowing real-time parameter tuning and visual debugging.
* **Topic-Wise Knowledge Analyzer**: Identifies critical topics that need work (e.g., Dynamic Programming, Graph) and visualizes them using status badges.
* **Interactive SVG Visualizations**: Displays custom circular progress gauges, contribution calendars, and responsive contest rating line charts.

---

## 🧮 How the Recommender Works

The recommendation system utilizes a hybrid network-based approach combining:
1. **Gibbs LDA (Latent Dirichlet Allocation)**: Uncovers latent topics in question descriptions using Collapsed Gibbs Sampling, enabling concept-level similarity mapping.
2. **Pairwise Markov Random Fields (MRF)**: Represents questions as nodes in an undirected graph. Unary potentials set individual recommendation priors (based on user weak areas, difficulty, and acceptance rate), while pairwise potentials model correlation (TF-IDF similarity + LDA topic overlaps).
3. **Belief Propagation**: Message-passing algorithm propagates recommendation signals through the graph, calculating marginal probabilities for unseen questions.

---

## 🛠️ Project Structure

```
LeetPath-React-Flask/
│
├── backend/
│   ├── recommendation.ipynb    # Main recommendation model notebook
│   ├── app.py                  # Flask REST API endpoints
│   ├── database.py             # SQLite database management
│   ├── generate_pdf.py         # Presentation guide compiler script
│   └── test_weak.py            # Weak area analysis test script
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Heatmap Calendar, SVG Charts, circular gauges
│   │   └── pages/              # Profile page & recommender dashboard UI
│   └── package.json
│
├── .gitignore                  # Automatically ignores databases, venv, and large model binaries
├── run-app.bat                 # Convenient launch script for backend & frontend
└── README.md                   # Project documentation
```

---

## 💻 Quick Start Guide

### 1. Backend Setup
1. Open terminal inside the `backend` folder.
2. Activate the virtual environment:
   ```bash
   venv\Scripts\activate
   ```
3. Run the server:
   ```bash
   python app.py
   ```

### 2. Frontend Setup
1. Open terminal inside the `frontend` folder.
2. Install packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### 3. Launch both at once
On Windows, you can double-click the **`run-app.bat`** file at the root of the project to start both backend and frontend servers in separate windows automatically!

---

## 📄 Generating PDF Interview Prep Guides

If you need a printable PDF of the interview preparation guide to present to your teacher, navigate to the `backend/` folder and run:
```bash
venv\Scripts\python.exe generate_pdf.py
```
This generates the file `LeetPath_Presentation_Guide.pdf` in your root folder.
