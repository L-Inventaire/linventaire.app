import timezoneToCountry from "@assets/timezones.json";

export const getCountryFromTimezone = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (timezoneToCountry as any)[timezone] as string | undefined;
};
