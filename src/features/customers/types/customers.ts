export type PublicCustomer = {
  avatar: string;
  email: string;
  id: string;
  full_name: string;
};

export type Customer = {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  preferences: Preferences;
};

type Preferences = {
  avatar?: string;
  language?: string;
};
