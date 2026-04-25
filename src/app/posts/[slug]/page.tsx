import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Comment, Post } from "@/types/database";
import { CommentForm } from "@/components/posts/comment-form";
import { RealtimeComments } from "@/components/posts/realtime-comments";
import { LikeButton } from "@/components/posts/like-button";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

function renderContentBlocks(content: string | null) {
  if (!content) {
    return null;
  }

  return content.split("\n").map((line, index) => {
    const trimmed = line.trim();
    const imageMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);

    if (imageMatch) {
      const [, alt, src] = imageMatch;

      return (
        <figure key={`image-${index}`} className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || "Ảnh bài viết"}
            className="w-full rounded-lg border border-gray-200"
          />
          {alt && (
            <figcaption className="mt-2 text-sm text-gray-500">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    }

    if (!trimmed) {
      return <div key={`spacer-${index}`} className="h-2" />;
    }

    return <p key={`paragraph-${index}`}>{line}</p>;
  });
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .single<Post>();

  return {
    title: post?.title || "Bài viết",
    description: post?.excerpt || "",
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: publishedPost, error: publishedError } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles (
        display_name,
        avatar_url
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single<Post>();

  let post = publishedPost;

  if (!post && user) {
    const { data: ownPost } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles (
          display_name,
          avatar_url
        )
      `,
      )
      .eq("slug", slug)
      .eq("author_id", user.id)
      .single<Post>();

    post = ownPost;
  }

  if ((publishedError && !post) || !post) {
    notFound();
  }

  const { count: likesCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);

  let hasLiked = false;

  if (user) {
    const { data: likedRow } = await supabase
      .from("likes")
      .select("post_id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle<{ post_id: string }>();

    hasLiked = !!likedRow;
  }

  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles (
        display_name,
        avatar_url
      )
    `,
    )
    .eq("post_id", post.id)
    .order("created_at", { ascending: true })
    .returns<Comment[]>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <article>
        <header className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-blue-600 hover:text-blue-500"
          >
            ← Quay lại trang chủ
          </Link>
          <h1 className="mb-4 text-4xl font-bold">{post.title}</h1>

          <div className="flex items-center gap-4 text-gray-500">
            <span>Bởi {post.profiles?.display_name || "Ẩn danh"}</span>
            <span>•</span>
            <time>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </time>
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          {renderContentBlocks(post.content)}
        </div>

        <LikeButton
          postId={post.id}
          initialLikesCount={likesCount ?? 0}
          initialHasLiked={hasLiked}
          canLike={!!user}
        />
      </article>

      <section className="mt-12 border-t pt-8">
        <h2 className="mb-6 text-2xl font-bold">
          Bình luận ({comments?.length || 0})
        </h2>

        {user ? (
          <div className="mb-8">
            <CommentForm postId={post.id} />
          </div>
        ) : (
          <p className="mb-8 text-gray-500">
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Đăng nhập
            </a>{" "}
            để bình luận.
          </p>
        )}

        <RealtimeComments postId={post.id} initialComments={comments || []} />
      </section>
    </main>
  );
}
