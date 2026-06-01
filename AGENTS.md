# Project Overview

Explain that this is an existing full-stack project with:
* React frontend
* FastAPI backend
* SQLite database
* Frontend located in `/frontend`
* Backend located in `/backend`

# Very Important Rules

* Do not start from scratch.
* Do not recreate the React frontend.
* Do not recreate the FastAPI backend.
* Do not delete the SQLite database.
* Do not delete existing source code.
* Do not overwrite existing UI unless specifically asked.
* Do not reinstall dependencies unless required.
* Always inspect existing files before making changes.
* Continue from the current codebase.

# Folder Structure

```text
project-root/
├── AGENTS.md
├── README.md
├── frontend/
│   ├── package.json
│   ├── package-lock.json or yarn.lock or pnpm-lock.yaml
│   ├── node_modules/
│   └── src/
├── backend/
│   ├── main.py or app/
│   ├── requirements.txt
│   ├── .venv/
│   └── database file such as app.db / database.db / *.sqlite
└── .gitignore
```

# Frontend Instructions

* Frontend is inside `/frontend`.
* Use existing React code.
* Run frontend with the command found in `package.json`.
* Usually use:

```bash
cd frontend
npm run dev
```

* Only run `npm install` if `node_modules` is missing or package files changed.
* Do not create a new Vite/React project unless the user explicitly asks.

# Backend Instructions

* Backend is inside `/backend`.
* Use existing FastAPI code.
* Use existing SQLite database.
* Activate virtual environment if it exists:

```bash
cd backend
source .venv/bin/activate
```

* If `.venv` does not exist, create it:

```bash
python -m venv .venv
source .venv/bin/activate
```

* Install backend dependencies only when needed:

```bash
pip install -r requirements.txt
```

* Run backend normally with:

```bash
uvicorn main:app --reload
```

* If the FastAPI app path is different, inspect the backend and use the correct app import path.

# SQLite Database Rules

* Do not delete the SQLite database.
* Do not reset migrations or tables unless the user clearly asks.
* Before changing database-related code, identify the current database file and connection configuration.
* If schema changes are needed, explain them first.

# Dependency Rules

* Do not reinstall packages every session.
* For frontend, check whether `node_modules` exists before running `npm install`.
* For backend, check whether `.venv` exists before creating a new virtual environment.
* Use existing lock files such as `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`.
* Do not change package managers unless asked.

# Git Workflow

* Check `git status` before changes.
* Avoid large unrelated edits.
* After meaningful changes, suggest committing work.
* Do not remove `.git`.

# Safe Startup Checklist

1. Read `AGENTS.md`.
2. Check `git status`.
3. Inspect `/frontend/package.json`.
4. Inspect `/backend` entry point.
5. Confirm SQLite database file exists.
6. Start backend.
7. Start frontend.
8. Continue from the last existing code.

# Commands

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload
```

Git save progress:

```bash
git add .
git commit -m "save project progress"
```

# Next-Day Resume Prompt

```text
Resume this existing full-stack project from where we left off.

Do not start a new project.
Do not recreate the React frontend.
Do not recreate the FastAPI backend.
Do not delete the SQLite database.
Do not reinstall dependencies unless they are missing.

First read:
- AGENTS.md
- README.md
- frontend/package.json
- backend files
- current git status

Project structure:
- React frontend is inside /frontend
- FastAPI backend is inside /backend
- SQLite database is used by the backend

Your first task is to inspect the existing project and continue from the current codebase. Use existing dependencies and existing files. Only install packages if something is missing or broken.
```
