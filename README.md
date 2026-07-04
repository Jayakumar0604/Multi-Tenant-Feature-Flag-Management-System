# Multi-Tenant Feature Flag Management System (SaaS-like)

This project is a multi-tenant feature-flag management platform, built as a monorepo consisting of a Node.js Express backend and three separate React Vite frontend applications. All frontends are styled with a premium dark-mode glassmorphic theme using Tailwind CSS v4.

---

## Repository Structure

```
feature-flag-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── models/          # Organization, User, FeatureFlag collections
│   │   ├── middleware/      # JWT validation, Role-based auth (RBAC), error handling
│   │   ├── controllers/     # Controller logic for all endpoints
│   │   ├── routes/          # Express route definitions
│   │   ├── utils/           # Database seed script for Super Admin
│   │   └── app.js           # Express app setup
│   ├── server.js            # Backend entry point
│   ├── .env                 # Environment variables
│   └── package.json
├── frontend-super-admin/    # Super Admin Dashboard (Port 5173)
├── frontend-org-admin/      # Organization Admin Workspace (Port 5174)
├── frontend-user/           # Public Feature Flag Evaluator (Port 5175)
├── package.json             # Monorepo configuration
└── README.md
```

---

## Port Allocation

To allow running all services concurrently on a local machine, the ports are allocated as follows:

| Component | Port | Description |
|---|---|---|
| **Backend API** | `4000` | Serves Express endpoints |
| **Super Admin Frontend** | `5173` | Manage tenants (create and list organizations) |
| **Organization Admin Frontend** | `5174` | Dashboard to register, log in, and CRUD feature flags |
| **User Frontend** | `5175` | SDK-like query board to check feature states |

---

## Architectural Decisions & Trade-offs

### 1. Unified Authentication Endpoint (`/api/auth/login`)
We implemented a single, unified `/auth/login` endpoint that looks up users by email and issues a role-scoped JWT. This is much cleaner and DRYer than maintaining three separate login routes. The JWT contains the user's role and organization ID, which the backend inspects on subsequent requests.

### 2. Super Admin as a Seeded Database Row
Instead of hardcoding Super Admin checks against env vars inside controllers, we seed a Super Admin user in the database on server startup if it doesn't already exist. This maintains a unified code path for auth logic and schema structures.

### 3. Tenancy Isolation Scoping
To prevent cross-tenant data leakage, the backend *never* fetches, updates, or deletes a feature flag by its ID alone. Every query is filtered explicitly by `{ _id: flagId, organizationId: req.user.organizationId }`, ensuring an Org Admin can never touch another tenant's flags, even if they guess or obtain their MongoDB Object ID.

### 4. Compound Index on Flag Keys
We defined a compound unique index on the `FeatureFlag` schema: `(organizationId, key)`. A feature key (e.g. `dark_theme`) must be unique *within* an organization, but can exist in multiple organizations simultaneously.

### 5. Pure Client-Side Evaluator
The public feature-check endpoint (`/api/flags/check`) is unauthenticated so that end users can perform checks instantly without signing in. To protect organizational privacy, we only return the state of the requested key and never expose lists of other flags.

---

## API Contract

Base URL: `http://localhost:4000/api`

### Auth Endpoints
- `POST /auth/signup` (Org Admin Signup) -> `{ email, password, organizationId }`
- `POST /auth/login` (Unified Login) -> `{ email, password }` -> Returns JWT token

### Super Admin Endpoints (Requires `super_admin` role)
- `POST /super-admin/organizations` (Create Org) -> `{ name }`
- `GET /super-admin/organizations` (List Orgs)

### Org Admin Endpoints (Requires `org_admin` role)
- `POST /flags` (Create Feature Flag) -> `{ key, description, enabled }`
- `GET /flags` (List own Org Flags)
- `PATCH /flags/:id` (Toggle flag state or change description) -> `{ enabled, description }`
- `DELETE /flags/:id` (Delete flag)

### Public Endpoints
- `GET /organizations/public` (Returns organization id/name list for dropdown selectors)
- `POST /flags/check` (SDK check) -> `{ organizationId, key }` -> Returns `200 { key, enabled }` or `404`

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on default port `27017` or configured via MONGODB_URI)

### Installation

1. Clone the project and navigate to the project directory.
2. Install monorepo dependencies (this installs `concurrently` at the root):
   ```bash
   npm install
   ```
3. Boot up the backend and all three React frontend applications with a single command:
   ```bash
   npm run dev
   ```

---

## Default Seed Credentials

On startup, the system seeds the following Super Admin user (which can be configured in `backend/.env`):

- **Super Admin Email**: `superadmin@byepo.com`
- **Super Admin Password**: `SuperAdmin123!`
