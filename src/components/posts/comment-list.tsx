import type { Comment } from "@/types/database";

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">
        Chưa có bình luận nào. Hãy là người đầu tiên!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-medium">
              {comment.profiles?.display_name || "Ẩn danh"}
            </span>
            <span className="text-sm text-gray-400">
              {new Date(comment.created_at).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <p className="text-gray-700">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
