export type PostStatus = "draft" | "published";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  profiles?: Profile;
}

export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface SearchPostResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  author_display_name: string | null;
  rank: number;
  highlighted_title: string;
  highlighted_excerpt: string;
}
