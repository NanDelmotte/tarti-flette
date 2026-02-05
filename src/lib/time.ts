// src/lib/time.ts
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const TZ = "Europe/Amsterdam";

export function toUTCFromLocalAmsterdam(local: string): string | null {
  // local: "YYYY-MM-DDTHH:mm" from <input type="datetime-local" />
  if (!local) return null;
  try {
    const utc = fromZonedTime(local, TZ);

    return utc.toISOString();
  } catch {
    return null;
  }
}

export function formatEU(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return formatInTimeZone(new Date(iso), TZ, "dd-MM-yy HH:mm");
  } catch {
    return "";
  }
}

export function formatEURange(
  startsIso: string | null | undefined,
  endsIso: string | null | undefined
): string {
  if (!startsIso) return "";
  if (!endsIso) return formatEU(startsIso);

  try {
    const startDate = new Date(startsIso);
    const endDate = new Date(endsIso);

    const startDay = formatInTimeZone(startDate, TZ, "dd-MM-yy");
    const endDay = formatInTimeZone(endDate, TZ, "dd-MM-yy");

    const startTime = formatInTimeZone(startDate, TZ, "HH:mm");
    const endTime = formatInTimeZone(endDate, TZ, "HH:mm");

    if (startDay === endDay) return `${startDay} ${startTime}–${endTime}`;
    return `${startDay} ${startTime}–${endDay} ${endTime}`;
  } catch {
    return formatEU(startsIso);
  }
}
