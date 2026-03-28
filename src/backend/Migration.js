/**
 * @file src/backend/Migration.js
 * @description ONE-OFF scripts to migrate legacy flat data into the new JSON structure.
 */

// ==========================================
// HELPERS
// ==========================================

function parseLegacyDate(rawDate) {
  // 1. If Apps Script already converted the cell to a Date object, perfect!
  if (rawDate instanceof Date) {
    return rawDate;
  }

  // 2. If it's a string like "25/10/2026", parse it manually
  const dateStr = rawDate.toString();
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }

  // 3. Absolute fallback (e.g., standard JS date string)
  return new Date(rawDate);
}

function parseCurrency(val) {
  if (typeof val === 'number') return val;
  const cleanStr = val.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanStr) || 0;
}

// ==========================================
// TREASURY MIGRATION
// ==========================================

function migrateTreasury() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('legacyDinheiro');
  if (!sheet) return Logger.log('Sheet legacyDinheiro not found.');

  const data = sheet.getDataRange().getValues();
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Skip empty rows

    const date = parseLegacyDate(row[0].toString());
    const playerId = row[1].toString();
    const type = row[2].toString().toUpperCase();
    const value = parseCurrency(row[3]);

    const transaction = {
      id: `t_legacy_${Utilities.getUuid()}`,
      date: date,
      type: type,
      value: value,
      playerId: playerId,
      expenseType: type === 'EXPENSE' ? 'Legacy Expense' : null
    };

    saveSystemRecord(transaction.id, 'TRANSACTION', transaction);
  }
  Logger.log('Treasury migration complete.');
}

// ==========================================
// MATCH MIGRATION
// ==========================================

function migrateMatches() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('legacyJogos');
  if (!sheet) return Logger.log('Sheet legacyJogos not found.');

  const data = sheet.getDataRange().getValues();
  const matchMap = {};

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    // Extract raw values
    const rawDate = row[0];
    const playerId = row[1].toString();
    const team = row[3].toString();
    const scoreStr = row[5].toString();
    const isFirstTeam = row[6] === true || row[6] === 'TRUE';
    const positionStr = row[7] ? row[7].toString() : null;
    const goals = parseInt(row[8]) || 0;
    const assists = parseInt(row[9]) || 0;

    // Get the bulletproof date object
    const dateObj = parseLegacyDate(rawDate);
    dateObj.setHours(8, 0, 0, 0);

    // Create the unique, predictable IDs (e.g., 'm_20261025')
    const dateKey = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const matchId = `m_${Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyyMMdd')}`;

    // Initialize Match
    if (!matchMap[dateKey]) {
      let teamAScore = 0;
      let teamBScore = 0;

      if (scoreStr && scoreStr.includes('-')) {
        const parts = scoreStr.split('-');
        teamAScore = parseInt(parts[0].trim()) || 0;
        teamBScore = parseInt(parts[1].trim()) || 0;
      }

      matchMap[dateKey] = {
        id: matchId, // <-- Using your newly formulated Date-based ID!
        date: dateObj,
        status: 'COMPLETED',
        score: { teamA: teamAScore, teamB: teamBScore },
        participants: [],
        events: []
      };
    }

    const currentMatch = matchMap[dateKey];

    // Create Participation record
    currentMatch.participants.push({
      playerId: playerId,
      isAttending: true,
      arrivalTime: null,
      firstTeam: isFirstTeam,
      team: team,
      position: positionStr,
      draft: null
    });

    // Generate Goals
    for (let g = 0; g < goals; g++) {
      currentMatch.events.push({
        eventId: `evt_${Utilities.getUuid()}`,
        playerId: playerId,
        type: 'GOAL'
      });
    }

    // Generate Assists
    for (let a = 0; a < assists; a++) {
      currentMatch.events.push({
        eventId: `evt_${Utilities.getUuid()}`,
        playerId: playerId,
        type: 'ASSIST'
      });
    }
  }

  // Save all grouped matches
  const matchKeys = Object.keys(matchMap);
  for (const key of matchKeys) {
    const match = matchMap[key];
    saveSystemRecord(match.id, 'MATCH', match);
  }

  Logger.log(`Match migration complete. Migrated ${matchKeys.length} matches.`);
}