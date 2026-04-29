# 🍽️ Health Nexus — AI-Powered Meal Scanner & Nutrition Tracker

<p align="center">
  <img src="download (1).jpeg" alt="Health Nexus Banner" width="600"/>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#training-the-model">Training</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

**Health Nexus** is a full-stack, AI-driven web application that lets users snap or upload a photo of their meal and instantly receive:

- 🔍 **Food detection** powered by a fine-tuned **YOLOv8** model
- 🥗 **Detailed nutrition breakdown** — calories, protein, carbs, fat, sugar, fiber, and sodium
- 💡 **Personalized health advice** based on dietary conditions (e.g. diabetes, weight loss)
- 📊 **Meal history** stored per-user in a persistent database

The backend is built with **FastAPI** (Python), the frontend with **React**, and the whole stack can be deployed on **Render** in a single `render.yaml` file.

---

## Features

| Feature | Details |
|---|---|
| 🤖 YOLOv8 Food Detection | Detects Indian food items in uploaded images with bounding boxes and confidence scores |
| 🗃️ Nutrition Database | Local per-100g nutrition data (calories, macros, micros) with heuristic portion-size estimation |
| 🌐 USDA FDC Integration | Optional live lookup via the [USDA FoodData Central API](https://fdc.nal.usda.gov/) for broader food coverage |
| 👤 User Authentication | JWT-based auth (register / login) with PBKDF2-SHA256 password hashing |
| 📜 Detection History | Per-user scan history stored in SQLite (or any SQLAlchemy-compatible DB) |
| 🏥 Condition-Aware Advice | Rule-based dietary tips tailored to health conditions |
| 📱 Responsive UI | React frontend with smooth animations (Framer Motion / GSAP) and live webcam capture |
| ☁️ One-Click Deployment | `render.yaml` ships both backend (Python) and frontend (static) services to Render |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser / Client                    │
│   React SPA  ←→  Axios  ←→  FastAPI Backend                 │
└─────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    Auth (JWT)         /scan-meal          SQLite DB
  register/login     ┌──────────┐       (users + detections)
                     │ YOLOv8   │
                     │ Inference│
                     └────┬─────┘
                          │  detected labels + bboxes
                     ┌────▼──────────┐
                     │ Nutrition DB  │──── optional ──▶ USDA FDC API
                     │ (local dict)  │
                     └───────────────┘
                          │  calories, macros, micros, advice
                     ◀────┘
```

### Request Flow — `/scan-meal`

1. Client uploads image (+ optional health condition & serving multipliers)
2. FastAPI saves image to a temp file
3. YOLOv8 runs inference → list of labels + bounding boxes
4. For each detection, `nutrition_db.py` estimates macros/micros scaled by bbox area
5. Optional USDA lookup enriches data if `USDA_ENABLED=1`
6. Structured JSON response is returned; totals are aggregated
7. Detection is optionally persisted to the database

---

## Tech Stack

### Backend
| Library | Version | Purpose |
|---|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | 0.115.0 | REST API framework |
| [Uvicorn](https://www.uvicorn.org/) | 0.32.0 | ASGI server |
| [SQLAlchemy](https://www.sqlalchemy.org/) | 2.0.35 | ORM / database layer |
| [Alembic](https://alembic.sqlalchemy.org/) | 1.13.3 | Database migrations |
| [Pydantic](https://docs.pydantic.dev/) | 2.9.2 | Request/response validation |
| [Ultralytics](https://github.com/ultralytics/ultralytics) | ≥8.1.0 | YOLOv8 model training & inference |
| [Pillow](https://python-pillow.org/) | 10.4.0 | Image processing |
| [OpenCV](https://opencv.org/) | 4.10.0.84 | Computer vision utilities |
| [python-jose](https://github.com/mpdavis/python-jose) | 3.3.0 | JWT creation & verification |
| [passlib](https://passlib.readthedocs.io/) | 1.7.4 | Password hashing (PBKDF2-SHA256) |
| [python-dotenv](https://saurabh-kumar.com/python-dotenv/) | 1.0.0 | Environment variable management |
| [requests](https://requests.readthedocs.io/) | 2.31.0 | USDA API HTTP client |

### Frontend
| Library | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 18.2.0 | UI framework |
| [React Router DOM](https://reactrouter.com/) | 7.9.4 | Client-side routing |
| [Axios](https://axios-http.com/) | 1.12.2 | HTTP client |
| [Framer Motion](https://www.framer.com/motion/) | 10.18.0 | Declarative animations |
| [GSAP](https://gsap.com/) | 3.13.0 | Advanced animation library |
| [React Webcam](https://github.com/mozmorris/react-webcam) | 7.2.0 | In-browser camera capture |
| [React Icons](https://react-icons.github.io/react-icons/) | 4.11.0 | Icon library |

### ML & Dataset
| Component | Details |
|---|---|
| Model | YOLOv8n (nano) — fine-tuned on Indian food images |
| Dataset source | [Roboflow — Indian Food YOLOv5](https://universe.roboflow.com/smart-india-hackathon/indian-food-yolov5/dataset/1) |
| Detected classes | `cham cham`, `naan`, `paneer butter masala`, `rasgulla` |
| Pretrained weights | `yolov8n.pt` (included) |
| Fine-tuned weights | `runs/detect/train2/best.pt` (generated after training) |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ / npm
- (Optional) A [USDA FDC API key](https://fdc.nal.usda.gov/api-guide.html) for live nutrition lookups

### 1. Clone the repository

```bash
git clone https://github.com/nullpointerx01/ML.git
cd ML
```

### 2. Backend setup

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment variables

Create a `.env` file in the project root:

```env
# Required
JWT_SECRET=your-super-secret-key-change-me

# Database (defaults to local SQLite)
DATABASE_URL=sqlite:///./app.db

# YOLOv8 model weights path (defaults to fine-tuned weights)
YOLO_WEIGHTS=./runs/detect/train2/best.pt

# USDA FoodData Central (optional — set to 1 to enable)
USDA_ENABLED=0
USDA_API_KEY=your-usda-api-key

# Token expiry in minutes (default: 60)
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

#### Start the backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Create a .env file
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# Start the dev server
npm start
```

The React app will be served at `http://localhost:3000`.

---

## API Reference

### Authentication

#### `POST /register`
Register a new user.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-01-01T12:00:00"
}
```

---

#### `POST /token`
Obtain a JWT access token.

**Request body** (form-encoded):
```
username=user@example.com&password=strongpassword
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### Meal Scanning

#### `POST /scan-meal`
Upload a food image and receive nutrition analysis.

**Request** (`multipart/form-data`):

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | image file | ✅ | The meal photo (JPEG, PNG, etc.) |
| `condition` | string | ❌ | Health condition: `diabetes`, `weight_loss` |
| `serve_mults` | JSON string | ❌ | Per-label serving multipliers, e.g. `{"pizza": 1.5}` |
| `user_email` | string | ❌ | Associate scan with a user |

**Example with `curl`:**
```bash
curl -X POST http://localhost:8000/scan-meal \
  -F "file=@meal.jpg" \
  -F "condition=diabetes"
```

**Response:**
```json
{
  "detections": [
    {
      "label": "rasgulla",
      "confidence": 0.87,
      "bbox": { "x1": 120, "y1": 80, "x2": 320, "y2": 280, "confidence": 0.87 },
      "nutrition": {
        "cal_per_100g": 200.0,
        "serving_g": 50.0,
        "protein_per_100g": 4.0,
        "carbs_per_100g": 40.0,
        "fat_per_100g": 3.0
      },
      "estimated_calories": 18.5,
      "estimated_protein": 0.4,
      "estimated_carbs": 3.7,
      "estimated_fat": 0.3,
      "estimated_sugar": 2.6,
      "estimated_fiber": 0.0,
      "estimated_sodium": 9.0,
      "advice": ["Prefer low sugar options; adjust serving size"]
    }
  ],
  "total_calories": 18.5,
  "total_protein": 0.4,
  "total_carbs": 3.7,
  "total_fat": 0.3,
  "total_sugar": 2.6,
  "total_fiber": 0.0,
  "total_sodium": 9.0
}
```

---

#### `GET /`
Health check endpoint.

**Response:**
```json
{ "message": "🍽️ YOLO Meal Scanner API (USDA Integrated)" }
```

---

## Training the Model

The YOLOv8 model is pre-trained on `yolov8n.pt` and fine-tuned on an Indian food dataset containing 4 classes: **cham cham**, **naan**, **paneer butter masala**, and **rasgulla**.

### Dataset structure

```
datasets/
├── data.yaml          # Class names & split paths
├── train/
│   └── images/        # Training images
├── valid/
│   └── images/        # Validation images
└── test/
    └── images/        # Test images
```

### Run training

```bash
python train_yolo.py \
  --data datasets/data.yaml \
  --epochs 50 \
  --batch 16 \
  --imgsz 640 \
  --pretrained yolov8n.pt \
  --name meal-train
```

After training, the best weights are saved to `runs/detect/meal-train/best.pt`.  
Update `YOLO_WEIGHTS` in your `.env` to point to the new weights.

### Training parameters

| Parameter | Default | Description |
|---|---|---|
| `--data` | required | Path to `data.yaml` |
| `--epochs` | 50 | Number of training epochs |
| `--batch` | 16 | Batch size |
| `--imgsz` | 640 | Input image size (pixels) |
| `--pretrained` | `yolov8n.pt` | Starting checkpoint |
| `--name` | `meal-train` | Run name (output directory) |

---

## Deployment

The project ships with a `render.yaml` for zero-config deployment on [Render](https://render.com/).

### Services defined

| Service | Type | Description |
|---|---|---|
| `healthnexus-backend` | Python web | FastAPI + Uvicorn |
| `healthnexus-frontend` | Static site | React built with `npm run build` |

### Deploy to Render

1. Fork / push the repo to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect your repository — Render auto-reads `render.yaml`.
4. Add the following environment variables in the Render dashboard for the backend service:

   | Variable | Value |
   |---|---|
   | `JWT_SECRET` | A strong random string |
   | `USDA_API_KEY` | *(optional)* Your USDA FDC key |
   | `USDA_ENABLED` | `0` or `1` |

5. Click **Deploy** — both services will be live within minutes.

### Manual Docker-style deployment

```bash
# Backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend (build)
cd frontend && npm ci && npm run build
# Serve the dist/ folder with any static host (Nginx, Vercel, etc.)
```

---

## Project Structure

```
ML/
├── main.py                  # FastAPI app — routes & middleware
├── models.py                # SQLAlchemy ORM models (User, Detection)
├── schemas.py               # Pydantic request/response schemas
├── crud.py                  # Database CRUD helpers
├── auth.py                  # JWT creation & password hashing
├── database.py              # DB engine & session factory
├── yolo_model.py            # YOLOv8 inference wrapper
├── nutrition_db.py          # Local nutrition database & estimation logic
├── usda_api.py              # USDA FoodData Central API client
├── train_yolo.py            # Model training script (CLI)
├── yolov8n.pt               # Pretrained YOLOv8 nano weights
├── app.db                   # SQLite database (auto-created)
├── requirements.txt         # Python dependencies
├── requirements_updated.txt # Updated dependency snapshot
├── render.yaml              # Render deployment blueprint
├── runtime.txt              # Python runtime version for Render
├── datasets/
│   ├── data.yaml            # YOLO dataset config (classes & paths)
│   ├── train/images/        # Training images
│   ├── valid/images/        # Validation images
│   └── test/images/         # Test images
├── runs/
│   └── detect/
│       └── train2/
│           └── best.pt      # Fine-tuned model weights
└── frontend/
    ├── package.json
    ├── src/
    │   ├── App.jsx           # Root component & routing
    │   ├── AuthContext.jsx   # Global auth state (React context)
    │   ├── pages/            # Page-level components
    │   ├── components/       # Reusable UI components
    │   └── utils/            # API helpers & utilities
    └── public/
```

---

## Nutrition Estimation Details

Calorie and macro estimates are based on a heuristic that scales a food item's **per-100g values** by an estimated portion size derived from the **bounding box area relative to the image**:

```
portion_multiplier = (bbox_area / image_area) × 10   # clamped to [0.05, 4.0]
estimated_calories = cal_per_100g × serving_g / 100 × multiplier
```

You can override the multiplier per food label by passing `serve_mults` as a JSON string in the `/scan-meal` request.

### Supported foods (local DB)

| Food | Cal/100g | Serving | Protein | Carbs | Fat |
|---|---|---|---|---|---|
| Rasgulla | 200 kcal | 50 g | 4 g | 40 g | 3 g |
| Naan | 89 kcal | 118 g | 1.1 g | 22.8 g | 0.3 g |
| Pizza | 266 kcal | 100 g | 11 g | 33 g | 10 g |

> **Note:** Extend the `NUTRITION` dict in `nutrition_db.py` to add more foods. Enabling `USDA_ENABLED=1` allows fallback to the USDA FDC API for any label not found locally.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `dev-secret-change-me` | Secret key for signing JWT tokens (**change in production**) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT token lifetime |
| `DATABASE_URL` | `sqlite:///./app.db` | SQLAlchemy database URL |
| `YOLO_WEIGHTS` | `./runs/detect/train2/best.pt` | Path to YOLO model weights |
| `USDA_ENABLED` | `0` | Set to `1` to enable live USDA lookups |
| `USDA_API_KEY` | — | API key from [USDA FDC](https://fdc.nal.usda.gov/api-guide.html) |
| `USDA_TIMEOUT` | `2.0` | Request timeout (seconds) for USDA API calls |
| `ALLOW_ORIGINS` | *(see main.py)* | Comma-separated CORS allowed origins |

---

## Contributing

Contributions are welcome! Here are some areas where help is appreciated:

- **Expanding the nutrition database** — add more Indian and global food items to `nutrition_db.py`
- **Improving the YOLO model** — collect more training data and re-train with a larger YOLOv8 variant
- **Frontend enhancements** — charts for macros, meal history dashboard, i18n
- **Tests** — unit tests for API routes and nutrition estimation logic

### Steps

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
# make changes
git commit -m "feat: describe your change"
git push origin feature/your-feature
# open a Pull Request
```

---

## License

This project uses the [Indian Food YOLOv5 dataset](https://universe.roboflow.com/smart-india-hackathon/indian-food-yolov5/dataset/1) from Roboflow under a **Public Domain** license.

All other source code is provided as-is for educational and research purposes.

---

## Acknowledgements

- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics) for the detection backbone
- [Roboflow / Smart India Hackathon](https://universe.roboflow.com/smart-india-hackathon/indian-food-yolov5) for the open food dataset
- [USDA FoodData Central](https://fdc.nal.usda.gov/) for the nutrition API
- [Render](https://render.com/) for free-tier deployment
