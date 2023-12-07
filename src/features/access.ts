/** Describes application permissions (examples) **/
export const AppPermissions = {
  Permission1Key: "permission_1_server_key",
  Permission2Key: "permission_2_server_key",
};

/** Defines the application feature access (examples) **/
export const AppFeatureAccess = {
  SIDENAV_DEMO: [AppPermissions.Permission1Key, AppPermissions.Permission2Key],
  SIDENAV_ADMIN: [AppPermissions.Permission2Key],
};
