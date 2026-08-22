# Naveen Workspace — Supabase backend build

## Connected project
- Supabase project: `naveenshukla1817's Project`
- Project URL: `https://yjpbnqpyhznpqusvqhsh.supabase.co`
- Frontend key: Supabase **publishable** key (safe for browser use when RLS is enabled)

## Backend already provisioned
- `public.workspace_state` PostgreSQL table
- Per-user RLS policies for SELECT/INSERT/UPDATE/DELETE
- `updated_at` trigger
- Realtime enabled for `workspace_state`
- Private `workspace-files` Storage bucket created

## Frontend
The single `index.html` includes the Supabase JS client and cloud-sync/auth layer.
It keeps localStorage as a local cache/fallback and syncs workspace state to Supabase after authentication.

## Auth
Email/password is wired in the UI. Google OAuth is wired too, but Google provider must be enabled in Supabase Auth and its OAuth credentials configured in the Supabase dashboard.

## Important
The Storage bucket exists, but browser upload/download policies could not be safely changed through the connected management interface because the `storage.objects` table is managed by Supabase. Configure Storage policies in the Supabase dashboard before using Storage uploads. Current proof images continue to be stored in the workspace JSON state, preserving functionality without exposing Storage.
