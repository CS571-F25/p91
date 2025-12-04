import React, { useState } from 'react';
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
  setSchedule
}) => {

  const presetColors = [
    '#0d6efd',
    '#6f42c1',
    '#20c997',
    '#ffc107',
    '#fd7e14',
    '#dc3545',
    '#198754'
  ];

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

  return (
    <div>
      <PageHeader title="📚 Manage Homework & Commitments" />

      <Row className="align-items-stretch">
        <Col lg={6} className="mb-4">
          <Card className="h-100 d-flex flex-column">
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
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: hwForm.color === color ? '2px solid #000' : '1px solid #ccc',
                      backgroundColor: color,
                      cursor: 'pointer'
                    }}
                    aria-label={`Choose color ${color}`}
                  />
                ))}
                <div style={{ position: 'relative', width: '40px', height: '32px' }}>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      background: '#fff',
                      cursor: 'pointer'
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
          <Card className="h-100 d-flex flex-column">
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

            <Input
              label="Start Time"
              type="time"
              value={commitmentForm.startTime}
              onChange={(e) => setCommitmentForm({ ...commitmentForm, startTime: e.target.value })}
            />

            <Input
              label="End Time"
              type="time"
              value={commitmentForm.endTime}
              onChange={(e) => setCommitmentForm({ ...commitmentForm, endTime: e.target.value })}
            />

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
