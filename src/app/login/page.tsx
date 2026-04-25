import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Đăng nhập</h2>
          <p className="mt-2 text-gray-600">
            Đăng nhập để quản lý blog của bạn
          </p>
        </div>

        {params?.message && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {params.message}
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
