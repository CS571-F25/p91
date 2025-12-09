import React, { useEffect, useState } from "react";

const clampTwoDigits = (val) => {
  const trimmed = (val || "").replace(/\D/g, "").slice(0, 2);
  return trimmed;
};

const parse24To12 = (value) => {
  if (!value) return { hour: "", minute: "", meridiem: "AM" };
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { hour: "", minute: "", meridiem: "AM" };
  const h24 = parseInt(match[1], 10);
  const minute = match[2];
  const meridiem = h24 >= 12 ? "PM" : "AM";
  const hour12 = ((h24 + 11) % 12) + 1;
  return { hour: String(hour12).padStart(2, "0"), minute, meridiem };
};

const to24h = (hourText, minuteText, meridiem) => {
  if (!hourText || !minuteText) return "";
  const h = parseInt(hourText, 10);
  const m = parseInt(minuteText, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  if (h < 1 || h > 12 || m < 0 || m > 59) return "";
  let hour24 = h % 12;
  if (meridiem === "PM") hour24 += 12;
  const hh = String(hour24).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
};

export default function SegmentedTimeInput({
  value,
  onChange,
  label,
  id,
  className = ""
}) {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [meridiem, setMeridiem] = useState("AM");
  const hourRef = React.useRef(null);
  const minuteRef = React.useRef(null);

  useEffect(() => {
    if (!value) return;
    const parsed = parse24To12(value);
    const currentNormalized = to24h(hour, minute, meridiem);
    if (currentNormalized === value) return;
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setMeridiem(parsed.meridiem);
  }, [value]);

  const emitChange = (nextHour, nextMinute, nextMeridiem) => {
    const normalized = to24h(nextHour, nextMinute, nextMeridiem);
    if (onChange) onChange(normalized || "");
  };

  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <label className="visually-hidden" htmlFor={id ? `${id}-hour` : undefined}>
        {label || "Time"} hours
      </label>
      <input
        id={id ? `${id}-hour` : undefined}
        className="form-control text-center"
        style={{ width: "64px" }}
        placeholder="--"
        inputMode="numeric"
        autoComplete="off"
        name={id ? `${id}-hour` : "time-hour"}
        value={hour}
        ref={hourRef}
        onChange={(e) => {
          const next = clampTwoDigits(e.target.value);
          setHour(next);
          emitChange(next, minute, meridiem);
          // Auto-advance when hour is complete: immediately if it's a single-digit hour (2-9),
          // or after two digits (10-12).
          if ((next.length === 1 && next !== "1" && next !== "0") || next.length === 2) {
            minuteRef.current?.focus();
            minuteRef.current?.select();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === ":" || e.key === "Enter") {
            e.preventDefault();
            minuteRef.current?.focus();
            minuteRef.current?.select();
          }
        }}
      />
      <span aria-hidden="true">:</span>
      <label className="visually-hidden" htmlFor={id ? `${id}-minute` : undefined}>
        {label || "Time"} minutes
      </label>
      <input
        id={id ? `${id}-minute` : undefined}
        className="form-control text-center"
        style={{ width: "64px" }}
        placeholder="--"
        inputMode="numeric"
        autoComplete="off"
        name={id ? `${id}-minute` : "time-minute"}
        value={minute}
        ref={minuteRef}
        onChange={(e) => {
          const next = clampTwoDigits(e.target.value);
          setMinute(next);
          emitChange(hour, next, meridiem);
        }}
      />
      <label className="visually-hidden" htmlFor={id ? `${id}-meridiem` : undefined}>
        {label || "Time"} AM/PM
      </label>
      <select
        id={id ? `${id}-meridiem` : undefined}
        className="form-select"
        style={{ width: "90px" }}
        autoComplete="off"
        name={id ? `${id}-meridiem` : "time-meridiem"}
        value={meridiem}
        onChange={(e) => {
          const next = e.target.value;
          setMeridiem(next);
          emitChange(hour, minute, next);
        }}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
