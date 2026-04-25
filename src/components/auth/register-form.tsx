"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getRegisterErrorMessage(message: string) {
  if (message.toLowerCase().includes("user already registered")) {
    return "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.";
  }

  if (message.toLowerCase().includes("password should be at least")) {
    return "Mật khẩu quá ngắn. Vui lòng nhập ít nhất 6 ký tự.";
  }

  if (message.toLowerCase().includes("unable to validate email address")) {
    return "Email không hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (message.toLowerCase().includes("too many requests")) {
    return "Bạn gửi yêu cầu quá nhanh. Vui lòng đợi một lúc rồi thử lại.";
  }

  if (message.toLowerCase().includes("email rate limit exceeded")) {
    return "Supabase đang giới hạn số lần gửi email đăng ký. Nếu bạn đang dùng lại cùng email, hãy đợi một lúc hoặc dùng email khác.";
  }

  return message;
}

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const isSubmittingRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRetryCooldown = (seconds: number) => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    setRetryAfterSeconds(seconds);

    cooldownTimerRef.current = setInterval(() => {
      setRetryAfterSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (loading || isSubmittingRef.current) {
      return;
    }

    if (retryAfterSeconds > 0) {
      setError(`Vui lòng chờ ${retryAfterSeconds}s trước khi thử lại.`);
      return;
    }

    setError(null);
    setLoading(true);
    isSubmittingRef.current = true;

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) {
        if (signUpError.status === 429) {
          startRetryCooldown(120);
        }

        setError(getRegisterErrorMessage(signUpError.message));
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else if (data.user) {
        router.push(
          "/login?message=Đăng ký thành công! Bạn có thể đăng nhập ngay.",
        );
      } else {
        setError(
          "Supabase chưa tạo user mới. Hãy kiểm tra lại email, hoặc dùng một email chưa tồn tại trong danh sách Users.",
        );
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleRegister} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700"
          >
            Tên hiển thị
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-gray-500">Tối thiểu 6 ký tự</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || retryAfterSeconds > 0}
        className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Đang xử lý..."
          : retryAfterSeconds > 0
            ? `Thử lại sau ${retryAfterSeconds}s`
            : "Đăng ký"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-500">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
