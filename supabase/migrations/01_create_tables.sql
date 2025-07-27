-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  street TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Deutschland',
  email TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_plan_id TEXT DEFAULT 'trial',
  subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_end_date TIMESTAMP WITH TIME ZONE
);

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id TEXT DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id TEXT DEFAULT 'employee',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company" 
  ON companies FOR SELECT 
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Administrators can update their own company" 
  ON companies FOR UPDATE 
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role_id = 'administrator'));

-- Users policies
CREATE POLICY "Users can view users in their company" 
  ON users FOR SELECT 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Administrators can insert users" 
  ON users FOR INSERT 
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE company_id = NEW.company_id AND role_id = 'administrator')
    OR auth.uid() IS NULL -- Allow during signup
  );

CREATE POLICY "Administrators can update users in their company" 
  ON users FOR UPDATE 
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role_id = 'administrator')
  );

CREATE POLICY "Administrators can delete users in their company" 
  ON users FOR DELETE 
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role_id = 'administrator')
  );

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (id = auth.uid());

-- Invitations policies
CREATE POLICY "Users can view invitations in their company" 
  ON invitations FOR SELECT 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Administrators can create invitations" 
  ON invitations FOR INSERT 
  WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role_id = 'administrator')
  );

CREATE POLICY "Administrators can delete invitations" 
  ON invitations FOR DELETE 
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role_id = 'administrator')
  );

CREATE POLICY "Anyone can update invitations when accepting" 
  ON invitations FOR UPDATE 
  USING (TRUE);