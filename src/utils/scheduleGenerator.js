export const generateSchedule = (homework, commitments, prefs) => {
  const newSchedule = [];
  const warnings = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Use prefs or defaults
  const workingHours = {
    start: prefs && prefs.startTime ? parseFloat(prefs.startTime.split(':')[0]) + parseFloat(prefs.startTime.split(':')[1]) / 60 : 8,
    end: prefs && prefs.endTime ? parseFloat(prefs.endTime.split(':')[0]) + parseFloat(prefs.endTime.split(':')[1]) / 60 : 22
  };
  
  const bufferTime = prefs && prefs.buffer ? parseFloat(prefs.buffer) / 60 : 0.5;
  
  console.log('=== SCHEDULE GENERATION START ===');
  console.log('Working hours:', workingHours);
  console.log('Homework to schedule:', homework.map(hw => ({ name: hw.name, hours: hw.hours, deadline: hw.deadline })));

  // Create commitments by actual date
  const commitmentsByDate = {};
  
  // Helper function to get day name from date
  const getDayName = (date) => {
    return days[date.getDay() === 0 ? 6 : date.getDay() - 1];
  };

  // Helper function to get date key (YYYY-MM-DD)
  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Initialize commitments for each date from today to max deadline
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log('Today:', today.toDateString());
  
  // Find max deadline to know how far to initialize
  let maxDeadline = new Date(today);
  homework.forEach(hw => {
    const deadline = new Date(hw.deadline);
    deadline.setHours(23, 59, 59, 999); // Set to end of deadline day
    if (deadline > maxDeadline) maxDeadline = deadline;
  });
  
  console.log('Max deadline (end of day):', maxDeadline.toDateString());
  
  // Initialize empty commitments for each date
  let currentDate = new Date(today);
  while (currentDate <= maxDeadline) {
    const dateKey = getDateKey(currentDate);
    commitmentsByDate[dateKey] = [];
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add recurring commitments to each applicable date
  commitments.forEach(c => {
    let currentDate = new Date(today);
    while (currentDate <= maxDeadline) {
      const dayName = getDayName(currentDate);
      if (dayName === c.day) {
        const dateKey = getDateKey(currentDate);
        const start = parseFloat(c.startTime.split(':')[0]) + parseFloat(c.startTime.split(':')[1]) / 60;
        const end = parseFloat(c.endTime.split(':')[0]) + parseFloat(c.endTime.split(':')[1]) / 60;
        
        commitmentsByDate[dateKey].push({ start, end, type: 'commitment', name: c.description });
        
        // Add buffer time after commitments
        if (bufferTime > 0 && end + bufferTime <= workingHours.end) {
          commitmentsByDate[dateKey].push({
            start: end,
            end: end + bufferTime,
            type: 'buffer',
            name: 'Buffer time'
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });
  
  // Add breaks to each date
  if (prefs && prefs.breaks && Array.isArray(prefs.breaks)) {
    let currentDate = new Date(today);
    while (currentDate <= maxDeadline) {
      const dateKey = getDateKey(currentDate);
      prefs.breaks.forEach(breakItem => {
        if (breakItem.startTime && breakItem.endTime) {
          const breakStart = parseFloat(breakItem.startTime.split(':')[0]) + parseFloat(breakItem.startTime.split(':')[1]) / 60;
          const breakEnd = parseFloat(breakItem.endTime.split(':')[0]) + parseFloat(breakItem.endTime.split(':')[1]) / 60;
          
          if (breakStart < workingHours.end && breakEnd > workingHours.start) {
            commitmentsByDate[dateKey].push({
              start: Math.max(breakStart, workingHours.start),
              end: Math.min(breakEnd, workingHours.end),
              type: 'break',
              name: breakItem.name || 'Break'
            });
          }
        }
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // Sort all commitments by start time for each date
  Object.keys(commitmentsByDate).forEach(dateKey => {
    commitmentsByDate[dateKey].sort((a, b) => a.start - b.start);
  });
  
  const sortedHomework = [...homework].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  
  sortedHomework.forEach(hw => {
    let remainingHours = parseFloat(hw.hours);
    const blockSize = parseFloat(hw.blockSize);
    
    // Set deadline to END of the due date (23:59:59)
    const deadline = new Date(hw.deadline);
    deadline.setHours(23, 59, 59, 999);
    
    const originalHours = remainingHours;
    
    console.log(`\n--- Scheduling "${hw.name}" ---`);
    console.log('Needs:', originalHours, 'hours');
    console.log('Due date:', hw.deadline);
    console.log('Deadline (end of day):', deadline.toDateString(), deadline.toTimeString());
    
    // Calculate available hours from today through the deadline day (inclusive)
    let totalAvailableHours = 0;
    let checkDate = new Date(today);
    
    // Schedule through AND INCLUDING the deadline day
    while (checkDate <= deadline) {
      const dateKey = getDateKey(checkDate);
      const busyTimes = commitmentsByDate[dateKey] || [];
      
      let availableInDay = 0;
      let searchStart = workingHours.start;
      
      for (let i = 0; i <= busyTimes.length; i++) {
        const searchEnd = i < busyTimes.length ? busyTimes[i].start : workingHours.end;
        availableInDay += Math.max(0, searchEnd - searchStart);
        searchStart = i < busyTimes.length ? busyTimes[i].end : searchEnd;
      }
      
      totalAvailableHours += availableInDay;
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    console.log('Total available hours before deadline:', totalAvailableHours.toFixed(1));
    
    // Check if there's enough time
    if (totalAvailableHours < originalHours) {
      warnings.push({
        homework: hw.name,
        needed: originalHours,
        available: totalAvailableHours,
        message: `⚠️ Not enough time! "${hw.name}" needs ${originalHours}h but only ${totalAvailableHours.toFixed(1)}h available before deadline.`
      });
    }
    
    // Schedule the homework starting from today through the deadline day (inclusive)
    let currentDate = new Date(today);
    let scheduledSessions = 0;
    
    while (remainingHours > 0 && currentDate <= deadline) {
      const dateKey = getDateKey(currentDate);
      const dayName = getDayName(currentDate);
      const hoursToSchedule = Math.min(remainingHours, blockSize);
      
      const busyTimes = commitmentsByDate[dateKey] || [];
      let searchStart = workingHours.start;
      let scheduled = false;
      
      for (let i = 0; i <= busyTimes.length; i++) {
        const searchEnd = i < busyTimes.length ? busyTimes[i].start : workingHours.end;
        const availableTime = searchEnd - searchStart;
        
        if (availableTime >= hoursToSchedule) {
          const sessionDate = new Date(currentDate);
          newSchedule.push({
            homework: hw.name,
            day: dayName,
            startTime: searchStart,
            duration: hoursToSchedule,
            date: sessionDate
          });
          
          console.log(`  ✓ Scheduled ${hoursToSchedule}h on ${sessionDate.toDateString()} at ${formatTime(searchStart)}`);
          
          // Add this study session as a commitment to prevent overlap
          commitmentsByDate[dateKey].push({
            start: searchStart,
            end: searchStart + hoursToSchedule,
            type: 'study'
          });
          commitmentsByDate[dateKey].sort((a, b) => a.start - b.start);
          
          remainingHours -= hoursToSchedule;
          scheduledSessions++;
          scheduled = true;
          break;
        }
        
        searchStart = i < busyTimes.length ? busyTimes[i].end : searchEnd;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Scheduled ${scheduledSessions} sessions, ${remainingHours.toFixed(1)}h remaining`);
    
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

  // Sort schedule by date and time
  newSchedule.sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime - b.startTime;
  });

  console.log('\n=== FINAL SCHEDULE ===');
  console.log('Total sessions scheduled:', newSchedule.length);
  console.log('Warnings:', warnings.length);
  console.log('=== SCHEDULE GENERATION END ===\n');
  
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