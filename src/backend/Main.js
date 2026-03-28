/**
 * @file src/backend/Main.js
 * @description Entry point for the Google Apps Script Web App.
 */

/**
 * Serves the initial HTML page and injects the initial state.
 * @param {GoogleAppsScript.Events.DoGet} e - The event object.
 * @returns {GoogleAppsScript.HTML.HtmlOutput} The evaluated HTML output.
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('src/frontend/index');

  try {
    // Pre-load essential data to avoid extra round-trips on first load.
    // We stringify it here. Date objects will naturally convert to ISO strings,
    // which the frontend vanilla JS will easily consume.
    template.initialData = JSON.stringify({
      players: PlayerDB.getAll(),
      matches: MatchDB.getAll(),
      transactions: TreasuryDB.getAll(),
      inventory: InventoryDB.getAll(),
      settings: {
        // Change this number to whatever cash you currently hold!
        initialBalance: 150.00
      }
    });
  } catch (error) {
    Logger.log('Error loading initial data: ' + error);
    // Fallback to empty arrays if the DB throws an error on first run
    template.initialData = JSON.stringify({
      players: [],
      matches: [],
      transactions: [],
      inventory: []
    });
  }

  return template.evaluate()
    .setTitle('ARFR')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Utility to include other HTML files (like our JS/CSS components) into the main template.
 * Now supports passing a data context to the included template!
 * * @param {string} filename - The name of the file to include (e.g., 'src/frontend/components').
 * @param {Object} [data] - Optional key-value pairs to inject into the template.
 * @returns {string} The evaluated raw HTML content.
 */
function include(filename, data) {
  try {
    const template = HtmlService.createTemplateFromFile(filename);

    if (data && typeof data === 'object') {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          template[key] = data[key];
        }
      }
    }

    return template.evaluate().getContent();

  } catch (error) {
    // If a file fails, instead of crashing the app, it will render a red warning box 
    // exactly where that file was supposed to be, telling us the exact file name!
    Logger.log(`[INCLUDE ERROR] Failed to load: ${filename} - ${error.message}`);
    return `<div style="background: #450a0a; border: 1px solid #ef4444; color: #fca5a5; padding: 1rem; margin: 1rem; font-family: monospace;">
              <strong>🚨 Component Crash:</strong> Could not load <code>${filename}</code><br>
              <small>${error.message}</small>
            </div>`;
  }
}