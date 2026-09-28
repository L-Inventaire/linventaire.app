import { useAuth } from "@features/auth/state/use-auth";
import { useQuery } from "@tanstack/react-query";
import { AdminApiClient } from "./api-client";

// Platform administrators have the SYSADMIN role (set in database, applied at next login)
export const useIsSysAdmin = () => {
  const { user, getExtractedToken } = useAuth();
  return !!user?.id && getExtractedToken()?.role === "SYSADMIN";
};

export const useAdminTenants = () => {
  const isSysAdmin = useIsSysAdmin();
  return useQuery({
    queryKey: ["admin_tenants"],
    queryFn: AdminApiClient.getTenants,
    enabled: isSysAdmin,
  });
};

export const useAdminTenant = (id: string) => {
  const isSysAdmin = useIsSysAdmin();
  return useQuery({
    queryKey: ["admin_tenant", id],
    queryFn: () => AdminApiClient.getTenant(id),
    enabled: isSysAdmin && !!id,
  });
};
