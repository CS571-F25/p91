import React from 'react';
import { Row, Col, Modal } from 'react-bootstrap';
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import StatTile from '../components/StatTile';
import DeadlineItem from '../components/DeadlineItem';

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T12:00:00");
    const dd = String(d.getDate()).padStart(2, "0");
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}/${MM}/${yyyy}`;
  } catch {
    return dateStr;
  }
};

const DashboardPage = ({ homework, commitments, schedule, setHomework, setSchedule }) => {
  const [showPastModal, setShowPastModal] = React.useState(false);
  const [confirmConfig, setConfirmConfig] = React.useState({
    show: false,
    message: "",
    onConfirm: null
  });
  const [completedHomework, setCompletedHomework] = React.useState(() => {
    try {
      const stored = localStorage.getItem("studysync-completed");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const completedIdSetRef = React.useRef(new Set((completedHomework || []).map((h) => h.id)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const isPastDue = (hw) =>
    hw?.deadline ? new Date(hw.deadline) < today : false;
  const isExpired = (hw) =>
    hw?.deadline ? new Date(hw.deadline) < monthAgo : false;

  const activeHomework = homework.filter((hw) => !isPastDue(hw));
  const pastAssignments = homework.filter(
    (hw) => isPastDue(hw) && !isExpired(hw)
  );
  const pastCompleted = completedHomework.filter(
    (hw) => isPastDue(hw) && !isExpired(hw)
  );
  const visibleCompleted = completedHomework.filter((hw) => !isPastDue(hw) || isExpired(hw));
  const activeHomeworkNames = new Set(activeHomework.map((hw) => hw.name));

  const sortedDeadlines = [...activeHomework].sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline)
  );
  const upcomingDeadlines = sortedDeadlines;

  const getEventHours = (ev) => {
    if (!ev) return 0;
    if (typeof ev.duration === "number" && !Number.isNaN(ev.duration)) return ev.duration;
    if (ev.start && ev.end) {
      const ms = new Date(ev.end).getTime() - new Date(ev.start).getTime();
      return ms > 0 ? ms / (1000 * 60 * 60) : 0;
    }
    return 0;
  };

  const getScheduledHours = (homeworkName) => {
    const now = new Date();
    return schedule
      .filter((s) => s.homework === homeworkName && s.end && new Date(s.end) <= now)
      .reduce((sum, ev) => sum + getEventHours(ev), 0);
  };

  const totalHours = activeHomework.reduce((sum, hw) => sum + parseFloat(hw.hours || 0), 0);
  const scheduledHours = schedule.reduce((sum, session) => {
    if (session.homework && !activeHomeworkNames.has(session.homework)) return sum;
    const duration =
      typeof session.duration === "number" && !Number.isNaN(session.duration)
        ? session.duration
        : session.start && session.end
        ? (new Date(session.end).getTime() - new Date(session.start).getTime()) / (1000 * 60 * 60)
        : 0;
    return sum + (Number.isFinite(duration) ? duration : 0);
  }, 0);
  
  const handleClearAllData = () => {
    setConfirmConfig({
      show: true,
      message: "Clear all homework, commitments, and schedule data? This cannot be undone.",
      onConfirm: () => {
        localStorage.removeItem('studysync-homework');
        localStorage.removeItem('studysync-commitments');
        localStorage.removeItem('studysync-schedule');
        localStorage.removeItem('studysync-completed');
        window.location.reload();
      }
    });
  };

  const markHomeworkDone = (hw) => {
    setConfirmConfig({
      show: true,
      message: `Mark "${hw.name}" as done and remove its scheduled blocks?`,
      onConfirm: () => {
        setHomework?.((prev) => prev.filter((h) => h.id !== hw.id));
        setSchedule?.((prev) => prev.filter((ev) => ev.homework !== hw.name));
        setCompletedHomework((prev) => {
          const updated = [...prev, { ...hw, completedAt: new Date().toISOString() }];
          completedIdSetRef.current = new Set(updated.map((h) => h.id));
          try {
            localStorage.setItem("studysync-completed", JSON.stringify(updated));
          } catch {
            // ignore storage errors
          }
          return updated;
        });
      }
    });
  };

  const handleClearCompleted = () => {
    setConfirmConfig({
      show: true,
      message: "Clear all completed assignments? This will remove them permanently (not moved to Past Assignments).",
      onConfirm: () => {
        setCompletedHomework([]);
        completedIdSetRef.current = new Set();
        try {
          localStorage.setItem("studysync-completed", JSON.stringify([]));
        } catch {
          // ignore storage errors
        }
      }
    });
  };

  const restoreCompleted = (hw) => {
    setCompletedHomework((prev) => {
      const updated = prev.filter((item) => item.id !== hw.id);
      completedIdSetRef.current = new Set(updated.map((h) => h.id));
      try {
        localStorage.setItem("studysync-completed", JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
    setHomework?.((prev) => [...prev, { ...hw }]);
  };

  React.useEffect(() => {
    if (!setHomework || !setSchedule) return;
    const existingCompletedIds = completedIdSetRef.current || new Set();
    const doneList = homework.filter((hw) => {
      const total = parseFloat(hw.hours || 0);
      const done = getScheduledHours(hw.name);
      return total > 0 && done + 0.0001 >= total && !existingCompletedIds.has(hw.id);
    });
    if (doneList.length === 0) return;

    setCompletedHomework((prev) => {
      const merged = [...prev, ...doneList.map((hw) => ({ ...hw, completedAt: new Date().toISOString() }))];
      completedIdSetRef.current = new Set(merged.map((h) => h.id));
      try {
        localStorage.setItem("studysync-completed", JSON.stringify(merged));
      } catch {
        // ignore storage errors
      }
      return merged;
    });

    setHomework((prev) => prev.filter((hw) => !doneList.some((d) => d.id === hw.id)));
    const doneNames = new Set(doneList.map((d) => d.name));
    setSchedule((prev) => prev.filter((ev) => !doneNames.has(ev.homework)));
  }, [homework, schedule, setHomework, setSchedule, getScheduledHours]);
  
  return (
    <div style={{ paddingBottom: "30px" }}>
      <PageHeader
        title="📊 Dashboard"
        actions={
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              className="btn-sm"
              onClick={() => setShowPastModal(true)}
              disabled={pastAssignments.length === 0}
            >
              View Past Assignments
            </Button>
            <Button onClick={handleClearAllData} variant="outline-danger" className="btn-sm">
              🗑️ Clear All Data
            </Button>
          </div>
        }
      />
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <StatTile label="Active Homework" value={activeHomework.length} icon="📚" variant="primary" />
        </Col>
        <Col md={4} className="mb-3">
          <StatTile label="Total Hours Needed" value={totalHours.toFixed(1)} icon="⏰" variant="warning" />
        </Col>
        <Col md={4} className="mb-3">
          <StatTile label="Hours Scheduled" value={scheduledHours.toFixed(1)} icon="✅" variant="success" />
        </Col>
      </Row>

      <Row className="align-items-start">
        <Col lg={4} className="mb-4">
          <Card className="h-100 d-flex flex-column">
            <h3 className="mb-3">⏳ Homework Progress</h3>
            {activeHomework.length === 0 ? (
              <p className="text-muted">Add homework to start tracking progress.</p>
            ) : (
              <div className="flex-grow-1">
                {activeHomework.map((hw) => {
                  const total = parseFloat(hw.hours || 0) || 0;
                  const done = getScheduledHours(hw.name);
                  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
                  const remaining = Math.max(total - done, 0);
                  return (
                    <div key={hw.id} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            display: "inline-block",
                            width: "14px",
                            height: "14px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            background: hw.color || "#0d6efd"
                          }}
                        />
                        <strong>{hw.name}</strong>
                        {pct >= 99.9 && (
                          <span className="badge bg-success ms-1">Done</span>
                        )}
                      </div>
                        <div className="d-flex align-items-center gap-2 flex-nowrap">
                          <small className="text-muted">
                            {pct.toFixed(0)}% • {remaining.toFixed(1)}h left
                          </small>
                          <Button
                            variant="outline-success"
                            className="btn-sm text-nowrap"
                            onClick={() => markHomeworkDone(hw)}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: hw.color || "#0d6efd"
                          }}
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        <Col lg={8} className="mb-4">
          <Card className="h-100 d-flex flex-column">
            <h3 className="mb-3">📅 Upcoming Deadlines</h3>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-muted">No homework added yet. Click "Add Homework" to get started!</p>
            ) : (
              <div
                className="flex-grow-1 d-flex flex-column"
                style={{ overflowY: "auto", maxHeight: "600px" }}
              >
                {upcomingDeadlines.map((hw, idx) => (
                  <div key={idx} className="mb-3">
                    <DeadlineItem
                      name={hw.name}
                      hours={hw.hours}
                      deadlineText={formatDateDisplay(hw.deadline)}
                      daysLeft={Math.ceil((new Date(hw.deadline) - new Date()) / (1000 * 60 * 60 * 24))}
                    />
                    <div className="mt-2">
                      {(() => {
                        const total = parseFloat(hw.hours || 0) || 0;
                        const done = getScheduledHours(hw.name);
                        const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
                        const remaining = Math.max(total - done, 0);
                        return (
                          <>
                            <div className="d-flex justify-content-between small text-muted mb-1">
                              <span>Studied {done.toFixed(1)}h / {total.toFixed(1)}h</span>
                              <span>
                                {remaining.toFixed(1)}h left • {pct.toFixed(0)}%
                              </span>
                            </div>
                            <div className="progress" style={{ height: "6px" }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: hw.color || "#0d6efd"
                                }}
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <Card>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="mb-0">✅ Completed Assignments</h3>
              <Button
                variant="outline-secondary"
                className="btn-sm"
                onClick={handleClearCompleted}
                disabled={visibleCompleted.length === 0}
              >
                Clear Completed
              </Button>
            </div>
            <div className="text-muted small mb-2">
              Restoring brings back the assignment only; re-add study blocks from the Schedule page.
            </div>
            {visibleCompleted.length === 0 ? (
              <p className="text-muted mb-0">No completed assignments yet.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {visibleCompleted.map((hw) => (
                  <div key={hw.id} className="border rounded p-2 d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{hw.name}</strong>
                      <div className="small text-muted">
                        Deadline: {formatDateDisplay(hw.deadline)} • Completed{" "}
                        {new Date(hw.completedAt).toLocaleDateString("en-GB")}
                      </div>
                    </div>
                    <Button
                      variant="outline-primary"
                      className="btn-sm text-nowrap"
                      onClick={() => restoreCompleted(hw)}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        show={showPastModal}
        onHide={() => setShowPastModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>📁 Past Assignments</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pastAssignments.length === 0 && pastCompleted.length === 0 ? (
            <p className="text-muted mb-0">No assignments in the last 30 days.</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {pastAssignments.map((hw) => (
                <div key={hw.id} className="border rounded p-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          background: hw.color || "#6c757d"
                        }}
                      />
                      <strong>{hw.name}</strong>
                    </div>
                    <small className="text-muted">
                      Due: {formatDateDisplay(hw.deadline)}
                    </small>
                  </div>
                </div>
              ))}
              {pastCompleted.map((hw) => (
                <div key={`completed-${hw.id}`} className="border rounded p-2 bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          background: hw.color || "#6c757d"
                        }}
                      />
                      <strong>{hw.name}</strong>
                      <span className="badge bg-success">Completed</span>
                    </div>
                    <small className="text-muted">
                      Due: {formatDateDisplay(hw.deadline)}
                    </small>
                  </div>
                </div>
              ))}
              <div className="text-muted small">
                Items remain for 30 days after their deadline.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPastModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={confirmConfig.show}
        onHide={() => setConfirmConfig({ show: false, message: "", onConfirm: null })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmConfig.message || "Are you sure?"}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setConfirmConfig({ show: false, message: "", onConfirm: null })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              confirmConfig.onConfirm?.();
              setConfirmConfig({ show: false, message: "", onConfirm: null });
            }}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DashboardPage;
