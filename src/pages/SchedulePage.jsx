import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";

export default function SchedulePage({
  homework,
  schedule,
  setSchedule,
  commitments
}) {
  const [selectedHomeworkId, setSelectedHomeworkId] = useState("");

  const sidebarRef = useRef(null);
  const draggableInitRef = useRef(false);

  const selectedHomework =
    homework.find((h) => h.id.toString() === selectedHomeworkId) || null;

  const formatTime = (t) => (t && t.length === 5 ? t : null);

  const homeworkEvents = schedule.map((s) => ({
    id: (s.id ?? Date.now() + Math.random()).toString(),
    title: s.homework,
    start: s.start,
    end: s.end,
    backgroundColor: "#0d6efd",
    borderColor: "#0a58ca",
    editable: true
  }));

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
      backgroundColor: "#6c757d",
      borderColor: "#495057",
      editable: false
    }));

  const events = [...homeworkEvents, ...commitmentEvents];

  useEffect(() => {
    if (sidebarRef.current && !draggableInitRef.current) {
      draggableInitRef.current = true;

      new Draggable(sidebarRef.current, {
        itemSelector: ".draggable-block",
        eventData: (el) => ({
          title: el.getAttribute("data-title"),
          duration: {
            hours: parseFloat(el.getAttribute("data-block-size"))
          }
        })
      });
    }
  }, []);

  const handleEventReceive = (info) => {
    if (!selectedHomework) return;

    const blockSize = parseFloat(selectedHomework.blockSize);

    info.event.remove();

    const start = info.event.start;
    const end = new Date(start.getTime() + blockSize * 60 * 60 * 1000);

    setSchedule((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        homework: selectedHomework.name,
        start,
        end
      }
    ]);
  };

  const handleDeleteEvent = (event) => {
    if (event.id.startsWith("commit-")) return;

    event.remove();

    setSchedule((prev) =>
      prev.filter((ev) => (ev.id ?? "").toString() !== event.id.toString())
    );
  };

  const renderEventContent = (info) => {
    const isCommitment = info.event.id.startsWith("commit-");

    return (
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
    );
  };

  let blocksRemaining = 0;
  if (selectedHomework) {
    const totalHours = parseFloat(selectedHomework.hours);
    const blockSize = parseFloat(selectedHomework.blockSize);

    const blocksNeeded = Math.ceil(totalHours / blockSize);
    const blocksScheduled = schedule.filter(
      (ev) => ev.homework === selectedHomework.name
    ).length;

    blocksRemaining = Math.max(0, blocksNeeded - blocksScheduled);
  }

  return (
    <div className="row">
      <div className="col-12 col-md-3 border-end p-3" ref={sidebarRef}>
        <h4 className="mb-3">Plan Homework</h4>

        <label className="form-label fw-bold">Select Homework</label>
        <select
          className="form-select mb-3"
          value={selectedHomeworkId}
          onChange={(e) => setSelectedHomeworkId(e.target.value)}
        >
          <option value="">-- Choose Homework --</option>
          {homework.map((hw) => (
            <option key={hw.id} value={hw.id}>
              {hw.name} ({hw.hours}h total)
            </option>
          ))}
        </select>

        {selectedHomework && (
          <>
            <div className="mb-2">
              <strong>Block Size:</strong> {selectedHomework.blockSize}h
            </div>

            <div className="mb-3">
              <strong>Blocks Remaining:</strong> {blocksRemaining}
            </div>

            {blocksRemaining > 0 && (
              <div
                className="p-3 bg-primary text-white rounded draggable-block"
                data-title={selectedHomework.name}
                data-block-size={selectedHomework.blockSize}
                style={{ cursor: "grab", userSelect: "none" }}
              >
                Drag Block:
                <br />
                <strong>{selectedHomework.name}</strong>
                <br />({selectedHomework.blockSize}h)
              </div>
            )}

            {blocksRemaining === 0 && (
              <div className="text-success fw-bold">
                🎉 All blocks scheduled!
              </div>
            )}
          </>
        )}
      </div>

      <div
        className="col-12 col-md-9 p-0"
        style={{
          height: "calc(100vh - 90px)",
          overflowY: "scroll",
          borderLeft: "1px solid #ddd"
        }}
      >
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          droppable={true}
          editable={true}
          events={events}
          eventReceive={handleEventReceive}
          eventContent={renderEventContent}
          eventOverlap={false}
          slotMinTime="06:00:00"
          height="auto"
        />
      </div>
    </div>
  );
}
