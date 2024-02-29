import { PublicCustomer } from "@features/customers/types/customers";

export type ClientsUsers = {
  client_id: string;
  user_id: string;
  created_at: number;
  updated_at: number;
  updated_by: string;
  roles: { list: Role[] };
  client: Clients;
};

export type ClientsUserWithUser = ClientsUsers & {
  user: PublicCustomer | { email: string };
};

// Roles are mainly read / write / manage
// read: can read and export data
// write: can write data
// manage: can manage data, e.g. delete, massive edits, configurations, etc.

export const Roles = [
  "CLIENT_MANAGE",
  "CLIENT_WRITE",
  "CLIENT_READ",
  "CONTACTS_READ",
  "CONTACTS_WRITE",
  "CONTACTS_MANAGE",
  "USERS_READ",
  "USERS_WRITE",
  "USERS_MANAGE",
] as const;

export type Role = (typeof Roles)[number];

export type Clients = {
  id: string;
  created_at: number;
  address: Address;
  company: Company;
  preferences: Preferences;
  configuration: Configuration;
};

export type Address = {
  address_line_1: string;
  address_line_2: string;
  region: string;
  country: string;
  zip: string;
  city: string;
};

type Company = {
  //Display information
  name: string;
  //Legal information
  legal_name: string;
  registration_number: string;
  tax_number: string;
};

type Preferences = {
  logo?: string;
  language?: string;
  currency?: string;
};

type Configuration = {
  plan: string;
};
