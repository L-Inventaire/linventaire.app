export interface PlatformService {
  init(...args: any[]): Promise<this>;
}
