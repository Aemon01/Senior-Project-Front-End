"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./StudentCalendar.module.css";

export type StudentCalendarTrackColor =
    | "pink"
    | "yellow"
    | "green"
    | "softPink"
    | "blue"
    | "orange"
    | "rose"
    | "greenWide";

export type StudentCalendarSiteEvent = {
    id: string;
    title: string;
    startAt: string;
    endAt?: string;
    calendarColor?: StudentCalendarTrackColor | null;
};

type GoogleCalendarEvent = {
    id: string;
    title: string;
    startAt: string;
    endAt?: string;
};

const GOOGLE_CONNECT_URL = "/api/google-calendar/connect";

type StudentCalendarProps = {
    siteEvents?: StudentCalendarSiteEvent[];
};

type CalendarDayCell = {
    date: Date;
    inCurrentMonth: boolean;
};

type DayRenderItem = {
    id: string;
    title: string;
    color: StudentCalendarTrackColor;
    source: "site" | "google";
    startAt?: string;
    endAt?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfCalendarGrid(d: Date) {
    const first = startOfMonth(d);
    return new Date(first.getFullYear(), first.getMonth(), first.getDate() - first.getDay());
}

function endOfCalendarGrid(d: Date) {
    const last = endOfMonth(d);
    return new Date(last.getFullYear(), last.getMonth(), last.getDate() + (6 - last.getDay()));
}

function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function toDateKeyLocal(d: Date) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function parseEventDate(value?: string) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function clampTrackColor(value?: string | null): StudentCalendarTrackColor {
    const allowed: StudentCalendarTrackColor[] = [
        "pink",
        "yellow",
        "green",
        "softPink",
        "blue",
        "orange",
        "rose",
        "greenWide",
    ];
    return allowed.includes(value as StudentCalendarTrackColor)
        ? (value as StudentCalendarTrackColor)
        : "pink";
}

function buildCalendarCells(currentMonth: Date): CalendarDayCell[][] {
    const start = startOfCalendarGrid(currentMonth);
    const cells: CalendarDayCell[] = Array.from({ length: 42 }).map((_, i) => {
        const date = addDays(start, i);
        return {
            date,
            inCurrentMonth: date.getMonth() === currentMonth.getMonth(),
        };
    });

    return Array.from({ length: 6 }).map((_, row) => cells.slice(row * 7, row * 7 + 7));
}

function expandEventToDateKeys(startAt?: string, endAt?: string) {
    const start = parseEventDate(startAt);
    const end = parseEventDate(endAt || startAt);

    if (!start || !end) return [];

    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const keys: string[] = [];
    let cursor = startDay;

    while (cursor.getTime() <= endDay.getTime()) {
        keys.push(toDateKeyLocal(cursor));
        cursor = addDays(cursor, 1);
    }

    return keys;
}

function monthLabel(date: Date) {
    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

function formatEventDateRange(startAt?: string, endAt?: string) {
    const start = parseEventDate(startAt);
    const end = parseEventDate(endAt || startAt);

    if (!start) return "-";

    const dateFmt = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const timeFmt = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (!end) {
        return `${dateFmt.format(start)} • ${timeFmt.format(start)}`;
    }

    const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    if (sameDay) {
        return `${dateFmt.format(start)} • ${timeFmt.format(start)} - ${timeFmt.format(end)}`;
    }

    return `${dateFmt.format(start)} ${timeFmt.format(start)} - ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

export default function StudentCalendar({
    siteEvents = [],
}: StudentCalendarProps) {
    const [viewDate, setViewDate] = useState(() => new Date());
    const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    const calendarCells = useMemo(() => buildCalendarCells(viewDate), [viewDate]);

    const googleStatusText = loadingGoogle
        ? "Loading Google Calendar..."
        : googleError === "Google Calendar not connected"
            ? "Google Calendar not connected"
            : googleError
                ? "Could not load Google Calendar"
                : "Google Calendar connected • Google events = green";

    useEffect(() => {
        let cancelled = false;

        async function loadGoogleEvents() {
            try {
                setLoadingGoogle(true);
                setGoogleError(null);

                const monthStart = startOfCalendarGrid(viewDate);
                const monthEnd = endOfCalendarGrid(viewDate);

                const qs = new URLSearchParams({
                    timeMin: monthStart.toISOString(),
                    timeMax: addDays(monthEnd, 1).toISOString(),
                });

                const res = await fetch(`/api/google-calendar/events?${qs.toString()}`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                const json = await res.json();

                if (!res.ok || !json?.ok) {
                    throw new Error(json?.message || "Failed to load Google Calendar");
                }

                if (!cancelled) {
                    setGoogleEvents(Array.isArray(json.items) ? json.items : []);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setGoogleEvents([]);
                    setGoogleError(e?.message || "Failed to load Google Calendar");
                }
            } finally {
                if (!cancelled) {
                    setLoadingGoogle(false);
                }
            }
        }

        loadGoogleEvents();

        return () => {
            cancelled = true;
        };
    }, [viewDate]);

    const dayMap = useMemo(() => {
        const map = new Map<string, DayRenderItem[]>();

        for (const event of siteEvents) {
            const keys = expandEventToDateKeys(event.startAt, event.endAt);
            for (const key of keys) {
                const arr = map.get(key) ?? [];
                arr.push({
                    id: `site-${event.id}-${key}`,
                    title: event.title,
                    color: clampTrackColor(event.calendarColor),
                    source: "site",
                    startAt: event.startAt,
                    endAt: event.endAt,
                });
                map.set(key, arr);
            }
        }


        for (const event of googleEvents) {
            const keys = expandEventToDateKeys(event.startAt, event.endAt);
            for (const key of keys) {
                const arr = map.get(key) ?? [];
                arr.push({
                    id: `google-${event.id}-${key}`,
                    title: event.title,
                    color: "greenWide",
                    source: "google",
                    startAt: event.startAt,
                    endAt: event.endAt,
                });
                map.set(key, arr);
            }
        }

        return map;
    }, [siteEvents, googleEvents]);

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <section className={styles.calendarCard}>
            <div className={styles.calendarPanel}>
                <div className={styles.calendarHeader}>
                    <button
                        type="button"
                        className={styles.navBtn}
                        onClick={() =>
                            setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                        }
                        aria-label="Previous month"
                    >
                        ‹
                    </button>

                    <div className={styles.calendarMonthChip}>
                        <div className={styles.calendarTitle}>{monthLabel(viewDate)}</div>
                    </div>

                    <button
                        type="button"
                        className={styles.navBtn}
                        onClick={() =>
                            setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                        }
                        aria-label="Next month"
                    >
                        ›
                    </button>
                </div>

                <div className={styles.calendarGrid}>
                    <div className={styles.calendarRow}>
                        {weekDays.map((d, idx) => (
                            <div
                                key={d}
                                className={cx(
                                    styles.calendarWeekDay,
                                    (idx === 0 || idx === 6) && styles.calendarWeekEnd
                                )}
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {calendarCells.map((week, rowIdx) => (
                        <div key={rowIdx} className={styles.calendarRow}>
                            {week.map((cell, idx) => {
                                const key = toDateKeyLocal(cell.date);
                                const items = dayMap.get(key) ?? [];
                                const isWeekend = idx === 0 || idx === 6;

                                return (
                                    <div
                                        key={key}
                                        className={cx(
                                            styles.calendarCell,
                                            isWeekend && styles.calendarWeekEnd,
                                            !cell.inCurrentMonth && styles.calendarOtherMonth
                                        )}
                                    >
                                        <div className={styles.calendarCellInner}>
                                            <div className={styles.calendarDay}>{cell.date.getDate()}</div>

                                            <div className={styles.calendarEvents}>
                                                {items.slice(0, 3).map((item) => (
                                                    <div key={item.id} className={styles.trackWrap}>
                                                        <div
                                                            className={cx(
                                                                styles.trackBar,
                                                                item.color === "pink" && styles.trackPink,
                                                                item.color === "yellow" && styles.trackYellow,
                                                                item.color === "green" && styles.trackGreen,
                                                                item.color === "softPink" && styles.trackSoftPink,
                                                                item.color === "blue" && styles.trackBlue,
                                                                item.color === "orange" && styles.trackOrange,
                                                                item.color === "rose" && styles.trackRose,
                                                                item.color === "greenWide" && styles.trackGreenWide
                                                            )}
                                                        />

                                                        <div className={styles.eventTooltip}>
                                                            <div className={styles.eventTooltipTitle}>{item.title}</div>
                                                            <div className={styles.eventTooltipMeta}>
                                                                {item.source === "google" ? "Google Calendar" : "Platform activity"}
                                                            </div>
                                                            <div className={styles.eventTooltipTime}>
                                                                {formatEventDateRange(item.startAt, item.endAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {items.length > 3 && (
                                                    <div className={styles.moreText}>+{items.length - 3}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className={styles.calendarBottom}>
                    <a href={GOOGLE_CONNECT_URL} className={styles.connectBtn}>
                        Connect Google Calendar
                    </a>
                    <div className={styles.calendarFootnote}>{googleStatusText}</div>
                </div>
            </div>
        </section>
    );
}