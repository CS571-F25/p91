import { HashRouter, Route, Routes } from 'react-router'
import { useState } from 'react'
import './App.css'
import Home from './components/Home'
import AboutMe from './components/AboutMe'
import DashboardPage from './pages/DashboardPage'
import HomeworkPage from './pages/HomeworkPage'
import SchedulePage from './pages/SchedulePage'
import NavigationBar from './components/NavigationBar'

function App() {
  const [homework, setHomework] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [schedule, setSchedule] = useState([]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-100">
        <NavigationBar />
        <div className="container py-4">
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