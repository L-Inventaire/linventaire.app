import { PlatformService } from "../types";

export interface PushTextMessageAdapterInterface extends PlatformService {
  push(sms: { message: string; to: string; sender: string }): Promise<void>;
}
