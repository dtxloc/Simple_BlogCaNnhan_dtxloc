import { PostForm } from "@/components/dashboard/post-form";

export default function NewPostPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Viết bài mới</h1>
      <PostForm />
    </main>
  );
}
