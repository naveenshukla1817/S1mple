# Newla — Your Space. Your Workflow.

Newla is a small personal workspace for keeping life and work in one place without turning productivity into a second job.

Tasks, ideas, notes, proofs, focus sessions, reminders, calendar views — everything lives together, so you can open Newla and just get on with what you were doing.

**Live:** https://newshukla.vercel.app/

---

## What is Newla?

Newla is built around a simple idea:

> **Do the work. Keep the proof. Keep moving.**

It is not trying to be the next giant project-management platform.

It is a personal workspace where you can:

* create and manage tasks
* work with priorities, deadlines and recurring tasks
* attach or keep proof for completed work
* capture ideas on a visual brainstorming board
* turn brain notes into tasks
* keep notes and knowledge in one place
* use calendar views for upcoming work
* run focused work sessions
* track focus history and progress
* switch between light and dark themes
* keep useful preferences between sessions
* use the app with a local cache while Supabase handles cloud persistence

The goal is simple: **less hunting through apps, more actual work.**

---

## The main parts

### Dashboard

The dashboard is the starting point.

It gives you a quick look at your workspace, your current workload, upcoming items and progress without forcing you to open five different screens.

There is also a little personality in there. Newla is supposed to feel like your own workspace, not like an accounting dashboard.

### Tasks

Tasks are the core of Newla.

You can create tasks with things like:

* priority
* status
* due dates
* reminders
* recurring behavior
* descriptions
* subtasks
* project/category information

Newla also supports a proof-first workflow, so completing a task does not have to mean simply clicking a checkbox and forgetting about it.

For smaller tasks, a quick-complete option is available when enabled.

### Proofs

Proofs are one of the things that make Newla different from a basic todo app.

The idea is simple:

**“I said I would do it” → “I actually did it” → “Here is the proof.”**

Proofs can be associated with work and viewed later instead of disappearing into an old chat, downloads folder or random screenshot pile.

### Brainstorming

The Brainstorming area is for messy thinking.

You can create visual notes, move things around, work with boards, use colors, draw on the canvas and turn a brain note into an actual task when an idea becomes something worth doing.

It is intentionally more visual than the task list.

You can also save board state and restore earlier snapshots.

### Calendar

Newla includes calendar views for planning work around actual dates.

You can move between month, week and day-style views, see tasks attached to dates, and get a clearer picture of what is coming next.

There is also an option to create a Google Calendar event from scheduled work.

### Knowledge / Notes

Knowledge is the quieter part of Newla.

This is where ideas, notes and things you want to remember can live without turning everything into a task.

Notes support titles, content and categorization, and the editor includes autosave behavior so you do not have to think about saving every few seconds.

### Focus

Focus is there for when planning needs to stop and actual work needs to start.

You can run focus sessions, pause and reset the timer, start focus around a task, and keep a history of completed sessions.

Newla also keeps focus statistics such as total and weekly focus time.

### Settings

Settings are for the small things that make the workspace feel like yours.

That includes theme controls, preferences, notification-related options and other workspace behavior.

The app supports both light and dark presentation, with the UI designed around the same overall Newla visual language.

---

## How the data works

Newla uses a local-first approach.

Your browser keeps a local cache so the workspace can stay responsive and useful even when the network is having a bad day.

When you are authenticated, Newla syncs the relevant workspace data to Supabase.

In simple terms:

```text
You
 ↓
Newla UI
 ↓
local cache
 ↓
Supabase sync
 ↓
your account data
```

The cloud sync layer also uses a queue and retry behavior so rapid changes are less likely to be lost while another sync is already in progress.

---

## Supabase backend

Newla uses Supabase for authentication, database persistence and file storage.

The current backend is organized around the real application features rather than one giant blob of workspace state.

The main data areas include:

* `profiles`
* `tasks`
* `projects`
* `proofs`
* `notes`
* `brainstorms`
* `focus_sessions`
* `settings`

Each user-owned table is protected with Row Level Security so users only get access to their own records.

The app also uses a private storage bucket for user files.

### Security model

The browser uses a Supabase publishable client key.

That key is meant to be public in a browser application. The important protection comes from authentication and database/storage policies, especially RLS.

Newla does **not** put a Supabase secret/service-role key in the frontend.

---

## Authentication

Newla supports email/password authentication.

Google sign-in is also wired into the frontend, but the Google provider still needs to be enabled and configured in the Supabase Auth dashboard with the appropriate OAuth credentials before it can be used in production.

After authentication, the app uses the signed-in user's identity when reading and writing personal workspace data.

---

## Storage and proofs

The storage bucket is private.

Proof files are associated with the current user instead of being treated like public assets.

The frontend also keeps enough proof information in the application state to preserve the core workflow, so the proof feature does not depend on making private files publicly accessible.

---

## Project structure

Newla is intentionally kept simple.

```text
S1mple/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── newla.css
    └── js/
        └── newla.js
```

The application is not currently split into a large framework with dozens of packages and folders.

That is deliberate.

The goal is to keep the project easy to deploy, easy to inspect and easy to move around while still keeping the HTML, CSS and JavaScript separated enough to stay maintainable.

---

## Tech stack

Newla is a lightweight web application built with:

* HTML
* CSS
* JavaScript
* Supabase Auth
* Supabase PostgreSQL
* Supabase Storage
* Vercel for deployment

The frontend uses pinned CDN versions for its external browser libraries instead of floating `@latest` dependencies.

---

## A few details that are easy to miss

Newla does a lot of little things behind the scenes:

* keeps sidebar and workspace preferences locally
* remembers the selected brainstorm board
* supports command-palette style navigation
* keeps focus history
* supports browser reminder notifications
* renders calendar data from task scheduling information
* supports proof image compression before storage-related work
* escapes user-entered text before rendering it back into the UI
* keeps the cloud sync process separate from the visual UI so the interface does not have to wait on every network request

None of these are meant to be flashy.

They are just there so the workspace feels less fragile.

---

## Production notes

Before making changes to the production build, it is worth remembering that Newla currently has two important layers:

1. **The frontend**
2. **The Supabase backend**

Changing one without checking the other can create subtle bugs.

For example, changing task fields in the UI without updating the matching Supabase mapping can make something appear to work locally while failing to sync correctly.

For production work, test the important path:

```text
sign in
  ↓
create task
  ↓
edit task
  ↓
complete task
  ↓
attach/check proof
  ↓
refresh
  ↓
sign out / sign in
  ↓
verify the data is still there
```

The same idea applies to notes, brainstorm boards and focus sessions.

---

## Current production checklist

Before calling a future release completely finished, check:

* authentication
* task creation/edit/delete
* task completion and proof flow
* notes and autosave
* brainstorming save/restore
* proof upload/view/delete
* calendar rendering
* focus session history
* theme persistence
* refresh persistence
* logout/login persistence
* mobile layout
* browser console errors
* Supabase Auth security settings
* Supabase Storage policies
* Vercel deployment status

---

## Why Newla exists

This project started because opening ten different tools just to remember what you were supposed to do is its own kind of work.

So Newla tries to keep the useful parts together.

Nothing more complicated than that.

**Your space. Your workflow. Keep building.**
