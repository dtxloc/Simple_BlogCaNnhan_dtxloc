import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Đăng ký tài khoản</h2>
          <p className="mt-2 text-gray-600">
            Tạo tài khoản để bắt đầu viết blog
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
