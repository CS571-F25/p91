import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';

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

  const getDisplayTime = (value) => {
    if (draftPrefs.timeFormat === "24h") return value || "";
    const normalized = to24h(value);
    if (normalized) return format12h(normalized);
    return value || "";
  };

  const splitTo12h = (value) => {
    const normalized = to24h(value);
    if (!normalized) return { time: "", meridiem: "AM" };
    const [hStr, mStr] = normalized.split(":");
    const hNum = parseInt(hStr, 10);
    const mNum = parseInt(mStr, 10);
    const meridiem = hNum >= 12 ? "PM" : "AM";
    const hour12 = ((hNum + 11) % 12) + 1;
    return {
      time: `${String(hour12).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`,
      meridiem
    };
  };

  const handleTimeChange = (field, meridiem) => (e) => {
    const raw = e.target.value;
    if (!raw) return;
    const [hStr, mStr] = raw.split(":");
    let hours = parseInt(hStr, 10);
    const minutes = mStr ? parseInt(mStr, 10) : 0;
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
                value={getDisplayTime(draftPrefs.calendarStart)}
                onChange={(e) => setDraftPrefs({ ...draftPrefs, calendarStart: e.target.value })}
                style={{ height: "38px", width: "100%" }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Calendar End</label>
              <Input
                type="time"
                value={getDisplayTime(draftPrefs.calendarEnd)}
                onChange={(e) => setDraftPrefs({ ...draftPrefs, calendarEnd: e.target.value })}
                style={{ height: "38px", width: "100%" }}
              />
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {(() => {
              const start12 = splitTo12h(draftPrefs.calendarStart);
              return (
                <div className="col-md-6">
                  <label className="form-label">Calendar Start</label>
                  <div className="row g-2 align-items-stretch">
                    <div className="col-9">
                      <Input
                        type="text"
                        value={start12.time}
                        onChange={(e) => handleTimeChange("calendarStart", start12.meridiem)(e)}
                        style={{ width: "100%", height: "38px" }}
                      />
                    </div>
                    <div className="col-3">
                      <select
                        className="form-select w-100"
                        value={start12.meridiem}
                        onChange={handleMeridiemChange("calendarStart", start12.time)}
                        style={{ height: "38px" }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const end12 = splitTo12h(draftPrefs.calendarEnd);
              return (
                <div className="col-md-6">
                  <label className="form-label">Calendar End</label>
                  <div className="row g-2 align-items-stretch">
                    <div className="col-9">
                      <Input
                        type="text"
                        value={end12.time}
                        onChange={(e) => handleTimeChange("calendarEnd", end12.meridiem)(e)}
                        style={{ width: "100%", height: "38px" }}
                      />
                    </div>
                    <div className="col-3">
                      <select
                        className="form-select w-100"
                        value={end12.meridiem}
                        onChange={handleMeridiemChange("calendarEnd", end12.time)}
                        style={{ height: "38px" }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })()}
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
