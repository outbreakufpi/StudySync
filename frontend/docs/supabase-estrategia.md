# StudySync x Supabase Integration Strategy

## 1. Overview
StudySync will leverage Supabase as its primary backend-as-a-service (BaaS). This provides us with a PostgreSQL database, Authentication, and Realtime capabilities out of the box.

## 2. Database Schema (Draft)

### Public Tables
*   **profiles:** Extends Supabase Auth users with app-specific data.
    *   `id` (uuid, primary key)
    *   `full_name` (text)
    *   `avatar_url` (text)
    *   `current_mode` (enum: 'university', 'competitive')
*   **subjects (University Mode):**
    *   `id` (uuid, primary key)
    *   `user_id` (uuid, foreign key)
    *   `name` (text)
    *   `professor` (text)
    *   `room` (text)
    *   `color` (text)
*   **tasks (University Mode):**
    *   `id` (uuid, primary key)
    *   `subject_id` (uuid, foreign key)
    *   `title` (text)
    *   `due_date` (timestamp)
    *   `type` (enum: 'task', 'exam', 'reminder')
*   **study_sessions (Competitive Mode):**
    *   `id` (uuid, primary key)
    *   `user_id` (uuid, foreign key)
    *   `duration_minutes` (int)
    *   `subject_tag` (text)
    *   `questions_answered` (int)
    *   `date` (timestamp)

## 3. Authentication Flow
*   Users sign up/in using Supabase Auth.
*   The `Login (PT-BR)` screen will connect to `supabase.auth.signInWithPassword()`.

## 4. Real-time Updates
*   Dashboards will subscribe to changes in `tasks` and `study_sessions` to provide instant UI feedback without manual refreshes.