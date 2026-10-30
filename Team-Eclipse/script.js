// Pixel Art Editor - Hack Day Haldia x GRID community starter. Build the core tasks from README.md.
const KEY = "hackday-haldia-team-eclipse";
const $ = (sel) => document.querySelector(sel);

// App state - reshape it to fit your project.
let state = { items: [] };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
}

function load() {
  try { state = JSON.parse(localStorage.getItem(KEY)) || state; } catch (e) { /* ignore */ }
}

function render() {
  // TODO: draw your UI into #app
}

// ---- TODO(core): fill these in -------------------------------------------
// TODO(core): paint one cell
function setPixel() {
}

// TODO(core): fill a connected area
function floodFill() {
}

// TODO(core): line / rectangle tools
function drawLine() {
}

// TODO(core): step back
function undo() {
}

// TODO(core): step forward
function redo() {
}

// TODO(core): download the art as PNG
function exportPng() {
}


document.addEventListener("DOMContentLoaded", () => {
  load();
  $("#status").textContent = "script.js loaded.";
  render();
});
