// Lazy Loading / Infinite Scroll System

let currentlyDisplayed = 0;
let filteredMuseumData = [];
let isLoading = false;
const MUSEUMS_PER_LOAD = 30;
const LOAD_THRESHOLD = 300; // pixels from bottom

function initializeLazyLoading() {
  // Set up intersection observer for infinite scroll
  setupInfiniteScroll();

  // Set up resize observer to handle window resizing
  window.addEventListener("resize", debounce(checkIfNeedMoreContent, 250));
}

function setupInfiniteScroll() {
  // Create a sentinel element at the bottom
  const sentinel = document.createElement("div");
  sentinel.id = "scroll-sentinel";
  sentinel.style.height = "1px";
  sentinel.style.position = "absolute";
  sentinel.style.bottom = `${LOAD_THRESHOLD}px`;
  sentinel.style.width = "100%";
  sentinel.style.pointerEvents = "none";

  // Add sentinel to main content
  const mainContent = document.querySelector(".main-content");
  mainContent.appendChild(sentinel);

  // Set up intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoading && hasMoreContent()) {
          loadMoreMuseums();
        }
      });
    },
    {
      rootMargin: `${LOAD_THRESHOLD}px`,
    }
  );

  observer.observe(sentinel);

  // Also check on scroll for backup
  let scrollTimeout;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (!isLoading && hasMoreContent() && isNearBottom()) {
        loadMoreMuseums();
      }
    }, 100);
  });
}

function isNearBottom() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  return scrollTop + windowHeight >= documentHeight - LOAD_THRESHOLD;
}

function hasMoreContent() {
  return currentlyDisplayed < filteredMuseumData.length;
}

function renderFilteredResultsWithLazyLoading(templates, data, filters) {
  // Apply filters to get the complete filtered dataset
  filteredMuseumData = filterMuseums(data, filters);

  // Reset display counter
  currentlyDisplayed = 0;

  // Clear container
  CONFIG.container.innerHTML = "";

  // Update container class for styling
  CONFIG.container.className =
    currentView === "grid"
      ? "cards-container stagger-animation"
      : "cards-container list-view stagger-animation";

  // Load initial batch
  loadMoreMuseums(templates);

  // Update results info
  updateResultsInfo(data.length, filteredMuseumData.length);

  // Show load more button if there's more content
  showLoadMoreButton();
}

function loadMoreMuseums(templates = null) {
  if (isLoading || !hasMoreContent()) return;

  isLoading = true;
  showLoadingIndicator();

  // Use global templates if not provided
  if (!templates) {
    templates = window.currentTemplates;
  }

  // Calculate slice bounds
  const startIndex = currentlyDisplayed;
  const endIndex = Math.min(
    startIndex + MUSEUMS_PER_LOAD,
    filteredMuseumData.length
  );
  const museumsToLoad = filteredMuseumData.slice(startIndex, endIndex);

  // Choose template based on current view
  const template =
    currentView === "grid" ? templates.gridTemplate : templates.listTemplate;

  // Render new museums with stagger animation
  museumsToLoad.forEach((museum, index) => {
    // Find the original index of this museum in the full dataset
    const originalIndex = museumData.findIndex((m) => m === museum);
    const html = renderCard(template, museum, originalIndex);

    // Create a wrapper for animation
    const cardWrapper = document.createElement("div");
    cardWrapper.innerHTML = html;
    cardWrapper.style.opacity = "0";
    cardWrapper.style.transform = "translateY(20px)";
    cardWrapper.style.transition = "all 0.4s ease-out";
    cardWrapper.style.transitionDelay = `${index * 50}ms`; // Stagger effect

    CONFIG.container.appendChild(cardWrapper.firstElementChild);

    // Trigger animation
    setTimeout(() => {
      const card = CONFIG.container.lastElementChild;
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 50);
  });

  // Add click handlers to new cards
  addClickHandlersToNewCards(startIndex, endIndex);

  // Update counter
  currentlyDisplayed = endIndex;

  // Hide loading indicator
  setTimeout(() => {
    hideLoadingIndicator();
    isLoading = false;

    // Update load more button
    updateLoadMoreButton();

    // Check if we need to load more content immediately (for very tall screens)
    setTimeout(checkIfNeedMoreContent, 100);
  }, 300);
}

function addClickHandlersToNewCards(startIndex, endIndex) {
  const allCards = CONFIG.container.querySelectorAll(
    ".museum-card, .list-museum-card"
  );
  const newCards = Array.from(allCards).slice(startIndex, endIndex);

  newCards.forEach((card, relativeIndex) => {
    const absoluteIndex = startIndex + relativeIndex;
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
      const museum = filteredMuseumData[absoluteIndex];
      const originalIndex = museumData.findIndex((m) => m === museum);
      const museumId = `museum-${originalIndex}`;
      openMuseumPage(museumId);
    });
  });
}

function showLoadingIndicator() {
  let loadingIndicator = document.getElementById("lazy-loading-indicator");

  if (!loadingIndicator) {
    loadingIndicator = document.createElement("div");
    loadingIndicator.id = "lazy-loading-indicator";
    loadingIndicator.innerHTML = `
      <div class="loading-indicator">
        <div class="loading-spinner"></div>
        <span>Loading more museums...</span>
      </div>
    `;
    CONFIG.container.parentNode.appendChild(loadingIndicator);
  }

  loadingIndicator.style.display = "flex";
}

function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById("lazy-loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
}

function showLoadMoreButton() {
  let loadMoreBtn = document.getElementById("load-more-btn");

  if (!loadMoreBtn && hasMoreContent()) {
    loadMoreBtn = document.createElement("div");
    loadMoreBtn.id = "load-more-btn";
    loadMoreBtn.innerHTML = `
      <button class="btn btn-primary load-more-button">
        Load More Museums (${
          filteredMuseumData.length - currentlyDisplayed
        } remaining)
      </button>
    `;

    loadMoreBtn.querySelector("button").addEventListener("click", () => {
      loadMoreMuseums();
    });

    CONFIG.container.parentNode.appendChild(loadMoreBtn);
  }

  updateLoadMoreButton();
}

function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) {
    const button = loadMoreBtn.querySelector("button");
    const remaining = filteredMuseumData.length - currentlyDisplayed;

    if (remaining > 0) {
      button.textContent = `Load More Museums (${remaining} remaining)`;
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }
  }
}

function updateResultsInfo(totalMuseums, filteredCount) {
  const resultsInfo = document.getElementById("results-info");

  if (filteredCount === totalMuseums) {
    resultsInfo.textContent = `Showing ${Math.min(
      currentlyDisplayed,
      filteredCount
    )} of ${totalMuseums} museums`;
  } else {
    resultsInfo.textContent = `Showing ${Math.min(
      currentlyDisplayed,
      filteredCount
    )} of ${filteredCount} filtered museums (${totalMuseums} total)`;
  }

  // Add load progress if not all are shown
  if (currentlyDisplayed < filteredCount) {
    resultsInfo.textContent += ` • Scroll for more`;
  }
}

function checkIfNeedMoreContent() {
  // Check if the viewport is taller than content and we have more to load
  const containerHeight = CONFIG.container.offsetHeight;
  const viewportHeight = window.innerHeight;

  if (
    containerHeight < viewportHeight * 1.5 &&
    hasMoreContent() &&
    !isLoading
  ) {
    loadMoreMuseums();
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export functions for global access
window.initializeLazyLoading = initializeLazyLoading;
window.renderFilteredResultsWithLazyLoading =
  renderFilteredResultsWithLazyLoading;
window.loadMoreMuseums = loadMoreMuseums;
