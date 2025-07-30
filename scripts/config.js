// Configuration and constants
const CONFIG = {
  cardTemplateURL: "cards.html",
  listTemplateURL: "list-card.html",
  dataURL: "data/museum_details_full.json",
  container: document.getElementById("cards"),
};

// Global state
let currentView = "grid";
let selectedDate = null;
let museumData = null;
