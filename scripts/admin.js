// Admin Panel JavaScript
// museumData is declared in config.js
museumData = []; // Initialize the global variable
let currentEditingIndex = -1;
let originalData = []; // Store original data for comparison
let changeLog = []; // Store all changes

// Admin password (you can change this)
const ADMIN_PASSWORD = "museum2025"; // Change this to your preferred password

// Check authentication on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check if already authenticated
  const isAuthenticated = sessionStorage.getItem("adminAuthenticated");

  if (isAuthenticated === "true") {
    showAdminPanel();
  } else {
    showLoginScreen();
  }

  // Setup login form
  setupLoginForm();
});

// Show login screen
function showLoginScreen() {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("admin-content").style.display = "none";
}

// Show admin panel
function showAdminPanel() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("admin-content").style.display = "block";
  loadAdminData();
}

// Setup login form
function setupLoginForm() {
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const password = document.getElementById("admin-password").value;

    if (password === ADMIN_PASSWORD) {
      // Set authentication flag
      sessionStorage.setItem("adminAuthenticated", "true");
      showAdminPanel();
      showStatus("login-status", "Access granted!", "success");
    } else {
      showStatus("login-status", "Incorrect password. Access denied.", "error");
      document.getElementById("admin-password").value = "";
    }
  });
}

// Load museum data (moved from DOMContentLoaded)
async function loadAdminData() {
  try {
    // Check if there's data in localStorage first
    const localData = localStorage.getItem("museumData");
    if (localData) {
      museumData = JSON.parse(localData);
      console.log(`Loaded ${museumData.length} museums from localStorage`);
    } else {
      // Load from JSON file
      const response = await fetch("data/museum_details_full.json");
      museumData = await response.json();
      console.log(`Loaded ${museumData.length} museums from JSON file`);
    }

    // Store original data for comparison
    originalData = JSON.parse(JSON.stringify(museumData));

    // Load existing changelog
    const savedChangeLog = localStorage.getItem("museumChangeLog");
    if (savedChangeLog) {
      changeLog = JSON.parse(savedChangeLog);
    }

    loadMuseumList();
    updateMuseumCount();
    updateChangeLogDisplay();
    setupEventListeners();
  } catch (error) {
    console.error("Failed to load museum data:", error);
    showStatus("edit-status", "Failed to load museum data", "error");
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const tabName = e.target.getAttribute("data-tab");
      showTab(tabName);
    });
  });

  // Action buttons
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (e) => {
      const action = e.target.getAttribute("data-action");

      // Call the appropriate function
      switch (action) {
        case "clearForm":
          clearForm();
          break;
        case "exportJSON":
          exportJSON();
          break;
        case "exportCSV":
          exportCSV();
          break;
        case "showDataPreview":
          showDataPreview();
          break;
        case "importData":
          importData();
          break;
        case "commitChanges":
          commitChanges();
          break;
        case "discardChanges":
          discardChanges();
          break;
        case "clearChangeLog":
          clearChangeLog();
          break;
        default:
          console.warn("Unknown action:", action);
      }
    });
  });
}

// Update museum count display
function updateMuseumCount() {
  const countElement = document.getElementById("museum-count");
  if (countElement) {
    countElement.textContent = museumData.length;
  }
}

// Tab switching
function showTab(tabName) {
  // Hide all panels
  document.querySelectorAll(".admin-panel").forEach((panel) => {
    panel.classList.remove("active");
  });

  // Remove active class from all tabs
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected panel and activate tab
  document.getElementById(`${tabName}-panel`).classList.add("active");

  // Find and activate the correct tab
  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add("active");
  }
}

// Show status messages
function showStatus(elementId, message, type) {
  const statusEl = document.getElementById(elementId);
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
  statusEl.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusEl.style.display = "none";
  }, 5000);
}

// Generate Google Maps URL
function generateMapsUrl(name, address) {
  const query = encodeURIComponent(`${name}, ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// Save to localStorage and update count
function saveToLocalStorage() {
  localStorage.setItem("museumData", JSON.stringify(museumData));
  updateMuseumCount();
}

// Add museum form submission
document
  .getElementById("add-museum-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const name = document.getElementById("name").value.trim();
      const address = document.getElementById("address").value.trim();

      if (!name || !address) {
        showStatus("add-status", "Name and address are required", "error");
        return;
      }

      // Check if museum already exists (only for new museums)
      if (currentEditingIndex === -1) {
        const existingMuseum = museumData.find(
          (m) => m.Name.toLowerCase() === name.toLowerCase()
        );

        if (existingMuseum) {
          showStatus(
            "add-status",
            "A museum with this name already exists",
            "error"
          );
          return;
        }
      }

      const newMuseum = {
        Name: name,
        "Open Today": "Hours unknown",
        Opening_Monday:
          document.getElementById("monday").value || "Hours unknown",
        Opening_Tuesday:
          document.getElementById("tuesday").value || "Hours unknown",
        Opening_Wednesday:
          document.getElementById("wednesday").value || "Hours unknown",
        Opening_Thursday:
          document.getElementById("thursday").value || "Hours unknown",
        Opening_Friday:
          document.getElementById("friday").value || "Hours unknown",
        Opening_Saturday:
          document.getElementById("saturday").value || "Hours unknown",
        Opening_Sunday:
          document.getElementById("sunday").value || "Hours unknown",
        Address: address,
        "Google Maps": generateMapsUrl(name, address),
        Phone: document.getElementById("phone").value || "-",
        Description_Text: document.getElementById("description").value || "",
        "Museum Card": document.getElementById("museum-card").value,
        Facilities: document.getElementById("facilities").value || "",
        Image:
          document.getElementById("image").value || "images/placeholder.jpg",
        Official_Website: document.getElementById("website").value || "",
      };

      if (currentEditingIndex >= 0) {
        // Update existing museum
        const oldMuseum = JSON.parse(
          JSON.stringify(museumData[currentEditingIndex])
        );
        museumData[currentEditingIndex] = newMuseum;

        // Log the change
        logChange("edited", newMuseum.Name, `Updated museum details`, {
          old: oldMuseum,
          new: newMuseum,
        });

        showStatus(
          "add-status",
          `Museum "${name}" updated successfully!`,
          "success"
        );
        cancelEdit();
      } else {
        // Add new museum
        museumData.push(newMuseum);

        // Log the change
        logChange("added", newMuseum.Name, `Added new museum`);

        showStatus(
          "add-status",
          `Museum "${name}" added successfully!`,
          "success"
        );
        clearForm();
      }

      // Save to localStorage
      saveToLocalStorage();
      loadMuseumList(); // Refresh the edit list
    } catch (error) {
      console.error("Error saving museum:", error);
      showStatus("add-status", "Failed to save museum", "error");
    }
  });

// Clear form
function clearForm() {
  document.getElementById("add-museum-form").reset();
}

// Load museum list for editing
function loadMuseumList() {
  const listContainer = document.getElementById("museum-list");
  const searchTerm = document
    .getElementById("search-museums")
    .value.toLowerCase();

  const filteredMuseums = museumData.filter(
    (museum) =>
      museum.Name.toLowerCase().includes(searchTerm) ||
      museum.Address.toLowerCase().includes(searchTerm)
  );

  listContainer.innerHTML = filteredMuseums
    .map(
      (museum, index) => `
    <div class="museum-item">
      <div>
        <div class="museum-name">${museum.Name}</div>
        <div class="museum-address">${museum.Address}</div>
      </div>
      <div class="museum-actions">
        <button class="btn btn-secondary btn-sm" onclick="editMuseum(${museumData.indexOf(
          museum
        )})">
          ✏️ Edit
        </button>
        <button class="btn btn-error btn-sm" onclick="deleteMuseum(${museumData.indexOf(
          museum
        )})">
          🗑️ Delete
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// Search museums
document
  .getElementById("search-museums")
  .addEventListener("input", loadMuseumList);

// Edit museum
function editMuseum(index) {
  currentEditingIndex = index;
  const museum = museumData[index];

  // Switch to add tab and populate form
  showTab("add");
  document.querySelector(".admin-tab").click(); // Activate add tab

  // Populate form with existing data
  document.getElementById("name").value = museum.Name || "";
  document.getElementById("address").value = museum.Address || "";
  document.getElementById("phone").value =
    museum.Phone === "-" ? "" : museum.Phone || "";
  document.getElementById("website").value = museum.Official_Website || "";
  document.getElementById("museum-card").value =
    museum["Museum Card"] || "Unknown";
  document.getElementById("image").value = museum.Image || "";
  document.getElementById("description").value = museum.Description_Text || "";
  document.getElementById("facilities").value = museum.Facilities || "";

  // Opening hours
  document.getElementById("monday").value =
    museum.Opening_Monday === "Hours unknown"
      ? ""
      : museum.Opening_Monday || "";
  document.getElementById("tuesday").value =
    museum.Opening_Tuesday === "Hours unknown"
      ? ""
      : museum.Opening_Tuesday || "";
  document.getElementById("wednesday").value =
    museum.Opening_Wednesday === "Hours unknown"
      ? ""
      : museum.Opening_Wednesday || "";
  document.getElementById("thursday").value =
    museum.Opening_Thursday === "Hours unknown"
      ? ""
      : museum.Opening_Thursday || "";
  document.getElementById("friday").value =
    museum.Opening_Friday === "Hours unknown"
      ? ""
      : museum.Opening_Friday || "";
  document.getElementById("saturday").value =
    museum.Opening_Saturday === "Hours unknown"
      ? ""
      : museum.Opening_Saturday || "";
  document.getElementById("sunday").value =
    museum.Opening_Sunday === "Hours unknown"
      ? ""
      : museum.Opening_Sunday || "";

  // Change form title and button
  document.querySelector(
    "#add-panel h2"
  ).textContent = `Edit Museum: ${museum.Name}`;
  document.querySelector('#add-museum-form button[type="submit"]').textContent =
    "Update Museum";

  // Add cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-ghost";
  cancelBtn.textContent = "Cancel Edit";
  cancelBtn.onclick = cancelEdit;

  const buttonContainer = document.querySelector(
    "#add-museum-form > div:last-child"
  );
  if (!buttonContainer.querySelector(".btn-ghost")) {
    buttonContainer.appendChild(cancelBtn);
  }
}

// Cancel edit
function cancelEdit() {
  currentEditingIndex = -1;
  clearForm();
  document.querySelector("#add-panel h2").textContent = "Add New Museum";
  document.querySelector('#add-museum-form button[type="submit"]').textContent =
    "Add Museum";

  // Remove cancel button
  const cancelBtn = document.querySelector("#add-museum-form .btn-ghost");
  if (cancelBtn) cancelBtn.remove();
}

// Delete museum
function deleteMuseum(index) {
  const museum = museumData[index];

  if (confirm(`Are you sure you want to delete "${museum.Name}"?`)) {
    // Log the change before deletion
    logChange("deleted", museum.Name, `Deleted museum`, { deleted: museum });

    museumData.splice(index, 1);
    saveToLocalStorage();
    loadMuseumList();
    showStatus(
      "edit-status",
      `Museum "${museum.Name}" deleted successfully`,
      "success"
    );
  }
}

// Export functions
function exportJSON() {
  const dataStr = JSON.stringify(museumData, null, 2);
  downloadFile(dataStr, "museum_data.json", "application/json");
  showStatus("export-status", "JSON file downloaded successfully", "success");
}

function exportCSV() {
  if (museumData.length === 0) {
    showStatus("export-status", "No data to export", "error");
    return;
  }

  const headers = Object.keys(museumData[0]);
  const csvContent = [
    headers.join(","),
    ...museumData.map((museum) =>
      headers
        .map((header) => {
          const value = museum[header] || "";
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(",") || value.includes('"')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, "museum_data.csv", "text/csv");
  showStatus("export-status", "CSV file downloaded successfully", "success");
}

function showDataPreview() {
  const preview = document.getElementById("data-preview");
  const content = document.getElementById("preview-content");

  content.textContent =
    JSON.stringify(museumData.slice(0, 3), null, 2) +
    (museumData.length > 3
      ? `\n\n... and ${museumData.length - 3} more museums`
      : "");

  preview.style.display = "block";
}

// Download file helper
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import data functionality
function importData() {
  const fileInput = document.getElementById("import-file");
  const file = fileInput.files[0];

  if (!file) {
    showStatus("export-status", "Please select a JSON file to import", "error");
    return;
  }

  if (!file.name.endsWith(".json")) {
    showStatus("export-status", "Please select a valid JSON file", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // Validate the data structure
      if (!Array.isArray(importedData)) {
        throw new Error("JSON file must contain an array of museums");
      }

      // Basic validation - check if it looks like museum data
      if (importedData.length > 0) {
        const firstMuseum = importedData[0];
        if (!firstMuseum.Name || !firstMuseum.Address) {
          throw new Error(
            "Invalid museum data format. Museums must have Name and Address fields."
          );
        }
      }

      // Confirm before replacing data
      const confirmMessage = `This will replace all current data with ${importedData.length} museums from the file. Are you sure?`;
      if (confirm(confirmMessage)) {
        museumData = importedData;
        saveToLocalStorage();
        loadMuseumList();
        showStatus(
          "export-status",
          `Successfully imported ${importedData.length} museums`,
          "success"
        );
        fileInput.value = ""; // Clear file input
      }
    } catch (error) {
      console.error("Import error:", error);
      showStatus("export-status", `Import failed: ${error.message}`, "error");
    }
  };

  reader.readAsText(file);
}

// Reset to original data
function resetToOriginal() {
  if (
    confirm(
      "This will discard all changes and reload the original data. Are you sure?"
    )
  ) {
    localStorage.removeItem("museumData");
    location.reload(); // Reload page to fetch original data
  }
}

// Changelog functions
function logChange(type, museumName, description, data = {}) {
  const change = {
    id: Date.now(),
    type: type, // 'added', 'edited', 'deleted'
    museumName: museumName,
    description: description,
    timestamp: new Date().toLocaleString(),
    data: data,
  };

  changeLog.unshift(change); // Add to beginning of array
  localStorage.setItem("museumChangeLog", JSON.stringify(changeLog));
  updateChangeLogDisplay();
}

function updateChangeLogDisplay() {
  const changesList = document.getElementById("changelog-list");
  const noChanges = document.getElementById("no-changes");
  const changesCount = document.getElementById("changes-count");

  if (changesCount) {
    changesCount.textContent = changeLog.length;
  }

  if (changeLog.length === 0) {
    if (noChanges) noChanges.style.display = "block";
    return;
  }

  if (noChanges) noChanges.style.display = "none";

  changesList.innerHTML = changeLog
    .map(
      (change) => `
    <div class="change-item">
      <div class="change-header">
        <div>
          <span class="change-type ${change.type}">${change.type}</span>
          <span class="change-museum-name">${change.museumName}</span>
        </div>
        <span class="change-timestamp">${change.timestamp}</span>
      </div>
      <div class="change-details">${change.description}</div>
    </div>
  `
    )
    .join("");
}

function commitChanges() {
  if (changeLog.length === 0) {
    showStatus("changelog-status", "No changes to commit", "error");
    return;
  }

  const confirmMessage = `This will save ${changeLog.length} changes to the JSON file permanently. Are you sure?`;
  if (confirm(confirmMessage)) {
    // Export the current data as JSON
    const dataStr = JSON.stringify(museumData, null, 2);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    downloadFile(
      dataStr,
      `museum_details_full_${timestamp}.json`,
      "application/json"
    );

    // Clear the changelog after successful commit
    changeLog = [];
    localStorage.setItem("museumChangeLog", JSON.stringify(changeLog));

    // Update original data to current state
    originalData = JSON.parse(JSON.stringify(museumData));

    updateChangeLogDisplay();
    showStatus(
      "changelog-status",
      "Changes committed successfully! JSON file downloaded.",
      "success"
    );
  }
}

function discardChanges() {
  if (changeLog.length === 0) {
    showStatus("changelog-status", "No changes to discard", "error");
    return;
  }

  const confirmMessage = `This will discard all ${changeLog.length} changes and restore original data. Are you sure?`;
  if (confirm(confirmMessage)) {
    // Restore original data
    museumData = JSON.parse(JSON.stringify(originalData));

    // Clear localStorage and changelog
    localStorage.removeItem("museumData");
    changeLog = [];
    localStorage.setItem("museumChangeLog", JSON.stringify(changeLog));

    // Refresh displays
    loadMuseumList();
    updateMuseumCount();
    updateChangeLogDisplay();

    showStatus(
      "changelog-status",
      "All changes discarded successfully",
      "success"
    );
  }
}

function clearChangeLog() {
  if (changeLog.length === 0) {
    showStatus("changelog-status", "Change log is already empty", "error");
    return;
  }

  if (
    confirm(
      "This will clear the change log history but keep your current data. Continue?"
    )
  ) {
    changeLog = [];
    localStorage.setItem("museumChangeLog", JSON.stringify(changeLog));
    updateChangeLogDisplay();
    showStatus("changelog-status", "Change log cleared", "success");
  }
}

// Make functions globally available
window.showTab = showTab;
window.clearForm = clearForm;
window.editMuseum = editMuseum;
window.deleteMuseum = deleteMuseum;
window.exportJSON = exportJSON;
window.exportCSV = exportCSV;
window.showDataPreview = showDataPreview;
window.importData = importData;
window.resetToOriginal = resetToOriginal;
window.commitChanges = commitChanges;
window.discardChanges = discardChanges;
window.clearChangeLog = clearChangeLog;
