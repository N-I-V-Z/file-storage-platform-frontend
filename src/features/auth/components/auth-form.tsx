"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../hooks/use-auth";
import {
  loginSchema,
  registerSchema,
  type LoginValues,
  type RegisterValues,
} from "../schemas/auth.schemas";
import { apiClient, ApiError } from "@/src/lib/http/api-client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { login, pending } = useAuth();
  const [serverError, setServerError] = useState("");
  const schema = mode === "login" ? loginSchema : registerSchema;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues | RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues | RegisterValues) {
    setServerError("");
    try {
      if (mode === "register") await apiClient.register(values);
      await login(values);
      router.replace("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Không thể kết nối máy chủ. Vui lòng thử lại.",
      );
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="field-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="field">
        <div className="field-heading">
          <label htmlFor="password">Mật khẩu</label>
          {mode === "register" && <span>Ít nhất 12 ký tự</span>}
        </div>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="••••••••••••"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="field-error" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      {serverError && (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      )}
      <button
        type="submit"
        className="button button-primary"
        disabled={pending || isSubmitting}
        aria-busy={pending || isSubmitting}
      >
        {pending
          ? "Đang kiểm tra phiên..."
          : isSubmitting
            ? "Đang xử lý..."
            : mode === "login"
              ? "Đăng nhập"
              : "Tạo tài khoản"}
      </button>
      <p className="form-switch">
        {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Đăng ký" : "Đăng nhập"}
        </Link>
      </p>
    </form>
  );
}
