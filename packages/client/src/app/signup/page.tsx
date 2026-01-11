"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { authApi } from "@/api/auth.api";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member" as "owner" | "member",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { setAuth } = useAuthStore();
  const { showToast } = useUIStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await authApi.register(formData);
      const { user, accessToken, refreshToken } = response.data.data;

      setAuth(user, accessToken, refreshToken);
      showToast("success", "Account created successfully!");
      router.push("/projects");
    } catch (error: any) {
      const errorData = error.response?.data?.error;

      // Try to parse message as JSON array (Zod error format)
      let parsedMessage = errorData?.message;
      try {
        if (
          typeof parsedMessage === "string" &&
          parsedMessage.trim().startsWith("[")
        ) {
          const parsed = JSON.parse(parsedMessage);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
            showToast("error", parsed[0].message);
            return;
          }
        }
      } catch (e) {
        // failed to parse, fallback to normal behavior
      }

      if (errorData?.details) {
        setErrors(
          Object.fromEntries(
            Object.entries(errorData.details).map(([k, v]) => [
              k,
              (v as string[])[0],
            ])
          )
        );
      } else {
        showToast("error", errorData?.message || "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          error={errors.password}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as "owner" | "member",
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="member">Member</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign Up
        </Button>
      </form>
      <p className="text-center mt-4 text-gray-800">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
