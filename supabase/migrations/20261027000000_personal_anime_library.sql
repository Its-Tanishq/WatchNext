-- ==============================================================================
-- PERSONAL ANIME LIBRARY SCHEMA
-- Project: WatchNext
-- Features: Watching, Completed, Plan to Watch, On Hold, Dropped, Favourites,
--           Custom Lists, Episodes Watched, Rewatch Counter, Ratings & Notes
-- ==============================================================================

-- 1. CLEANUP (Optional reset: safe to run if you want a clean start)
-- DROP TABLE IF EXISTS public.user_anime_library CASCADE;
-- DROP TABLE IF EXISTS public.user_custom_lists CASCADE;

-- 2. CREATE TABLE: user_anime_library
CREATE TABLE IF NOT EXISTS public.user_anime_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anime_id INTEGER NOT NULL,
    anime_title TEXT NOT NULL,
    anime_title_romaji TEXT,
    anime_title_english TEXT,
    anime_title_native TEXT,
    anime_cover TEXT,
    anime_banner TEXT,
    anime_format TEXT,
    anime_genres TEXT[] DEFAULT '{}'::TEXT[],
    anime_total_episodes INTEGER,
    anime_season TEXT,
    anime_season_year INTEGER,
    anime_average_score NUMERIC,
    status TEXT NOT NULL DEFAULT 'PLANNING' CHECK (status IN ('CURRENT', 'COMPLETED', 'PLANNING', 'PAUSED', 'DROPPED')),
    is_favourite BOOLEAN NOT NULL DEFAULT FALSE,
    episodes_watched INTEGER NOT NULL DEFAULT 0 CHECK (episodes_watched >= 0),
    rewatch_counter INTEGER NOT NULL DEFAULT 0 CHECK (rewatch_counter >= 0),
    user_score NUMERIC(4, 1) DEFAULT NULL CHECK (user_score IS NULL OR (user_score >= 0 AND user_score <= 10)),
    user_notes TEXT DEFAULT '',
    custom_lists TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_anime_library_user_anime_unique UNIQUE (user_id, anime_id)
);

-- 3. CREATE TABLE: user_custom_lists
CREATE TABLE IF NOT EXISTS public.user_custom_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#ff5238',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_custom_lists_user_name_unique UNIQUE (user_id, name)
);

-- 4. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_anime_library_updated ON public.user_anime_library;
CREATE TRIGGER on_user_anime_library_updated
    BEFORE UPDATE ON public.user_anime_library
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_user_anime_library_user_status ON public.user_anime_library (user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_anime_library_user_favourite ON public.user_anime_library (user_id, is_favourite);
CREATE INDEX IF NOT EXISTS idx_user_anime_library_user_updated ON public.user_anime_library (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_anime_library_custom_lists ON public.user_anime_library USING GIN (custom_lists);
CREATE INDEX IF NOT EXISTS idx_user_custom_lists_user_id ON public.user_custom_lists (user_id);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_anime_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_lists ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.user_anime_library TO authenticated;
GRANT ALL ON public.user_custom_lists TO authenticated;

-- Policies for user_anime_library
DROP POLICY IF EXISTS "Users can view own anime library" ON public.user_anime_library;
CREATE POLICY "Users can view own anime library" ON public.user_anime_library
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert into own anime library" ON public.user_anime_library;
CREATE POLICY "Users can insert into own anime library" ON public.user_anime_library
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own anime library" ON public.user_anime_library;
CREATE POLICY "Users can update own anime library" ON public.user_anime_library
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete from own anime library" ON public.user_anime_library;
CREATE POLICY "Users can delete from own anime library" ON public.user_anime_library
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- Policies for user_custom_lists
DROP POLICY IF EXISTS "Users can view own custom lists" ON public.user_custom_lists;
CREATE POLICY "Users can view own custom lists" ON public.user_custom_lists
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own custom lists" ON public.user_custom_lists;
CREATE POLICY "Users can insert own custom lists" ON public.user_custom_lists
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own custom lists" ON public.user_custom_lists;
CREATE POLICY "Users can update own custom lists" ON public.user_custom_lists
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own custom lists" ON public.user_custom_lists;
CREATE POLICY "Users can delete own custom lists" ON public.user_custom_lists
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);
