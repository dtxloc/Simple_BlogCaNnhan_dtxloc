import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostList } from "@/components/dashboard/post-list";
import type { Post } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bài viết của tôi</h1>
        <Link
          href="/dashboard/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Viết bài mới
        </Link>
      </div>

      {posts && posts.length > 0 ? (
        <PostList posts={posts as Post[]} />
      ) : (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <p className="mb-4 text-gray-500">Bạn chưa có bài viết nào.</p>
          <Link
            href="/dashboard/new"
            className="text-blue-600 hover:text-blue-500"
          >
            Viết bài đầu tiên →
          </Link>
        </div>
      )}
    </main>
  );
}
