import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Card from '../components/Card';
import Button from '../components/Button';

const DashboardPage = ({ homework, commitments, schedule }) => {
  const upcomingDeadlines = [...homework]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);
  
  const totalHours = homework.reduce((sum, hw) => sum + parseFloat(hw.hours || 0), 0);
  const scheduledHours = schedule.reduce((sum, session) => sum + session.duration, 0);
  
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all homework, commitments, and schedule data? This cannot be undone.')) {
      localStorage.removeItem('studysync-homework');
      localStorage.removeItem('studysync-commitments');
      localStorage.removeItem('studysync-schedule');
      window.location.reload(); // Reload to reset state
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📊 Dashboard</h1>
        <Button onClick={handleClearAllData} variant="outline-danger" className="btn-sm">
          🗑️ Clear All Data
        </Button>
      </div>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">Active Homework</p>
                <h2 className="text-primary mb-0">{homework.length}</h2>
              </div>
              <span style={{ fontSize: '3rem', opacity: 0.2 }}>📚</span>
            </div>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">Total Hours Needed</p>
                <h2 className="text-warning mb-0">{totalHours.toFixed(1)}</h2>
              </div>
              <span style={{ fontSize: '3rem', opacity: 0.2 }}>⏰</span>
            </div>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1">Hours Scheduled</p>
                <h2 className="text-success mb-0">{scheduledHours.toFixed(1)}</h2>
              </div>
              <span style={{ fontSize: '3rem', opacity: 0.2 }}>✅</span>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Card>
        <h3 className="mb-3">📅 Upcoming Deadlines</h3>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-muted">No homework added yet. Click "Add Homework" to get started!</p>
        ) : (
          <div>
            {upcomingDeadlines.map((hw, idx) => (
              <div key={idx} className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-2">
                <div>
                  <p className="fw-bold mb-1">{hw.name}</p>
                  <p className="text-muted mb-0 small">{hw.hours} hours • Due: {new Date(hw.deadline).toLocaleDateString()}</p>
                </div>
                <span className="badge bg-primary">
                  {Math.ceil((new Date(hw.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;