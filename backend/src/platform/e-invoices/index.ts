import { PlatformService } from "../types";
import { SuperPDPClient, SuperPDPConfig } from "./adapters/superpdp/client";

export class EInvoicesService implements PlatformService {
  async init() {
    return this;
  }

  getClient(configuration: SuperPDPConfig) {
    return new SuperPDPClient(configuration);
  }
}
