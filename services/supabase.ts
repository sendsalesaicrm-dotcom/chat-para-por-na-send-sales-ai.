// Arquivo: services/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Suas chaves (depois coloque em .env para segurança)
const supabaseUrl = ''; 
const supabaseKey = '';

export const supabase = createClient(supabaseUrl, supabaseKey);