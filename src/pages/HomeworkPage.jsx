import React, { useState } from 'react';
import { Row, Col, Form, Badge } from 'react-bootstrap';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const HomeworkPage = ({ homework, setHomework, commitments, setCommitments }) => {
  const [hwForm, setHwForm] = useState({ name: '', hours: '', deadline: '', blockSize: '2' });
  const [commitmentForm, setCommitmentForm] = useState({ 
    days: [], 
    startTime: '', 
    endTime: '', 
    description: '' 
  });
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const addHomework = () => {
    if (hwForm.name && hwForm.hours && hwForm.deadline) {
      setHomework([...homework, { ...hwForm, id: Date.now() }]);
      setHwForm({ name: '', hours: '', deadline: '', blockSize: '2' });
    }
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
    if (commitmentForm.days.length > 0 && commitmentForm.startTime && commitmentForm.endTime) {
      const newCommitments = commitmentForm.days.map(day => ({
        day,
        startTime: commitmentForm.startTime,
        endTime: commitmentForm.endTime,
        description: commitmentForm.description,
        id: Date.now() + Math.random()
      }));
      
      setCommitments([...commitments, ...newCommitments]);
      setCommitmentForm({ days: [], startTime: '', endTime: '', description: '' });
    }
  };
  
  const deleteHomework = (id) => {
    setHomework(homework.filter(hw => hw.id !== id));
  };
  
  const deleteCommitment = (id) => {
    setCommitments(commitments.filter(c => c.id !== id));
  };
  
  const getDayAbbr = (day) => {
    const abbr = {
      'Monday': 'M',
      'Tuesday': 'T',
      'Wednesday': 'W',
      'Thursday': 'Th',
      'Friday': 'F',
      'Saturday': 'Sa',
      'Sunday': 'Su'
    };
    return abbr[day];
  };

  const getDayColor = (day) => {
    const colors = {
      'Monday': '#FF6B6B',
      'Tuesday': '#4ECDC4',
      'Wednesday': '#45B7D1',
      'Thursday': '#FFA07A',
      'Friday': '#98D8C8',
      'Saturday': '#A78BFA',
      'Sunday': '#F687B3'
    };
    return colors[day];
  };

  const groupedCommitments = commitments.reduce((acc, commitment) => {
    const key = `${commitment.startTime}-${commitment.endTime}-${commitment.description}`;
    if (!acc[key]) {
      acc[key] = {
        startTime: commitment.startTime,
        endTime: commitment.endTime,
        description: commitment.description,
        days: [],
        ids: []
      };
    }
    acc[key].days.push(commitment.day);
    acc[key].ids.push(commitment.id);
    return acc;
  }, {});

  const groupedCommitmentsList = Object.values(groupedCommitments);
  
  return (
    <div>
      <h1 className="mb-4">📚 Manage Homework & Commitments</h1>
      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <h4 className="mb-3">➕ Add Homework or Study Session</h4>
            <Input 
              label="Assignment Name"
              value={hwForm.name}
              onChange={(e) => setHwForm({...hwForm, name: e.target.value})}
              placeholder="e.g., Math Problem Set 5"
            />
            <Input 
              label="Total Hours Needed"
              type="number"
              step="0.5"
              min="0.5"
              value={hwForm.hours}
              onChange={(e) => setHwForm({...hwForm, hours: e.target.value})}
              placeholder="e.g., 6"
            />
            <Input 
              label="Deadline"
              type="date"
              value={hwForm.deadline}
              onChange={(e) => setHwForm({...hwForm, deadline: e.target.value})}
            />
            <Input
              label="Preferred Block Size (hours)"
              type="number"
              step="0.5"
              min="0.5"
              value={hwForm.blockSize}
              onChange={(e) => setHwForm({ ...hwForm, blockSize: e.target.value })}
              placeholder="e.g., 1.5"
            />
            <Button onClick={addHomework} variant="success" className="w-100">
              ➕ Add Homework
            </Button>
            
            {homework.length > 0 && (
              <div className="mt-4">
                <h5 className="mb-3">📝 Current Homework/Study Session</h5>
                <div className="d-flex flex-column gap-2">
                  {homework.map((hw) => (
                    <div key={hw.id} className="d-flex justify-content-between align-items-center p-3 border rounded shadow-sm bg-white">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-bold text-dark">{hw.name}</span>
                          <Badge bg="info">{hw.hours}h</Badge>
                        </div>
                        <small className="text-muted">
                          📅 Due {new Date(hw.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </small>
                      </div>
                      <button 
                        onClick={() => deleteHomework(hw.id)} 
                        className="btn btn-sm btn-outline-danger ms-2"
                        style={{ minWidth: '40px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
        
        <Col lg={6} className="mb-4">
          <Card>
            <h4 className="mb-3">📅 Add Existing Commitment</h4>
            <Form.Group className="mb-3">
              <Form.Label>Days of Week</Form.Label>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {daysOfWeek.map(day => (
                  <React.Fragment key={day}>
                    <Form.Check
                      type="checkbox"
                      id={`day-${day}`}
                      checked={commitmentForm.days.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="btn-check"
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor={`day-${day}`}
                      className={`btn ${commitmentForm.days.includes(day) ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                      style={{ cursor: 'pointer', minWidth: '45px'}}
                    >
                      {getDayAbbr(day)}
                    </label>
                  </React.Fragment>
                ))}
              </div>
              <Form.Text className="text-muted" fontSize="12px">
                Select multiple days (e.g., MWF for Monday, Wednesday, Friday)
              </Form.Text>
            </Form.Group>
            
            <Input 
              label="Start Time"
              type="time"
              value={commitmentForm.startTime}
              onChange={(e) => setCommitmentForm({...commitmentForm, startTime: e.target.value})}
            />
            <Input 
              label="End Time"
              type="time"
              value={commitmentForm.endTime}
              onChange={(e) => setCommitmentForm({...commitmentForm, endTime: e.target.value})}
            />
            <Input 
              label="Description (optional)"
              value={commitmentForm.description}
              onChange={(e) => setCommitmentForm({...commitmentForm, description: e.target.value})}
              placeholder="e.g., Math class"
            />
            <Button
              onClick={addCommitment} 
              variant="primary" 
              className="w-100"
              disabled={commitmentForm.days.length === 0 || !commitmentForm.startTime || !commitmentForm.endTime}
            >
              ➕ Add Commitment to {commitmentForm.days.length} day{commitmentForm.days.length !== 1 ? 's' : ''}
            </Button>
            
            {commitments.length > 0 && (
              <div className="mt-4">
                <h5 className="mb-3">🗓️ Current Commitments</h5>
                <div className="d-flex flex-column gap-3">
                  {groupedCommitmentsList.map((group, idx) => (
                    <div 
                      key={idx} 
                      className="border rounded p-3 shadow-sm bg-white position-relative"
                      style={{
                        borderLeft: `4px solid ${getDayColor(group.days[0])}`
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="fs-5">🕐</span>
                            <strong className="text-dark">
                              {group.startTime} - {group.endTime}
                            </strong>
                          </div>
                          {group.description && (
                            <div className="mb-2">
                              <span className="text-muted">{group.description}</span>
                            </div>
                          )}
                          <div className="d-flex flex-wrap gap-1">
                            {group.days
                              .sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b))
                              .map((day, dayIdx) => (
                                <span
                                  key={dayIdx}
                                  className="badge"
                                  style={{
                                    backgroundColor: getDayColor(day),
                                    fontSize: '0.75rem',
                                    padding: '0.35em 0.65em'
                                  }}
                                >
                                  {getDayAbbr(day)}
                                </span>
                              ))}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCommitments(commitments.filter(c => !group.ids.includes(c.id)));
                          }}
                          className="btn btn-sm btn-outline-danger"
                          style={{ minWidth: '40px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeworkPage;