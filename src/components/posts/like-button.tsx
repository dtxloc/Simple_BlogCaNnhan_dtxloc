"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface LikeButtonProps {
  postId: string;
  initialLikesCount: number;
  initialHasLiked: boolean;
  canLike: boolean;
}

export function LikeButton({
  postId,
  initialLikesCount,
  initialHasLiked,
  canLike,
}: LikeButtonProps) {
  const supabase = createClient();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = async () => {
    if (loading || !canLike) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Bạn cần đăng nhập để thích bài viết.");
        return;
      }

      if (hasLiked) {
        const { error: unlikeError } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (unlikeError) {
          throw unlikeError;
        }

        setHasLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error: likeError } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id });

        if (likeError) {
          throw likeError;
        }

        setHasLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch {
      setError("Không thể cập nhật lượt thích. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleLike}
          disabled={!canLike || loading}
          className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            hasLiked
              ? "border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {loading ? "Đang xử lý..." : hasLiked ? "Bo like" : "Thich"}
        </button>

        <span className="text-sm text-gray-600">{likesCount} lượt thích</span>
      </div>

      {!canLike && (
        <p className="text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:text-blue-500">
            Đăng nhập
          </Link>{" "}
          để thích bài viết.
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
