/**
 * @file src/backend/Config.js
 * @description Defines the core data models, types, and global configuration for the application.
 * These definitions represent the backend domain models using JSDoc for editor intellisense.
 * Note that when passing these objects to the frontend via google.script.run, 
 * Date objects will be serialized into strings.
 */

// ==========================================
// ENUMS & TYPES
// ==========================================

/** * Represents the position of a player on the pitch. 
 * GR = Goalkeeper, DC = Central Defender, DD = Right Defender, 
 * DE = Left Defender, MED = Midfielder, AT = Attacker, AV = Forward.
 * @typedef {'GR' | 'DC' | 'LD' | 'LE' | 'MED' | 'AT' | 'AV'} Position
 */

/** * Represents the two teams in a match.
 * @typedef {'A' | 'B'} Team
 */

/** * Types of events that can be recorded for a player during a match.
 * @typedef {'GOAL' | 'GOALP' | 'ASSIST' | 'EXPULSION' | 'SUBSTITUTION'} MatchEventType
 */

/** * Lifecycle status of a match.
 * PRE-DRAFT: Accepting RSVPs, roster open.
 * SORT: Roster closed, priorities calculated, waitlist generated.
 * DRAFT: Teams balanced and locked.
 * ONGOING: Live match, tracking score and events.
 * FINISHED: Match over, stats locked.
 * @typedef {'PRE-DRAFT' | 'SORT' | 'DRAFT' | 'ONGOING' | 'FINISHED'} MatchStatus
 */

/** * Differentiates between incoming treasury funds and outgoing expenses.
 * @typedef {'INCOME' | 'EXPENSE' | 'MATERIAL DONATION'} TransactionType
 */

// ==========================================
// INTERFACES (Mapped to JSDoc Objects)
// ==========================================

/**
 * Represents a Sunday League player.
 * @typedef {Object} Player
 * @property {string} id Unique identifier for the player (e.g., 'p_12345').
 * @property {string | null} email The Google account email of the player. Used to map the active session to the user.
 * @property {boolean} isAdmin Grants privileges to edit stats, manage treasury, and resolve draft conflicts.
 * @property {string} name Full name or nickname of the player.
 * @property {Position[]} positions Array of preferred positions. First element is primary position.
 * @property {string | null} contact Contact number. Defaults to an empty string if not provided.
 * @property {string} photo URL to the player's photo/avatar.
 * @property {Date} addedAt The date the player joined the league.
 * @property {Date | null} removedAt The date the player left the league. Null if currently active.
 * @property {boolean} entersDraft If true, the player has priority in the draft (guaranteed first team if present and within the 16-player limit, or priority if arriving before 8:01 AM).
 * @property {boolean} isShiftWorker Identifies players whose work schedules grant them special priority rules.
 */

/**
 * Contains the draft resolution logic for a specific player in a specific match.
 * @typedef {Object} Draft
 * @property {string} playerId Reference to the Player's ID.
 * @property {number} order The order in which the player was drafted. 1-16 = First Team, 17+ = Subs.
 * @property {boolean} priorityFromPrevious True if the player missed the previous draft and is guaranteed a spot today.
 * @property {boolean} priorityForNext True if the player missed today's draft and gets priority for the next match.
 * @property {boolean} priorityForNextPresence True if a shift worker missed the draft and gets priority for the next match they are able to attend. Requires Player.isShiftWorker === true.
 */

/**
 * Represents a player's RSVP, arrival, and assignment for a specific match.
 * @typedef {Object} MatchParticipation
 * @property {string} playerId Reference to the Player's ID.
 * @property {boolean} isAttending True if the player has RSVP'd to attend.
 * @property {Date | null} arrivalTime The exact time the player arrived on match day. Crucial for determining draft eligibility.
 * @property {boolean} firstTeam True if the player is in the starting 16. False if they are a substitute.
 * @property {Team | null} team The team the player was sorted into. Null until the draft is executed.
 * @property {Position | null} position The actual position the player is assigned to play in this specific match. Null until assigned.
 * @property {Draft | null} draft Draft resolution details for this player. Null until the draft is executed.
 */

/**
 * Represents a countable action (goal, assist, etc.) performed by a player during a match.
 * @typedef {Object} MatchEvent
 * @property {string} eventId Unique identifier for the event.
 * @property {string} playerId The ID of the player who performed the action.
 * @property {MatchEventType} type The type of event recorded.
 */

/**
 * Represents the score for a Sunday League match.
 * @typedef {Object} MatchScore
 * @property {number} teamA
 * @property {number} teamB
 */

/**
 * Represents a Sunday League match, containing all rosters, draft info, and match events.
 * @typedef {Object} Match
 * @property {string} id Unique identifier for the match (e.g., 'm_20261025').
 * @property {Date} date The scheduled date and time of the match.
 * @property {MatchStatus} status Current state of the match lifecycle.
 * @property {MatchScore | null} score Final score for the match. Null until the match is completed.
 * @property {MatchParticipation[]} participants Contains all RSVPs, arrival times, draft outcomes, and team assignments.
 * @property {MatchEvent[]} events A log of all stats generated during the match (goals, red cards, etc.).
 */

/**
 * Represents a financial transaction within the league's treasury.
 * @typedef {Object} Transaction
 * @property {string} id Unique identifier for the transaction (e.g., 't_98765').
 * @property {Date} date The date the transaction occurred.
 * @property {TransactionType} type INCOME (funds added) or EXPENSE (funds spent).
 * @property {number} value The monetary value of the transaction.
 * @property {string | null} playerId The ID of the player associated with this transaction (null for general league expenses).
 * @property {string | null} expenseType Description or category of the expense. Null for standard income.
 * @property {string | null} donationType Description or category of the donation. Null for standard income.
 */

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

/**
 * Global configuration for interacting with Google Sheets.
 */
const DB_CONFIG = {
  SPREADSHEET_ID: SHEETID,
  SHEETS: {
    /** * Stores players. 
     * Columns: [A: ID] [B: Email] [C: JSON Payload]
     */
    PLAYERS: 'listaJogadores',
    /** * Consolidated sheet for Matches and Treasury Transactions to maximize row limits. 
     * Columns: [A: Entity ID] [B: Entity Type (MATCH/TRANSACTION)] [C: JSON Payload]
     */
    SYSTEM_DATA: 'dadosSistema'
  }
};