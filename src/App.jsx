import { HashRouter, Route, Routes } from 'react-router'
import { useState, useEffect } from 'react'
import './App.css'
import Home from './components/Home'
import AboutMe from './components/AboutMe'
import DashboardPage from './pages/DashboardPage'
import HomeworkPage from './pages/HomeworkPage'
import SchedulePage from './pages/SchedulePage'
import NavigationBar from './components/NavigationBar'

function App() {
  // Load data from localStorage
  const [homework, setHomework] = useState(() => {
    const saved = localStorage.getItem('studysync-homework');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [commitments, setCommitments] = useState(() => {
    const saved = localStorage.getItem('studysync-commitments');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem('studysync-schedule');
    return saved ? JSON.parse(saved) : [];
  });

  // Save homework to localStorage
  useEffect(() => {
    localStorage.setItem('studysync-homework', JSON.stringify(homework));
  }, [homework]);

  // Save commitments to localStorage
  useEffect(() => {
    localStorage.setItem('studysync-commitments', JSON.stringify(commitments));
  }, [commitments]);

  // Save schedule to localStorage
  useEffect(() => {
    localStorage.setItem('studysync-schedule', JSON.stringify(schedule));
  }, [schedule]);

  return (
    <HashRouter>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <NavigationBar />
        <div
          className="container-fluid"
          style={{
            maxWidth: '1400px',
            flexGrow: 1,
            overflowY: 'auto',
            paddingTop: '80px',
            paddingBottom: '2rem',
          }}
        >
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
              path="/homework"
              element={
                <HomeworkPage
                  homework={homework}
                  setHomework={setHomework}
                  commitments={commitments}
                  setCommitments={setCommitments}
                />
              }
            />
            <Route
              path="/schedule"
              element={
                <SchedulePage
                  homework={homework}
                  commitments={commitments}
                  schedule={schedule}
                  setSchedule={setSchedule}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );  
}

export default App;