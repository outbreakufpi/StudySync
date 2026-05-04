import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const SUPABASE_URL = 'https://qgkfdyqrytqvtsfnrdms.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFna2ZkeXFyeXRxdnRzZm5yZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTI4MTcsImV4cCI6MjA5MzA2ODgxN30.dsp5ofHP_MW7q1_k_TypdT98BjB8GRTgz3vOV8j5Hw4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);