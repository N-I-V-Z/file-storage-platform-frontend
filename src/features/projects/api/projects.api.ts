import { ApiClient, apiClient } from "@/src/lib/http/api-client";
import {
  createProjectSchema,
  projectSchema,
  projectsSchema,
  type CreateProjectValues,
} from "../schemas/projects.schemas";

export function listProjects(client: ApiClient = apiClient) {
  return client.request("/projects", projectsSchema);
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
