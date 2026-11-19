import { z } from "zod";

const email = z.email("Nhập địa chỉ email hợp lệ.").max(320, "Email quá dài.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Nhập mật khẩu.").max(128, "Mật khẩu quá dài."),
});

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(12, "Mật khẩu cần ít nhất 12 ký tự.")
    .max(128, "Mật khẩu tối đa 128 ký tự."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

export const userSchema = z.object({ id: z.string().min(1), email: z.email() });
export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: userSchema,
});
export const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
});
