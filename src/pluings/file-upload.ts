import multer from "multer";

import type { FileName } from "./explorer-panel/src/types/filename";

const upload = multer({ storage: multer.memoryStorage() });

export const fileUploading = {
  defaultFileUpload: (NameForAccessingTheFile: FileName) => { return upload.single(NameForAccessingTheFile.value); },
  multipleFilesUpload: (NameForAccessingTheFiles: FileName, maxFilesCountAllowed: number) => {
    return upload.array(NameForAccessingTheFiles.value, maxFilesCountAllowed);
  },
};
