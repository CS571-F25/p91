import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import PageHeader from "../components/PageHeader";
import CalendarLegend from "../components/CalendarLegend";
import { Modal, Form } from "react-bootstrap";
import Input from "../components/Input";
import Button from "../components/Button";
import Card from "../components/Card";

export default function SchedulePage({
  homework,
  setHomework,
  schedule,
  setSchedule,
  commitments,
  setCommitments,
  prefs
}) {
  const defaultColor = "#0d6efd";
  const [calendarRange, setCalendarRange] = useState({ start: null, end: null });
  const [shadedHomework, setShadedHomework] = useState(null);
  const [highlightConflicts, setHighlightConflicts] = useState(false);
  const [enableHistory, setEnableHistory] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState("homework");
  const [editingHomeworkId, setEditingHomeworkId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    name: "",
    hours: "",
    deadline: "",
    blockSize: "",
    color: defaultColor
  });
  const presetColors = [
    "#0d6efd",
    "#6f42c1",
    "#20c997",
    "#ffc107",
    "#fd7e14",
    "#dc3545",
    "#198754"
  ];
  const swatchSize = 32;
  const [hwForm, setHwForm] = useState({
    name: "",
    hours: "",
    deadline: "",
    blockSize: "2",
    color: "#0d6efd"
  });
  const [commitmentForm, setCommitmentForm] = useState({
    days: [],
    startTime: "",
    endTime: "",
    description: "",
    endDate: ""
  });
  const [showExportModal, setShowExportModal] = useState(false);

  const sidebarRef = useRef(null);
  const draggableInstanceRef = useRef(null);

  const cloneSchedule = (arr) =>
    (arr || []).map((ev) => ({
      ...ev,
      start: ev.start ? new Date(ev.start) : ev.start,
      end: ev.end ? new Date(ev.end) : ev.end
    }));

  const resetHistory = () => {
    setUndoStack([]);
    setRedoStack([]);
  };

  const pushHistory = () => {
    if (!enableHistory) return;
    setUndoStack((prev) => [...prev, cloneSchedule(schedule)]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (!enableHistory || undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, cloneSchedule(schedule)]);
    setSchedule(cloneSchedule(previous));
  };

  const handleRedo = () => {
    if (!enableHistory || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, cloneSchedule(schedule)]);
    setSchedule(cloneSchedule(next));
  };

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

  const dayToIndex = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };

  const conflictsWithCommitments = (start, end) => {
    if (!start || !end) return false;
    const dayIdx = new Date(start).getDay();
    const startMinutes =
      start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    return (commitments || []).some((c) => {
      if (!c || !c.day || dayToIndex[c.day] !== dayIdx) return false;
      const startStr = formatTime(c.startTime);
      const endStr = formatTime(c.endTime);
      if (!startStr || !endStr) return false;
      const [sh, sm] = startStr.split(":").map((n) => parseInt(n, 10));
      const [eh, em] = endStr.split(":").map((n) => parseInt(n, 10));
      const cStart = sh * 60 + sm;
      const cEnd = eh * 60 + em;
      return Math.max(startMinutes, cStart) < Math.min(endMinutes, cEnd);
    });
  };

  const homeworkEvents = schedule.map((s) => {
    const color =
      s.color ||
      homework.find((h) => h.name === s.homework)?.color ||
      defaultColor;
    const conflict =
      highlightConflicts &&
      conflictsWithCommitments(
        s.start ? new Date(s.start) : null,
        s.end ? new Date(s.end) : null
      );

    return {
      id: (s.id ?? Date.now() + Math.random()).toString(),
      title: s.homework,
      start: s.start,
      end: s.end,
      backgroundColor: color,
      borderColor: color,
      editable: true,
      classNames: conflict ? ["event-conflict"] : []
    };
  });

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

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const handleDayToggle = (day) => {
    setCommitmentForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day]
    }));
  };

  const addHomeworkFromModal = () => {
    if (!hwForm.name || !hwForm.hours || !hwForm.deadline) return;
    const newHW = {
      id: Date.now(),
      name: hwForm.name,
      hours: hwForm.hours,
      deadline: hwForm.deadline,
      blockSize: hwForm.blockSize,
      color: hwForm.color || defaultColor
    };
    setHomework?.((prev) => [...prev, newHW]);
    setHwForm({
      name: "",
      hours: "",
      deadline: "",
      blockSize: "2",
      color: defaultColor
    });
    setShowAddModal(false);
  };

  const addCommitmentFromModal = () => {
    if (
      commitmentForm.days.length === 0 ||
      !commitmentForm.startTime ||
      !commitmentForm.endTime
    )
      return;

    const newCommitments = commitmentForm.days.map((day) => ({
      id: Date.now() + Math.random(),
      day,
      startTime: commitmentForm.startTime,
      endTime: commitmentForm.endTime,
      description: commitmentForm.description,
      endDate: commitmentForm.endDate || null
    }));

    setCommitments?.((prev) => [...prev, ...newCommitments]);
    setCommitmentForm({
      days: [],
      startTime: "",
      endTime: "",
      description: "",
      endDate: ""
    });
    setShowAddModal(false);
  };

  const startEditHomework = (hw) => {
    setEditForm({
      id: hw.id,
      name: hw.name || "",
      hours: hw.hours || "",
      deadline: hw.deadline || "",
      blockSize: hw.blockSize || "2",
      color: hw.color || defaultColor
    });
    setShowEditModal(true);
  };

  const deleteHomeworkFromSidebar = (hw) => {
    if (!window.confirm(`Delete "${hw.name}" and its scheduled blocks?`)) return;
    setHomework?.((prev) => prev.filter((h) => h.id !== hw.id));
    setSchedule?.((prev) => prev.filter((ev) => ev.homework !== hw.name));
  };

  const getDeadlineForHomework = (homeworkName) => {
    const hw = homework.find((h) => h.name === homeworkName);
    if (!hw || !hw.deadline) return null;

    return new Date(hw.deadline + "T23:59:59");
  };

  useEffect(() => {
    if (!sidebarRef.current) return;
    if (draggableInstanceRef.current) {
      draggableInstanceRef.current.destroy();
    }
    draggableInstanceRef.current = new Draggable(sidebarRef.current, {
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
  }, [homework]);

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

    pushHistory();
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

    pushHistory();
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

    pushHistory();
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

    pushHistory();
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
        className="d-flex justify-content-between align-items-center mb-3 schedule-toolbar"
        style={{ paddingLeft: "25%" }}
      >
        <CalendarLegend direction="row" className="mt-0" hideLabel />
        <div className="d-flex gap-2 align-items-center">
          <Button
            onClick={() => {
              setModalTab("homework");
              setShowAddModal(true);
            }}
            className="btn-sm"
          >
            ➕ Add Homework
          </Button>
          <Button
            onClick={() => {
              setModalTab("commitment");
              setShowAddModal(true);
            }}
            className="btn-sm"
            variant="outline-primary"
          >
            ➕ Add Commitment
          </Button>
          <Button
            onClick={() => setShowExportModal(true)}
            className="btn-sm"
            variant="outline-secondary"
          >
            Export / Subscribe
          </Button>
        </div>
      </div>
      <div
        className="row"
        style={{ paddingBottom: "30px" }}
      >
      <div
        className="col-12 col-md-3 border-end px-3 py-2 d-flex flex-column"
        style={{ height: "calc(100vh - 90px)" }}
      >
        <h4 className="mb-3 flex-shrink-0">Plan Homework</h4>
        <div className="text-muted small mb-2 flex-shrink-0">
          Scroll to see more homework items
        </div>
        <div
          className="flex-grow-1 overflow-auto"
          ref={sidebarRef}
        >
          {homework.length === 0 && (
            <div className="text-muted">Add homework to start planning.</div>
          )}

          {homework
            .filter((hw) => getRemainingHours(hw) > 0.0001)
            .map((hw) => {
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
                  style={{ position: "relative" }}
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
                  <div className="d-flex justify-content-end gap-2 mb-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => startEditHomework(hw)}
                    >
                      ⋯ Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteHomeworkFromSidebar(hw)}
                    >
                      🗑️
                    </button>
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
                </div>
              );
            })}
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
          allDaySlot={false}
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

    <Modal
      show={showAddModal}
      onHide={() => setShowAddModal(false)}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {modalTab === "homework" ? "Add Homework" : "Add Commitment"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {modalTab === "homework" ? (
          <div className="row">
            <div className="col-12 mb-3" style={{ border: "1px solid #0d6efd", borderRadius: "8px", padding: "4px" }}>
              <Card>
                <h5>➕ Add Homework</h5>
                <Input
                  label="Assignment Name"
                  value={hwForm.name}
                  onChange={(e) => setHwForm({ ...hwForm, name: e.target.value })}
                />
                <Input
                  label="Total Hours Needed"
                  type="number"
                  value={hwForm.hours}
                  onChange={(e) => setHwForm({ ...hwForm, hours: e.target.value })}
                />
                <Input
                  label="Deadline"
                  type="date"
                  value={hwForm.deadline}
                  onChange={(e) => setHwForm({ ...hwForm, deadline: e.target.value })}
                />
                <Input
                  label="Block Size (hours)"
                  type="number"
                  step="0.5"
                  value={hwForm.blockSize}
                  onChange={(e) => setHwForm({ ...hwForm, blockSize: e.target.value })}
                />
                <div className="mb-3">
                  <label className="form-label">Block Color</label>
                  <div className="d-flex align-items-center justify-content-start gap-2 flex-wrap">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setHwForm({ ...hwForm, color })}
                        style={{
                          width: `${swatchSize}px`,
                          height: `${swatchSize}px`,
                          borderRadius: "6px",
                          border:
                            hwForm.color === color ? "2px solid #000" : "1px solid #ccc",
                          backgroundColor: color,
                          cursor: "pointer"
                        }}
                        aria-label={`Choose color ${color}`}
                      />
                    ))}
                    <div
                      style={{
                        position: "relative",
                        width: `${swatchSize}px`,
                        height: `${swatchSize}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          width: `${swatchSize}px`,
                          height: `${swatchSize}px`,
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          background: "#fff",
                          cursor: "pointer",
                          fontSize: "1.6rem",
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0
                        }}
                        aria-label="Custom color"
                      >
                        🎨
                      </button>
                      <input
                        type="color"
                        value={hwForm.color}
                        onChange={(e) => setHwForm({ ...hwForm, color: e.target.value })}
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0,
                          cursor: "pointer"
                        }}
                        aria-label="Custom color"
                      />
                    </div>
                  </div>
                </div>
                <Button className="w-100" onClick={addHomeworkFromModal}>
                  Add Homework
                </Button>
              </Card>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-12 mb-3" style={{ border: "1px solid #0d6efd", borderRadius: "8px", padding: "4px" }}>
              <Card>
                <h5>📅 Add Commitment</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Days</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <React.Fragment key={day}>
                        <Form.Check
                          type="checkbox"
                          id={`modal-${day}`}
                          className="btn-check"
                          checked={commitmentForm.days.includes(day)}
                          onChange={() => handleDayToggle(day)}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor={`modal-${day}`}
                          className={`btn btn-sm ${
                            commitmentForm.days.includes(day)
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </label>
                      </React.Fragment>
                    ))}
                  </div>
                </Form.Group>

                <Input
                  label="Start Time"
                  type="time"
                  value={commitmentForm.startTime}
                  onChange={(e) =>
                    setCommitmentForm({ ...commitmentForm, startTime: e.target.value })
                  }
                />

                <Input
                  label="End Time"
                  type="time"
                  value={commitmentForm.endTime}
                  onChange={(e) =>
                    setCommitmentForm({ ...commitmentForm, endTime: e.target.value })
                  }
                />

                <Input
                  label="Description (optional)"
                  value={commitmentForm.description}
                  onChange={(e) =>
                    setCommitmentForm({ ...commitmentForm, description: e.target.value })
                  }
                />

                <Input
                  label="End Date (optional)"
                  type="date"
                  value={commitmentForm.endDate}
                  onChange={(e) =>
                    setCommitmentForm({ ...commitmentForm, endDate: e.target.value })
                  }
                />

                <Button
                  className="w-100"
                  onClick={addCommitmentFromModal}
                  disabled={
                    commitmentForm.days.length === 0 ||
                    !commitmentForm.startTime ||
                    !commitmentForm.endTime
                  }
                >
                  Add Commitment
                </Button>
              </Card>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>

    <Modal
      show={showEditModal}
      onHide={() => setShowEditModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit Homework</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Input
          label="Assignment Name"
          value={editForm.name}
          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <Input
          label="Total Hours Needed"
          type="number"
          value={editForm.hours}
          onChange={(e) => setEditForm((prev) => ({ ...prev, hours: e.target.value }))}
        />
        <Input
          label="Deadline"
          type="date"
          value={editForm.deadline}
          onChange={(e) => setEditForm((prev) => ({ ...prev, deadline: e.target.value }))}
        />
        <Input
          label="Block Size (hours)"
          type="number"
          step="0.5"
          value={editForm.blockSize}
          onChange={(e) => setEditForm((prev) => ({ ...prev, blockSize: e.target.value }))}
        />
        <div className="mb-3">
          <label className="form-label">Block Color</label>
          <div className="d-flex align-items-center justify-content-start gap-2 flex-wrap">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setEditForm((prev) => ({ ...prev, color }))}
                style={{
                  width: `${swatchSize}px`,
                  height: `${swatchSize}px`,
                  borderRadius: "6px",
                  border:
                    editForm.color === color ? "2px solid #000" : "1px solid #ccc",
                  backgroundColor: color,
                  cursor: "pointer"
                }}
                aria-label={`Choose color ${color}`}
              />
            ))}
            <div
              style={{
                position: "relative",
                width: `${swatchSize}px`,
                height: `${swatchSize}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <button
                type="button"
                style={{
                  width: `${swatchSize}px`,
                  height: `${swatchSize}px`,
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "1.6rem",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0
                }}
                aria-label="Custom color"
              >
                🎨
              </button>
              <input
                type="color"
                value={editForm.color || defaultColor}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, color: e.target.value }))
                }
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer"
                }}
                aria-label="Custom color"
              />
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            const targetId = editForm.id;
            const original = homework.find((h) => h.id === targetId);
            if (!original || !editForm.name || !editForm.hours || !editForm.deadline) {
              setShowEditModal(false);
              return;
            }
            const updated = {
              ...original,
              name: editForm.name,
              hours: editForm.hours,
              deadline: editForm.deadline,
              blockSize: editForm.blockSize || original.blockSize,
              color: editForm.color || original.color || defaultColor
            };
            setHomework?.((prev) => prev.map((h) => (h.id === targetId ? updated : h)));
            setSchedule?.((prev) =>
              prev.map((ev) =>
                ev.homework === original.name
                  ? { ...ev, homework: updated.name, color: updated.color }
                  : ev
              )
            );
            setShowEditModal(false);
          }}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal
      show={showExportModal}
      onHide={() => setShowExportModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Export / Subscribe</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="form-check mb-2">
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
        <div className="form-check mb-2">
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
        <div className="text-muted small">
          Re-exports skip items already sent to your calendar to avoid duplicates.
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setShowExportModal(false)}>
          Close
        </Button>
        <Button onClick={handleExportCalendar} disabled={!canExport}>
          Export .ics
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
}
