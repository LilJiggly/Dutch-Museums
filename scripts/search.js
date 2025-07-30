// Advanced Search Functionality

let searchTimeout = null;
let currentSearchTerm = "";

function setupSearch(templates, data) {
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search");
  const searchSuggestions = document.getElementById("search-suggestions");

  // Search input handler with debouncing
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value;
    currentSearchTerm = searchTerm;

    // Show/hide clear button
    if (searchTerm.length > 0) {
      clearSearchBtn.classList.add("show");
    } else {
      clearSearchBtn.classList.remove("show");
    }

    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(templates, data, searchTerm);
      if (searchTerm.length >= 2) {
        showSearchSuggestions(data, searchTerm);
      } else {
        hideSearchSuggestions();
      }
    }, 300);
  });

  // Clear search button
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentSearchTerm = "";
    clearSearchBtn.classList.remove("show");
    hideSearchSuggestions();
    performSearch(templates, data, "");
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      hideSearchSuggestions();
    }
  });

  // Handle keyboard navigation in suggestions
  searchInput.addEventListener("keydown", (e) => {
    const suggestions =
      searchSuggestions.querySelectorAll(".search-suggestion");
    const activeSuggestion = searchSuggestions.querySelector(
      ".search-suggestion.active"
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeSuggestion) {
        activeSuggestion.classList.remove("active");
        const next = activeSuggestion.nextElementSibling;
        if (next) {
          next.classList.add("active");
        } else {
          suggestions[0]?.classList.add("active");
        }
      } else {
        suggestions[0]?.classList.add("active");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeSuggestion) {
        activeSuggestion.classList.remove("active");
        const prev = activeSuggestion.previousElementSibling;
        if (prev) {
          prev.classList.add("active");
        } else {
          suggestions[suggestions.length - 1]?.classList.add("active");
        }
      } else {
        suggestions[suggestions.length - 1]?.classList.add("active");
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestion) {
        activeSuggestion.click();
      }
    } else if (e.key === "Escape") {
      hideSearchSuggestions();
    }
  });
}

function performSearch(templates, data, searchTerm) {
  const filters = {
    search: searchTerm,
    status: document.getElementById("status-filter").value,
    card: document.getElementById("card-filter").value,
  };

  renderFilteredResults(templates, data, filters);
}

function showSearchSuggestions(data, searchTerm) {
  const searchSuggestions = document.getElementById("search-suggestions");

  if (!searchTerm || searchTerm.length < 2) {
    hideSearchSuggestions();
    return;
  }

  const suggestions = generateSearchSuggestions(data, searchTerm);

  if (suggestions.length === 0) {
    hideSearchSuggestions();
    return;
  }

  const suggestionsHtml = suggestions
    .map(
      (suggestion, index) => `
    <div class="search-suggestion" data-museum-index="${suggestion.index}">
      <div class="search-suggestion-name">${highlightSearchTerm(
        suggestion.name,
        searchTerm
      )}</div>
      <div class="search-suggestion-details">${suggestion.details}</div>
    </div>
  `
    )
    .join("");

  searchSuggestions.innerHTML = suggestionsHtml;
  searchSuggestions.classList.add("show");

  // Add click handlers to suggestions
  searchSuggestions
    .querySelectorAll(".search-suggestion")
    .forEach((suggestion) => {
      suggestion.addEventListener("click", () => {
        const museumIndex = suggestion.dataset.museumIndex;
        const museum = museumData[museumIndex];

        // Set search input to museum name
        document.getElementById("search-input").value = museum["Name"];
        currentSearchTerm = museum["Name"];

        // Hide suggestions
        hideSearchSuggestions();

        // Perform search - get current filters and apply search
        const filters = {
          search: museum["Name"],
          status: document.getElementById("status-filter").value,
          card: document.getElementById("card-filter").value,
        };

        // Use the global renderFilteredResults function
        const templates = window.currentTemplates || {
          gridTemplate: "",
          listTemplate: "",
        };
        renderFilteredResults(templates, museumData, filters);

        // Optionally scroll to the museum card
        setTimeout(() => {
          const museumCard = document.querySelector(
            `[onclick*="museum-${museumIndex}"]`
          );
          if (museumCard) {
            museumCard.scrollIntoView({ behavior: "smooth", block: "center" });
            museumCard.style.animation = "pulse 1s ease-out";
          }
        }, 100);
      });

      suggestion.addEventListener("mouseenter", () => {
        // Remove active class from all suggestions
        searchSuggestions
          .querySelectorAll(".search-suggestion")
          .forEach((s) => s.classList.remove("active"));
        // Add active class to hovered suggestion
        suggestion.classList.add("active");
      });
    });
}

function hideSearchSuggestions() {
  const searchSuggestions = document.getElementById("search-suggestions");
  searchSuggestions.classList.remove("show");
  searchSuggestions.innerHTML = "";
}

function generateSearchSuggestions(data, searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  const suggestions = [];
  const maxSuggestions = 8;

  data.forEach((museum, index) => {
    const name = museum["Name"] || "";
    const address = museum["Address"] || "";
    const description = museum["Description_Text"] || "";
    const facilities = museum["Facilities"] || "";

    let matchType = "";
    let matchDetails = "";

    // Check for name match (highest priority)
    if (name.toLowerCase().includes(term)) {
      matchType = "name";
      matchDetails = `📍 ${address}`;
    }
    // Check for address match
    else if (address.toLowerCase().includes(term)) {
      matchType = "address";
      matchDetails = `📍 ${address}`;
    }
    // Check for facilities match
    else if (facilities.toLowerCase().includes(term)) {
      matchType = "facilities";
      matchDetails = `🛠 Facilities: ${facilities.substring(0, 50)}...`;
    }
    // Check for description match
    else if (description.toLowerCase().includes(term)) {
      matchType = "description";
      const matchIndex = description.toLowerCase().indexOf(term);
      const start = Math.max(0, matchIndex - 30);
      const end = Math.min(description.length, matchIndex + 50);
      matchDetails = `📝 ...${description.substring(start, end)}...`;
    }

    if (matchType && suggestions.length < maxSuggestions) {
      suggestions.push({
        index: index,
        name: name,
        details: matchDetails,
        matchType: matchType,
        priority: matchType === "name" ? 1 : matchType === "address" ? 2 : 3,
      });
    }
  });

  // Sort by priority (name matches first)
  return suggestions.sort((a, b) => a.priority - b.priority);
}

function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Export for global access
window.setupSearch = setupSearch;
window.performSearch = performSearch;
