// Data formatting utilities
function formatDescription(text) {
  if (!text) return "<em>No description available</em>";

  // Split by double newlines to get paragraphs/sections
  const sections = text.split("\n\n");
  let html = "";

  sections.forEach((section) => {
    const lines = section.split("\n");
    if (lines.length > 1) {
      // First line is likely a heading
      html += `<div class="description-title">${lines[0]}</div>`;
      html += `<div class="description-block">${lines
        .slice(1)
        .join(" ")}</div>`;
    } else {
      // Single paragraph
      html += `<div class="description-block">${section}</div>`;
    }
  });

  return html;
}

function formatOpeningHours(data) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const hours = [];

  days.forEach((day) => {
    const dayHours = data[`Opening_${day}`];
    if (dayHours && dayHours !== "Time unknown") {
      hours.push(
        `<div class="hours-day"><strong>${day}:</strong> ${dayHours}</div>`
      );
    } else if (dayHours === "Time unknown") {
      hours.push(
        `<div class="hours-day"><strong>${day}:</strong> <em>Time unknown</em></div>`
      );
    }
  });

  return hours.length > 0
    ? hours.join("")
    : "<em>Opening hours not available</em>";
}

function formatFacilities(facilityText) {
  if (!facilityText) return "<em>None listed</em>";
  return facilityText
    .split(",")
    .map((f) => `<span class="facility-tag">${f.trim()}</span>`)
    .join("");
}

function formatOpeningHoursForModal(data) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Get current day for highlighting
  const { dayName: currentDay } = getCurrentTimeInNetherlands(selectedDate);

  const hoursHtml = days
    .map((day) => {
      const dayHours = data[`Opening_${day}`];
      let timeDisplay = "";
      const isCurrentDay = day === currentDay;

      if (!dayHours || dayHours.toLowerCase().includes("closed")) {
        timeDisplay = "<em>Closed</em>";
      } else if (dayHours.toLowerCase().includes("time unknown")) {
        timeDisplay = "<em>Time unknown</em>";
      } else {
        timeDisplay = dayHours;
      }

      return `
      <div class="modal-hours-day ${isCurrentDay ? "current-day" : ""}">
        <span class="modal-hours-name">${day}${
        isCurrentDay ? " (Today)" : ""
      }</span>
        <span class="modal-hours-time">${timeDisplay}</span>
      </div>
    `;
    })
    .join("");

  return `<div class="modal-hours-grid">${hoursHtml}</div>`;
}

function formatFacilitiesForModal(facilityText) {
  if (!facilityText) return '<div class="modal-facility-tag">None listed</div>';

  return facilityText
    .split(",")
    .map(
      (f) => `<div class="modal-facility-tag">
      <span class="modal-facility-icon">🏛️</span>
      ${f.trim()}
    </div>`
    )
    .join("");
}
