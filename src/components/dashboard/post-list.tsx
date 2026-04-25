import Link from "next/link";
import type { Post } from "@/types/database";
import { DeletePostButton } from "./delete-post-button";

interface PostListProps {
  posts: Post[];
}

export function PostList({ posts }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    post.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {post.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                </span>
              </div>
              {post.excerpt && (
                <p className="mb-2 text-sm text-gray-600">{post.excerpt}</p>
              )}
              <p className="text-xs text-gray-400">
                Tạo ngày:{" "}
                {new Date(post.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={
                  post.status === "published"
                    ? `/posts/${post.slug}`
                    : `/dashboard/edit/${post.id}`
                }
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {post.status === "published" ? "Xem" : "Mở nháp"}
              </Link>
              <Link
                href={`/dashboard/edit/${post.id}`}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-500"
              >
                Sửa
              </Link>
              <DeletePostButton postId={post.id} postTitle={post.title} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
