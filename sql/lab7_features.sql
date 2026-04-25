-- Lab 7 features: profile update, likes, storage upload, full-text search

-- 1) Ensure profiles can be updated by the owner
alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can view all profiles'
  ) then
    create policy "Users can view all profiles"
      on public.profiles
      for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end;
$$;

-- 2) Likes table + RLS
create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'likes'
      and policyname = 'Anyone can view likes'
  ) then
    create policy "Anyone can view likes"
      on public.likes
      for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'likes'
      and policyname = 'Authenticated users can like'
  ) then
    create policy "Authenticated users can like"
      on public.likes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'likes'
      and policyname = 'Users can unlike own likes'
  ) then
    create policy "Users can unlike own likes"
      on public.likes
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end;
$$;

create index if not exists likes_post_id_idx on public.likes(post_id);
create index if not exists likes_user_id_idx on public.likes(user_id);

-- 3) Storage bucket for post images + policies
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read post images'
  ) then
    create policy "Public can read post images"
      on storage.objects
      for select
      using (bucket_id = 'post-images');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload own post images'
  ) then
    create policy "Users can upload own post images"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update own post images'
  ) then
    create policy "Users can update own post images"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'post-images'
        and owner = auth.uid()
      )
      with check (
        bucket_id = 'post-images'
        and owner = auth.uid()
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete own post images'
  ) then
    create policy "Users can delete own post images"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'post-images'
        and owner = auth.uid()
      );
  end if;
end;
$$;

-- 4) Full-text search support
alter table public.posts
add column if not exists search_vector tsvector
generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A')
  || setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B')
  || setweight(to_tsvector('simple', coalesce(content, '')), 'C')
) stored;

create index if not exists posts_search_vector_idx
on public.posts
using gin(search_vector);

create or replace function public.search_posts(query_text text)
returns table (
  id uuid,
  slug text,
  title text,
  excerpt text,
  published_at timestamptz,
  author_display_name text,
  rank real,
  highlighted_title text,
  highlighted_excerpt text
)
language sql
stable
as $$
  select
    p.id,
    p.slug,
    p.title,
    p.excerpt,
    p.published_at,
    pr.display_name as author_display_name,
    ts_rank(p.search_vector, plainto_tsquery('simple', query_text)) as rank,
    ts_headline(
      'simple',
      p.title,
      plainto_tsquery('simple', query_text),
      'StartSel=[[[, StopSel=]]], MaxWords=12, MinWords=3, ShortWord=2'
    ) as highlighted_title,
    ts_headline(
      'simple',
      coalesce(p.excerpt, left(coalesce(p.content, ''), 220)),
      plainto_tsquery('simple', query_text),
      'StartSel=[[[, StopSel=]]], MaxWords=25, MinWords=8, ShortWord=2'
    ) as highlighted_excerpt
  from public.posts p
  left join public.profiles pr on pr.id = p.author_id
  where p.status = 'published'
    and p.search_vector @@ plainto_tsquery('simple', query_text)
  order by rank desc, p.published_at desc;
$$;

grant execute on function public.search_posts(text) to anon, authenticated;
