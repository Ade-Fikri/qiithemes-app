import { createClient } from '@supabase/supabase-js';

// Mengambil variabel URL dan KEY yang sudah kita daftarkan di file .env tadi
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validasi kecil untuk memastikan env terisi dan gak bikin aplikasi crash diem-diem
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Waduh Lee! URL atau Anon Key Supabase belum diisi di file .env nya.");
}

// Inisialisasi client Supabase tunggal (Singleton)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
