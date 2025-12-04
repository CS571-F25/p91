import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SchedulePage from "./pages/SchedulePage";
import HomeworkPage from "./pages/HomeworkPage";
import DashboardPage from "./pages/DashboardPage";
import PreferencesPage from "./pages/PreferencesPage";
import NavigationBar from "./components/NavigationBar";
import "./App.css";

function App() {
  const [homework, setHomework] = useState(() => {
    const stored = localStorage.getItem("studysync-homework");
    return stored ? JSON.parse(stored) : [];
  });

  const [schedule, setSchedule] = useState(() => {
    const stored = localStorage.getItem("studysync-schedule");
    return stored ? JSON.parse(stored) : [];
  });

  const [commitments, setCommitments] = useState(() => {
    const stored = localStorage.getItem("studysync-commitments");
    return stored ? JSON.parse(stored) : [];
  });

  const [prefs, setPrefs] = useState(() => {
    const stored = localStorage.getItem("studysync-prefs");
    return stored
      ? JSON.parse(stored)
      : {
          startTime: "08:00",
          endTime: "22:00",
          breaks: [],
          timeFormat: "12h",
          calendarStart: "06:00",
          calendarEnd: "22:00"
        };
  });

  useEffect(() => {
    localStorage.setItem("studysync-homework", JSON.stringify(homework));
  }, [homework]);

  useEffect(() => {
    localStorage.setItem("studysync-schedule", JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem("studysync-commitments", JSON.stringify(commitments));
  }, [commitments]);

  useEffect(() => {
    localStorage.setItem("studysync-prefs", JSON.stringify(prefs));
  }, [prefs]);

  return (
    <>
      <NavigationBar />
      <div className="container mt-3">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                homework={homework}
                commitments={commitments}
                schedule={schedule}
              />
            }
          />
          <Route
            path="/schedule"
            element={
              <SchedulePage
                homework={homework}
                schedule={schedule}
                setSchedule={setSchedule}
                commitments={commitments}
                prefs={prefs}
              />
            }
          />
          <Route
            path="/preferences"
            element={<PreferencesPage prefs={prefs} setPrefs={setPrefs} />}
          />
          <Route
            path="/homework"
            element={
              <HomeworkPage
                homework={homework}
                setHomework={setHomework}
                commitments={commitments}
                setCommitments={setCommitments}
                schedule={schedule}
                setSchedule={setSchedule}
              />
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
