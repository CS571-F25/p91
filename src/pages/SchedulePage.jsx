import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Card from '../components/Card';
import Button from '../components/Button';
import { generateSchedule, generateICS, formatTime } from '../utils/scheduleGenerator';

const SchedulePage = ({ homework, commitments, schedule, setSchedule }) => {
  
  const handleGenerateSchedule = () => {
    const newSchedule = generateSchedule(homework, commitments);
    setSchedule(newSchedule);
  };
  
  const handleExport = () => {
    generateICS(schedule);
  };
  
  const groupedSchedule = schedule.reduce((acc, session) => {
    if (!acc[session.day]) acc[session.day] = [];
    acc[session.day].push(session);
    return acc;
  }, {});
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>🗓️ Your Study Schedule</h1>
        <div className="d-flex gap-2">
          <Button onClick={handleGenerateSchedule} variant="primary">
            ⚡ Generate Schedule
          </Button>
          {schedule.length > 0 && (
            <Button onClick={handleExport} variant="success">
              📥 Export to Calendar
            </Button>
          )}
        </div>
      </div>
      
      {schedule.length === 0 ? (
        <Card>
          <div className="text-center py-5">
            <div style={{ fontSize: '4rem' }}>📅</div>
            <p className="text-muted mb-2">No schedule generated yet</p>
            <p className="text-muted small">Add homework and commitments, then click "Generate Schedule"</p>
          </div>
        </Card>
      ) : (
        <>
          <Row>
            {days.map(day => (
              <Col key={day} md={6} lg={4} className="mb-3">
                <Card className={groupedSchedule[day] ? '' : 'opacity-50'}>
                  <h5 className="text-primary mb-3">{day}</h5>
                  {groupedSchedule[day] ? (
                    <div>
                      {groupedSchedule[day]
                        .sort((a, b) => a.startTime - b.startTime)
                        .map((session, idx) => (
                        <div key={idx} className="border-start border-primary border-4 bg-light p-3 rounded mb-2">
                          <p className="fw-bold mb-1 small">{session.homework}</p>
                          <p className="text-muted mb-1" style={{fontSize: '0.75rem'}}>
                            {formatTime(session.startTime)} - {formatTime(session.startTime + session.duration)}
                          </p>
                          <span className="badge bg-primary">{session.duration} hour{session.duration !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small">No sessions scheduled</p>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
          
          <Card className="mt-4">
            <h5>📱 How to Import:</h5>
            <ol className="mb-0">
              <li className="mb-2">Click "Export to Calendar" to download the .ics file</li>
              <li className="mb-2"><strong>iPhone/iPad:</strong> Open the file, tap "Add All" to import to Apple Calendar</li>
              <li className="mb-2"><strong>Android:</strong> Open the file with Google Calendar app</li>
              <li><strong>Desktop:</strong> Import the .ics file into your calendar app (Calendar, Outlook, etc.)</li>
            </ol>
          </Card>
        </>
      )}
    </div>
  );
};

export default SchedulePage;