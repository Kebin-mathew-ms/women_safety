# AI-Powered Safe Travel Companion for Women

This repository contains the production-quality foundation for the **AI-Powered Safe Travel Companion for Women** mobile application, Node.js backend server, and React operator admin panel.

---

## 1. Project Directory Structure

```
women/
├── .gitignore                    # Workspace gitignore rule set
├── README.md                     # Master project instructions and roadmap
├── backend/                      # Node.js, Express & Real-Time Engine
│   ├── .env                      # Application environment secrets (local port settings, database credentials)
│   ├── .env.example              # Env template for deployment setups
│   ├── package.json              # Backend modules list & runner scripts
│   ├── tsconfig.json             # TypeScript compiler rules
│   ├── .eslintrc.json            # Linting constraints
│   ├── .prettierrc               # Prettier formatting specifications
│   ├── prisma/
│   │   └── schema.prisma         # Prisma ORM MySQL schema models
│   └── src/
│       ├── app.ts                # Express application configuration
│       ├── server.ts             # Entry server file running API and Sockets
│       ├── config/               # Strongly-typed settings using Zod
│       ├── controllers/          # Request handlers
│       ├── routes/               # Express endpoints routers mapping
│       ├── middleware/           # Auth, logger, validation, error handlers
│       ├── services/             # Database and core external connections
│       ├── socket/               # Real-time event and room listeners
│       ├── types/                # Express global TS typings
│       ├── utils/                # Standard loggers, response & exception helpers
│       ├── uploads/              # Local storage for media attachments
│       └── logs/                 # Console logging files output
│
├── mobile/                       # React Native (Expo) Client App
│   ├── package.json              # React Native dependencies and Expo commands
│   ├── tsconfig.json             # Mobile TypeScript configurations
│   ├── App.tsx                   # Master entry, splash & navigation switcher
│   ├── babel.config.js           # Babel preset settings for Expo
│   └── src/
│       ├── screens/              # Splash, Onboarding, Login & Home views
│       ├── services/             # Secure Store, Axios API & Socket.IO connections
│       ├── theme/                # Global colors, spacing, shadows & typography
│       ├── navigation/           # Tab and Auth navigation managers
│       └── ...                   # Hooks, stores, components & helpers (folders created)
│
└── admin/                        # React + Vite Admin Panel Console
    ├── package.json              # Web libraries, Material UI, Vite dependencies
    ├── tsconfig.json             # Compiler options for web compilation
    ├── index.html                # Entry web template loading custom fonts
    ├── vite.config.ts            # Vite asset server configurations
    └── src/
        ├── App.tsx               # Main routes, layouts, and theme injection
        ├── main.tsx              # Web app bootstrap mounting script
        ├── components/           # UI elements (Sidebar, Topbar)
        ├── pages/                # Views (Login console, Dashboard metrics)
        ├── services/             # Axios API communications client
        └── theme/                # Custom Material UI (MUI) Dark Mode themes
```

---

## 2. Environment Variables

Create a `.env` file in the `backend/` directory with the following keys:

| Key | Example Value | Description |
|---|---|---|
| `DATABASE_URL` | `mysql://root:root@localhost:3306/women` | MySQL connection URL for Prisma |
| `MYSQL_HOST` | `localhost` | Local MySQL server host |
| `MYSQL_PORT` | `3306` | Default MySQL port |
| `MYSQL_USER` | `root` | Database connection username |
| `MYSQL_PASSWORD` | `root` | Local database password |
| `MYSQL_DATABASE` | `women` | MySQL database name |
| `PORT` | `5000` | Express API port |
| `SOCKET_PORT` | `5001` | Socket.IO server port |
| `JWT_SECRET` | `super-secret-key-2026` | Token authentication sign key |
| `UPLOAD_PATH` | `uploads` | Directory path for image/media uploads |
| `NODE_ENV` | `development` | Environment mode (`development`/`production`) |

---

## 3. Installation & Run Commands

### 3.1 Prerequisite Database Setup
Ensure that MySQL is running locally on port `3306`. Create the database manually if required:
```sql
CREATE DATABASE IF NOT EXISTS women;
```

### 3.2 Installation Commands
Install all dependencies in each respective folder:
```bash
# Backend dependencies
cd backend
npm install

# Admin Panel dependencies
cd ../admin
npm install

# Mobile app dependencies
cd ../mobile
npm install
```

### 3.3 Database Migration and Client Generation
Before starting the backend, generate the Prisma client:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3.4 Startup Run Commands
Run each service in separate terminal instances:

#### Start Node.js Backend Server
Runs backend live-reloading server on API port `5000` and socket server on `5001`.
```bash
cd backend
npm run dev
```

#### Start Admin Panel Web App
Launches Vite development server on port `3000` (`http://localhost:3000`).
```bash
cd admin
npm run dev
```

#### Start Mobile App (Expo Developer Menu)
Starts Expo Metro bundler console. Follow the on-screen options to open Android or iOS simulators.
```bash
cd mobile
npm run start
```

---

## 4. Features & Verification Suite

The foundation contains mock authentication and verification testing scripts to assert readiness:

### Demo User Accounts
- **Admin operator panel**: Login using `admin@safetravel.com` with password `adminpassword` to access the dashboard.
- **Mobile app client**: Authenticate using `user@safetravel.com` with password `userpassword`.

### Verification Endpoints
- **Health Check Status**: `GET http://localhost:5000/api/health` returning system state, MySQL connection validation, and active Socket.IO connection metrics.
