// Main initialization
(async function init() {
  try {
    // Show loading state
    CONFIG.container.innerHTML = `
      <div class="loading-state" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        text-align: center;
        color: var(--neutral-600);
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid var(--neutral-200);
          border-top: 3px solid var(--primary-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        "></div>
        <h3 style="margin: 0 0 0.5rem 0; font-family: var(--font-display);">Loading Museums</h3>
        <p style="margin: 0; font-size: 0.875rem;">Discovering amazing Dutch museums for you...</p>
      </div>
    `;

    const [templates, data] = await Promise.all([loadTemplates(), loadData()]);

    // Make data and templates globally available
    museumData = data;
    window.currentTemplates = templates;

    // Initialize lazy loading system
    initializeLazyLoading();

    // Setup navigation and initial render
    setupNavigation(templates, data);

    // Handle window resize to reload templates if needed
    let resizeTimeout;
    let wasMobile = isMobileDevice();

    window.addEventListener("resize", async () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(async () => {
        const isMobileNow = isMobileDevice();

        // If mobile state changed, reload templates and re-render
        if (wasMobile !== isMobileNow) {
          wasMobile = isMobileNow;

          try {
            const newTemplates = await loadTemplates();
            window.currentTemplates = newTemplates;

            // Re-render current view with new templates
            const filters = {
              search: document.getElementById("search-input")?.value || "",
              status: document.getElementById("status-filter").value,
              card: document.getElementById("card-filter").value,
            };
            renderFilteredResults(newTemplates, data, filters);
          } catch (error) {
            console.error("Failed to reload templates on resize:", error);
          }
        }
      }, 250);
    });

    // Update status every 5 minutes to keep it current (less frequent refreshing)
    setInterval(() => {
      const filters = {
        search: document.getElementById("search-input")?.value || "",
        status: document.getElementById("status-filter").value,
        card: document.getElementById("card-filter").value,
      };
      renderFilteredResults(templates, data, filters);
    }, 300000); // 5 minutes (300 seconds)

    // Time display is already handled in the header, no need to create another one

    // Update time display in header
    function updateHeaderTime() {
      const timeDisplay = document.getElementById("current-time");
      if (timeDisplay) {
        const { dayName, timeStr } = getCurrentTimeInNetherlands(selectedDate);
        const dateInfo = selectedDate
          ? ` (Simulating: ${new Date(selectedDate).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
              }
            )})`
          : "";
        timeDisplay.textContent = `${dayName}, ${timeStr}${dateInfo}`;
      }
    }

    updateHeaderTime();
    setInterval(updateHeaderTime, 1000); // Update every second

    console.log(`✅ Loaded ${data.length} museums successfully`);
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    CONFIG.container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #721c24; background: #f8d7da; border-radius: 8px;">
        <h3>Failed to load museum data</h3>
        <p>Please check your internet connection and try refreshing the page.</p>
      </div>
    `;
  }
})();
