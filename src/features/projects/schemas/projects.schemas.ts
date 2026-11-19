import { z } from "zod";

export const projectSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const projectsSchema = z.array(projectSchema);

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên project.")
    .max(120, "Tên project tối đa 120 ký tự."),
});

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectValues = z.infer<typeof createProjectSchema>;
