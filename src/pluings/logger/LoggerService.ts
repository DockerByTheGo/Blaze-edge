import type { ILogSaver, RequestLog } from "./types";

/**
 * Simplified LoggerService - only saveLog and getLogs
 */
export class LoggerService {
  private saver: ILogSaver;

  constructor(saver: ILogSaver) {
    this.saver = saver;
  }

  async saveLog(log: RequestLog): Promise<void> {
    await this.saver.save(log);
  }

  async getLogs(): Promise<RequestLog[]> {
    return this.saver.getLogs();
  }
}
