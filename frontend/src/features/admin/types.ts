// Mirrors backend/src/services/admin/services/tenants.ts

export type TenantActivity = {
  total: number; // Non deleted documents
  created_30d: number;
  updated_7d: number; // Documents created or modified in the last 7 days
  updated_30d: number; // Documents created or modified in the last 30 days
  last_activity_at: number | null;
};

export type TenantOwner = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

export type Tenant = {
  id: string;
  name: string;
  legal_name: string | null;
  registration_number: string | null;
  city: string | null;
  country: string | null;
  plan: string | null;
  created_at: number | null;
  members: number;
  invitations: number;
  owners: TenantOwner[];
  activity: TenantActivity;
  documents: { [table: string]: number };
};

export type TenantsList = {
  summary: {
    tenants: number;
    active_7d: number;
    active_30d: number;
    new_30d: number;
    users: number;
    documents_updated_30d: number;
  };
  tenants: Tenant[];
};

export type TenantMember = TenantOwner & {
  roles: string[];
  created_at: number | null;
  invitation: boolean;
  last_activity_at: number | null;
  updated_30d: number;
};

export type TenantDetails = {
  tenant: Tenant;
  days: number;
  per_day: { day: string; count: number }[]; // Documents created per day
  tables: ({ table: string } & TenantActivity)[];
  invoices_by_type: { type: string; count: number }[];
  members: TenantMember[];
};
