-- Fix search_path for existing functions
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.get_pool_ratio() SET search_path = public;