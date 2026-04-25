import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PostForm } from "@/components/dashboard/post-form";
import type { Post } from "@/types/database";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("author_id", user.id)
    .single<Post>();

  if (error || !post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Chỉnh sửa bài viết</h1>
      <PostForm post={post} />
    </main>
  );
}
