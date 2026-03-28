/**
 * @file src/backend/Controllers.js
 * @description API endpoints exposed to the frontend via google.script.run.
 */

// ==========================================
// PLAYERS API
// ==========================================

/**
 * Retrieves all players from the database.
 * @returns {Player[]} Array of all players.
 */
function apiGetPlayers() {
  return PlayerDB.getAll();
}

/**
 * Saves a player to the database, hydrating dates passed from the frontend.
 * @param {Player} player The player object to save.
 * @returns {boolean} True if successful.
 */
function apiSavePlayer(player) {
  try {
    // Note: Dates sent from frontend via google.script.run arrive as strings.
    // We need to hydrate them back to Date objects before saving to DB.
    if (typeof player.addedAt === 'string') player.addedAt = new Date(player.addedAt);
    if (typeof player.removedAt === 'string') player.removedAt = new Date(player.removedAt);

    PlayerDB.save(player);
    return true;
  } catch (error) {
    Logger.log('apiSavePlayer error: ' + error);
    throw new Error('Failed to save player.');
  }
}

/**
 * Deletes a player from the database.
 * @param {string} id The ID of the player to delete.
 * @returns {boolean} True if successful.
 */
function apiDeletePlayer(id) {
  try {
    PlayerDB.delete(id);
    return true;
  } catch (error) {
    Logger.log('apiDeletePlayer error: ' + error);
    throw new Error('Failed to delete player.');
  }
}

// ==========================================
// MATCHES API
// ==========================================

/**
 * Retrieves all matches from the database.
 * @returns {Match[]} Array of all matches.
 */
function apiGetMatches() {
  return MatchDB.getAll();
}

/**
 * Saves a match to the database, hydrating dates passed from the frontend.
 * @param {Match} match The match object to save.
 * @returns {boolean} True if successful.
 */
function apiSaveMatch(match) {
  try {
    // Hydrate dates as your schema requires
    if (typeof match.date === 'string') match.date = new Date(match.date);

    if (match.participants) {
      match.participants.forEach(p => {
        if (typeof p.arrivalTime === 'string' && p.arrivalTime !== null) {
          p.arrivalTime = new Date(p.arrivalTime);
        }
      });
    }

    // Call your existing MatchDB save logic
    MatchDB.save(match);

    return true;
  } catch (error) {
    Logger.log('apiSaveMatch error: ' + error.message);
    throw new Error(error.message);
  }
}

/**
 * Deletes a match from the database.
 * @param {string} id The ID of the match to delete.
 * @returns {boolean} True if successful.
 */
function apiDeleteMatch(id) {
  try {
    MatchDB.delete(id);
    return true;
  } catch (error) {
    Logger.log('apiDeleteMatch error: ' + error);
    throw new Error('Failed to delete match.');
  }
}

// ==========================================
// TREASURY API
// ==========================================

/**
 * Retrieves all transactions from the database.
 * @returns {Transaction[]} Array of all transactions.
 */
function apiGetTransactions() {
  return TreasuryDB.getAll();
}

/**
 * Saves a transaction to the database, hydrating dates passed from the frontend.
 * @param {Transaction} transaction The transaction object to save.
 * @returns {boolean} True if successful.
 */
function apiSaveTransaction(transaction) {
  try {
    if (typeof transaction.date === 'string') transaction.date = new Date(transaction.date);

    TreasuryDB.save(transaction);
    return true;
  } catch (error) {
    Logger.log('apiSaveTransaction error: ' + error);
    throw new Error('Failed to save transaction.');
  }
}

/**
 * Deletes a transaction from the database.
 * @param {string} id The ID of the transaction to delete.
 * @returns {boolean} True if successful.
 */
function apiDeleteTransaction(id) {
  try {
    TreasuryDB.delete(id);
    return true;
  } catch (error) {
    Logger.log('apiDeleteTransaction error: ' + error);
    throw new Error('Failed to delete transaction.');
  }
}

// ==========================================
// INVENTORY API
// ==========================================

/**
 * Retrieves all inventory items from the database.
 * @returns {InventoryItem[]} Array of all inventory items.
 */
function apiGetInventory() {
  return InventoryDB.getAll();
}

/**
 * Saves an inventory item to the database, hydrating dates passed from the frontend.
 * @param {InventoryItem} item The inventory item object to save.
 * @returns {boolean} True if successful.
 */
function apiSaveInventoryItem(item) {
  try {
    // Hydrate the date if it comes from the frontend as a string
    if (typeof item.lastUpdated === 'string') {
      item.lastUpdated = new Date(item.lastUpdated);
    }

    InventoryDB.save(item);
    return true;
  } catch (error) {
    Logger.log('apiSaveInventoryItem error: ' + error);
    throw new Error('Failed to save inventory item.');
  }
}

/**
 * Deletes an inventory item from the database.
 * @param {string} id The ID of the inventory item to delete.
 * @returns {boolean} True if successful.
 */
function apiDeleteInventoryItem(id) {
  try {
    InventoryDB.delete(id);
    return true;
  } catch (error) {
    Logger.log('apiDeleteInventoryItem error: ' + error);
    throw new Error('Failed to delete inventory item.');
  }
}