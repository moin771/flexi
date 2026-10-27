/*
# Velocity Motors — Superbikes Dealership Schema

1. Purpose
- Full-stack superbikes dealership: showroom, purchasing, selling, and profit tracking.
- Single-tenant (no auth requested) so the anon-key frontend can read/write.

2. New Tables
- `bikes` — catalog of 30+ superbikes (the showroom / purchase catalog)
  - id (uuid PK), name (text), brand (text), category (text), engine_cc (int),
    power_hp (int), top_speed_kmh (int), weight_kg (int), color (text), price (numeric),
    stock (int default 0), description (text), created_at (timestamptz)
- `transactions` — every purchase or sale the dealership makes
  - id (uuid PK), type ('purchase' | 'sale'), bike_id (uuid FK -> bikes),
    bike_name_snapshot (text), quantity (int), unit_price (numeric),
    total_amount (numeric), color (text), notes (text), created_at (timestamptz)
  - total_amount = quantity * unit_price (computed in app on insert)

3. Security
- Enable RLS on both tables.
- Grant CRUD to anon + authenticated (single-tenant, no sign-in).
- Allow anon + authenticated full CRUD because data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS bikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  engine_cc integer NOT NULL,
  power_hp integer NOT NULL,
  top_speed_kmh integer NOT NULL,
  weight_kg integer NOT NULL,
  color text NOT NULL DEFAULT 'Red',
  price numeric(12,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON bikes TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_bikes" ON bikes;
CREATE POLICY "anon_select_bikes" ON bikes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bikes" ON bikes;
CREATE POLICY "anon_insert_bikes" ON bikes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bikes" ON bikes;
CREATE POLICY "anon_update_bikes" ON bikes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bikes" ON bikes;
CREATE POLICY "anon_delete_bikes" ON bikes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('purchase','sale')),
  bike_id uuid REFERENCES bikes(id) ON DELETE SET NULL,
  bike_name_snapshot text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  color text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);
