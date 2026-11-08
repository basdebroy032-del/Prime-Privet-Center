
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rgadahkiofvrnemjevek.supabase.co'

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYWRhaGtpb2Z2cm5lbWpldmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNDU5MTUsImV4cCI6MjEwOTcyMTkxNX0.1TENiX73bKGYdrtoAaYTBJ9LpkSSQ6IGn-62SJd6IC8'

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)
