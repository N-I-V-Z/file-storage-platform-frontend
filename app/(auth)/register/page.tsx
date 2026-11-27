import type { Metadata } from "next";
import { AuthForm } from "@/src/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản File Storage Platform để quản lý tệp và project.",
};

export default function RegisterPage() {
  return (
    <div className="auth-panel">
      <span className="eyebrow">BẮT ĐẦU VỚI FILESTACK</span>
      <h1>Tạo tài khoản</h1>
      <p className="auth-description">
        Thiết lập không gian lưu trữ đầu tiên của bạn.
      </p>
      <AuthForm mode="register" />
    </div>
  );
}
