import { PlatformService } from "../types";

export interface CaptchaAdapterInterface extends PlatformService {
  verify(token: string, ip?: string): Promise<boolean>;
}
