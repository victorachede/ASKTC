# ⚖️ AskTC: Command Center Briefing System

**AskTC** is a high-octane, real-time intelligence suite built for live event Q&A and long-term knowledge archiving. It moves beyond standard "chat" tools to provide a professional, military-grade interface for speakers and audiences.

---

## 🚀 The Modules

### 📱 Student Feed (`/`)
* **Minimalist Submission:** Low-friction interface for rapid-fire intelligence gathering.
* **Anonymous Entry:** Instant access without the barrier of account creation (Speed is priority).
* **Live Status:** Real-time updates on question status.

### 🎮 Leader Dashboard (`/leader`)
* **Control Center:** The "God-view" for moderators to approve, answer, or archive questions.
* **One-Click Cleanup:** Archive entire sessions instantly to refresh the live feed.
* **Realtime Sync:** No refreshing required; questions flow in as they are asked.

### 🎥 Projector Mode (`/projector`)
* **High-Visibility UI:** Designed for massive displays in large halls.
* **Celebration Engine:** Integrated **Canvas-Confetti** triggers automatically when a question is marked "Answered."
* **HUD Display:** Live queue counters and scrolling branding.

### 🏛️ Intel Vault (`/archives`)
* **Historical Data:** Every answered question is automatically indexed here.
* **Search Optimization:** Instant client-side filtering to find specific briefing notes.

---

## 🛠️ The Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Server-side rendering & high-speed routing |
| **Database** | PostgreSQL (via Supabase) | Relational data storage |
| **Realtime** | Supabase Broadcast | WebSocket-based instant UI updates |
| **Styling** | Tailwind CSS | War Room / HUD aesthetic |
| **Animations** | Framer Motion | Smooth state transitions & UI "Pop" |
| **VFX** | Canvas-Confetti | Engagement rewards for the audience |

---

## 🛰️ Database Schema (PostgreSQL)

Run this in your Supabase SQL Editor to initialize the system:

```sql
create table questions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  guest_name text default 'Anonymous',
  guest_emoji text default '👤',
  status text default 'pending', -- pending, answered, archived
  user_id uuid references auth.users(id) -- for future 24/7 auth feature
);

-- Enable Realtime for this table
alter publication supabase_realtime add table questions;