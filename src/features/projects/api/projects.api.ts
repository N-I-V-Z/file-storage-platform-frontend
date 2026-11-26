import { ApiClient, ApiError, apiClient } from "@/src/lib/http/api-client";
import {
  createProjectSchema,
  projectSchema,
  projectUsageSchema,
  projectUsageBreakdownSchema,
  projectsSchema,
  type CreateProjectValues,
} from "../schemas/projects.schemas";

export function listProjects(client: ApiClient = apiClient) {
  return client.request("/projects", projectsSchema);
}

export async function getProjectUsage(
  projectId: string,
  client: ApiClient = apiClient,
) {
  const usage = await client.request(
    `/projects/${projectId}/usage`,
    projectUsageSchema,
  );
  if (usage.projectId !== projectId) {
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  }
  return usage;
}

export async function getProjectUsageBreakdown(
  projectId: string,
  client: ApiClient = apiClient,
) {
  const breakdown = await client.request(
    `/projects/${projectId}/usage/breakdown`,
    projectUsageBreakdownSchema,
  );
  if (breakdown.projectId !== projectId) {
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  }
  return breakdown;
}

export function createProject(
  values: CreateProjectValues,
  client: ApiClient = apiClient,
) {
  const input = createProjectSchema.parse(values);
  return client.request("/projects", projectSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
