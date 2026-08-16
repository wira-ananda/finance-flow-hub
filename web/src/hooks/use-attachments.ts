import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateRequestQueries } from "@/lib/api/query-invalidation";
import { syncRequestAttachments } from "@/services/attachment.service";

import type { User } from "@/types";
import type { FileUploadItem } from "@/types/files";

interface SyncAttachmentsVariables {
  requestId: string;
  initialAttachmentIds: string[];
  files: FileUploadItem[];
  refresh?: boolean;
}

/**
 * Menyinkronkan dokumen pendukung request tanpa useEffect dan tanpa state server duplikat.
 */
export function useSyncRequestAttachmentsMutation(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, initialAttachmentIds, files }: SyncAttachmentsVariables) =>
      syncRequestAttachments(user, requestId, initialAttachmentIds, files),

    onSuccess: async (_result, variables) => {
      if (variables.refresh === false) {
        return;
      }

      await invalidateRequestQueries(queryClient, user.id, variables.requestId);
    },
  });
}
