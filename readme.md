# TaskManagerPro

A full-stack project and task management application built with Next.js and Node.js. Supports real-time notifications, file attachments, team collaboration, and project announcements.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Overview](#api-overview)
- [Notifications](#notifications)
- [File Attachments](#file-attachments)

---

## Features

### Projects
- Create, edit, and delete projects
- Invite members by email
- Transfer project ownership
- Remove members
- Per-member role descriptions
- Project announcements with Markdown support, pinning, and acknowledgment tracking

### Tasks
- Create, edit, and delete tasks
- Assign tasks to project members
- Set priority (Low, Medium, High, Critical) and status (To Do, In Progress, Done)
- Deadline tracking
- Filter tasks by status, project, and assigned user
- Highlight and scroll to a specific task via URL param (`?highlight=id`)

### Comments
- Comment on any task
- Edit and delete your own comments
- Project owners can delete any comment

### Attachments
- Attach files to tasks (images, PDFs, Word documents, text files, zip archives)
- Files stored on Cloudinary
- Project owners can delete any attachment; members can delete their own
- 10 MB per file limit

### Notifications
- In-app notification bell with unread badge
- Push notifications via Web Push API (works when browser is closed)
- Per-category notification preferences (task assigned, comments, deadlines, etc.)
- Polling on tab visibility change for near real-time in-app updates
- Daily cron job for deadline reminders and overdue alerts

### Profile
- Update username, email, avatar, bio, and password
- Productivity score based on completed tasks
- Full stats: projects owned, tasks completed, overdue tasks, comments, and more

### Settings
- Theme selector (6 themes: 3 light, 3 dark)
- Enable/disable browser push notifications
- Granular notification preferences per category

### Authentication
- JWT-based authentication (30-day tokens)
- Forgot password flow via email (Resend)
- Secure password reset with expiring tokens

---

## Tech Stack

### Frontend
- [Next.js 14](https://nextjs.org/) (App Router)
- React hooks and context
- CSS variables for theming
- `react-hot-toast` for toast notifications
- `react-markdown` for announcement content
- `react-tooltip` for UI hints
- Web Push API + Service Worker for push notifications

### Backend
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/) via `pg`
- [Cloudinary](https://cloudinary.com/) for file storage
- [Resend](https://resend.com/) for transactional email
- [web-push](https://github.com/web-push-libs/web-push) for push notifications
- [node-cron](https://github.com/node-cron/node-cron) for scheduled jobs
- [multer](https://github.com/expressjs/multer) for file upload handling
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) for auth tokens
- [Zod](https://zod.dev/) for request validation

---

## Project Structure

```
TaskManagerPro/
├── client/                         # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── dashboard/          # Dashboard page
│       │   ├── projects/           # Projects page, hooks, components
│       │   ├── tasks/              # Tasks page, hooks, components
│       │   ├── profile/            # Profile page
│       │   └── settings/           # Settings page
│       ├── components/
│       │   ├── auth/               # Login, register, password reset
│       │   ├── layout/             # Sidebar, main layout
│       │   └── ui/                 # Shared components (RemovalModal, NotificationsModal)
│       ├── context/                # AppContext, ThemeContext
│       ├── lib/                    # Utilities, validators
│       └── styles/                 # Global CSS
│
└── server/                         # Express backend
    ├── config/                     # Cloudinary, web-push config
    ├── controllers/                # Route handlers
    ├── jobs/                       # Cron jobs (deadline notifier)
    ├── middleware/                  # Auth, validation, file upload
    ├── routes/                     # Express routers
    ├── scripts/                    # schema.sql, reset_db.sql
    └── validators/                 # Zod schemas
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Cloudinary account
- Resend account

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/yourname/taskmanagerpro.git
cd taskmanagerpro
```

**2. Install server dependencies:**
```bash
cd server
npm install
```

**3. Install client dependencies:**
```bash
cd ../client
npm install
```

**4. Set up environment variables** (see [Environment Variables](#environment-variables))

**5. Set up the database:**
```bash
psql -U your_user -d your_database -f server/scripts/schema.sql
```

**6. Generate VAPID keys for push notifications:**
```bash
npx web-push generate-vapid-keys
```
Copy the output into your `.env` file.

**7. Start the server:**
```bash
cd server
npm run dev
```

**8. Start the client:**
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Server — `server/.env`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager

# Auth
JWT_SECRET=your_jwt_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend (email)
RESEND_API_KEY=your_resend_api_key

# Web Push
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your@email.com

# App
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Client — `client/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Database Setup

Run the schema script to create all tables:

```bash
psql -U your_user -d your_database -f server/scripts/schema.sql
```

To reset the database during development:

```bash
psql -U your_user -d your_database -f server/scripts/reset_db.sql
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with auth fields |
| `projects` | Projects with owner reference |
| `project_members` | Many-to-many: projects ↔ users with role descriptions |
| `tasks` | Tasks with status, priority, deadline, assignment |
| `comments` | Task comments |
| `attachments` | File metadata (stored on Cloudinary) |
| `notifications` | In-app notifications |
| `notification_preferences` | Per-user notification category preferences |
| `push_subscriptions` | Web Push subscription endpoints |
| `project_announcements` | Project-level announcements |
| `announcement_acknowledgments` | Tracks who has read each announcement |

---

## API Overview

All routes are prefixed with `/api`.

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive JWT |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Reset password with token |

### Projects
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/projects` | Get all projects for current user |
| POST | `/projects` | Create a project |
| PUT | `/projects/:id` | Update project name/description |
| DELETE | `/projects/:id` | Delete a project |
| GET | `/projects/:id/members` | Get project members with task stats |
| POST | `/projects/:id/members` | Add a member by email |
| DELETE | `/projects/:id/members/:memberId` | Remove a member |
| PUT | `/projects/:id/members/:memberId/transfer` | Transfer ownership |
| PUT | `/projects/:id/members/:memberId/role` | Update role description |
| DELETE | `/projects/:id/leave` | Leave a project (members only) |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/tasks` | Get tasks with optional filters |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

### Announcements
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/projects/:id/announcements` | Get project announcements |
| POST | `/projects/:id/announcements` | Create an announcement (owner only) |
| DELETE | `/projects/:id/announcements/:announcementId` | Delete an announcement |
| POST | `/projects/:id/announcements/:announcementId/acknowledge` | Toggle acknowledgment |

### Attachments
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/tasks/:taskId/attachments` | Get attachments for a task |
| POST | `/tasks/:taskId/attachments` | Upload a file |
| DELETE | `/attachments/:id` | Delete an attachment |

### Notifications
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/notifications` | Get all notifications |
| PUT | `/notifications/:id/read` | Mark one as read |
| PUT | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete a notification |
| GET | `/notifications/vapid-public-key` | Get VAPID public key |
| POST | `/notifications/push-subscription` | Save push subscription |
| DELETE | `/notifications/push-subscription` | Remove push subscription |
| GET | `/notifications/preferences` | Get notification preferences |
| PUT | `/notifications/preferences` | Update notification preferences |

---

## Notifications

The app has two notification layers:

**In-app notifications** are stored in the database and displayed in the bell dropdown. The dropdown polls on mount and on tab visibility change (`visibilitychange` event) to stay up to date without a persistent connection.

**Push notifications** use the [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API). Users enable them from the Settings page. A service worker (`public/sw.js`) handles incoming push events and displays OS-level notifications even when the browser tab is closed.

Users can control which categories trigger notifications from Settings → Notification Preferences. Categories include task assignments, task updates, completions, deletions, comments, project changes, deadline reminders, and announcements.

A daily cron job runs at 8:00 AM and sends reminders for tasks due the next day and alerts for overdue tasks.

---

## File Attachments

Files are uploaded directly from the browser to the server, then streamed to Cloudinary using `upload_stream`. The server stores the Cloudinary URL, public ID, original filename, MIME type, and file size in the `attachments` table.

**Supported file types:** JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT, ZIP

**Limit:** 10 MB per filea

Deletion removes the file from both Cloudinary and the database. Project owners can delete any attachment; regular members can only delete files they uploaded themselves.

> **Note:** Cloudinary's free tier includes approximately 1 GB storage and 1 GB bandwidth per month. For a small team or personal project this is sufficient, but monitor usage as the app grows.