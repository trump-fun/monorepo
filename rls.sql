-- Enable RLS on all tables
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trump_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.truth_social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;

-- Comments table policies for public users
CREATE POLICY "Allow public to read comments" 
ON public.comments FOR SELECT 
USING (true);

-- Facts table policies for public users
CREATE POLICY "Allow public to read facts" 
ON public.facts FOR SELECT 
USING (true);

-- Truth social posts table policies for public users
CREATE POLICY "Allow public to read truth_social_posts" 
ON public.truth_social_posts FOR SELECT 
USING (true);




-- Create the admin role
CREATE ROLE trump_fun_admin WITH LOGIN PASSWORD 'strong-password-here';

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO trump_fun_admin;

-- Grant all privileges on all tables to admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trump_fun_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trump_fun_admin;

-- Ensure the admin can connect to the database
ALTER ROLE trump_fun_admin WITH LOGIN;



-- Create RLS policies for admin on all tables
CREATE POLICY "Admin full access to comments" 
ON public.comments FOR ALL 
TO trump_fun_admin 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admin full access to facts" 
ON public.facts FOR ALL 
TO trump_fun_admin 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admin full access to trump_users" 
ON public.trump_users FOR ALL 
TO trump_fun_admin 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admin full access to truth_social_posts" 
ON public.truth_social_posts FOR ALL 
TO trump_fun_admin 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admin full access to wallets" 
ON public.wallets FOR ALL 
TO trump_fun_admin 
USING (true) 
WITH CHECK (true);




// For Node.js backend environment only
import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

)

// Method 2: Direct Postgres connection for admin operations
const pgPool = new Pool({
  host: 'db.your-project-url.supabase.co',
  user: 'trump_fun_admin',
  password: 'strong-password-here',
  database: 'postgres',
  port: 5432,
  ssl: true
})

async function adminQuery(sql, params = []) {
  const client = await pgPool.connect()
  try {
    return await client.query(sql, params)
  } finally {
    client.release()
  }
}

// Example admin operation
async function getAllUsers() {
  return await adminQuery('SELECT * FROM trump_users')
}