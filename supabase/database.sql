-- ============================================================
-- DIMSUM LUMER — DATABASE SCHEMA
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- PROFILES (customer, terhubung ke auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'customer', 
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- CATEGORIES ----------
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  icon_url text,
  product_count int default 0,
  created_at timestamptz default now()
);

-- ---------- PRODUCTS ----------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(12,2) not null default 0,
  stock int not null default 0,
  image_url text,
  is_active boolean default true,
  sold_count int default 0,
  rating numeric(2,1) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- STORES ----------
create table if not exists stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  phone text,
  open_time time,
  close_time time,
  is_open boolean default true,
  photo_url text,
  created_at timestamptz default now()
);

-- ---------- ADDRESSES (customer) ----------
create table if not exists addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  label text,
  phone text,
  full_address text not null,
  landmark text,
  latitude double precision,
  longitude double precision,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- ---------- ORDERS ----------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_code text unique not null default concat('DL-', to_char(now(), 'YYMMDD'), '-', floor(random()*9000+1000)::text),
  user_id uuid references profiles(id) on delete set null,
  store_id uuid references stores(id) on delete set null,
  address_id uuid references addresses(id) on delete set null,
  status text not null default 'pending', -- pending | processing | shipping | completed | cancelled
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  shipping_fee numeric(12,2) default 0,
  total numeric(12,2) default 0,
  payment_method text,
  delivery_address text,
  delivery_latitude double precision,
  delivery_longitude double precision,
  location_accuracy double precision,
  location_updated_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- ORDER DETAIL ----------
create table if not exists order_detail (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price numeric(12,2) not null,
  qty int not null default 1,
  subtotal numeric(12,2) not null
);

-- ---------- MEMBER POINT ----------
create table if not exists member_point (
  user_id uuid primary key references profiles(id) on delete cascade,
  total_point int default 0,
  updated_at timestamptz default now()
);

create table if not exists point_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  type text not null, -- earn | redeem
  amount int not null,
  description text,
  created_at timestamptz default now()
);

-- ---------- REWARD ----------
create table if not exists reward (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  point_cost int not null,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------- WISHLIST ----------
create table if not exists wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

-- ---------- REVIEWS ----------
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  customer_name text,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- ---------- PROMOS ----------
create table if not exists promos (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  code text unique,
  discount_type text default 'percentage', 
  discount_value numeric(12,2) default 0,
  banner_url text,
  is_active boolean default true,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- ---------- NOTIFICATIONS ----------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ---------- ACTIVITY LOGS (admin) ----------
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references profiles(id) on delete set null,
  action text not null,
  detail text,
  created_at timestamptz default now()
);

-- ---------- MAINTENANCE ----------
create table if not exists maintenance (
  id uuid primary key default uuid_generate_v4(),
  target text unique not null,
  is_active boolean default false,
  message text,
  updated_at timestamptz default now()
);

-- ---------- APK VERSIONS ----------
create table if not exists apk_versions (
  id uuid primary key default uuid_generate_v4(),
  version text not null,
  file_url text not null,
  release_notes text,
  created_at timestamptz default now()
);

-- ---------- STORE SETTINGS ----------
create table if not exists store_settings (
  id uuid primary key default uuid_generate_v4(),
  store_name text default 'Dimsum Lumer',
  contact_email text,
  contact_phone text,
  updated_at timestamptz default now()
);
