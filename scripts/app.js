// Main application logic
function renderCard(template, data, index) {
  const openingStatus = getCurrentOpeningStatus(data);
  const nextOpeningInfo = getNextOpeningTime(data);
  const museumId = `museum-${index}`;

  // Format next opening time for cards
  const nextOpeningHtml = nextOpeningInfo
    ? `<div class="museum-status status-closed next-opening-card">${nextOpeningInfo}</div>`
    : "";

  return template
    .replace(/\{\{IMAGE\}\}/g, data["Image"] || "images/placeholder.jpg")
    .replace(/\{\{NAME\}\}/g, data["Name"] || "")
    .replace(/\{\{MUSEUM_ID\}\}/g, museumId)
    .replace(/\{\{OPEN_TODAY\}\}/g, openingStatus.message)
    .replace(/\{\{STATUS_CLASS\}\}/g, openingStatus.className)
    .replace(/\{\{NEXT_OPENING\}\}/g, nextOpeningHtml)
    .replace(/\{\{ADDRESS\}\}/g, data["Address"] || "-")
    .replace(/\{\{MAPS\}\}/g, data["Google Maps"] || "#")
    .replace(/\{\{PHONE\}\}/g, data["Phone"] || "-")
    .replace(/\{\{HOURS\}\}/g, formatOpeningHours(data))
    .replace(/\{\{CARD\}\}/g, data["Museum Card"] || "-")
    .replace(
      /\{\{DESCRIPTION_BLOCKS\}\}/g,
      formatDescription(data["Description_Text"])
    )
    .replace(/\{\{FACILITIES\}\}/g, formatFacilities(data["Facilities"]));
}

// Search functionality
function searchMuseums(data, searchTerm) {
  if (!searchTerm || searchTerm.trim() === "") {
    return data;
  }

  const term = searchTerm.toLowerCase().trim();

  return data.filter((museum) => {
    // Search in all relevant fields
    const searchableFields = [
      museum["Name"],
      museum["Address"],
      museum["Description_Text"],
      museum["Facilities"],
      museum["Phone"],
      // Opening hours
      museum["Opening_Monday"],
      museum["Opening_Tuesday"],
      museum["Opening_Wednesday"],
      museum["Opening_Thursday"],
      museum["Opening_Friday"],
      museum["Opening_Saturday"],
      museum["Opening_Sunday"],
    ];

    return searchableFields.some((field) => {
      if (!field) return false;
      return field.toLowerCase().includes(term);
    });
  });
}

// Filtering functions
function filterMuseums(data, filters) {
  let filteredData = data;

  // Apply search filter first
  if (filters.search) {
    filteredData = searchMuseums(filteredData, filters.search);
  }

  return filteredData.filter((museum) => {
    // Status filter
    if (filters.status !== "all") {
      const status = getCurrentOpeningStatus(museum);
      if (filters.status !== status.status) return false;
    }

    // Museum card filter
    if (filters.card !== "all") {
      const hasCard = museum["Museum Card"]?.toLowerCase() === "yes";
      if (filters.card === "yes" && !hasCard) return false;
      if (filters.card === "no" && hasCard) return false;
    }

    return true;
  });
}

function renderFilteredResults(templates, data, filters) {
  CONFIG.container.innerHTML = "";
  const filteredData = filterMuseums(data, filters);

  // Choose template based on current view
  const template =
    currentView === "grid" ? templates.gridTemplate : templates.listTemplate;

  // Update container class for styling
  CONFIG.container.className =
    currentView === "grid"
      ? "cards-container stagger-animation"
      : "cards-container list-view stagger-animation";

  filteredData.forEach((museum, filteredIndex) => {
    // Find the original index of this museum in the full dataset
    const originalIndex = data.findIndex((m) => m === museum);
    const html = renderCard(template, museum, originalIndex);
    CONFIG.container.insertAdjacentHTML("beforeend", html);
  });

  // Add click handlers to make entire cards clickable
  const cards = CONFIG.container.querySelectorAll(
    ".museum-card, .list-museum-card"
  );
  cards.forEach((card, domIndex) => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicking on a button or link
      if (
        e.target.tagName === "BUTTON" ||
        e.target.tagName === "A" ||
        e.target.closest("button") ||
        e.target.closest("a")
      ) {
        return;
      }

      // Get the original museum index from the filtered data
      const museum = filteredData[domIndex];
      const originalIndex = data.findIndex((m) => m === museum);
      const museumId = `museum-${originalIndex}`;
      openMuseumPage(museumId);
    });
  });

  // Update results info
  const resultsInfo = document.getElementById("results-info");
  const total = data.length;
  const shown = filteredData.length;

  if (shown === total) {
    resultsInfo.textContent = `Showing all ${total} museums`;
  } else {
    resultsInfo.textContent = `Showing ${shown} of ${total} museums`;
  }
}
