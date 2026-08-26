# Newla — Your Space. Your Workflow.

## Most things worth doing leave a trace.

You make a painting — you take a photo.  
You build something — you take a photo.  
You finish something you're proud of — you keep the result.

There is a reason we do this.

Finishing something feels good.  
And when you make something that matters to you, you usually want to remember it.

So we started asking a simple question:

> **Why do our tasks end with a checkbox?**

A checkbox can say a task is done.

It cannot show that the work happened.

## Newla turns completion into evidence.

Plan the work.  
Do the work.  
Keep the proof.

---

## What is Newla?

Newla is a personal workspace for the things you actually want to get done.

Tasks, ideas, notes, proofs, focus sessions, calendar planning and everyday organization live together in one place — without turning productivity into another thing you have to manage.

You open Newla, see what matters, do the work, and keep moving.

### The idea is simple:

> **Plan it. Make it. Prove it. Keep moving.**

---

## The idea behind Proof

Proof is not just an attachment on a task.

It is the record of the work.

Maybe your task was:

- Paint a sketch
- Build a model car
- Finish a design
- Clean and organize a space
- Complete a physical project
- Solve something you had been putting off

You do the work.

Then, when you're finished, you capture the result — usually with a photo, screenshot or whatever makes sense for that task.

That becomes the proof.

Not because you need to prove yourself to Newla.

Because sometimes it feels good to look back and see:

**I actually did that.**

### So instead of:

```text
Task → Checkbox → Done
Newla is built around:
Task → Work → Proof → Completed

A checkbox says you finished. A proof shows that you did.

Why Newla?

Most productivity tools are very good at telling you what to do next.

Newla also cares about what happens after you do it.

The task should not just disappear because you checked a box.

The work should leave something behind.

A result.
A memory.
A piece of proof.

Something you can come back to later and say:

I did that.

What you can do in Newla
Tasks

Create tasks, set priorities, add due dates and reminders, manage recurring work, use subtasks, track progress and keep important details close to the work.

When the work is actually done, you can attach proof and keep the result with the task.

Proofs

Keep evidence of completed work in one place instead of letting it disappear into your camera roll, downloads folder or an old chat.

Proof files are stored privately and tied to your workspace.

Brainstorming

Ideas are rarely neat when they first appear.

The brainstorming board gives you a place to put things down, move them around, connect them and turn useful ideas into actual work.

Focus

Sometimes planning is enough.

Sometimes you just need to sit down and do the thing.

Newla includes focus sessions to help you stay with the next useful task and keep a history of the time you actually spent working.

Calendar

See your work around real dates.

Upcoming tasks, reminders and scheduled work stay visible so you know what is coming without having to keep everything in your head.

Knowledge & Notes

Keep useful information, notes and things you want to remember close to the rest of your workspace.

Not everything needs to become a task.

Some things are just worth keeping.

Settings & Preferences

Choose how Newla looks and behaves, including warm light and dark themes and other workspace preferences.

Built to stay useful

Newla uses a local-first approach.

Your browser keeps a local copy of important workspace data so the app can stay responsive, while authenticated data is synchronized to Supabase for cloud persistence.

In simple terms:

You
 ↓
Newla
 ↓
Local workspace
 ↓
Cloud sync
 ↓
Your account

If the network has a bad moment, Newla is designed to keep working locally and retry cloud synchronization when possible.

The goal is simple:

A temporary internet problem should not make your work feel lost.

Supabase backend

Newla uses Supabase for authentication, cloud persistence and private file storage.

The workspace includes user-owned data for areas such as:

Tasks
Projects
Proofs
Notes
Brainstorms
Focus sessions
Settings

Row Level Security is used so authenticated users can access their own records.

Proof files are kept in a private storage bucket and accessed through signed URLs instead of public file URLs.

Authentication

Newla supports:

Email and password sign-in
Account creation
Google sign-in
Password reset
Persistent sessions

Password recovery is handled through Supabase Auth and returns users to the production Newla app.

Privacy & Security

The frontend uses a Supabase publishable key, which is intended for browser applications.

The important security layer comes from authentication, Row Level Security and private storage policies.

Newla does not put a Supabase service-role or secret key in the browser.

Proof files use user-specific paths and ownership checks so users cannot access another user's private proof files.

Project structure

Newla is intentionally lightweight.

S1mple/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── newla.css
    └── js/
        └── newla.js

HTML, CSS and JavaScript are separated so the project stays easy to inspect, deploy and maintain without adding a large framework just for the sake of it.

Tech stack
HTML
CSS
JavaScript
Supabase Auth
Supabase PostgreSQL
Supabase Storage
Vercel

External browser dependencies are pinned instead of relying on floating @latest versions.

Production mindset

Newla is built around a few simple ideas.

Keep the work close.

Tasks, ideas, notes, focus and proof belong in one workspace.

Make completion meaningful.

When evidence makes sense, keep it with the task.

Fail gracefully.

A temporary network problem should not make the workspace feel broken.

Keep the interface quiet.

Newla should help you work, not become another thing competing for your attention.

Why Newla exists

Newla started from a very ordinary human habit.

People make things.

They paint something and take a photo.

They build something and take a photo.

They finish something difficult and save the result.

They post it.
They send it to someone.
They keep it.

Not because someone told them to.

Because finishing something feels good.

And when you can see what you made, the feeling becomes a little more real.

Newla takes that same idea and brings it into everyday work.

Instead of ending with:

“I checked it off.”

You can end with:

“I did it. And here's what I made.”

The philosophy

Do the work.
Keep the proof.
Keep moving.

Because sometimes the best part of finishing something isn't seeing a checkbox turn green.

It's looking at what you made and thinking:

I did that.

Live

https://newshukla.vercel.app/

Newla

Your space.
Your workflow.
Your work.

Plan it. Make it. Prove it. Keep moving.
