import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TransactionType = 'purchase' | 'sale';

export interface Bike {
  id: string;
  name: string;
  brand: string;
  category: string;
  engine_cc: number;
  power_hp: number;
  top_speed_kmh: number;
  weight_kg: number;
  color: string;
  price: number;
  stock: number;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  bike_id: string | null;
  bike_name_snapshot: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  color: string | null;
  notes: string | null;
  created_at: string;
}

export interface NewTransaction {
  type: TransactionType;
  bike_id: string;
  bike_name_snapshot: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  color: string;
  notes?: string | null;
}
