import { z } from "zod";

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, "Nhập tên folder.")
  .max(120, "Tên folder tối đa 120 ký tự.")
  .refine(
    (name) => name !== "." && name !== ".." && !/[\\/\x00-\x1f\x7f]/.test(name),
    {
      message:
        "Tên folder không được chứa dấu phân cách đường dẫn hoặc ký tự điều khiển.",
    },
  );

export const folderFormSchema = z.object({ name: folderNameSchema });

export const folderSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const foldersSchema = z.array(folderSchema);

export type Folder = z.infer<typeof folderSchema>;
export type FolderFormValues = z.infer<typeof folderFormSchema>;
