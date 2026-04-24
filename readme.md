# TaskManagerPro

A full-stack project and task management application built with Next.js and Node.js. Supports real-time notifications, file attachments, team collaboration, and project announcements.

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
- Forgot password flow via email 
- Secure password reset with expiring tokens

---

### Techstack
- Next.js
- Express.js 18+
- PostgreSQL 14+
- Cloudinary account

- Frontend hoste on Vercel
- DB hosted on Neon
- Backend hosted on Render

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