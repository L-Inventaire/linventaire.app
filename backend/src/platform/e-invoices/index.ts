import { PlatformService } from "../types";
import { SuperPDPClient } from "./adapters/superpdp/client";

export class EInvoicesService implements PlatformService {
  async init() {
    return this;
  }

  getClient(configuration: { clientId: string; clientSecret: string }) {
    return new SuperPDPClient(configuration);
  }
}
