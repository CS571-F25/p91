import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import PageHeader from "../components/PageHeader";
import CalendarLegend from "../components/CalendarLegend";

export default function SchedulePage({
  homework,
  schedule,
  setSchedule,
  commitments,
  prefs
}) {
  const defaultColor = "#0d6efd";
  const [calendarRange, setCalendarRange] = useState({ start: null, end: null });
  const [shadedHomework, setShadedHomework] = useState(null);
  const [includeHomeworkExport, setIncludeHomeworkExport] = useState(true);
  const [includeCommitmentsExport, setIncludeCommitmentsExport] = useState(true);
  const [exportedUids, setExportedUids] = useState(() => {
    try {
      const stored = localStorage.getItem("studysync-exported-uids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const sidebarRef = useRef(null);
  const draggableInitRef = useRef(false);

  const formatTime = (t) => (t && t.length === 5 ? t : null);
  const getEventHours = (ev) => {
    if (!ev.start || !ev.end) return 0;
    return (
      (new Date(ev.end).getTime() - new Date(ev.start).getTime()) /
      (1000 * 60 * 60)
    );
  };

  const getScheduledHours = (homeworkName) =>
    schedule
      .filter((ev) => ev.homework === homeworkName)
      .reduce((sum, ev) => sum + getEventHours(ev), 0);

  const getRemainingHours = (hw) => {
    const totalHours = parseFloat(hw.hours || 0);
    const scheduledHours = getScheduledHours(hw.name);
    return Math.max(0, totalHours - scheduledHours);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB");
    } catch {
      return dateStr;
    }
  };

  const normalizeTime = (time, fallback) => {
    if (!time || typeof time !== "string") return fallback;
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
    if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
    return fallback;
  };

  const toMinutes = (timeStr, fallbackMinutes) => {
    const normalized = normalizeTime(timeStr, null);
    if (!normalized) return fallbackMinutes;
    const [h, m] = normalized.split(":");
    const mins = parseInt(h, 10) * 60 + parseInt(m, 10);
    if (Number.isNaN(mins)) return fallbackMinutes;
    return mins;
  };

  const homeworkEvents = schedule.map((s) => {
    const color =
      s.color ||
      homework.find((h) => h.name === s.homework)?.color ||
      defaultColor;

    return {
      id: (s.id ?? Date.now() + Math.random()).toString(),
      title: s.homework,
      start: s.start,
      end: s.end,
      backgroundColor: color,
      borderColor: color,
      editable: true
    };
  });

  const dayToIndex = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };

  const commitmentEvents = (commitments || [])
    .filter(
      (c) =>
        c.day &&
        dayToIndex[c.day] !== undefined &&
        formatTime(c.startTime) &&
        formatTime(c.endTime)
    )
    .map((c) => ({
      id: "commit-" + c.id,
      title: c.description || "Commitment",
      daysOfWeek: [dayToIndex[c.day]],
      startTime: formatTime(c.startTime),
      endTime: formatTime(c.endTime),
      endRecur: c.endDate ? `${c.endDate}T23:59:59` : undefined,
      backgroundColor: "#6c757d",
      borderColor: "#495057",
      editable: false
    }));

  const events = [...homeworkEvents, ...commitmentEvents];

  const getDeadlineForHomework = (homeworkName) => {
    const hw = homework.find((h) => h.name === homeworkName);
    if (!hw || !hw.deadline) return null;

    return new Date(hw.deadline + "T23:59:59");
  };

  useEffect(() => {
    if (sidebarRef.current && !draggableInitRef.current) {
      draggableInitRef.current = true;

      new Draggable(sidebarRef.current, {
        itemSelector: ".draggable-block",
        eventData: (el) => ({
          title: el.getAttribute("data-title"),
          backgroundColor: el.getAttribute("data-color"),
          borderColor: el.getAttribute("data-color"),
          extendedProps: {
            homeworkId: el.getAttribute("data-homework-id"),
            homeworkName: el.getAttribute("data-title"),
            blockSize: parseFloat(el.getAttribute("data-block-size")),
            color: el.getAttribute("data-color")
          },
          duration: {
            hours: parseFloat(el.getAttribute("data-block-size"))
          }
        })
      });
    }
  }, []);

  const handleEventReceive = (info) => {
    const hwName =
      info.event.extendedProps.homeworkName || info.event.title || "";
    const hwColor = info.event.extendedProps.color || defaultColor;
    const baseBlockSize =
      parseFloat(
        info.event.extendedProps.blockSize || info.event.duration?.hours
      ) || 1;

    const hw = homework.find((h) => h.name === hwName);
    const remainingHours = hw ? getRemainingHours(hw) : baseBlockSize;
    if (!remainingHours || remainingHours <= 0) {
      info.event.remove();
      return;
    }

    const hoursToSchedule = Math.min(baseBlockSize, remainingHours);

    info.event.remove();

    const start = info.event.start;
    const end = new Date(start.getTime() + hoursToSchedule * 60 * 60 * 1000);

    const deadline = getDeadlineForHomework(hwName);
    if (deadline && start > deadline) return;

    setSchedule((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        homework: hwName,
        start,
        end,
        color: hwColor
      }
    ]);
  };

  const handleEventDrop = (info) => {
    if (info.event.id.startsWith("commit-")) {
      info.revert();
      return;
    }

    const deadline = getDeadlineForHomework(info.event.title);
    const endDate = info.event.end || info.event.start;

    if (deadline && endDate > deadline) {
      info.revert();
      return;
    }

    setSchedule((prev) =>
      prev.map((ev) =>
        (ev.id ?? "").toString() === info.event.id.toString()
          ? { ...ev, start: info.event.start, end: info.event.end }
          : ev
      )
    );
  };

  const handleEventResize = (info) => {
    if (info.event.id.startsWith("commit-")) {
      info.revert();
      return;
    }

    const deadline = getDeadlineForHomework(info.event.title);
    const endDate = info.event.end || info.event.start;

    if (deadline && endDate > deadline) {
      info.revert();
      return;
    }

    setSchedule((prev) =>
      prev.map((ev) =>
        (ev.id ?? "").toString() === info.event.id.toString()
          ? { ...ev, start: info.event.start, end: info.event.end }
          : ev
      )
    );
  };

  const handleDeleteEvent = (event) => {
    if (event.id.startsWith("commit-")) return;

    event.remove();

    setSchedule((prev) =>
      prev.filter((ev) => (ev.id ?? "").toString() !== event.id.toString())
    );
  };

  const renderEventContent = (info) => {
    if (info.event.display === "background") return null;

    const isCommitment = info.event.id.startsWith("commit-");
    if (info.event.classNames?.includes("deadline-line-bg")) {
      return (
        <div className="deadline-line-marker" aria-label="Deadline boundary" />
      );
    }

    return (
      <div
        className={`position-relative w-100 h-100 d-flex align-items-center ${
          !isCommitment ? "resizable-event" : ""
        }`}
        style={{ padding: "4px 6px" }}
      >
        {!isCommitment && (
          <span className="resize-arrow top" aria-hidden="true" />
        )}

        <div className="d-flex justify-content-between align-items-center w-100">
          <span>{info.event.title}</span>

          {!isCommitment && (
            <span
              className="text-danger ms-2"
              style={{ cursor: "pointer", fontSize: "1.2rem" }}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEvent(info.event);
              }}
            >
              🗑️
            </span>
          )}
        </div>

        {!isCommitment && (
          <span className="resize-arrow bottom" aria-hidden="true" />
        )}
      </div>
    );
  };

  const formatDeadline = (deadline) =>
    deadline ? new Date(deadline + "T12:00:00").toLocaleDateString() : "No deadline";

  const deadlineShading = [];
  if (shadedHomework && calendarRange.end) {
    const hw = homework.find((h) => h.name === shadedHomework);
    if (hw && hw.deadline) {
      const deadlineEnd = getDeadlineForHomework(hw.name);
      const shadeStart = new Date(deadlineEnd.getTime() + 1000);

      if (shadeStart < calendarRange.end) {
        deadlineShading.push({
          id: "deadline-bg",
          start: shadeStart,
          end: calendarRange.end,
          display: "background",
          backgroundColor: "rgba(220, 53, 69, 0.2)",
          borderColor: "rgba(220, 53, 69, 0.5)"
        });
      }
      const deadlineStart = new Date(hw.deadline + "T00:00:00");
      const deadlineLineEnd = new Date(deadlineStart.getTime() + 24 * 60 * 60 * 1000);
      deadlineShading.push({
        id: `deadline-line-${hw.id}`,
        start: deadlineStart,
        end: deadlineLineEnd,
        display: "background",
        classNames: ["deadline-line-bg"]
      });
    }
  }

  const allEvents = [...events, ...deadlineShading];

  const uidSet = new Set(exportedUids || []);
  const hasNewHomework =
    includeHomeworkExport &&
    schedule.some(
      (ev) => !uidSet.has(`hw-${ev.id || ev.start}-${ev.homework || "block"}`)
    );
  const hasNewCommitments =
    includeCommitmentsExport &&
    (commitments || []).some((c) => {
      const uid = `commit-${c.id || `${c.day}-${c.startTime}-${c.endTime}`}`;
      return !uidSet.has(uid);
    });
  const canExport =
    (includeHomeworkExport || includeCommitmentsExport) &&
    (hasNewHomework || hasNewCommitments);

  const formatICSDate = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const getNextDateForDayIndex = (dayIdx) => {
    const now = new Date();
    const diff = (dayIdx - now.getDay() + 7) % 7;
    const next = new Date(now);
    next.setHours(0, 0, 0, 0);
    next.setDate(now.getDate() + diff);
    return next;
  };

  const persistExportedUids = (uids) => {
    setExportedUids(uids);
    try {
      localStorage.setItem("studysync-exported-uids", JSON.stringify(uids));
    } catch {
      // ignore storage errors
    }
  };

  const handleExportCalendar = () => {
    if (!canExport) return;

    const uidSet = new Set(exportedUids || []);
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//StudySync//Calendar Export//EN"
    ];

    const dayCode = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    const nowStamp = formatICSDate(new Date());
    const newUids = [];

    if (includeHomeworkExport) {
      schedule.forEach((ev) => {
        if (!ev.start || !ev.end) return;
        const uid = `hw-${ev.id || ev.start}-${ev.homework || "block"}`;
        if (uidSet.has(uid)) return;
        const dtStart = formatICSDate(ev.start);
        const dtEnd = formatICSDate(ev.end);
        if (!dtStart || !dtEnd) return;

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${nowStamp}`);
        lines.push(`SUMMARY:${ev.homework || "Study Block"}`);
        lines.push(`DTSTART:${dtStart}`);
        lines.push(`DTEND:${dtEnd}`);
        lines.push("END:VEVENT");

        newUids.push(uid);
      });
    }

    if (includeCommitmentsExport) {
      (commitments || []).forEach((c) => {
        if (!c.day || !formatTime(c.startTime) || !formatTime(c.endTime)) return;
        const uid = `commit-${c.id || `${c.day}-${c.startTime}-${c.endTime}`}`;
        if (uidSet.has(uid)) return;
        const dayIdx = dayToIndex[c.day];
        const startDate = getNextDateForDayIndex(dayIdx);

        const [sh, sm] = c.startTime.split(":").map((n) => parseInt(n, 10));
        const [eh, em] = c.endTime.split(":").map((n) => parseInt(n, 10));
        const start = new Date(startDate);
        start.setHours(sh || 0, sm || 0, 0, 0);
        const end = new Date(startDate);
        end.setHours(eh || 0, em || 0, 0, 0);

        const dtStart = formatICSDate(start);
        const dtEnd = formatICSDate(end);
        if (!dtStart || !dtEnd) return;

        const until = c.endDate
          ? formatICSDate(new Date(`${c.endDate}T23:59:59`))
          : null;
        const rrule = until
          ? `FREQ=WEEKLY;BYDAY=${dayCode[dayIdx]};UNTIL=${until}`
          : `FREQ=WEEKLY;BYDAY=${dayCode[dayIdx]}`;

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${nowStamp}`);
        lines.push(`SUMMARY:${c.description || "Commitment"}`);
        lines.push(`DTSTART:${dtStart}`);
        lines.push(`DTEND:${dtEnd}`);
        lines.push(`RRULE:${rrule}`);
        lines.push("END:VEVENT");

        newUids.push(uid);
      });
    }

    lines.push("END:VCALENDAR");
    const icsContent = lines.join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "studysync-calendar.ics";
    link.click();
    URL.revokeObjectURL(url);

    persistExportedUids([...uidSet, ...newUids]);
  };

  const isWithinDeadline = (start, end, title) => {
    const deadline = getDeadlineForHomework(title);
    if (!deadline) return true;
    const comparisonEnd = end || start;
    return comparisonEnd <= deadline;
  };

  return (
    <>
      <PageHeader
        title="🗓️ Schedule"
        subtitle="Drag study blocks into your week"
      />
      <div
        className="row"
        style={{ paddingBottom: "30px" }}
      >
      <div className="col-12 col-md-3 border-end p-3" ref={sidebarRef}>
        <h4 className="mb-3">Plan Homework</h4>

        {homework.length === 0 && (
          <div className="text-muted">Add homework to start planning.</div>
        )}

        {homework.map((hw) => {
          const remainingHours = getRemainingHours(hw);
          const blockSize = parseFloat(hw.blockSize || 1) || 1;
          const nextBlockHours =
            remainingHours > 0 ? Math.min(blockSize, remainingHours) : blockSize;
          return (
            <div
              key={hw.id}
              className="p-3 mb-3 rounded border"
              onMouseEnter={() => setShadedHomework(hw.name)}
              onMouseLeave={() => setShadedHomework(null)}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-bold">{hw.name}</div>
                <span
                  style={{
                    display: "inline-block",
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: hw.color || defaultColor
                  }}
                  aria-label={`${hw.name} color`}
                />
              </div>
              <div className="small text-muted">
                {hw.hours}h total • {hw.blockSize}h blocks
              </div>
              <div className="small text-muted">
                Deadline: {formatDateDisplay(hw.deadline)}
              </div>
              <div className="small mb-2">
                Hours remaining: <strong>{remainingHours.toFixed(1)}h</strong>
              </div>

              {remainingHours > 0 ? (
                <div
                  className="p-2 text-white rounded draggable-block"
                  data-title={hw.name}
                  data-block-size={nextBlockHours}
                  data-color={hw.color || defaultColor}
                  data-homework-id={hw.id}
                  style={{
                    cursor: "grab",
                    userSelect: "none",
                    backgroundColor: hw.color || defaultColor,
                    border: "1px solid rgba(0,0,0,0.1)"
                  }}
                  onMouseDown={() => setShadedHomework(hw.name)}
                >
                  Drag Block ({nextBlockHours}h)
                </div>
              ) : (
                <div className="text-success fw-bold">🎉 All blocks scheduled!</div>
              )}
            </div>
          );
        })}
        <CalendarLegend />
        <div className="mt-4 p-3 border rounded">
          <h6 className="fw-bold mb-2">Export / Subscribe</h6>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="export-homework"
              checked={includeHomeworkExport}
              onChange={(e) => setIncludeHomeworkExport(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="export-homework">
              Include homework blocks
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="export-commitments"
              checked={includeCommitmentsExport}
              onChange={(e) => setIncludeCommitmentsExport(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="export-commitments">
              Include commitments
            </label>
          </div>
          <div className="text-muted small mt-2">
            Re-exports skip items already sent to your calendar to avoid duplicates.
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm w-100 mt-3"
            onClick={handleExportCalendar}
            disabled={!canExport}
          >
            Export .ics
          </button>
        </div>
      </div>

      <div
        className="col-12 col-md-9 p-0"
        style={{
          height: "calc(100vh - 90px)",
          overflowY: "auto",
          borderLeft: "1px solid #ddd"
        }}
      >
        <div className="schedule-calendar calendar-modern">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            buttonText={{ today: "Today" }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: ""
          }}
          titleFormat={{
            day: "2-digit",
            month: "short",
            year: "numeric"
          }}
          dayHeaderFormat={{
            weekday: "short",
            day: "2-digit",
            month: "short"
          }}
          nowIndicator={true}
            droppable={true}
            editable={true}
            eventDurationEditable={true}
            eventResizableFromStart={true}
            events={allEvents}
            eventReceive={handleEventReceive}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventContent={renderEventContent}
            eventAllow={(dropInfo, draggedEvent) =>
              isWithinDeadline(dropInfo.start, dropInfo.end, draggedEvent.title)
            }
            datesSet={(arg) => setCalendarRange({ start: arg.start, end: arg.end })}
            eventOverlap={false}
            slotMinTime={(() => {
              const rawEnd = prefs?.calendarEnd;
              let minMinutes = toMinutes(prefs?.calendarStart, 360);
              let maxMinutes = toMinutes(rawEnd, 1320);
              if (maxMinutes === 0 && typeof rawEnd === "string" && rawEnd.startsWith("00")) {
                maxMinutes = 1440;
              }
              if (maxMinutes <= minMinutes) {
                maxMinutes = Math.min(1440, minMinutes + 60);
              }
              const safeMin = Math.max(0, Math.min(minMinutes, maxMinutes - 60));
              const h = String(Math.floor(safeMin / 60)).padStart(2, "0");
              const m = String(safeMin % 60).padStart(2, "0");
              return `${h}:${m}:00`;
            })()}
            slotMaxTime={(() => {
              const rawEnd = prefs?.calendarEnd;
              const minMinutes = toMinutes(prefs?.calendarStart, 360);
              let maxMinutes = toMinutes(rawEnd, 1320);
              if (maxMinutes === 0 && typeof rawEnd === "string" && rawEnd.startsWith("00")) {
                maxMinutes = 1440;
              }
              if (maxMinutes <= minMinutes) {
                maxMinutes = Math.min(1440, minMinutes + 60);
              }
              const safeMax = Math.max(maxMinutes, minMinutes + 60);
              const h = String(Math.floor(safeMax / 60)).padStart(2, "0");
              const m = String(safeMax % 60).padStart(2, "0");
              return `${h}:${m}:00`;
            })()}
            slotLabelFormat={{
              hour: "numeric",
              minute: "2-digit",
              hour12: prefs?.timeFormat !== "24h",
            }}
            height="auto"
            stickyHeaderDates={true}
          />
        </div>
      </div>
    </div>
    </>
  );
}
