import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://otwoohjgicrebxgsbwpt.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90d29vaGpnaWNyZWJ4Z3Nid3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTMwNzcsImV4cCI6MjA3ODIyOTA3N30.lOEg-1nvMBVAL8BSPXT8QcytzZt1TEU_V9bwcifXGpU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export default supabase;
