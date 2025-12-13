
-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create tables
-- CLIENTS
create table clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid default auth.uid(), -- Multi-tenant isolation
  name text not null,
  phone text,
  address text,
  complement text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  pets jsonb default '[]'::jsonb -- Storing pets as JSON for simplicity, matching Client type
);

-- SERVICES
create table services (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid default auth.uid(),
  name text not null,
  price numeric not null,
  duration_min integer default 30,
  description text,
  category text check (category in ('principal', 'adicional')),
  target_size text default 'Todos',
  target_coat text default 'Todos'
);

-- APPOINTMENTS
create table appointments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid default auth.uid(),
  client_id uuid references clients(id) on delete cascade,
  pet_id text, -- ID inside the JSON array of the client
  service_id uuid references services(id) on delete set null,
  additional_service_ids text[], -- Array of UUIDs
  date timestamp with time zone not null,
  status text check (status in ('agendado', 'concluido', 'cancelado', 'nao_veio')),
  notes text,
  duration_total integer,
  paid_amount numeric,
  payment_method text,
  rating integer,
  rating_tags text[]
);

-- COSTS
create table costs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid default auth.uid(),
  date timestamp with time zone default timezone('utc'::text, now()),
  category text,
  amount numeric,
  status text,
  month text,
  week text
);

-- 3. Enable Row Level Security (RLS)
alter table clients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table costs enable row level security;

-- 4. Create Policies
-- Clients
create policy "Users can view their own clients" on clients for select using (auth.uid() = user_id);
create policy "Users can insert their own clients" on clients for insert with check (auth.uid() = user_id);
create policy "Users can update their own clients" on clients for update using (auth.uid() = user_id);
create policy "Users can delete their own clients" on clients for delete using (auth.uid() = user_id);

-- Services
create policy "Users can view their own services" on services for select using (auth.uid() = user_id);
create policy "Users can insert their own services" on services for insert with check (auth.uid() = user_id);
create policy "Users can update their own services" on services for update using (auth.uid() = user_id);
create policy "Users can delete their own services" on services for delete using (auth.uid() = user_id);

-- Appointments
create policy "Users can view their own appointments" on appointments for select using (auth.uid() = user_id);
create policy "Users can insert their own appointments" on appointments for insert with check (auth.uid() = user_id);
create policy "Users can update their own appointments" on appointments for update using (auth.uid() = user_id);
create policy "Users can delete their own appointments" on appointments for delete using (auth.uid() = user_id);

-- Costs
create policy "Users can view their own costs" on costs for select using (auth.uid() = user_id);
create policy "Users can insert their own costs" on costs for insert with check (auth.uid() = user_id);
create policy "Users can update their own costs" on costs for update using (auth.uid() = user_id);
create policy "Users can delete their own costs" on costs for delete using (auth.uid() = user_id);
