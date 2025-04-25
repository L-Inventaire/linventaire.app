/**
 * Full config file types for autocomplete in code
 */
export type ConfigType = {
  db: {
    type: "mariadb";
    database: string;
    mariadb: {
      host: string;
      port: string | number;
      username: string;
      password: string;
    };
  };
  jwt: {
    secret: string;
  };
  server: {
    port: number;
  };
};
