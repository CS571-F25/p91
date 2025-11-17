export const generateSchedule = (homework, commitments) => {
    const newSchedule = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const workingHours = { start: 8, end: 22 };
    
    const commitmentsByDay = {};
    days.forEach(day => commitmentsByDay[day] = []);
    commitments.forEach(c => {
      const start = parseFloat(c.startTime.split(':')[0]) + parseFloat(c.startTime.split(':')[1]) / 60;
      const end = parseFloat(c.endTime.split(':')[0]) + parseFloat(c.endTime.split(':')[1]) / 60;
      commitmentsByDay[c.day].push({ start, end });
    });
    
    const sortedHomework = [...homework].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    sortedHomework.forEach(hw => {
      let remainingHours = parseFloat(hw.hours);
      const blockSize = parseFloat(hw.blockSize);
      const deadline = new Date(hw.deadline);
      
      let currentDate = new Date();
      let dayIndex = 0;
      
      while (remainingHours > 0 && currentDate <= deadline) {
        const dayName = days[dayIndex % 7];
        const hoursToSchedule = Math.min(remainingHours, blockSize);
        
        const busyTimes = commitmentsByDay[dayName].sort((a, b) => a.start - b.start);
        let searchStart = workingHours.start;
        
        for (let i = 0; i <= busyTimes.length; i++) {
          const searchEnd = i < busyTimes.length ? busyTimes[i].start : workingHours.end;
          const availableTime = searchEnd - searchStart;
          
          if (availableTime >= hoursToSchedule) {
            newSchedule.push({
              homework: hw.name,
              day: dayName,
              startTime: searchStart,
              duration: hoursToSchedule,
              date: new Date(currentDate)
            });
            
            commitmentsByDay[dayName].push({
              start: searchStart,
              end: searchStart + hoursToSchedule
            });
            commitmentsByDay[dayName].sort((a, b) => a.start - b.start);
            
            remainingHours -= hoursToSchedule;
            break;
          }
          
          searchStart = i < busyTimes.length ? busyTimes[i].end : searchEnd;
        }
        
        dayIndex++;
        if (dayIndex % 7 === 0) {
          currentDate.setDate(currentDate.getDate() + 7);
        }
        
        if (dayIndex > 50) break;
      }
    });
    
    return newSchedule;
  };
  
  export const formatTime = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  export const generateICS = (schedule) => {
    let icsContent = `BEGIN:VCALENDAR
  VERSION:2.0
  PRODID:-//StudySync//Homework Scheduler//EN
  CALSCALE:GREGORIAN
  METHOD:PUBLISH
  X-WR-CALNAME:StudySync Schedule
  X-WR-TIMEZONE:America/New_York
  X-WR-CALDESC:Your personalized homework schedule
  `;
  
    schedule.forEach((session, idx) => {
      const startDate = new Date(session.date);
      const startHour = Math.floor(session.startTime);
      const startMinute = Math.round((session.startTime - startHour) * 60);
      startDate.setHours(startHour, startMinute, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + session.duration * 60);
      
      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      icsContent += `BEGIN:VEVENT
  DTSTART:${formatDate(startDate)}
  DTEND:${formatDate(endDate)}
  SUMMARY:${session.homework}
  DESCRIPTION:Study session for ${session.homework}
  STATUS:CONFIRMED
  SEQUENCE:0
  UID:${Date.now()}-${idx}@studysync.app
  END:VEVENT
  `;
    });
    
    icsContent += 'END:VCALENDAR';
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'studysync-schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };