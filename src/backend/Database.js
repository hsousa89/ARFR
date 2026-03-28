/**
 * @file src/backend/Database.js
 * @description Handles all interactions with the Google Sheets database.
 */

// ==========================================
// UTILITIES
// ==========================================

/**
 * Gets the active spreadsheet using the configured ID.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(DB_CONFIG.SPREADSHEET_ID);
}

/**
 * Revives JSON string dates back into JavaScript Date objects.
 * @param {string} key 
 * @param {*} value 
 * @returns {*}
 */
function dateReviver(key, value) {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
  if (typeof value === 'string' && isoDateRegex.test(value)) return new Date(value);

  const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (typeof value === 'string' && simpleDateRegex.test(value)) return new Date(value);

  return value;
}

/**
 * Utility to format Date objects for human-readable sheet columns.
 * @param {Date | null} date
 * @returns {string}
 */
function formatDateForSheet(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ==========================================
// GENERIC READ & DELETE
// ==========================================

/**
 * Retrieves all JSON records from a given sheet.
 * @template T
 * @param {string} sheetName - The name of the sheet.
 * @param {number} jsonColIndex - The column number (1-based) where the JSON is stored.
 * @returns {T[]} Array of parsed generic objects.
 */
function getAll(sheetName, jsonColIndex) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const jsonValues = sheet.getRange(2, jsonColIndex, lastRow - 1, 1).getValues();

  const results = [];
  for (const row of jsonValues) {
    const jsonString = row[0];
    if (jsonString) {
      try {
        results.push(JSON.parse(jsonString, dateReviver));
      } catch (e) {
        Logger.log(`Failed to parse JSON in ${sheetName}: ${jsonString}`);
      }
    }
  }
  return results;
}

/**
 * Deletes a row based on the ID in the first column.
 * @param {string} sheetName 
 * @param {string} id 
 */
function deleteRecord(sheetName, id) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < idValues.length; i++) {
    if (idValues[i][0] === id) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
}

// ==========================================
// SPECIFIC SAVE OPERATIONS
// ==========================================

/**
 * Saves a player to the 12-column 'listaJogadores' sheet.
 * @param {Player} player 
 */
function savePlayerRecord(player) {
  const sheet = getSpreadsheet().getSheetByName(DB_CONFIG.SHEETS.PLAYERS);
  if (!sheet) throw new Error(`Sheet ${DB_CONFIG.SHEETS.PLAYERS} not found.`);

  const lastRow = sheet.getLastRow();
  const jsonPayload = JSON.stringify(player);

  // Maps exactly to your 12 headers: 
  // ID, Nome, Contacto, Email, Admin, Prioritário, Trabalha Turnos, Posição, img, Adicionado em, Removido em, JSON_payload
  const rowData = [
    player.id,
    player.name,
    player.contact || '',
    player.email || '',
    player.isAdmin,
    player.entersDraft,
    player.isShiftWorker,
    player.positions.join(','),
    player.photo || '',
    formatDateForSheet(player.addedAt),
    formatDateForSheet(player.removedAt),
    jsonPayload
  ];

  if (lastRow < 2) {
    sheet.appendRow(rowData);
    return;
  }

  const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let rowIndex = -1;

  for (let i = 0; i < idValues.length; i++) {
    if (idValues[i][0] === player.id) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex > -1) {
    // Update existing row (1 row, 12 columns)
    sheet.getRange(rowIndex, 1, 1, 12).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * Saves Matches and Transactions to the 3-column 'dadosSistema' sheet.
 * @template T
 * @param {string} id 
 * @param {string} type 
 * @param {T} payload 
 */
function saveSystemRecord(id, type, payload) {
  const sheetName = DB_CONFIG.SHEETS.SYSTEM_DATA;
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found.`);

  const lastRow = sheet.getLastRow();
  const jsonPayload = JSON.stringify(payload);
  const rowData = [id, type, jsonPayload];

  if (lastRow < 2) {
    sheet.appendRow(rowData);
    return;
  }

  const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let rowIndex = -1;

  for (let i = 0; i < idValues.length; i++) {
    if (idValues[i][0] === id) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex > -1) {
    // Update existing row (1 row, 3 columns)
    sheet.getRange(rowIndex, 1, 1, 3).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// ==========================================
// DOMAIN-SPECIFIC REPOSITORIES
// ==========================================

const PlayerDB = {
  /** @returns {Player[]} */
  getAll: () => getAll(DB_CONFIG.SHEETS.PLAYERS, 12),
  /** @param {Player} player */
  save: (player) => savePlayerRecord(player),
  /** @param {string} id */
  delete: (id) => deleteRecord(DB_CONFIG.SHEETS.PLAYERS, id)
};

const MatchDB = {
  /** @returns {Match[]} */
  getAll: () => {
    /** @type {Match[]} */
    const matches = getAll(DB_CONFIG.SHEETS.SYSTEM_DATA, 3);
    return matches.filter(m => m.id && m.id.startsWith('m_'));
  },
  /** @param {Match} match */
  save: (match) => saveSystemRecord(match.id, 'MATCH', match),
  /** @param {string} id */
  delete: (id) => deleteRecord(DB_CONFIG.SHEETS.SYSTEM_DATA, id)
};

const TreasuryDB = {
  /** @returns {Transaction[]} */
  getAll: () => {
    /** @type {Transaction[]} */
    const transactions = getAll(DB_CONFIG.SHEETS.SYSTEM_DATA, 3);
    return transactions.filter(t => t.id && t.id.startsWith('t_'));
  },
  /** @param {Transaction} transaction */
  save: (transaction) => saveSystemRecord(transaction.id, 'TRANSACTION', transaction),
  /** @param {string} id */
  delete: (id) => deleteRecord(DB_CONFIG.SHEETS.SYSTEM_DATA, id)
};

const InventoryDB = {
  /** @returns {InventoryItem[]} */
  getAll: () => {
    // Make sure to add INVENTORY to your DB_CONFIG.SHEETS object!
    const items = getAll(DB_CONFIG.SHEETS.SYSTEM_DATA, 3);
    return items.filter(i => i.id && i.id.startsWith('inv_'));
  },

  /** @param {InventoryItem} item */
  save: (item) => saveSystemRecord(item.id, 'INVENTORY', item),

  /** @param {string} id */
  delete: (id) => deleteRecord(DB_CONFIG.SHEETS.SYSTEM_DATA, id)
};