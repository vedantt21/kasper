-- Create gender and preference enums
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE public.user_status AS ENUM ('in_pool', 'in_connection', 'waitlisted', 'chatting');
CREATE TYPE public.connection_status AS ENUM ('pending', 'chatting', 'ended');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  gender gender_type NOT NULL,
  preference gender_type NOT NULL,
  intro_text TEXT NOT NULL CHECK (char_length(intro_text) <= 200),
  photo_url TEXT NOT NULL,
  status user_status NOT NULL DEFAULT 'in_pool',
  active_connection_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mutual_like BOOLEAN NOT NULL DEFAULT FALSE,
  a_confirm BOOLEAN DEFAULT NULL,
  b_confirm BOOLEAN DEFAULT NULL,
  status connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_users CHECK (user_a_id != user_b_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 2000),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create likes table to track who liked whom
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(liker_id, liked_id),
  CONSTRAINT different_users CHECK (liker_id != liked_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view profiles in the pool"
  ON public.profiles FOR SELECT
  USING (
    status = 'in_pool' 
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Connections RLS policies
CREATE POLICY "Users can view their own connections"
  ON public.connections FOR SELECT
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "Users can update their own connections"
  ON public.connections FOR UPDATE
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "System can insert connections"
  ON public.connections FOR INSERT
  WITH CHECK (true);

-- Messages RLS policies
CREATE POLICY "Users can view messages in their connections"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE id = connection_id
      AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their connections"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE id = connection_id
      AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
      AND status = 'chatting'
    )
  );

-- Likes RLS policies
CREATE POLICY "Users can view their own likes"
  ON public.likes FOR SELECT
  USING (liker_id = auth.uid() OR liked_id = auth.uid());

CREATE POLICY "Users can create likes"
  ON public.likes FOR INSERT
  WITH CHECK (liker_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_connections
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to get pool ratio
CREATE OR REPLACE FUNCTION public.get_pool_ratio()
RETURNS JSON AS $$
DECLARE
  male_count INT;
  female_count INT;
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO male_count 
  FROM public.profiles 
  WHERE gender = 'male' AND status = 'in_pool';
  
  SELECT COUNT(*) INTO female_count 
  FROM public.profiles 
  WHERE gender = 'female' AND status = 'in_pool';
  
  total_count := male_count + female_count;
  
  RETURN json_build_object(
    'male_count', male_count,
    'female_count', female_count,
    'total_count', total_count,
    'ratio', CASE WHEN female_count > 0 THEN male_count::FLOAT / female_count::FLOAT ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;