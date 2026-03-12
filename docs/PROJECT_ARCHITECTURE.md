## 1. Project Overview

This repository contains a **Super App Platform** that combines multiple on-demand services into a single unified experience, similar to a mix of **Zomato (food delivery)**, **Blinkit (quick commerce)**, and **Uber (ride booking)**.

The key design goals are:

- **Single Authentication System** shared across all services.
- **Role-Based Access Control (RBAC)** to manage permissions.
- **Modular Monolith Architecture** so service modules can be **added, replaced, or removed** with minimal impact.
- **Scalable folder structure** for long-term growth and new business verticals.
- **Clean separation of concerns** between core platform, shared infrastructure, and individual service modules.

Current and planned service verticals:

- **Food Delivery** (Zomato-like)
- **Quick Commerce** (Blinkit-like)
- **Taxi / Ride Booking** (Uber-like)
- **Future verticals**: Grocery, Pharmacy, Logistics, Subscriptions, etc.

All services sit behind a single backend API and a single frontend application.

---

## 2. Backend Architecture

**Tech Stack**: **Node.js + Express + MongoDB** (with Redis and Socket.io for caching and realtime features).

**Architecture Style**: **Modular Monolith**

- All code is deployed as a single backend service.
- Within the service, the codebase is **strongly modularized**:
  - **Core platform layer**: auth, users, roles, payments, notifications.
  - **Service modules**: zomato, quickCommerce, taxi, and future modules.
  - **Infrastructure**: config, middleware, utilities, and shared route registration.

High-level backend layout (conceptual target):

```text
Backend
│
├── server.js
├── package.json
├── .env
├── README.md
│
├── src
│   ├── app.js
│   │
│   ├── config
│   │   ├── db.js          # MongoDB connection
│   │   ├── redis.js       # Redis client, caches, queues
│   │   ├── socket.js      # Socket.io server setup
│   │   └── env.js         # Environment variable loader / validator
│   │
│   ├── core               # Platform-level, shared across all modules
│   │   ├── auth           # Registration, login, JWT, password reset
│   │   ├── users          # Base user profile and management
│   │   ├── roles          # Role definitions and RBAC policies
│   │   ├── payments       # Payment flows (initiate, verify, refunds)
│   │   └── notifications  # Email, SMS, push, in-app notifications
│   │
│   ├── modules            # Business verticals (independent service modules)
│   │   ├── zomato
│   │   ├── quickCommerce
│   │   ├── taxi
│   │   └── futureModules  # Placeholder / directory for upcoming modules
│   │
│   ├── middleware
│   │   ├── auth.js        # JWT verification and user extraction
│   │   ├── role.js        # Role and permission checks
│   │   ├── rateLimit.js   # API rate limiting
│   │   └── errorHandler.js# Centralized error formatting and logging
│   │
│   ├── routes
│   │   └── index.js       # Root router that composes module + core routes
│   │
│   └── utils
│       ├── logger.js      # Central logging abstraction
│       ├── response.js    # Standard API response helpers
│       └── helpers.js     # Misc. pure helper functions
```

### 2.1 Backend Request Flow

1. **`server.js`** boots the app, loads environment variables, connects to MongoDB (and optionally Redis), and starts the HTTP server.
2. **`src/app.js`** wires up:
   - Global middlewares (`helmet`, `cors`, logging, body parsers).
   - The root API router at `/api` (`src/routes/index.js`).
   - Error handling (`errorHandler.js`).
3. **`src/routes/index.js`** mounts:
   - Core routes (auth, users, etc.).
   - Service module routes from `src/modules/*`.
4. Requests pass through:
   - **`auth` middleware** to validate tokens and attach `req.user`.
   - **`role` middleware** to enforce role-based permissions where required.
   - **Rate limiting** for sensitive endpoints.
5. Requests then hit **controllers** inside the respective core or module package, which delegate to **services**, which interact with **models** (MongoDB) and **utilities**.

---

## 3. Frontend Architecture

**Tech Stack**: **React** (modular application structure).

While the actual frontend implementation may evolve, the **target structure** is:

```text
frontend
│
├── public
│
├── src
│   ├── App.jsx
│   ├── main.jsx
│   │
│   ├── config          # API base URLs, environment config, feature flags
│   │
│   ├── routes          # Route definitions, protected routes, layouts
│   │
│   ├── services        # API clients / data-access layer (per backend module)
│   │
│   ├── store           # Global state (Redux, Zustand, or similar)
│   │
│   ├── components      # Shared UI components (buttons, layouts, modals, etc.)
│   │
│   ├── modules         # Mirrors backend service modules
│   │   ├── auth
│   │   ├── zomato
│   │   ├── quickCommerce
│   │   ├── taxi
│   │   └── futureModules
│   │
│   ├── assets          # Images, icons, fonts
│   │
│   ├── styles          # Global styles, theme, design system tokens
│   │
│   └── utils           # Frontend utilities, formatters, hooks
```

### 3.1 Frontend–Backend Integration

- Each frontend module (e.g. `modules/zomato`) should call backend APIs through a **services layer** (e.g. `src/services/zomatoService.js`) rather than hard-coding fetch calls inside components.
- Authentication state (JWT, current user, role) is stored in a global store and/or secure storage (e.g. http-only cookies or local storage, depending on final implementation).
- Routing is organized so that:
  - **Public routes** (login, register, landing pages).
  - **Authenticated routes** guarded by auth state.
  - **Role-specific sections** (Admin panel, Restaurant dashboard, Vendor panel, Driver app views).

---

## 4. Folder Structure Explanation

### 4.1 Backend Key Directories

- **`Backend/server.js`**
  - Entry point; initializes environment, database connections, and starts the HTTP server using `app.js`.

- **`Backend/src/app.js`**
  - Constructs the Express application.
  - Registers global security + parsing middleware.
  - Mounts `/api` routes and the global error handler.

- **`Backend/src/config`**
  - **`db.js`**: Sets up and exports the MongoDB (Mongoose) connection.
  - **`redis.js`**: Configures Redis clients (caching, queues, sessions).
  - **`socket.js`**: Socket.io initialization and namespace/room setup.
  - **`env.js`**: Central place to read and validate environment variables (port, DB URI, JWT secrets, etc.).

- **`Backend/src/core`**
  - Contains **shared platform domains** used by all service modules.
  - Example submodules:
    - `auth`: registration, login, token handling.
    - `users`: user profiles and global user-related functions.
    - `roles`: role definitions and access policy logic.
    - `payments`: payment methods, order charges, refunds.
    - `notifications`: email/SMS/push dispatching.

- **`Backend/src/modules`**
  - Houses service-specific code for each business vertical (e.g. zomato, quickCommerce, taxi).
  - Each module is **self-contained** (its own models, services, controllers, routes, and sometimes admin or subdomains).

- **`Backend/src/middleware`**
  - **`auth.js`**: Verifies JWT, attaches authenticated user (`req.user`).
  - **`role.js`**: Verifies that `req.user.role` has the required permissions.
  - **`rateLimit.js`**: Protects endpoints with rate limiting rules.
  - **`errorHandler.js`**: Catches and formats errors in a consistent JSON structure.

- **`Backend/src/routes/index.js`**
  - Central router.
  - Imports and mounts core and module routers (e.g., `/auth`, `/zomato`, `/quick-commerce`, `/taxi`).
  - This is the **only place that needs to be updated** when adding/removing service modules.

- **`Backend/src/utils`**
  - **`logger.js`**: Logging wrapper (can plug in Winston, pino, or other loggers).
  - **`response.js`**: Helpers for unified response structure (success/error envelopes).
  - **`helpers.js`**: Small, stateless helper functions shared across code.

### 4.2 Frontend Key Directories

- **`frontend/src/modules`**: Mirrors backend service modules; each contains pages, feature components, hooks, and local state for that vertical.
- **`frontend/src/services`**: Encapsulates all API calls (per module) and handles base URLs, headers, and error normalization.
- **`frontend/src/store`**: Shared application state (auth, user, cart, active orders, etc.).
- **`frontend/src/routes`**: Route configuration and guards (e.g. PrivateRoute, RoleRoute).

---

## 5. Module Design

### 5.1 Generic Service Module Structure

Every backend service module follows the same internal layout:

```text
serviceModule
├── admin        # Admin-only handlers and routes for this module
├── controllers  # HTTP controllers; thin, request/response layer
├── models       # Mongoose models (MongoDB schemas)
├── routes       # Express routers for module endpoints
└── services     # Business logic; orchestrates models, payments, notifications, etc.
```

This pattern ensures:

- **Clear separation of concerns**:
  - Controllers focus on translating HTTP to service calls.
  - Services implement business rules and workflows.
  - Models know only about data persistence.
- **Testability**: Services can be unit-tested without Express.
- **Swappability**: Modules can be removed or replaced by modifying import/registration in `routes/index.js`.

### 5.2 Example Modules

- **`modules/zomato`**
  - `restaurant`: Restaurant registration, listing, availability, and settings.
  - `menu`: Menu items, categories, pricing.
  - `orders`: Food order lifecycle (create, accept, prepare, deliver).
  - `delivery`: Delivery assignment, tracking, status updates.

- **`modules/quickCommerce`**
  - `vendors`: Store setup, inventory, store status.
  - `products`: Item catalogue, categories, pricing, stock.
  - `cart`: Cart management, coupons, pricing calculations.
  - `orders`: Order placement, fulfillment and status tracking.

- **`modules/taxi`**
  - `drivers`: Driver onboarding, verification, online/offline state.
  - `rides`: Ride requests, matching, trip lifecycle.
  - `vehicles`: Vehicle registration and metadata.

All modules:

- Reuse **core** domain services where appropriate (auth, payments, notifications).
- Avoid **direct cross-module dependencies** (e.g. taxi module does not import zomato logic directly).

---

## 6. Authentication System

Authentication is **centralized** and shared across all services.

### 6.1 Endpoints

- **`POST /api/auth/register`**
  - Registers a new user.
  - Captures basic profile info and role (if role is user-selectable) or assigns a default `USER` role.

- **`POST /api/auth/login`**
  - Authenticates with credentials (e.g. email/phone + password).
  - Returns a **JWT token** and relevant user info.

### 6.2 JWT Structure

The JWT payload minimally includes:

- `userId`: Unique user identifier.
- `role`: One of the supported roles (see Role System).

Additional claims (such as token expiry, issued-at, and other metadata) may also be included.

### 6.3 Auth Middleware

- **`auth` middleware**:
  - Extracts the token from headers (or cookie).
  - Verifies the JWT signature and expiry.
  - Loads basic user context and attaches it to `req.user` (including `userId` and `role`).
  - Rejects unauthorized requests with standardized error responses.

All protected routes in both **core** and **modules** should use this middleware.

---

## 7. Role System

All roles use the **same authentication system**; authorization is handled via **roles and permissions**.

Supported roles:

- `USER`
- `ADMIN`
- `RESTAURANT_OWNER`
- `DELIVERY_BOY`
- `VENDOR`
- `DRIVER`

### 7.1 Role-Based Access Control (RBAC)

- **`roles` core module** defines:
  - Each role.
  - Which actions/endpoints each role can access.
  - Optionally, per-module permissions (e.g. `USER` can create zomato orders but cannot manage restaurants).

- **`role` middleware**:
  - Accepts required roles/permissions for a route.
  - Compares `req.user.role` (and permissions if applicable).
  - Returns 403 Forbidden for insufficient permissions.

### 7.2 Role Usage Examples

- `USER`: Browse, order food, place quick-commerce orders, book rides.
- `ADMIN`: Global configuration, user management, viewing analytics, module-level settings.
- `RESTAURANT_OWNER`: Manage restaurant info, menus, and incoming food orders.
- `DELIVERY_BOY`: Access assigned deliveries (food or quick-commerce), update statuses.
- `VENDOR`: Manage inventory and orders for quick commerce.
- `DRIVER`: Accept, start, and complete taxi rides.

---

## 8. Module Add/Remove Rules

The system is designed so individual service modules are **optional**.

### 8.1 Adding a Module

To add a new service module (e.g. `grocery`):

1. Create a new folder under `Backend/src/modules`, e.g. `grocery`, following the standard structure:
   ```text
   Backend/src/modules/grocery
   ├── admin
   ├── controllers
   ├── models
   ├── routes
   └── services
   ```
2. Expose the module’s Express router (e.g. `grocery.routes.js`).
3. Import and mount the module router in `Backend/src/routes/index.js`, e.g.:
   - `router.use('/grocery', groceryRouter);`
4. Optionally, add corresponding **frontend** module under `frontend/src/modules/grocery` plus its service client.

### 8.2 Removing a Module

Example: removing the **taxi** module.

1. Delete or disable the `Backend/src/modules/taxi` directory.
2. Remove its route registration from `Backend/src/routes/index.js`, e.g. remove:
   - `router.use('/taxi', taxiRouter);`
3. Remove/disable any **frontend** routes and UI components that reference taxi APIs.

As long as:

- Other modules do **not import taxi module code directly**.
- Shared logic lives in **core** (not in taxi).

The rest of the system continues to function without errors.

---

## 9. Development Guidelines

To keep the architecture clean and scalable:

- **Keep modules independent**
  - Each module manages its own models, services, controllers, and routes.
  - Shared logic belongs in `core` or `utils`, not in another module.

- **Avoid tight coupling between services**
  - Do not have module A directly import private implementation details of module B.
  - If two modules need to collaborate, prefer:
    - Shared core services.
    - Well-defined APIs between modules (ideally through clear service interfaces).

- **Use a clear service layer**
  - Controllers should be **thin**: validate input, call services, map results to HTTP responses.
  - Business rules, workflows, and side effects (payments, notifications, etc.) belong in **services**.

- **Use middleware for cross-cutting concerns**
  - Authentication (`auth`).
  - Authorization (`role`).
  - Rate limiting, logging, request tracing.

- **Use utilities/helpers for shared low-level logic**
  - Date/price formatting, ID generation, small reusable pure functions.

- **Consistent API design**
  - Use predictable REST patterns across all modules.
  - Follow shared response shapes defined in `response.js` (e.g. `{ success, data, error }`).

---

## 10. Future Scalability and New Modules

The architecture explicitly supports future services such as:

- Grocery Delivery
- Pharmacy
- Logistics
- Subscription Services

### 10.1 `futureModules` Placeholder

- **`Backend/src/modules/futureModules`** serves as:
  - A conceptual grouping for upcoming modules.
  - A place to store experimental or WIP modules before promotion to top-level (e.g. `grocery`).
- **`frontend/src/modules/futureModules`** similarly groups upcoming frontend modules.

### 10.2 Scaling Strategies

As traffic and complexity grow, this **modular monolith** can evolve without breaking existing code:

- **Horizontal scaling**:
  - Run multiple instances of the monolith behind a load balancer.
  - Use Redis for shared caching and WebSocket scale-out.

- **Gradual extraction**:
  - High-traffic modules (e.g. taxi, payments) can be gradually extracted into separate services.
  - Keep public contracts (routes, DTOs) stable while internal deployments change.

- **Observability and reliability**:
  - Central logging via `logger.js`.
  - Global error handling for consistent error payloads.
  - Room to add metrics, tracing, and circuit breakers as needed.

By adhering to the guidelines above—especially **module independence**, **clear service boundaries**, and **centralized auth & roles**—future developers and AI tools can safely extend or modify the system while preserving overall stability.

