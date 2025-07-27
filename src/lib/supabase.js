import {createClient} from '@supabase/supabase-js' 

const SUPABASE_URL='https://brqqgvvaofimdlrfliba.supabase.co' 
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycXFndnZhb2ZpbWRscmZsaWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjU4NjUsImV4cCI6MjA2ODk0MTg2NX0.UZ5BShtVt0wVJ-H_L1iJhUmjlbSiRgSKSWm2gpgaR1Y' 

// Erstelle den Supabase Client für die echte Authentifizierung 
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export default supabase