-- PANELISTS TABLE
-- Stores panelists added by the moderator per session/room
create table if not exists panelists (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  name text not null,
  title text, -- e.g. "Pastor", "Elder", "Dr."
  created_at timestamptz default now()
);

-- QUESTION ASSIGNMENTS TABLE
-- Tracks which question is assigned to which panelist, and the queue order
create table if not exists question_assignments (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade not null unique,
  panelist_id uuid references panelists(id) on delete cascade not null,
  room_id uuid references rooms(id) on delete cascade not null,
  status text default 'queued' check (status in ('queued', 'active', 'done')),
  queue_position integer default 0,
  assigned_at timestamptz default now()
);

-- Enable realtime on both tables
alter publication supabase_realtime add table panelists;
alter publication supabase_realtime add table question_assignments;

-- RLS Policies (adjust to your existing auth setup)
alter table panelists enable row level security;
alter table question_assignments enable row level security;

-- Allow all reads (panelist display is public within a session)
create policy "Allow read panelists" on panelists for select using (true);
create policy "Allow read assignments" on question_assignments for select using (true);

-- Allow leaders/mods to insert/update/delete
create policy "Allow leader insert panelists" on panelists for insert with check (true);
create policy "Allow leader update panelists" on panelists for update using (true);
create policy "Allow leader delete panelists" on panelists for delete using (true);

create policy "Allow leader insert assignments" on question_assignments for insert with check (true);
create policy "Allow leader update assignments" on question_assignments for update using (true);
create policy "Allow leader delete assignments" on question_assignments for delete using (true);
