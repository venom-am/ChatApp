-- Supabase SQL Setup Script
-- Paste this entire script into your Supabase SQL Editor (under SQL Editor tab)
-- Then click "Run" to create all required tables

-- ============================================
-- 1. Create profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_pic TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_id_key UNIQUE (id)
);

-- ============================================
-- 2. Create messages table  
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create RLS Policies for profiles
-- ============================================
-- Allow users to see their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to see other profiles (for sidebar)
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow new profiles to be inserted (during signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- ============================================
-- 5. Create RLS Policies for messages
-- ============================================
-- Users can only see their own sent/received messages
CREATE POLICY "Users can view own messages"
ON public.messages FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Users can insert messages they send
CREATE POLICY "Users can insert messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- 6. Create indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_id 
ON public.messages(receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON public.messages(created_at);

-- ============================================
-- Done! Your tables are now ready to use
-- ============================================
-- Test by:
-- 1. Going to frontend and signing up
-- 2. Check Auth > Users in Supabase dashboard
-- 3. Check Table Editor - profiles/messages should have data
