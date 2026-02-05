
# 🐛 Bug Tracker / Issue Tracker App

A professional project management tool inspired by Jira and Linear, featuring a dark purple theme with a modern SaaS design.

---

## Design & Theme
- **Dark theme** with rich purple accent colors (Linear-inspired)
- **Full-page gradient background** with subtle purple tones
- **Modern sidebar layout** with responsive design
- Clean typography and smooth animations

---

## Core Features

### 1. User Authentication
- Email/password registration and login
- User profile with avatar and display name
- Protected routes for authenticated users
- Session management and logout

### 2. Project Management
- Create and manage multiple projects
- Project dashboard with overview stats
- Invite team members by email
- Project-specific settings and permissions

### 3. Ticket/Issue System
- Create bug reports and feature requests
- Fields: title, description, priority (Low/Medium/High/Critical), status, assignee
- Due dates and labels/tags
- Screenshot/file attachments support

### 4. Kanban Board
- Drag-and-drop interface for moving tickets
- Three columns: **To Do** → **In Progress** → **Done**
- Visual priority indicators (color-coded)
- Quick edit functionality

### 5. Search & Filters
- Search tickets by keyword
- Filter by status, priority, assignee
- Sort by date, priority, or alphabetically

### 6. Comments & Collaboration
- Threaded comments on each ticket
- @mentions for team members
- Activity history on tickets

---

## Pages Overview

1. **Landing/Auth Page** - Login/Signup forms with purple gradient background
2. **Dashboard** - Overview of all projects and recent activity
3. **Project View** - Kanban board with the selected project's tickets
4. **Ticket Detail** - Full view of a single ticket with comments
5. **Settings** - User profile and project settings

---

## Database Structure
- **Users/Profiles** - User information and avatars
- **Projects** - Project details and team members
- **Tickets** - Issues/bugs with all metadata
- **Comments** - Threaded discussions on tickets
- **User Roles** - Admin/member permissions per project
