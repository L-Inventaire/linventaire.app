import countries from "@assets/countries.json";
import timezoneToCountry from "@assets/timezones.json";

export const getCountryFromTimezone = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (timezoneToCountry as any)[timezone] as string | undefined;
};

/**
 * Country proposed for a new address or phone number: the country of the company,
 * else the one of the user (time zone, then browser language), else France
 */
export const getDefaultCountry = (companyCountry?: string) => {
  const [language, region] = navigator.language.split("-");
  return (
    [companyCountry, getCountryFromTimezone(), region, language]
      .map((code) => code?.toUpperCase())
      .find((code) => code && countries.some((c) => c.code === code)) || "FR"
  );
};
