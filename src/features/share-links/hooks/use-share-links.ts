import { useQuery } from "@tanstack/react-query";
import { listShareLinks } from "../api/share-links.api";
import { shareLinkKeys } from "../api/share-links.keys";

export function useShareLinks(
  userId: string,
  projectId: string,
  fileId: string,
) {
  return useQuery({
    queryKey: shareLinkKeys.file(userId, projectId, fileId),
    queryFn: () => listShareLinks(projectId, fileId),
  });
}
