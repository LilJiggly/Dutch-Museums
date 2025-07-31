// Modal functionality
function openMuseumPage(museumId) {
  const index = parseInt(museumId.replace("museum-", ""));
  const museum = museumData[index];

  if (!museum) {
    console.error("Museum not found:", museumId, "Index:", index);
    return;
  }

  const modal = document.getElementById("museum-modal");
  const modalBody = document.getElementById("museum-modal-body");
  const modalTitle = document.getElementById("modal-title");

  // Update modal header
  modalTitle.textContent = museum["Name"] || "Unknown Museum";

  modalBody.innerHTML = `
    <img class="modal-image" src="${
      museum["Image"] || "images/placeholder.jpg"
    }" alt="${museum["Name"]} image" />
    
    <div class="modal-section">
      <div class="modal-section-title">
        <span class="modal-section-icon">📍</span>
        Visit Information
      </div>
      <div class="modal-info-grid">
        <div class="modal-info-item">
          <div class="modal-info-label">📍 Address</div>
          <div class="modal-info-value">${museum["Address"] || "-"}</div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-label">🗺️ Location</div>
          <div class="modal-info-value">
            <a href="${
              museum["Google Maps"] || "#"
            }" target="_blank">View on Google Maps</a>
          </div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-label">🌐 Website</div>
          <div class="modal-info-value">
            ${
              museum["Official_Website"]
                ? `<a href="${museum["Official_Website"]}" target="_blank">Visit Museum Website</a>`
                : "-"
            }
          </div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-label">📞 Phone</div>
          <div class="modal-info-value">${museum["Phone"] || "-"}</div>
        </div>
        <div class="modal-info-item">
          <div class="modal-info-label">🎫 Museum Card</div>
          <div class="modal-info-value">${museum["Museum Card"] || "-"}</div>
        </div>
      </div>
    </div>
    
    <div class="modal-section">
      <div class="modal-section-title">
        <span class="modal-section-icon">🕐</span>
        Opening Hours
      </div>
      <div class="modal-opening-hours">
        ${formatOpeningHoursForModal(museum)}
      </div>
    </div>
    
    <div class="modal-section">
      <div class="modal-section-title">
        <span class="modal-section-icon">📝</span>
        Description
      </div>
      <div class="modal-description">
        ${formatDescription(museum["Description_Text"])}
      </div>
    </div>
    
    <div class="modal-section">
      <div class="modal-section-title">
        <span class="modal-section-icon">🛠</span>
        Facilities
      </div>
      <div class="modal-facilities">
        ${formatFacilitiesForModal(museum["Facilities"])}
      </div>
    </div>
  `;

  // Store current scroll position before showing modal
  const currentScrollY = window.scrollY;

  // Show modal with proper CSS classes
  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  // Prevent scroll on background but maintain position
  document.body.style.position = "fixed";
  document.body.style.top = `-${currentScrollY}px`;
  document.body.style.width = "100%";

  // Store scroll position for restoration
  modal.dataset.scrollY = currentScrollY;

  // Reset modal content scroll to top
  const modalBodyElement = document.querySelector(".modal-body");
  if (modalBodyElement) {
    modalBodyElement.scrollTop = 0;
  }
}
function closeMuseumModal() {
  const modal = document.getElementById("museum-modal");

  // Hide modal with proper CSS classes
  modal.classList.remove("show");

  // Restore scroll position
  const storedScrollY = modal.dataset.scrollY || "0";

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.overflow = "";

  // Restore to exact position
  window.scrollTo(0, parseInt(storedScrollY));
}

// Close modal when clicking outside of it
window.onclick = function (event) {
  const modal = document.getElementById("museum-modal");
  if (event.target === modal) {
    closeMuseumModal();
  }
};

// Close modal with Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeMuseumModal();
  }
});

// Make functions globally available
window.openMuseumPage = openMuseumPage;
window.closeMuseumModal = closeMuseumModal;
