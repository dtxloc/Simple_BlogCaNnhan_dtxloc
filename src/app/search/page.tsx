import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SearchPostResult } from "@/types/database";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

function renderHighlightedText(value: string) {
  const parts = value.split(/(\[\[\[|\]\]\])/g);
  let isMarked = false;
  const nodes: ReactNode[] = [];

  for (const part of parts) {
    if (part === "[[[") {
      isMarked = true;
      continue;
    }

    if (part === "]]]") {
      isMarked = false;
      continue;
    }

    if (!part) {
      continue;
    }

    if (isMarked) {
      nodes.push(
        <mark
          key={`mark-${nodes.length}`}
          className="rounded bg-yellow-200 px-1"
        >
          {part}
        </mark>,
      );
      continue;
    }

    nodes.push(<span key={`text-${nodes.length}`}>{part}</span>);
  }

  return nodes;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const query = (params.q || "").trim();

  let results: SearchPostResult[] = [];

  if (query) {
    const { data, error } = await supabase.rpc("search_posts", {
      query_text: query,
    });

    if (error) {
      console.error("Search error:", error);
    } else {
      results = (data || []) as SearchPostResult[];
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Tìm kiếm bài viết</h1>

      <form action="/search" method="get" className="mb-8 flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={query}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Nhập từ khóa tiêu đề hoặc nội dung..."
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Tìm
        </button>
      </form>

      {!query && (
        <p className="rounded-md bg-gray-50 p-4 text-gray-600">
          Hãy nhập từ khóa để bắt đầu tìm kiếm.
        </p>
      )}

      {query && (
        <p className="mb-4 text-sm text-gray-600">
          Tìm thấy <strong>{results.length}</strong> kết quả cho từ khóa &quot;
          {query}&quot;.
        </p>
      )}

      {query && results.length === 0 && (
        <div className="rounded-lg bg-gray-50 py-12 text-center text-gray-500">
          Không tìm thấy bài viết phù hợp.
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <article
              key={result.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <Link
                href={`/posts/${result.slug}`}
                className="text-2xl font-semibold text-gray-900 hover:text-blue-600"
              >
                {renderHighlightedText(
                  result.highlighted_title || result.title,
                )}
              </Link>

              <p className="mt-2 text-gray-700">
                {renderHighlightedText(
                  result.highlighted_excerpt || result.excerpt || "",
                )}
              </p>

              <div className="mt-3 text-sm text-gray-500">
                <span>{result.author_display_name || "Ẩn danh"}</span>
                <span className="mx-2">•</span>
                <span>
                  {result.published_at
                    ? new Date(result.published_at).toLocaleDateString("vi-VN")
                    : "Chưa xuất bản"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
