# TaskTracker

A full-stack task management web application built with **React**, **Node.js / Express**, and **MongoDB**. Users can register, log in, and manage their personal tasks with priorities, statuses, due dates, and a live progress overview — all deployed seamlessly on **Vercel**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Run the Development Servers](#4-run-the-development-servers)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [User Profile](#user-profile)
  - [Tasks](#tasks)
- [Data Models](#data-models)
  - [User](#user)
  - [Task](#task)
- [Frontend Pages & Routes](#frontend-pages--routes)
- [Deployment (Vercel)](#deployment-vercel)
- [Environment Variables Reference](#environment-variables-reference)
- [License](#license)

---

## Features

- **User Authentication** — Secure registration and login with bcrypt-hashed passwords and JWT-based sessions (7-day token expiry).
- **Task CRUD** — Create, read, update, and delete tasks, each owned by the authenticated user.
- **Task Attributes** — Every task carries a title, optional description, priority level (`low` / `medium` / `high`), status (`todo` / `in-progress` / `done`), completion flag, and optional due date.
- **Smart Filtering** — Filter tasks by view: All, Today, This Week, High / Medium / Low priority.
- **Progress Dashboard** — A live productivity widget shows total tasks, completed tasks, pending tasks, and an overall completion rate.
- **Profile Management** — Update display name, email address, avatar URL, and account password.
- **Protected Routes** — All task and profile endpoints require a valid Bearer token; the React frontend redirects unauthenticated users to `/login`.
- **Vercel Serverless Deployment** — The Express backend is bundled as a Vercel serverless function; the React frontend is served as a static site from the same deployment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router DOM 7, Vite 6 |
| **Backend** | Node.js, Express 5 (ESM) |
| **Database** | MongoDB via Mongoose 9 |
| **Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Validation** | `validator` |
| **Deployment** | Vercel (serverless functions + static hosting) |

---

## Project Structure

```
TaskTracker/
├── api/
│   └── index.mjs            # Vercel serverless entry point
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB connection helper
│   ├── controllers/
│   │   ├── authController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT protect middleware
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   ├── package.json
│   └── server.js            # Express app & local dev server
├── config/
│   └── db.js                # Re-exports connectDB for Vercel
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api.js           # Fetch wrapper & API helpers
│   │   ├── App.jsx          # All pages and components
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json             # Root-level shared dependencies
├── vercel.json              # Vercel build & routing config
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the Repository

```bash
git clone https://github.com/Adarshvijaycx/TaskTracker.git
cd TaskTracker
```

### 2. Configure Environment Variables

Create a `.env` file inside the `backend/` directory:

```bash
cp backend/.env.example backend/.env   # if the example exists, otherwise create it manually
```

Populate it with the following values (see [Environment Variables Reference](#environment-variables-reference)):

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/tasktracker
JWT_SECRET=your_super_secret_key
PORT=4000
```

> **Note:** Never commit your `.env` file. It is already listed in `.gitignore`.

### 3. Install Dependencies

Install dependencies for all three packages from the project root:

```bash
# Backend
npm --prefix backend install

# Frontend
npm --prefix frontend install
```

### 4. Run the Development Servers

Open two terminal windows (or use a process manager):

**Backend** (runs on `http://localhost:4000`):

```bash
npm --prefix backend run dev
```

**Frontend** (runs on `http://localhost:5173` by default):

```bash
npm --prefix frontend run dev
```

The frontend automatically proxies `/api/*` requests to `http://localhost:4000/api` when running on `localhost`.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require the header:

```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ✗ | Register a new user |
| `POST` | `/api/auth/login` | ✗ | Log in and receive a JWT |

#### POST `/api/auth/register`

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response `201`:**

```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com", "avatar": "" }
}
```

#### POST `/api/auth/login`

**Request Body:**

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response `200`:**

```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com", "avatar": "" }
}
```

---

### User Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/user/me` | ✓ | Get the current user's profile |
| `PUT` | `/api/user/profile` | ✓ | Update name, email, or avatar |
| `PUT` | `/api/user/password` | ✓ | Change account password |

#### PUT `/api/user/profile`

**Request Body** (all fields optional):

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "avatar": "https://example.com/avatar.png"
}
```

#### PUT `/api/user/password`

**Request Body:**

```json
{
  "currentPassword": "secret123",
  "newPassword": "newSecret456"
}
```

---

### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/tasks` | ✓ | List all tasks for the current user |
| `GET` | `/api/tasks/gp` | ✓ | Get task progress summary |
| `POST` | `/api/tasks` | ✓ | Create a new task |
| `PUT` | `/api/tasks/:id` | ✓ | Update an existing task |
| `DELETE` | `/api/tasks/:id` | ✓ | Delete a task |

#### POST `/api/tasks`

**Request Body:**

```json
{
  "title": "Write unit tests",
  "description": "Cover all controller functions",
  "status": "todo",
  "priority": "high",
  "dueDate": "2026-05-10",
  "completed": false
}
```

**Response `201`:**

```json
{
  "success": true,
  "task": { "_id": "...", "title": "Write unit tests", "priority": "high", ... }
}
```

#### GET `/api/tasks/gp` — Progress Summary

**Response `200`:**

```json
{
  "success": true,
  "progress": {
    "total": 10,
    "completed": 6,
    "pending": 4,
    "completionRate": 60
  }
}
```

#### Health Check

```
GET /api/health  →  { "success": true, "message": "TaskFlow API running" }
```

---

## Data Models

### User

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | String | ✓ | Trimmed |
| `email` | String | ✓ | Unique, lowercase |
| `password` | String | ✓ | bcrypt hash, min 6 chars |
| `avatar` | String | ✗ | URL string, defaults to `""` |
| `createdAt` | Date | — | Auto-managed by Mongoose |
| `updatedAt` | Date | — | Auto-managed by Mongoose |

### Task

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `user` | ObjectId | ✓ | — | Reference to `User` |
| `title` | String | ✓ | — | Trimmed |
| `description` | String | ✗ | `""` | Trimmed |
| `priority` | String | ✗ | `"low"` | `low` / `medium` / `high` |
| `status` | String | ✗ | `"todo"` | `todo` / `in-progress` / `done` |
| `completed` | Boolean | ✗ | `false` | |
| `dueDate` | Date | ✗ | — | |
| `createdAt` | Date | — | — | Auto-managed by Mongoose |
| `updatedAt` | Date | — | — | Auto-managed by Mongoose |

---

## Frontend Pages & Routes

| Path | Access | Description |
|------|--------|-------------|
| `/login` | Public | Sign-in form |
| `/register` | Public | Sign-up form |
| `/dashboard` | Protected | All tasks with filter bar & progress widget |
| `/pending` | Protected | Tasks that are not yet completed |
| `/completed` | Protected | Tasks marked as done |
| `/profile` | Protected | Edit profile and change password |

Unauthenticated users are automatically redirected to `/login` by a `<Protected>` route wrapper. The JWT token is persisted in `localStorage` under the key `taskflow_token`.

---

## Deployment (Vercel)

The repository is pre-configured for a **single Vercel deployment** that hosts both the frontend static site and the backend as a serverless function.

**How it works (`vercel.json`):**

1. **Build** — `npm --prefix frontend install && npm --prefix frontend run build` produces the static assets in `frontend/dist/`.
2. **Serverless function** — `api/index.mjs` imports and re-exports the Express app from `backend/server.js`. All files under `backend/` are bundled with it.
3. **Routing** — Requests to `/api/*` are routed to the serverless function; everything else falls through to `frontend/dist/index.html` (client-side routing).

**To deploy:**

1. Push your code to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Add the environment variables (`MONGO_URI`, `JWT_SECRET`) in the Vercel project settings.
4. Vercel will build and deploy automatically on every push to the default branch.

---

## Environment Variables Reference

| Variable | Location | Required | Description |
|----------|----------|----------|-------------|
| `MONGO_URI` | `backend/.env` | ✓ | MongoDB connection string |
| `JWT_SECRET` | `backend/.env` | ✓ | Secret key for signing JWTs |
| `PORT` | `backend/.env` | ✗ | Server port (defaults to `4000`) |
| `VITE_API_BASE` | `frontend/.env` | ✗ | Override API base URL for the frontend (e.g., `https://your-app.vercel.app/api`) |

---

## License

This project is open-source. Feel free to fork and adapt it for your own use.
