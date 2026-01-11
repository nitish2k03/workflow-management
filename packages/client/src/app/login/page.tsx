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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const response = await authApi.login({ email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      setAuth(user, accessToken, refreshToken);
      showToast("success", "Login successful!");
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
        showToast("error", errorData?.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Login">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Login
        </Button>
      </form>
      <p className="text-center mt-4 text-gray-800">
        Don't have an account?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
