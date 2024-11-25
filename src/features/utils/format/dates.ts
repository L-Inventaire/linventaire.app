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

export function timeDecimalToBase60(hourDecimal: number): [number, number] {
  // Extract the whole hours
  const hours = Math.floor(hourDecimal);

  // Calculate the remaining minutes in decimal
  const decimalMinutes = (hourDecimal - hours) * 60;

  // Round minutes to the nearest whole number
  const minutes = Math.round(decimalMinutes);

  // If rounding minutes results in 60, adjust hours and reset minutes to 0
  if (minutes === 60) {
    return [hours + 1, 0];
  }

  // Format the output as "hours:minutes" with leading zero for minutes if necessary
  return [hours, minutes];
}

export function timeBase60ToDecimal(timeArray: number[]): number {
  // Split the input into hours and minutes
  const [hours, minutes] = timeArray;

  // Validate the input
  if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes >= 60) {
    throw new Error(
      'Invalid time format. Ensure it is in "HH:MM" format with minutes between 0 and 59.'
    );
  }

  // Convert hours and minutes to decimal
  return hours + minutes / 60;
}
