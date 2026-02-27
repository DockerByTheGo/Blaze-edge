export { LocalFileSaver } from "./LocalFileSaver";
export { S3FileSaver } from "../../../../../batteries/file-saving/s3/S3FileSaver";
export { MulterFileSaver } from "../../../../../batteries/file-saving/multer/MulterFileSaver";
export type { IFileSaver, SaveIfNotExistsOptions, SaveIfNotExistsResult } from "../IFileSaver";

// For backwards compatibility, export LocalFileSaver as default FileSaver
export { LocalFileSaver as FileSavingService };
