import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables!');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file');
    process.exit(1);
}

// 使用 Service Role Key 绕过 RLS，后端可执行所有操作
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
