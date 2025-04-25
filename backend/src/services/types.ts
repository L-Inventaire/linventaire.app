import { Express } from "express";

export interface InternalApplicationService {
  init(server: Express): Promise<this>;
}

export type BaseTypes = string | number | boolean | null;

//@ts-ignore
export type AnyValue = any;
