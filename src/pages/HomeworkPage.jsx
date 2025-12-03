import React, { useState } from 'react';
import { Row, Col, Form, Badge } from 'react-bootstrap';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const HomeworkPage = ({
  homework,
  setHomework,
  commitments,
  setCommitments,
  schedule,
  setSchedule
}) => {

  const [hwForm, setHwForm] = useState({
    name: '',
    hours: '',
    deadline: '',
    blockSize: '2'
  });

  const [commitmentForm, setCommitmentForm] = useState({
    days: [],
    startTime: '',
    endTime: '',
    description: ''
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday'
  ];

  // ADD HOMEWORK
  const addHomework = () => {
    if (!hwForm.name || !hwForm.hours || !hwForm.deadline) return;

    const newHW = {
      id: Date.now(),
      name: hwForm.name,
      hours: hwForm.hours,
      deadline: hwForm.deadline,
      blockSize: hwForm.blockSize
    };

    setHomework(prev => [...prev, newHW]);

    setHwForm({
      name: '',
      hours: '',
      deadline: '',
      blockSize: '2'
    });
  };

  // DELETE HOMEWORK + ITS SCHEDULED BLOCKS
  const deleteHomework = (id) => {
    const hw = homework.find(h => h.id === id);
    if (!hw) return;

    setHomework(prev => prev.filter(h => h.id !== id));
    setSchedule(prev => prev.filter(ev => ev.homework !== hw.name));
  };

  // ---------------- COMMITMENT LOGIC (unchanged) ----------------

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
      description: commitmentForm.description
    }));

    setCommitments(prev => [...prev, ...newCommitments]);

    setCommitmentForm({
      days: [],
      startTime: '',
      endTime: '',
      description: ''
    });
  };

  const deleteCommitment = (id) => {
    setCommitments(prev => prev.filter(c => c.id !== id));
  };

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
      <h1 className="container pt-4">📚 Manage Homework & Commitments</h1>

      <Row>
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
              onChange={(e) => setHwForm({ ...hwForm, deadline: e.target.value })}
            />

            <Input
              label="Block Size (hours)"
              type="number"
              step="0.5"
              value={hwForm.blockSize}
              onChange={(e) => setHwForm({ ...hwForm, blockSize: e.target.value })}
            />

            <Button onClick={addHomework} className="w-100 mt-2">
              Add Homework
            </Button>

            {homework.length > 0 && (
              <div className="mt-4">
                <h5>Current Homework</h5>

                {homework.map(hw => (
                  <div
                    key={hw.id}
                    className="p-3 border rounded d-flex justify-content-between align-items-center mt-2 shadow-sm bg-white"
                  >
                    <div>
                      <strong>{hw.name}</strong>
                      <div className="text-muted">
                        {hw.hours}h total — {hw.blockSize}h blocks
                      </div>
                      <div className="text-muted small">
                      Due {
                        hw.deadline
                          ? new Date(hw.deadline + "T12:00:00").toLocaleDateString()
                          : ""
                      }
                      </div>
                    </div>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteHomework(hw.id)}
                    >
                      🗑️
                    </button>
                  </div>
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
              <div className="mt-4">
                <h5>Current Commitments</h5>

                {groupedCommitmentsList.map((group, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded mt-2 shadow-sm bg-white"
                    style={{ borderLeft: `4px solid ${getDayColor(group.days[0])}` }}
                  >
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>{group.startTime} - {group.endTime}</strong>
                        <div className="text-muted small">{group.description}</div>

                        <div className="mt-1">
                          {group.days.map((day, i) => (
                            <span
                              key={i}
                              className="badge me-1"
                              style={{ backgroundColor: getDayColor(day) }}
                            >
                              {getDayAbbr(day)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          setCommitments(prev =>
                            prev.filter(c => !group.ids.includes(c.id))
                          )
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeworkPage;
