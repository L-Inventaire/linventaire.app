
export const applyOffset = (
  date: Date,
  frequencyAndCount: string,
  timezone: string,
  factor = 1,
) => {
  const { offset } = getTimezoneOffset(timezone, new Date(date).getTime());
  date.setHours(date.getHours() + offset);

  const frequency = frequencyAndCount.split("_").pop();
  const periodCount = parseInt(
    frequencyAndCount.split("_")?.length === 2
      ? frequencyAndCount.split("_")[0]
      : "1",
  );
  if (frequencyAndCount.split("_").length > 2 || periodCount < 1) {
    throw new Error(`Invalid frequency ${frequencyAndCount}`);
  }

  const monthly = (date: Date) => {
    const dayOfMonth = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1 * factor * periodCount);
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    date.setDate(Math.min(dayOfMonth, daysInMonth));
  };

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1 * factor * periodCount);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7 * factor * periodCount);
      break;
    case "monthly":
      monthly(date);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1 * factor * periodCount);
      break;
    default:
      throw new Error(`Unknown frequency ${frequencyAndCount}`);
  }

  date.setHours(date.getHours() - offset);
};

export const getTimezoneOffset = (timezone: string, date?: Date | number) => {
  const targetDate = date ? new Date(date) : new Date();

  // Generating the formatted text
  // Setting the timeZoneName to longOffset will convert PDT to GMT-07:00
  const dateText = Intl.DateTimeFormat([], {
    timeZone: timezone,
    timeZoneName: "longOffset",
  }).format(targetDate);

  // Scraping the numbers we want from the text
  // The default value '+0' is needed when the timezone is missing the number part. Ex. Africa/Bamako --> GMT
  let timezoneString = dateText.split(" ")[1].slice(3) || "+0";

  // Getting the offset
  let timezoneOffset = parseInt(timezoneString.split(":")[0]) * 60;

  // Checking for a minutes offset and adding if appropriate
  if (timezoneString.includes(":")) {
    timezoneOffset = timezoneOffset + parseInt(timezoneString.split(":")[1]);
  } else if (timezoneOffset === 0) {
    timezoneString = "";
  }

  return {
    offset: timezoneOffset,
    suffix: timezoneString,
    offsetms: timezoneOffset * 60000,
  };
};