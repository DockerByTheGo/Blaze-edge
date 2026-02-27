export { LocalFileSaver } from "./LocalFileSaver";
export { S3FileSaver } from "./S3FileSaver";
export { MulterFileSaver } from "./MulterFileSaver";
export type { IFileSaver, SaveIfNotExistsOptions, SaveIfNotExistsResult } from "../IFileSaver";

// For backwards compatibility, export LocalFileSaver as default FileSaver
export { LocalFileSaver as FileSavingService };
