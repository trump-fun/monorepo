import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fxewzungnacaxpsnowcu.supabase.co', 'SERVICE_KEY');

const { data, error } = await supabase.auth.signUp({
  email: 'admin@trump.fun',
  password: 'PASSWORD',
});

if (error) {
  console.error('Admin user creation failed:', error);
  process.exit(1);
}

console.log('Admin user created with ID:', data);
