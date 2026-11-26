import type { Metadata } from "next";
import { AuthForm } from "@/src/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào không gian lưu trữ File Storage Platform.",
};

export default function LoginPage() {
  return (
    <div className="auth-panel">
      <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
      <h1>Đăng nhập</h1>
      <p className="auth-description">Truy cập không gian lưu trữ của bạn.</p>
      <AuthForm mode="login" />
    </div>
  );
}
