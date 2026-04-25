"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/types/database";
import { CommentList } from "./comment-list";

interface RealtimeCommentsProps {
  postId: string;
  initialComments: Comment[];
}

export function RealtimeComments({
  postId,
  initialComments,
}: RealtimeCommentsProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>(initialComments);

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const { data: newComment } = await supabase
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
            .eq("id", payload.new.id)
            .single<Comment>();

          if (newComment) {
            setComments((prev) => [...prev, newComment]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, supabase]);

  return <CommentList comments={comments} />;
}
