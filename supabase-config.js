// Supabase Configuration
const SUPABASE_URL = 'https://rpassssxkjzzwqhsyhlb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwYXNzc3N4a2p6endxaHN5aGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mjk0NzIsImV4cCI6MjA4NjEwNTQ3Mn0.4ZOkR2M5-pBCIIoyfPy_T6Hic67UkR0ADBUguc1fqaU';

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
