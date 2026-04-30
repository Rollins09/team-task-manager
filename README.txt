================================================
  TASKFLOW — TEAM TASK MANAGER
  Full-Stack Web Application
================================================

LIVE URL: [YOUR_RAILWAY_URL_HERE]
GITHUB:   https://github.com/Rollins09/team-task-manager

------------------------------------------------
TABLE OF CONTENTS
------------------------------------------------
1. Project Overview
2. Tech Stack
3. Features
4. Project Structure
5. API Documentation
6. Local Development Setup
7. Deployment Guide (Railway)
8. Environment Variables
9. Database Schema
10. Role-Based Access Control

------------------------------------------------
1. PROJECT OVERVIEW
------------------------------------------------
TaskFlow is a full-stack Team Task Management web application
that allows users to create projects, invite team members, assign
tasks, and track progress through a clean dashboard interface.

It is built as a simplified Trello/Asana alternative with:
- JWT-based authentication
- Role-based access control (Admin / Member)
- Real-time dashboard stats
- Full REST API backend

------------------------------------------------
2. TECH STACK
------------------------------------------------
BACKEND:
  - Node.js + Express.js
  - PostgreSQL (database)
  - JWT (jsonwebtoken) for authentication
  - bcryptjs for password hashing
  - express-validator for input validation
  - CORS enabled for cross-origin requests

FRONTEND:
  - React 18 (Vite)
  - React Router v6 (SPA routing)
  - Axios (HTTP client)
  - react-hot-toast (notifications)
  - lucide-react (icons)
  - date-fns (date formatting)
  - Custom CSS design system (no UI library)

DEPLOYMENT:
  - Railway (backend + PostgreSQL)
  - Railway (frontend as static site)

------------------------------------------------
3. FEATURES
------------------------------------------------
AUTHENTICATION:
  [x] User signup with name, email, password
  [x] Secure login with JWT tokens (7-day expiry)
  [x] Token stored in localStorage
  [x] Auto-redirect on 401 unauthorized
  [x] Protected routes on frontend

PROJECT MANAGEMENT:
  [x] Create projects (creator becomes Admin)
  [x] View all projects you belong to
  [x] Edit/Delete projects (Admin only)
  [x] Add members by email (Admin only)
  [x] Remove members (Admin only)
  [x] Role assignment: admin or member

TASK MANAGEMENT:
  [x] Create tasks with: Title, Description, Due Date, Priority
  [x] Assign tasks to project members (Admin only)
  [x] Update task status: To Do / In Progress / Done
  [x] Edit/Delete tasks (Admin only)
  [x] Members can update status of their own tasks
  [x] Filter tasks: All / Mine / By Status / Overdue

DASHBOARD:
  [x] Total projects count
  [x] Total tasks count
  [x] Tasks by status (To Do, In Progress, Done)
  [x] Overdue tasks count
  [x] My assigned tasks count
  [x] Visual progress bars by status
  [x] Tasks per team member breakdown
  [x] Recent tasks list

ROLE-BASED ACCESS CONTROL:
  Admin:
    - Create/Edit/Delete tasks
    - Create/Edit/Delete projects
    - Add/Remove members
    - Assign tasks to any member
    - Update any task field
  Member:
    - View all tasks in assigned projects
    - Update STATUS of tasks assigned to them ONLY
    - Cannot create/delete tasks or modify other fields

------------------------------------------------
4. PROJECT STRUCTURE
------------------------------------------------
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── index.js        # DB connection + schema init
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # POST /signup, /login, GET /me
│   │   │   ├── projects.js     # CRUD + member management
│   │   │   ├── tasks.js        # Task CRUD (nested under projects)
│   │   │   └── dashboard.js    # Aggregated stats
│   │   └── server.js           # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx      # Sidebar + navigation
    │   ├── pages/
    │   │   ├── Auth.jsx        # Login + Signup pages
    │   │   ├── Dashboard.jsx   # Stats dashboard
    │   │   ├── Projects.jsx    # Projects list
    │   │   └── ProjectDetail.jsx # Tasks + members tabs
    │   ├── api.js              # Axios API layer
    │   ├── AuthContext.jsx     # Global auth state
    │   ├── App.jsx             # Routes
    │   ├── main.jsx            # Entry point
    │   └── index.css           # Design system + styles
    ├── .env.example
    ├── vite.config.js
    └── railway.toml

------------------------------------------------
5. API DOCUMENTATION
------------------------------------------------
BASE URL: https://your-backend.railway.app/api

AUTH ENDPOINTS:
  POST /auth/signup
    Body: { name, email, password }
    Returns: { token, user }

  POST /auth/login
    Body: { email, password }
    Returns: { token, user }

  GET /auth/me
    Headers: Authorization: Bearer <token>
    Returns: { id, name, email, created_at }

PROJECT ENDPOINTS (all require auth):
  GET    /projects               — List user's projects
  POST   /projects               — Create project (body: name, description)
  GET    /projects/:id           — Get project with members
  PUT    /projects/:id           — Update project (admin only)
  DELETE /projects/:id           — Delete project (admin only)
  POST   /projects/:id/members   — Add member (body: email, role)
  DELETE /projects/:id/members/:userId — Remove member (admin only)

TASK ENDPOINTS (all require auth):
  GET    /projects/:projectId/tasks         — List tasks
  POST   /projects/:projectId/tasks         — Create task (admin only)
  PUT    /projects/:projectId/tasks/:id     — Update task
  DELETE /projects/:projectId/tasks/:id     — Delete task (admin only)

DASHBOARD:
  GET /dashboard — Aggregated stats for current user

HEALTH CHECK:
  GET /api/health — Returns { status: "ok", timestamp }

------------------------------------------------
6. LOCAL DEVELOPMENT SETUP
------------------------------------------------
PREREQUISITES:
  - Node.js 18+
  - PostgreSQL 14+ running locally
  - npm or yarn

STEP 1: Clone the repository
  git clone https://github.com/Rollins09/team-task-manage.git
  cd team-task-manager

STEP 2: Setup Backend
  cd backend
  cp .env.example .env
  # Edit .env with your local PostgreSQL credentials
  npm install
  npm run dev   # Starts on port 5000

STEP 3: Setup Frontend
  cd ../frontend
  cp .env.example .env
  # Edit .env: VITE_API_URL=http://localhost:5000/api
  npm install
  npm run dev   # Starts on port 5173

STEP 4: Open browser
  Navigate to http://localhost:5173
  Create an account and start using the app!

NOTE: The database schema is created automatically on first run.
No manual migrations needed.

------------------------------------------------
7. DEPLOYMENT GUIDE (RAILWAY)
------------------------------------------------
DEPLOY BACKEND + DATABASE:

Step 1: Create Railway account at railway.app

Step 2: Create a new project on Railway

Step 3: Add a PostgreSQL database service
  - Click "Add Service" → "Database" → "PostgreSQL"
  - Railway will auto-create DATABASE_URL variable

Step 4: Deploy backend
  - Click "Add Service" → "GitHub Repo"
  - Select your repository, set root directory to "backend"
  - Railway auto-detects Node.js
  - Add environment variables (see Section 8)

Step 5: Get backend URL
  - Go to backend service → Settings → Networking
  - Copy the public domain (e.g. backend-xyz.railway.app)

DEPLOY FRONTEND:

Step 6: Add another service for frontend
  - Click "Add Service" → "GitHub Repo"
  - Select same repo, set root directory to "frontend"
  - Set environment variable:
    VITE_API_URL = https://your-backend.railway.app/api

Step 7: Frontend build
  - Railway auto-runs "npm run build"
  - Uses "npx serve -s dist" to serve the static files

Step 8: Done!
  - Visit your frontend Railway URL
  - Everything should be live and connected

------------------------------------------------
8. ENVIRONMENT VARIABLES
------------------------------------------------
BACKEND (.env):
  DATABASE_URL    = postgresql://user:pass@host:5432/dbname
                    
  JWT_SECRET      = a-long-random-secret-string-minimum-32-chars
  PORT            = 5000 (Railway auto-sets this)
  NODE_ENV        = production
  FRONTEND_URL    = https://your-frontend.railway.app

FRONTEND (.env):
  VITE_API_URL    = https://your-backend.railway.app/api

------------------------------------------------
9. DATABASE SCHEMA
------------------------------------------------
TABLE: users
  id          SERIAL PRIMARY KEY
  name        VARCHAR(100) NOT NULL
  email       VARCHAR(150) UNIQUE NOT NULL
  password    VARCHAR(255) NOT NULL  -- bcrypt hashed
  created_at  TIMESTAMP DEFAULT NOW()

TABLE: projects
  id          SERIAL PRIMARY KEY
  name        VARCHAR(150) NOT NULL
  description TEXT
  created_by  INTEGER REFERENCES users(id)
  created_at  TIMESTAMP DEFAULT NOW()

TABLE: project_members
  id          SERIAL PRIMARY KEY
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE
  role        VARCHAR(20) CHECK (role IN ('admin', 'member'))
  joined_at   TIMESTAMP DEFAULT NOW()
  UNIQUE(project_id, user_id)

TABLE: tasks
  id          SERIAL PRIMARY KEY
  title       VARCHAR(200) NOT NULL
  description TEXT
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL
  status      VARCHAR(20) CHECK IN ('todo', 'in_progress', 'done')
  priority    VARCHAR(20) CHECK IN ('low', 'medium', 'high')
  due_date    DATE
  created_at  TIMESTAMP DEFAULT NOW()
  updated_at  TIMESTAMP DEFAULT NOW()

------------------------------------------------
10. ROLE-BASED ACCESS CONTROL SUMMARY
------------------------------------------------

ENDPOINT                          | ADMIN | MEMBER
----------------------------------|-------|-------
GET  /projects                    |  YES  |  YES
POST /projects                    |  YES  |  YES
GET  /projects/:id                |  YES  |  YES
PUT  /projects/:id                |  YES  |   NO
DELETE /projects/:id              |  YES  |   NO
POST /projects/:id/members        |  YES  |   NO
DELETE /projects/:id/members/:uid |  YES  |   NO
GET  /projects/:id/tasks          |  YES  |  YES
POST /projects/:id/tasks          |  YES  |   NO
PUT  /projects/:id/tasks/:id      |  YES  | PARTIAL*
DELETE /projects/:id/tasks/:id    |  YES  |   NO

* Members can only update the STATUS field of tasks
  that are assigned to them specifically.

------------------------------------------------
AUTHOR NOTES
------------------------------------------------
This project was built as a full-stack assessment demonstrating:
- Clean REST API design with proper HTTP status codes
- Relational database with foreign keys + constraints
- JWT authentication with token-based auth flow
- Role-based access control enforced server-side
- React SPA with protected routes
- Responsive design with custom CSS design system
- Production deployment on Railway

The app follows MVC-like patterns with separate route handlers,
middleware for authentication, and a clean separation between
the React frontend and Express backend.

================================================
