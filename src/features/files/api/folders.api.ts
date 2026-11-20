import { ApiClient, ApiError, apiClient } from "@/src/lib/http/api-client";
import {
  folderFormSchema,
  folderSchema,
  foldersSchema,
  type FolderFormValues,
} from "../schemas/folders.schemas";

function assertProject(projectId: string, actualId: string) {
  if (projectId !== actualId) {
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  }
}

export async function listFolders(
  projectId: string,
  client: ApiClient = apiClient,
) {
  const folders = await client.request(
    `/projects/${projectId}/folders`,
    foldersSchema,
  );
  folders.forEach((folder) => assertProject(projectId, folder.projectId));
  return folders;
}

export async function createFolder(
  projectId: string,
  input: FolderFormValues,
  client: ApiClient = apiClient,
) {
  const folder = await client.request(
    `/projects/${projectId}/folders`,
    folderSchema,
    {
      method: "POST",
      body: JSON.stringify(folderFormSchema.parse(input)),
    },
  );
  assertProject(projectId, folder.projectId);
  return folder;
}

export async function renameFolder(
  projectId: string,
  folderId: string,
  input: FolderFormValues,
  client: ApiClient = apiClient,
) {
  const folder = await client.request(
    `/projects/${projectId}/folders/${folderId}`,
    folderSchema,
    { method: "PATCH", body: JSON.stringify(folderFormSchema.parse(input)) },
  );
  assertProject(projectId, folder.projectId);
  if (folder.id !== folderId) {
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  }
  return folder;
}

export function deleteFolder(
  projectId: string,
  folderId: string,
  client: ApiClient = apiClient,
) {
  return client.requestNoContent(`/projects/${projectId}/folders/${folderId}`, {
    method: "DELETE",
  });
}
