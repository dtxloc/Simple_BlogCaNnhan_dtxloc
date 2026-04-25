import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/types/database";

const PAGE_SIZE = 5;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

  const { count: totalPostsCount, error: countError } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const totalPages = Math.max(1, Math.ceil((totalPostsCount ?? 0) / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles (
        display_name,
        avatar_url
      )
    `,
      { count: "exact" },
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  const paginatedPosts = posts ?? [];

  if (countError) {
    console.error("Error counting posts:", countError);
  }

  if (error) {
    console.error("Error fetching posts:", error);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Bài viết mới nhất</h1>

      {paginatedPosts.length > 0 ? (
        <div className="space-y-6">
          {paginatedPosts.map((post) => {
            const typedPost = post as Post;

            return (
              <article
                key={typedPost.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow"
              >
                <Link href={`/posts/${typedPost.slug}`}>
                  <h2 className="text-2xl font-semibold transition-colors hover:text-blue-600">
                    {typedPost.title}
                  </h2>
                </Link>

                {typedPost.excerpt && (
                  <p className="mt-2 text-gray-600">{typedPost.excerpt}</p>
                )}

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Bởi {typedPost.profiles?.display_name || "Ẩn danh"}
                  </span>
                  <span>•</span>
                  <span>
                    {typedPost.published_at
                      ? new Date(typedPost.published_at).toLocaleDateString(
                          "vi-VN",
                        )
                      : "Chưa xuất bản"}
                  </span>
                </div>

                <Link
                  href={`/posts/${typedPost.slug}`}
                  className="mt-4 inline-block text-blue-600 hover:text-blue-500"
                >
                  Đọc tiếp →
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <p className="text-gray-500">Chưa có bài viết nào.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-600">
            Trang {safePage} / {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={`/?page=${Math.max(1, safePage - 1)}`}
              aria-disabled={safePage === 1}
              className={`rounded-md px-3 py-2 text-sm ${
                safePage === 1
                  ? "pointer-events-none text-gray-300"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              Trước
            </Link>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <Link
                    key={page}
                    href={`/?page=${page}`}
                    className={`rounded-md px-3 py-2 text-sm ${
                      page === safePage
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </Link>
                ),
              )}
            </div>

            <Link
              href={`/?page=${Math.min(totalPages, safePage + 1)}`}
              aria-disabled={safePage === totalPages}
              className={`rounded-md px-3 py-2 text-sm ${
                safePage === totalPages
                  ? "pointer-events-none text-gray-300"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              Sau
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
