import { format } from "date-fns";

/* Show minimal needed information to get date
 * ex. if it is to_day only show hour and minutes
 * ex. if it is yesterday show day and hour and minutes
 * ex. if it is this year show day and month
 * else show day and month and year
 */
export const formatTime = (
  time: number | string | Date,
  options: {
    keepTime?: boolean;
    keepSeconds?: boolean;
    keepDate?: boolean;
    hideTime?: boolean;
    numeric?: boolean;
  } = {
    keepTime: true,
    keepDate: true,
  },
  locale?: string
) => {
  time = new Date(
    typeof time === "string" ? parseInt(time as any) : time
  ).getTime();
  locale = locale || navigator.language;
  const now = Date.now();
  const year = new Date(time).getFullYear();
  const nowYear = new Date(now).getFullYear();
  const nowDay = new Date();
  nowDay.setHours(0);
  nowDay.setMinutes(0);
  const oneDayLater = time < nowDay.getTime();

  // if it's today
  if (now - time < 24 * 60 * 60 * 1000) {
    return format(new Date(time), "HH:mm");
  }

  return new Intl.DateTimeFormat(locale, {
    year: nowYear !== year || options?.keepDate ? "numeric" : undefined,
    month:
      oneDayLater || options?.keepDate
        ? options?.numeric
          ? "numeric"
          : "short"
        : undefined,
    day: oneDayLater || options?.keepDate ? "numeric" : undefined,
    hour:
      (!oneDayLater || options?.keepTime) && !options?.hideTime
        ? "numeric"
        : undefined,
    minute:
      (!oneDayLater || options?.keepTime) && !options?.hideTime
        ? "numeric"
        : undefined,
    second: options?.keepSeconds ? "numeric" : undefined,
  }).format(new Date(time));
};

export const formatDuration = (duration: number) => {
  duration = Math.floor(duration / 1000 / 60);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${(minutes + "").padStart(2, "0")}m`;
};

export function getPeriodEnd(dateStr: string) {
  const maxDay = new Date(
    new Date(dateStr).getFullYear(),
    new Date(dateStr).getMonth() + 1,
    0
  ).getDate();

  return (
    dateStr +
    ("9999-12-" + maxDay + "T23:59:59").slice((dateStr as string)?.length || 0)
  );
}

export function timeDecimalToBase60(
  hourDecimal: number | undefined
): [number, number] {
  if (hourDecimal === undefined) {
    return [0, 0];
  }
  return [
    Math.floor(hourDecimal),
    Math.floor((hourDecimal - Math.floor(hourDecimal)) * 60),
  ];
}

export function prettyPrintTime(timeArray: number[]): string {
  // Validate the input
  if (timeArray.length !== 2) {
    throw new Error('Invalid time format. Ensure it is in "HH:MM" format.');
  }

  // Extract the hours and minutes
  const [hours, minutes] = timeArray;

  // Format the output as "HH:MM" with leading zeros if necessary
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function timeBase60ToDecimal(timeArray: number[]): number {
  // Split the input into hours and minutes
  const [hours, minutes] = timeArray;

  // Validate the input
  if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes > 60) {
    throw new Error(
      'Invalid time format. Ensure it is in "HH:MM" format with minutes between 0 and 59.'
    );
  }

  // Convert hours and minutes to decimal
  return hours + minutes / 60;
}

export const formatDate = (date: any) => {
  const locale = navigator.language;
  if (locale.toLocaleLowerCase().includes("fr")) {
    return format(date, "dd/MM/yyyy");
  }
  return format(date, "yyyy-MM-dd");
};
