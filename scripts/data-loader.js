// Data loading functions
async function loadTemplate(url) {
  const res = await fetch(url);
  return await res.text();
}

async function loadTemplates() {
  const [gridTemplate, listTemplate] = await Promise.all([
    loadTemplate(CONFIG.cardTemplateURL),
    loadTemplate(CONFIG.listTemplateURL),
  ]);
  return { gridTemplate, listTemplate };
}

async function loadData() {
  const res = await fetch(CONFIG.dataURL);
  return await res.json();
}
