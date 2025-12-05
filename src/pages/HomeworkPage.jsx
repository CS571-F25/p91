// Not in nav bar anymore, keeping this as backup

import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Badge, Modal } from 'react-bootstrap';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import PageHeader from '../components/PageHeader';
import HomeworkItem from '../components/HomeworkItem';
import CommitmentItem from '../components/CommitmentItem';

const HomeworkPage = ({
  homework,
  setHomework,
  commitments,
  setCommitments,
  schedule,
  setSchedule,
  prefs
}) => {
  const timeFormat = prefs?.timeFormat || "12h";

  const presetColors = [
    '#0d6efd',
    '#6f42c1',
    '#20c997',
    '#ffc107',
    '#fd7e14',
    '#dc3545',
    '#198754'
  ];
  const swatchSize = 36;

  const [hwForm, setHwForm] = useState({
    name: '',
    hours: '',
    deadline: '',
    blockSize: '2',
    color: '#0d6efd'
  });

  const [editHomeworkId, setEditHomeworkId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    hours: '',
    deadline: '',
    blockSize: '',
    color: '#0d6efd'
  });
  const [showEditModal, setShowEditModal] = useState(false);

  const [commitmentForm, setCommitmentForm] = useState({
    days: [],
    startTime: '',
    endTime: '',
    description: '',
    endDate: ''
  });
  const [commitmentDisplay, setCommitmentDisplay] = useState({
    start: '',
    end: ''
  });

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB");
    } catch {
      return dateStr;
    }
  };

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday'
  ];

  const addHomework = () => {
    if (!hwForm.name || !hwForm.hours || !hwForm.deadline) return;

    const newHW = {
      id: Date.now(),
      name: hwForm.name,
      hours: hwForm.hours,
      deadline: hwForm.deadline,
      blockSize: hwForm.blockSize,
      color: hwForm.color || '#0d6efd'
    };

    setHomework(prev => [...prev, newHW]);

    setHwForm({
      name: '',
      hours: '',
    deadline: '',
      blockSize: '2',
      color: '#0d6efd'
    });
  };

  const updateHomeworkColor = (id, newColor) => {
    setHomework(prev =>
      prev.map(item =>
        item.id === id ? { ...item, color: newColor } : item
      )
    );
    setSchedule(prev =>
      prev.map(ev =>
        ev.homework === homework.find(h => h.id === id)?.name
          ? { ...ev, color: newColor }
          : ev
      )
    );
  };

  const startEditingHomework = (hw) => {
    setEditHomeworkId(hw.id);
    setEditForm({
      name: hw.name || '',
      hours: hw.hours || '',
      deadline: hw.deadline || '',
      blockSize: hw.blockSize || '',
      color: hw.color || '#0d6efd'
    });
    setShowEditModal(true);
  };

  const cancelEditing = () => {
    setEditHomeworkId(null);
    setShowEditModal(false);
    setEditForm({
      name: '',
      hours: '',
      deadline: '',
      blockSize: '',
      color: '#0d6efd'
    });
  };

  const saveHomeworkEdits = () => {
    if (!editHomeworkId) return;
    if (!editForm.name || !editForm.hours || !editForm.deadline) return;

    const original = homework.find((h) => h.id === editHomeworkId);
    if (!original) return;

    const updated = {
      ...original,
      name: editForm.name,
      hours: editForm.hours,
      deadline: editForm.deadline,
      blockSize: editForm.blockSize || original.blockSize,
      color: editForm.color || original.color || '#0d6efd'
    };

    setHomework((prev) =>
      prev.map((h) => (h.id === editHomeworkId ? updated : h))
    );

    setSchedule((prev) =>
      prev.map((ev) =>
        ev.homework === original.name
          ? { ...ev, homework: updated.name, color: updated.color }
          : ev
      )
    );

    cancelEditing();
  };

  const deleteHomework = (id) => {
    const hw = homework.find(h => h.id === id);
    if (!hw) return;

    setHomework(prev => prev.filter(h => h.id !== id));
    setSchedule(prev => prev.filter(ev => ev.homework !== hw.name));
  };

  const handleDayToggle = (day) => {
    setCommitmentForm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const addCommitment = () => {
    if (!commitmentForm.startTime || !commitmentForm.endTime || commitmentForm.days.length === 0)
      return;

    const newCommitments = commitmentForm.days.map(day => ({
      id: Date.now() + Math.random(),
      day,
      startTime: commitmentForm.startTime,
      endTime: commitmentForm.endTime,
      description: commitmentForm.description,
      endDate: commitmentForm.endDate || null
    }));

    setCommitments(prev => [...prev, ...newCommitments]);

    setCommitmentForm({
      days: [],
      startTime: '',
      endTime: '',
      description: '',
      endDate: ''
    });
  };

  const deleteCommitment = (id) => {
    setCommitments(prev => prev.filter(c => c.id !== id));
  };

  const currentEditingHomework = homework.find((h) => h.id === editHomeworkId);

  const getDayAbbr = (day) => {
    const abbr = {
      Monday: 'M', Tuesday: 'T', Wednesday: 'W',
      Thursday: 'Th', Friday: 'F', Saturday: 'Sa', Sunday: 'Su'
    };
    return abbr[day];
  };

  const getDayColor = (day) => {
    const colors = {
      Monday: '#FF6B6B',
      Tuesday: '#4ECDC4',
      Wednesday: '#45B7D1',
      Thursday: '#FFA07A',
      Friday: '#98D8C8',
      Saturday: '#A78BFA',
      Sunday: '#F687B3'
    };
    return colors[day];
  };

  const groupedCommitments = commitments.reduce((acc, c) => {
    const key = `${c.startTime}-${c.endTime}-${c.description}`;
    if (!acc[key]) {
      acc[key] = {
        startTime: c.startTime,
        endTime: c.endTime,
        description: c.description,
        days: [],
        ids: []
      };
    }
    acc[key].days.push(c.day);
    acc[key].ids.push(c.id);
    return acc;
  }, {});

  const groupedCommitmentsList = Object.values(groupedCommitments);

  const splitTo12h = (value) => {
    if (!value || typeof value !== "string") return { time: "", meridiem: "AM" };
    const [hStr, mStr] = value.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return { time: "", meridiem: "AM" };
    const meridiem = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return {
      time: `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      meridiem
    };
  };

  const to24h = (time, meridiem) => {
    if (!time) return "";
    const [hStr, mStr] =
      time.replace(/[^\d]/g, "").padStart(4, "0").match(/.{1,2}/g) || ["00", "00"];
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    let hour24 = h % 12;
    if (meridiem === "PM") hour24 += 12;
    return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const normalize12Input = (value) => {
    let cleaned = (value || "").replace(/[^\d]/g, "");
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);
    if (cleaned.length >= 3) {
      cleaned = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    } else if (cleaned.length === 2) {
      cleaned = `${cleaned}:`;
    }
    const [hRaw, mRaw] = cleaned.split(":");
    const hNum = parseInt(hRaw || "", 10);
    const mNum = parseInt(mRaw || "", 10);
    const hValid = !Number.isNaN(hNum) ? Math.min(Math.max(hNum, 1), 12) : NaN;
    const mValid = !Number.isNaN(mNum) ? Math.min(Math.max(mNum, 0), 59) : NaN;
    if (!Number.isNaN(hValid) && !Number.isNaN(mValid)) {
      return `${String(hValid).padStart(2, "0")}:${String(mValid).padStart(2, "0")}`;
    }
    if (!Number.isNaN(hValid) && cleaned.endsWith(":")) {
      return `${String(hValid).padStart(2, "0")}:`;
    }
    return cleaned;
  };

  const handleTimeInputChange12 = (field, meridiem) => (e) => {
    const displayKey = field === "endTime" ? "end" : "start";
    const normalized = normalize12Input(e.target.value);
    setCommitmentDisplay((prev) => ({ ...prev, [displayKey]: normalized }));
    if (/^\d{2}:\d{2}$/.test(normalized)) {
      const value24 = to24h(normalized, meridiem);
      setCommitmentForm((prev) => ({ ...prev, [field]: value24 }));
    } else {
      setCommitmentForm((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleMeridiemChange12 = (field) => (e) => {
    const displayKey = field === "endTime" ? "end" : "start";
    const displayValue = commitmentDisplay[displayKey];
    const normalized = normalize12Input(displayValue);
    setCommitmentDisplay((prev) => ({ ...prev, [displayKey]: normalized }));
    if (/^\d{2}:\d{2}$/.test(normalized)) {
      const value24 = to24h(normalized, e.target.value);
      setCommitmentForm((prev) => ({ ...prev, [field]: value24 }));
    }
  };

  useEffect(() => {
    const start12 = splitTo12h(commitmentForm.startTime);
    const end12 = splitTo12h(commitmentForm.endTime);
    setCommitmentDisplay({ start: start12.time, end: end12.time });
  }, [commitmentForm.startTime, commitmentForm.endTime]);

  return (
    <div>
      <PageHeader title="📚 Manage Homework & Commitments" />

      <Row className="align-items-stretch">
        <Col lg={6} className="mb-4">
          <Card>
            <h4>➕ Add Homework</h4>

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
              onChange={(e) =>
                setHwForm({
                  ...hwForm,
                  deadline: e.target.value
                })
              }
            />
            {hwForm.deadline && (
              <div className="text-muted small mb-3">
                Formatted: {formatDateDisplay(hwForm.deadline)}
              </div>
            )}

            <Input
              label="Block Size (hours)"
              type="number"
              step="0.5"
              value={hwForm.blockSize}
              onChange={(e) => setHwForm({ ...hwForm, blockSize: e.target.value })}
            />

            <div className="mb-3">
              <label className="form-label">Block Color</label>
              <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setHwForm({ ...hwForm, color })}
                    style={{
                      width: `${swatchSize}px`,
                      height: `${swatchSize}px`,
                      borderRadius: '6px',
                      border: hwForm.color === color ? '2px solid #000' : '1px solid #ccc',
                      backgroundColor: color,
                      cursor: 'pointer'
                    }}
                    aria-label={`Choose color ${color}`}
                  />
                ))}
                <div
                  style={{
                    position: 'relative',
                    width: `${swatchSize}px`,
                    height: `${swatchSize}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: `${swatchSize}px`,
                      height: `${swatchSize}px`,
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '1.9rem',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                    aria-label="Custom color"
                  />
                </div>
              </div>
            </div>

            <Button onClick={addHomework} className="w-100 mt-2">
              Add Homework
            </Button>

            {homework.length > 0 && (
              <div className="mt-4" style={{ maxHeight: "340px", overflowY: "auto" }}>
                <h5>Current Homework</h5>

                {homework.map(hw => (
                  <HomeworkItem
                    key={hw.id}
                    homework={hw}
                    dueText={hw.deadline ? formatDateDisplay(hw.deadline) : ""}
                    onDelete={() => deleteHomework(hw.id)}
                    onEdit={() => startEditingHomework(hw)}
                    onColorChange={(color) => updateHomeworkColor(hw.id, color)}
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <h4>📅 Add Commitment</h4>

            <Form.Group className="mb-3">
              <Form.Label>Days</Form.Label>

              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {daysOfWeek.map(day => (
                  <React.Fragment key={day}>
                    <Form.Check
                      type="checkbox"
                      id={day}
                      className="btn-check"
                      checked={commitmentForm.days.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor={day}
                      className={`btn btn-sm ${
                        commitmentForm.days.includes(day)
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                    >
                      {getDayAbbr(day)}
                    </label>
                  </React.Fragment>
                ))}
              </div>
            </Form.Group>

            {timeFormat === "24h" ? (
              <>
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
              </>
            ) : (
              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label">Start Time</label>
                  <div className="row g-2 align-items-stretch">
                    <div className="col-9">
                      <Input
                        type="text"
                        value={commitmentDisplay.start}
                        onChange={handleTimeInputChange12("startTime", splitTo12h(commitmentForm.startTime).meridiem)}
                        placeholder="--:--"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="col-3">
                      <select
                        className="form-select w-100"
                        value={splitTo12h(commitmentForm.startTime).meridiem}
                        onChange={handleMeridiemChange12("startTime")}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">End Time</label>
                  <div className="row g-2 align-items-stretch">
                    <div className="col-9">
                      <Input
                        type="text"
                        value={commitmentDisplay.end}
                        onChange={handleTimeInputChange12("endTime", splitTo12h(commitmentForm.endTime).meridiem)}
                        placeholder="--:--"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="col-3">
                      <select
                        className="form-select w-100"
                        value={splitTo12h(commitmentForm.endTime).meridiem}
                        onChange={handleMeridiemChange12("endTime")}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Description (optional)"
              value={commitmentForm.description}
              onChange={(e) => setCommitmentForm({ ...commitmentForm, description: e.target.value })}
            />

            <Input
              label="End Date (optional)"
              type="date"
              value={commitmentForm.endDate}
              onChange={(e) => setCommitmentForm({ ...commitmentForm, endDate: e.target.value })}
            />

            <Button
              className="w-100"
              onClick={addCommitment}
              disabled={
                commitmentForm.days.length === 0 ||
                !commitmentForm.startTime ||
                !commitmentForm.endTime
              }
            >
              Add Commitment
            </Button>

            {commitments.length > 0 && (
              <div className="mt-4" style={{ maxHeight: "340px", overflowY: "auto" }}>
                <h5>Current Commitments</h5>

                {groupedCommitmentsList.map((group, idx) => (
                  <CommitmentItem
                    key={idx}
                    group={group}
                    getDayColor={getDayColor}
                    getDayAbbr={getDayAbbr}
                    onDelete={() =>
                      setCommitments(prev => prev.filter(c => !group.ids.includes(c.id)))
                    }
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        show={!!editHomeworkId}
        onHide={cancelEditing}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Homework</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Input
            label="Assignment Name"
            value={editForm.name}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            label="Total Hours Needed"
            type="number"
            value={editForm.hours}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, hours: e.target.value }))
            }
          />
          <Input
            label="Deadline"
            type="date"
            value={editForm.deadline}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, deadline: e.target.value }))
            }
          />
          <Input
            label="Block Size (hours)"
            type="number"
            step="0.5"
            value={editForm.blockSize}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, blockSize: e.target.value }))
            }
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={cancelEditing}>
            Cancel
          </Button>
          <Button onClick={saveHomeworkEdits}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HomeworkPage;
