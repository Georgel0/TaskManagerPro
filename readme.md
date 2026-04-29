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