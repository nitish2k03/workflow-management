# Workflow Management System

A multi-user workflow management application built with the MERN stack, featuring role-based access control, real-time updates, and a Kanban board interface.

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, MongoDB, Socket.io
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Zustand
- **Validation**: Zod (shared schemas between client and server)
- **Authentication**: JWT (access + refresh tokens)

## Project Structure

```
workflow-management/
├── packages/
│   ├── shared/          # Shared types, validation schemas, constants
│   ├── server/          # Express.js REST API + WebSocket server
│   └── client/          # Next.js frontend application
├── package.json         # Root workspace configuration
└── .env.example         # Environment variables template
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)
- npm 9+

### Installation

1. Clone the repository and install dependencies:

```bash
cd workflow-management
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure `.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/workflow-management
JWT_ACCESS_SECRET=<your-secure-secret>
JWT_REFRESH_SECRET=<your-secure-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

4. Start development servers:

```bash
npm run dev
```

This runs both backend (port 5000) and frontend (port 3000) concurrently.

## Architecture Overview

### Monorepo Structure

The project uses npm workspaces to manage three packages:

- **@workflow/shared**: Common types, Zod validation schemas, and constants (task state machine). Both client and server depend on this package to ensure type consistency.

- **@workflow/server**: Express.js API with layered architecture:
  - Routes → Controllers → Services → Models
  - Middleware for authentication, authorization, validation, and error handling
  - Socket.io for real-time event broadcasting

- **@workflow/client**: Next.js 14 App Router with:
  - Zustand for client state management
  - React Query for server state
  - Real-time WebSocket integration

### Data Flow

```
Client Request → Auth Middleware → Authorization Middleware → Controller → Service → MongoDB
                                                                    ↓
                                                              WebSocket Emit
                                                                    ↓
                                                            Other Clients
```

## Authorization Strategy

### Role-Based Access Control (RBAC)

Two user roles with distinct permissions:

| Role   | Permissions |
|--------|-------------|
| Owner  | Create projects, manage members, full project control, all task operations |
| Member | View assigned projects, create/update/move tasks within projects |

### Backend Enforcement

Authorization is enforced at the API level through middleware:

1. **authenticate**: Validates JWT access token, attaches user to request
2. **requireProjectAccess**: Verifies user is owner or member of the project
3. **requireProjectOwner**: Verifies user is the project owner (for sensitive operations)
4. **requireOwnerRole**: Verifies user has "owner" role (for project creation)

All protected routes use these middleware in sequence. The frontend role checks are for UX only; the backend is the source of truth.

### Token Management

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are stored in localStorage and Zustand with persistence
- Axios interceptors handle automatic token refresh on 401 responses

## State Transition Handling

Tasks follow a strict state machine with unidirectional flow:

```
BACKLOG → IN_PROGRESS → REVIEW → DONE
```

### Transition Rules

| Current State | Allowed Next States |
|---------------|---------------------|
| BACKLOG       | IN_PROGRESS         |
| IN_PROGRESS   | REVIEW              |
| REVIEW        | DONE                |
| DONE          | (none - terminal)   |

### Implementation

The state machine is defined once in `@workflow/shared/constants/task-states.ts`:

```typescript
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.BACKLOG]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW],
  [TaskStatus.REVIEW]: [TaskStatus.DONE],
  [TaskStatus.DONE]: [],
};
```

Both frontend and backend import from this single source of truth. Invalid transitions return HTTP 400 with a descriptive error message.

### Activity Logging

Every task creation and status change generates an activity log entry:

```typescript
{
  taskId, projectId, action, performedBy, previousValue, newValue, createdAt
}
```

Logs are indexed by `(taskId, createdAt)` and `(projectId, createdAt)` for efficient retrieval.

## Performance Considerations

### Database Indexes

MongoDB indexes optimized for common query patterns:

**Tasks:**
- `{ projectId, status }` - Kanban board grouping
- `{ projectId, createdAt }` - Task listing with pagination
- `{ assignee, status }` - User's task dashboard

**Activity Logs:**
- `{ taskId, createdAt }` - Task history timeline
- `{ projectId, createdAt }` - Project activity feed

### Efficient Queries

- **Kanban Board**: Single aggregation pipeline groups tasks by status, reducing N+1 queries
- **Authorization**: Lookup joins in aggregation avoid multiple round trips
- **Pagination**: Cursor-based with `.skip()` and `.limit()` for consistent performance
- **Lean queries**: Using `.lean()` for read-only operations to skip Mongoose document overhead

### Real-time Updates

WebSocket rooms scoped to projects ensure:
- Events only broadcast to relevant users
- Minimal payload (task ID + changes, not full documents for status changes)
- Connection authenticated via JWT

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create new user
- `POST /api/v1/auth/login` - Authenticate and receive tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile

### Projects
- `GET /api/v1/projects` - List user's projects (paginated)
- `POST /api/v1/projects` - Create project (Owner role required)
- `GET /api/v1/projects/:id` - Get project details
- `PATCH /api/v1/projects/:id` - Update project (Project owner only)
- `DELETE /api/v1/projects/:id` - Delete project and all related data
- `POST /api/v1/projects/:id/invite` - Invite member by email
- `DELETE /api/v1/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/v1/projects/:projectId/tasks` - List tasks (filterable, paginated)
- `GET /api/v1/projects/:projectId/tasks/board` - Get Kanban board grouped by status
- `POST /api/v1/projects/:projectId/tasks` - Create task
- `GET /api/v1/tasks/:id` - Get task details with activity log
- `PATCH /api/v1/tasks/:id` - Update task fields
- `PATCH /api/v1/tasks/:id/status` - Change task status (validates state machine)
- `DELETE /api/v1/tasks/:id` - Delete task

## Trade-offs and Assumptions

### Assumptions

1. **User Registration**: Users self-register and select their role (owner/member). In production, this would likely be admin-controlled or invitation-based.

2. **Project Scope**: Members can only access projects they're explicitly invited to. There's no organization-level access.

3. **Task Assignment**: Any project participant can be assigned to any task within that project.

4. **Single Assignee**: Tasks have one assignee (not multiple). This simplifies the UI and state management.

### Trade-offs

1. **Next.js vs Vite**: Chose Next.js for better SSR support and file-based routing despite the initial plan using Vite. Trade-off: larger bundle, but better SEO potential and simpler deployment.

2. **Zustand vs Redux**: Chose Zustand for simpler API and less boilerplate. Trade-off: less middleware ecosystem, but sufficient for this scope.

3. **Optimistic Updates**: Implemented for drag-and-drop status changes to improve perceived performance. Trade-off: brief inconsistency window if server rejects the change (handled with rollback).

4. **Activity Log Scope**: Only task creation and status changes are logged. General updates (title, description changes) are not logged. Trade-off: simpler implementation, less storage, but incomplete audit trail.

5. **Pagination**: Server-side pagination with skip/limit. Trade-off: performance degrades with large offsets, but acceptable for expected data volumes.

## Known Limitations

1. **No Email Verification**: User registration doesn't verify email addresses.

2. **No Password Reset**: Forgot password flow is not implemented.

3. **No File Attachments**: Tasks don't support file uploads.

4. **No Task Comments**: Discussion/comment threads on tasks are not implemented.

5. **No Due Dates**: Task deadline tracking is not implemented.

6. **No Search**: Full-text search across tasks is not implemented.

7. **No Notifications**: Email or push notifications for task assignments/updates are not implemented.

8. **No Offline Support**: Application requires active network connection.

## Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | - |
| JWT_ACCESS_SECRET | Access token signing secret | - |
| JWT_REFRESH_SECRET | Refresh token signing secret | - |
| JWT_ACCESS_EXPIRES_IN | Access token TTL | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token TTL | 7d |
| CLIENT_URL | Frontend URL for CORS | http://localhost:3000 |
