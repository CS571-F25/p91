export const generateSchedule = (homework, commitments) => {
  const newSchedule = [];
  const warnings = [];
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
    deadline.setHours(23, 59, 59, 999); // End of deadline day
    
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Start of current day
    let dayIndex = 0;
    const originalHours = remainingHours;
    
    // Calculate available hours before deadline
    let totalAvailableHours = 0;
    let tempDate = new Date(currentDate);
    let tempDayIndex = 0;
    
    while (tempDate <= deadline && tempDayIndex < 365) {
      const dayName = days[tempDayIndex % 7];
      const busyTimes = [...commitmentsByDay[dayName]].sort((a, b) => a.start - b.start);
      
      let availableInDay = 0;
      let searchStart = workingHours.start;
      
      for (let i = 0; i <= busyTimes.length; i++) {
        const searchEnd = i < busyTimes.length ? busyTimes[i].start : workingHours.end;
        availableInDay += Math.max(0, searchEnd - searchStart);
        searchStart = i < busyTimes.length ? busyTimes[i].end : searchEnd;
      }
      
      totalAvailableHours += availableInDay;
      tempDayIndex++;
      tempDate.setDate(currentDate.getDate() + tempDayIndex);
    }
    
    // Check if there's enough time
    if (totalAvailableHours < originalHours) {
      warnings.push({
        homework: hw.name,
        needed: originalHours,
        available: totalAvailableHours,
        message: `⚠️ Not enough time! "${hw.name}" needs ${originalHours}h but only ${totalAvailableHours.toFixed(1)}h available before deadline.`
      });
      // Still try to schedule as much as possible
    }
    
    // Schedule the homework
    while (remainingHours > 0 && currentDate <= deadline) {
      const dayName = days[dayIndex % 7];
      const hoursToSchedule = Math.min(remainingHours, blockSize);
      
      // Get the actual calendar date for this iteration
      const scheduleDate = new Date(currentDate);
      const daysToAdd = dayIndex % 7;
      scheduleDate.setDate(currentDate.getDate() + Math.floor(dayIndex / 7) * 7 + daysToAdd);
      
      // Stop if we've passed the deadline
      if (scheduleDate > deadline) break;
      
      const busyTimes = [...commitmentsByDay[dayName]].sort((a, b) => a.start - b.start);
      let searchStart = workingHours.start;
      let scheduled = false;
      
      for (let i = 0; i <= busyTimes.length; i++) {
        const searchEnd = i < busyTimes.length ? busyTimes[i].start : workingHours.end;
        const availableTime = searchEnd - searchStart;
        
        if (availableTime >= hoursToSchedule) {
          newSchedule.push({
            homework: hw.name,
            day: dayName,
            startTime: searchStart,
            duration: hoursToSchedule,
            date: new Date(scheduleDate)
          });
          
          commitmentsByDay[dayName].push({
            start: searchStart,
            end: searchStart + hoursToSchedule
          });
          commitmentsByDay[dayName].sort((a, b) => a.start - b.start);
          
          remainingHours -= hoursToSchedule;
          scheduled = true;
          break;
        }
        
        searchStart = i < busyTimes.length ? busyTimes[i].end : searchEnd;
      }
      
      dayIndex++;
      
      if (dayIndex > 365) break; // Safety limit (1 year)
    }
    
    // If we couldn't schedule all the hours, add a warning
    if (remainingHours > 0 && !warnings.find(w => w.homework === hw.name)) {
      warnings.push({
        homework: hw.name,
        needed: originalHours,
        scheduled: originalHours - remainingHours,
        remaining: remainingHours,
        message: `⚠️ Only scheduled ${(originalHours - remainingHours).toFixed(1)}h of ${originalHours}h for "${hw.name}". ${remainingHours.toFixed(1)}h could not be scheduled before the deadline.`
      });
    }
  });
  
  return { schedule: newSchedule, warnings };
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
    // Create a fresh date object for this session
    const startDate = new Date(session.date.getTime());
    const startHour = Math.floor(session.startTime);
    const startMinute = Math.round((session.startTime - startHour) * 60);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    // Create end date from start date
    const endDate = new Date(startDate.getTime());
    endDate.setMinutes(endDate.getMinutes() + Math.round(session.duration * 60));
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Generate unique UID using timestamp and random number
    const uid = `${startDate.getTime()}-${Math.random().toString(36).substr(2, 9)}@studysync.app`;
    
    icsContent += `BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${session.homework}
DESCRIPTION:Study session for ${session.homework}
STATUS:CONFIRMED
SEQUENCE:0
UID:${uid}
END:VEVENT
`;
  });
  
  icsContent += 'END:VCALENDAR';
  
  // Clean up whitespace in ICS content
  icsContent = icsContent.replace(/^\s+/gm, '');
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'studysync-schedule.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};