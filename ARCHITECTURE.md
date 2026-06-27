# Zenth Architecture & Data Flow

## The Big Picture
Browser (You) ↕ Next.js (Your App) ↕ Supabase (Database + Auth)

## Auth Flow
/auth page
→ You type email + password
→ createClient() connects to Supabase
→ supabase.auth.signUp() or signInWithPassword()
→ Supabase creates a SESSION and stores it in a COOKIE
→ middleware.ts runs on every page request
    → reads that cookie
    → if session exists → let through
    → if no session → redirect to /auth
    → if session + on /auth → redirect to /dashboard

The cookie is what keeps you logged in. Supabase handles it automatically.

## Data Flow — Starting a Workout
/dashboard/workouts
→ Click '+ New Workout'
→ Modal opens (local React state — nothing hits DB yet)
→ You type a name, click 'Blank Workout'
→ startWorkout() runs
    → supabase.auth.getUser() — gets YOUR user id
    → supabase.from('workouts').insert({ user_id, name })
    → Supabase creates a row, returns the new workout ID
→ router.push('/dashboard/workouts/active?id=ABC123')
    → the ID travels in the URL as a query parameter

## Data Flow — Active Workout
→ useSearchParams() reads id from URL
→ Sets only hit DB when you finish
→ During workout everything lives in React state (memory)

## How Tables Relate
auth.users → workouts → workout_exercises ↔ exercises → sets

## State vs Database
React state: UI interactions, form inputs, mid-workout sets
Supabase DB: Anything that needs to persist after refresh
URL: IDs passed between pages
Cookie: Your login session
