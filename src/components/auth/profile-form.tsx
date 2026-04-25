"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string;
  email?: string;
}

export function ProfileForm({
  userId,
  initialDisplayName,
  initialAvatarUrl,
  email,
}: ProfileFormProps) {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (errorValue: unknown) => {
    return errorValue instanceof Error
      ? errorValue.message
      : "Không thể cập nhật profile.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        id: userId,
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(payload);

      if (upsertError) {
        throw upsertError;
      }

      setSuccess("Cập nhật profile thành công.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email || ""}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
        />
      </div>

      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-gray-700"
        >
          Display Name
        </label>
        <input
          id="display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Tên hiển thị của bạn"
        />
      </div>

      <div>
        <label
          htmlFor="avatar_url"
          className="block text-sm font-medium text-gray-700"
        >
          Avatar URL
        </label>
        <input
          id="avatar_url"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      {avatarUrl && (
        <div>
          <p className="mb-2 text-sm text-gray-600">Xem trước avatar:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Avatar preview"
            className="h-20 w-20 rounded-full border border-gray-200 object-cover"
          />
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu profile"}
        </button>
      </div>
    </form>
  );
}
