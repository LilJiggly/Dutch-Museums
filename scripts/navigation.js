// Navigation and filtering setup
function setupNavigation(templates, data) {
  const visitDateInput = document.getElementById("visit-date");
  const todayBtn = document.getElementById("today-btn");
  const statusFilter = document.getElementById("status-filter");
  const cardFilter = document.getElementById("card-filter");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const gridViewBtn = document.getElementById("grid-view");
  const listViewBtn = document.getElementById("list-view");
  const toggleDetailsBtn = document.getElementById("toggle-details");

  // Set default date to today
  const today = new Date().toISOString().split("T")[0];
  visitDateInput.value = today;

  function getFilters() {
    const searchInput = document.getElementById("search-input");
    return {
      search: searchInput ? searchInput.value : "",
      status: statusFilter.value,
      card: cardFilter.value,
    };
  }

  function applyFilters() {
    renderFilteredResults(templates, data, getFilters());
  }

  // Date change handler
  visitDateInput.addEventListener("change", (e) => {
    selectedDate = e.target.value
      ? new Date(e.target.value + "T12:00:00 -")
      : null;
    applyFilters();
  });

  // Today button
  todayBtn.addEventListener("click", () => {
    selectedDate = null;
    visitDateInput.value = today;
    applyFilters();
  });

  // Filter change handlers
  statusFilter.addEventListener("change", applyFilters);
  cardFilter.addEventListener("change", applyFilters);

  // Clear filters
  clearFiltersBtn.addEventListener("click", () => {
    selectedDate = null;
    visitDateInput.value = today;
    statusFilter.value = "all";
    cardFilter.value = "all";

    // Clear search
    const searchInput = document.getElementById("search-input");
    const clearSearchBtn = document.getElementById("clear-search");
    if (searchInput) {
      searchInput.value = "";
      clearSearchBtn.classList.remove("show");
    }

    applyFilters();
  });

  // Toggle opening hours visibility
  let hoursVisible = false;
  toggleDetailsBtn.addEventListener("click", () => {
    hoursVisible = !hoursVisible;
    const openingHoursElements = document.querySelectorAll(".opening-hours");

    openingHoursElements.forEach((element) => {
      element.style.display = hoursVisible ? "block" : "none";
    });

    toggleDetailsBtn.textContent = hoursVisible ? "Hide Hours" : "Show Hours";
  });

  // View switching
  gridViewBtn.addEventListener("click", () => {
    currentView = "grid";
    gridViewBtn.classList.add("active");
    listViewBtn.classList.remove("active");
    applyFilters();
  });

  listViewBtn.addEventListener("click", () => {
    currentView = "list";
    listViewBtn.classList.add("active");
    gridViewBtn.classList.remove("active");
    applyFilters();
  });

  // Setup search functionality
  setupSearch(templates, data);

  // Initial render
  applyFilters();
}
