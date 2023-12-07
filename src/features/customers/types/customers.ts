export type PublicCustomer = {
  avatar: string;
  email: string;
  id: string;
  name: string;
  phone: string;
  company: { name: string; logo: string } | null;
};

export type Customer = {
  id: string;
  id_email: string;
  id_phone: string;
  role: "USER" | "DISABLED" | "SYSADMIN" | "SYSAGENT";
  created_at: number;
  mfas: MFA[];

  full_name: string;
  preferences: Preferences;
};

type MFA = {
  id: string;
  type: "email" | "phone" | "app" | "password";
  value: string;
};

type Preferences = {
  avatar?: string;
  language?: string;
};
