import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import StatTile from '../components/StatTile';
import DeadlineItem from '../components/DeadlineItem';

const formatDateDisplay = (dateStr, pattern) => {
  if (!dateStr) return "";
  const fmt = pattern || "MM/dd/yyyy";
  try {
    const d = new Date(dateStr + "T12:00:00");
    const dd = String(d.getDate()).padStart(2, "0");
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    let out;
    if (fmt === "dd/MM/yyyy") out = `${dd}/${MM}/${yyyy}`;
    else if (fmt === "yyyy-MM-dd") out = `${yyyy}-${MM}-${dd}`;
    else out = `${MM}/${dd}/${yyyy}`;
    return out.toUpperCase();
  } catch {
    return dateStr;
  }
};

const DashboardPage = ({ homework, commitments, schedule, prefs }) => {
  const upcomingDeadlines = [...homework]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);
  
  const totalHours = homework.reduce((sum, hw) => sum + parseFloat(hw.hours || 0), 0);
  const scheduledHours = schedule.reduce((sum, session) => {
    const duration =
      typeof session.duration === "number" && !Number.isNaN(session.duration)
        ? session.duration
        : session.start && session.end
        ? (new Date(session.end).getTime() - new Date(session.start).getTime()) / (1000 * 60 * 60)
        : 0;
    return sum + (Number.isFinite(duration) ? duration : 0);
  }, 0);
  
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all homework, commitments, and schedule data? This cannot be undone.')) {
      localStorage.removeItem('studysync-homework');
      localStorage.removeItem('studysync-commitments');
      localStorage.removeItem('studysync-schedule');
      window.location.reload();
    }
  };
  
  return (
    <div>
      <PageHeader
        title="📊 Dashboard"
        actions={
          <Button onClick={handleClearAllData} variant="outline-danger" className="btn-sm">
            🗑️ Clear All Data
          </Button>
        }
      />
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <StatTile label="Active Homework" value={homework.length} icon="📚" variant="primary" />
        </Col>
        <Col md={4} className="mb-3">
          <StatTile label="Total Hours Needed" value={totalHours.toFixed(1)} icon="⏰" variant="warning" />
        </Col>
        <Col md={4} className="mb-3">
          <StatTile label="Hours Scheduled" value={scheduledHours.toFixed(1)} icon="✅" variant="success" />
        </Col>
      </Row>
      
      <Card>
        <h3 className="mb-3">📅 Upcoming Deadlines</h3>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-muted">No homework added yet. Click "Add Homework" to get started!</p>
        ) : (
          <div>
            {upcomingDeadlines.map((hw, idx) => (
              <DeadlineItem
                key={idx}
                name={hw.name}
                hours={hw.hours}
                deadlineText={formatDateDisplay(hw.deadline, prefs?.dateFormat)}
                daysLeft={Math.ceil((new Date(hw.deadline) - new Date()) / (1000 * 60 * 60 * 24))}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
