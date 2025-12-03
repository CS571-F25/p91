import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import AboutMe from "./components/AboutMe";
import SchedulePage from "./pages/SchedulePage";
import HomeworkPage from "./pages/HomeworkPage";
import DashboardPage from "./pages/DashboardPage";
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

  useEffect(() => {
    localStorage.setItem("studysync-homework", JSON.stringify(homework));
  }, [homework]);

  useEffect(() => {
    localStorage.setItem("studysync-schedule", JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem("studysync-commitments", JSON.stringify(commitments));
  }, [commitments]);

  return (
    <>
      <NavigationBar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutMe />} />
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
              />
            }
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
