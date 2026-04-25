"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getResetPasswordErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("session not found")) {
    return "Liên kết đặt lại đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu email mới.";
  }

  if (lowerMessage.includes("password should be at least")) {
    return "Mật khẩu quá ngắn. Vui lòng nhập ít nhất 6 ký tự.";
  }

  return message;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const code = searchParams.get("code");

  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(true);

  useEffect(() => {
    const exchangeRecoveryCode = async () => {
      if (!code) {
        setError("Thiếu mã xác thực. Vui lòng mở lại liên kết từ email.");
        setExchanging(false);
        return;
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        setError(
          getResetPasswordErrorMessage(exchangeError.message) ||
            "Không thể xác thực liên kết đặt lại mật khẩu.",
        );
      } else {
        setReady(true);
      }

      setExchanging(false);
    };

    exchangeRecoveryCode();
  }, [code, supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        setError("Hai mật khẩu không khớp.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(getResetPasswordErrorMessage(updateError.message));
        return;
      }

      await supabase.auth.signOut();
      router.push(
        "/login?message=Mật khẩu đã được đổi thành công. Hãy đăng nhập lại.",
      );
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Đặt lại mật khẩu</h2>
          <p className="mt-2 text-gray-600">
            Tạo mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {exchanging && (
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            Đang xác thực liên kết đặt lại mật khẩu...
          </div>
        )}

        {message && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Mật khẩu mới
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={!ready}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Xác nhận mật khẩu mới
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={!ready}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !ready}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Đang lưu..." : "Cập nhật mật khẩu"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="text-blue-600 hover:text-blue-500">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            Đang tải trang đặt lại mật khẩu...
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
