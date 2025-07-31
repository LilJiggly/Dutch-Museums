// Data loading functions
async function loadTemplate(url) {
  const res = await fetch(url);
  return await res.text();
}

function isMobileDevice() {
  return window.innerWidth <= 768;
}

async function loadTemplates() {
  const isMobile = isMobileDevice();
  const listTemplateURL = isMobile
    ? "list-card-mobile.html"
    : CONFIG.listTemplateURL;

  const [gridTemplate, listTemplate] = await Promise.all([
    loadTemplate(CONFIG.cardTemplateURL),
    loadTemplate(listTemplateURL),
  ]);
  return { gridTemplate, listTemplate };
}

async function loadData() {
  const res = await fetch(CONFIG.dataURL);
  return await res.json();
}

// Make isMobileDevice available globally
window.isMobileDevice = isMobileDevice;
