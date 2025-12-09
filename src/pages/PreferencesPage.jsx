import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import SegmentedTimeInput from '../components/SegmentedTimeInput';

export default function PreferencesPage({ prefs, setPrefs }) {
  const effectivePrefs = {
    startTime: prefs?.startTime || '08:00',
    endTime: prefs?.endTime || '22:00',
    breaks: prefs?.breaks || [],
    timeFormat: prefs?.timeFormat || '12h',
    calendarStart: prefs?.calendarStart || '06:00',
    calendarEnd: prefs?.calendarEnd || '22:00'
  };

  const [draftPrefs, setDraftPrefs] = useState(effectivePrefs);

  useEffect(() => {
    setDraftPrefs(effectivePrefs);
  }, [prefs?.startTime, prefs?.endTime, prefs?.timeFormat, prefs?.calendarStart, prefs?.calendarEnd]);

  const to24h = (value) => {
    if (!value) return null;
    const trimmed = value.trim();
    const ampmMatch = trimmed.match(/^(\d{1,2}):?(\d{0,2})?\s*(am|pm)$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1] || "0", 10);
      const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
      const isPM = ampmMatch[3].toLowerCase() === "pm";
      if (hours === 12) hours = isPM ? 12 : 0;
      else if (isPM) hours += 12;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    const hhmm = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) {
      const hours = Math.min(23, Math.max(0, parseInt(hhmm[1], 10)));
      const minutes = Math.min(59, Math.max(0, parseInt(hhmm[2], 10)));
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    return null;
  };

  const format12h = (value) => {
    const normalized = to24h(value);
    if (!normalized) return "";
    const [h, m] = normalized.split(":").map((n) => parseInt(n, 10));
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  const handleTimeChange = (field, meridiem) => (e) => {
    const raw = e.target.value;
    if (!raw) {
      setDraftPrefs({ ...draftPrefs, [field]: "" });
      return;
    }
    const match = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10) || 0;
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    const normalized = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    setDraftPrefs({ ...draftPrefs, [field]: normalized });
  };

  const handleMeridiemChange = (field, currentTime) => (e) => {
    const newMer = e.target.value;
    const normalized = to24h(`${currentTime} ${newMer}`);
    setDraftPrefs({
      ...draftPrefs,
      [field]: normalized || draftPrefs[field]
    });
  };

  const handleSave = () => {
    setPrefs(draftPrefs);
  };

  const isDirty =
    draftPrefs.timeFormat !== effectivePrefs.timeFormat ||
    draftPrefs.calendarStart !== effectivePrefs.calendarStart ||
    draftPrefs.calendarEnd !== effectivePrefs.calendarEnd;

  return (
    <div>
      <PageHeader title="⚙️ Preferences" />

      <Card className="mb-4">
        <h3 className="text-center">🗓️ Time Format</h3>
        <p className="text-muted text-center">Choose how times are displayed</p>
        <div className="row justify-content-center">
          <div className="col-12 col-md-6">
            <label className="form-label text-center d-block">Time Format</label>
            <select
              className="form-select mb-3 text-center"
              value={draftPrefs.timeFormat}
              onChange={(e) => setDraftPrefs({ ...draftPrefs, timeFormat: e.target.value })}
            >
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <h3>⏰ Calendar Hours</h3>
        <p className="text-muted">Limit the calendar to your typical study window</p>
        {draftPrefs.timeFormat === "24h" ? (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Calendar Start</label>
              <Input
                type="time"
                value={draftPrefs.calendarStart}
                onChange={(e) => setDraftPrefs({ ...draftPrefs, calendarStart: e.target.value })}
                style={{ height: "38px", width: "100%" }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Calendar End</label>
              <Input
                type="time"
                value={draftPrefs.calendarEnd}
                onChange={(e) => setDraftPrefs({ ...draftPrefs, calendarEnd: e.target.value })}
                style={{ height: "38px", width: "100%" }}
              />
            </div>
          </div>
        ) : (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Calendar Start</label>
              <SegmentedTimeInput
                value={draftPrefs.calendarStart}
                onChange={(val) => setDraftPrefs({ ...draftPrefs, calendarStart: val })}
                label="Calendar Start"
                id="calendar-start"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Calendar End</label>
              <SegmentedTimeInput
                value={draftPrefs.calendarEnd}
                onChange={(val) => setDraftPrefs({ ...draftPrefs, calendarEnd: val })}
                label="Calendar End"
                id="calendar-end"
              />
            </div>
          </div>
        )}
      </Card>

      <div className="d-flex justify-content-end">
        <Button
          onClick={handleSave}
          disabled={!isDirty}
          variant={isDirty ? "primary" : "secondary"}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
