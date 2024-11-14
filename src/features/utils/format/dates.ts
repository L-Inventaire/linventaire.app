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
