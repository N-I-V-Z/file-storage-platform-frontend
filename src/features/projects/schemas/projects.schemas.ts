import { z } from "zod";

export const projectSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const projectsSchema = z.array(projectSchema);

const byteCountSchema = z.string().regex(/^(0|[1-9]\d*)$/);

export const projectUsageSchema = z
  .strictObject({
    projectId: z.uuid(),
    quotaBytes: byteCountSchema,
    usedBytes: byteCountSchema,
    reservedBytes: byteCountSchema,
  })
  .refine(
    ({ quotaBytes, usedBytes, reservedBytes }) =>
      /^(0|[1-9]\d*)$/.test(quotaBytes) &&
      /^(0|[1-9]\d*)$/.test(usedBytes) &&
      /^(0|[1-9]\d*)$/.test(reservedBytes) &&
      BigInt(usedBytes) + BigInt(reservedBytes) <= BigInt(quotaBytes),
  );

export const projectUsageBreakdownSchema = projectUsageSchema
  .safeExtend({
    readyBytes: byteCountSchema,
    trashBytes: byteCountSchema,
    pendingBytes: byteCountSchema,
    matchesBalance: z.boolean(),
  })
  .refine(
    ({
      readyBytes,
      trashBytes,
      pendingBytes,
      usedBytes,
      reservedBytes,
      matchesBalance,
    }) =>
      !matchesBalance ||
      (BigInt(readyBytes) + BigInt(trashBytes) === BigInt(usedBytes) &&
        BigInt(pendingBytes) === BigInt(reservedBytes)),
  );

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên project.")
    .max(120, "Tên project tối đa 120 ký tự."),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectUsage = z.infer<typeof projectUsageSchema>;
export type ProjectUsageBreakdown = z.infer<typeof projectUsageBreakdownSchema>;
export type CreateProjectValues = z.infer<typeof createProjectSchema>;
