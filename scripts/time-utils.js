// Time and opening hours utilities
function getCurrentTimeInNetherlands(simulateDate = null) {
  const now = simulateDate ? new Date(simulateDate) : new Date();

  // Get day name
  const dayName = now.toLocaleDateString("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
  });

  // Get time (use current time even when simulating date)
  const timeStr = new Date().toLocaleTimeString("en-US", {
    timeZone: "Europe/Amsterdam",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  return { dayName, timeStr };
}

function parseTimeRange(timeStr) {
  if (
    !timeStr ||
    timeStr.toLowerCase().includes("closed") ||
    timeStr.toLowerCase().includes("time unknown")
  ) {
    return null;
  }

  // Parse formats like "10:00 - 17:00" or "10:00-17:00"
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const [, openHour, openMin, closeHour, closeMin] = match;
  return {
    open: { hour: parseInt(openHour), minute: parseInt(openMin) },
    close: { hour: parseInt(closeHour), minute: parseInt(closeMin) },
  };
}

function getCurrentOpeningStatus(data) {
  const { dayName, timeStr } = getCurrentTimeInNetherlands(selectedDate);
  const [currentHour, currentMinute] = timeStr.split(":").map(Number);

  // Get today's opening hours
  const todayHours = data[`Opening_${dayName}`];

  if (!todayHours || todayHours.toLowerCase().includes("closed")) {
    return {
      status: "closed",
      message: "Closed today",
      className: "status-closed",
    };
  }

  if (todayHours.toLowerCase().includes("time unknown")) {
    return {
      status: "unknown",
      message: "Opening hours unknown",
      className: "status-unknown",
    };
  }

  const timeRange = parseTimeRange(todayHours);
  if (!timeRange) {
    return {
      status: "unknown",
      message: "Opening hours unclear",
      className: "status-unknown",
    };
  }

  const currentMinutes = currentHour * 60 + currentMinute;
  const openMinutes = timeRange.open.hour * 60 + timeRange.open.minute;
  const closeMinutes = timeRange.close.hour * 60 + timeRange.close.minute;

  if (currentMinutes < openMinutes) {
    const openTime = `${timeRange.open.hour
      .toString()
      .padStart(2, "0")}:${timeRange.open.minute.toString().padStart(2, "0")}`;
    return {
      status: "closed",
      message: `Closed - Opens at ${openTime}`,
      className: "status-closed",
    };
  } else if (currentMinutes >= closeMinutes) {
    return {
      status: "closed",
      message: "Closed for today",
      className: "status-closed",
    };
  } else {
    const openTime = `${timeRange.open.hour
      .toString()
      .padStart(2, "0")}:${timeRange.open.minute.toString().padStart(2, "0")}`;
    const closeTime = `${timeRange.close.hour
      .toString()
      .padStart(2, "0")}:${timeRange.close.minute.toString().padStart(2, "0")}`;
    return {
      status: "open",
      message: `Open until ${closeTime}`,
      className: "status-open",
    };
  }
}

function getNextOpeningTime(data) {
  const { dayName } = getCurrentTimeInNetherlands(selectedDate);
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const currentDayIndex = days.indexOf(dayName);

  // Check if currently closed
  const currentStatus = getCurrentOpeningStatus(data);
  if (currentStatus.status === "open") {
    return null; // Museum is open, no need to show next opening
  }

  // Look for next opening day (starting from tomorrow)
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = days[nextDayIndex];
    const nextDayHours = data[`Opening_${nextDay}`];

    if (
      nextDayHours &&
      !nextDayHours.toLowerCase().includes("closed") &&
      !nextDayHours.toLowerCase().includes("time unknown")
    ) {
      const timeRange = parseTimeRange(nextDayHours);
      if (timeRange) {
        const openTime = `${timeRange.open.hour
          .toString()
          .padStart(2, "0")}:${timeRange.open.minute
          .toString()
          .padStart(2, "0")}`;
        const dayText = i === 1 ? "tomorrow" : nextDay;
        return `📅 Next opening: ${dayText} at ${openTime}`;
      }
    }
  }

  return null; // No opening hours found in the next week
}
