// =============================================================================
// AlphaBlet Game
// =============================================================================

// ---- Constants ----
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TOTAL_ROUNDS = 26;
const MAX_DISTANCE_FOR_COLOR = 13;
const HIGHLIGHT_DURATION_MS = 1000;
const TIMER_INTERVAL_MS = 10;
const MODE_MULTIPLIERS = [1.0, 0.8, 0.6]; // A Ok, B Careful, C of Trouble
const SCORE_TIERS = [
  { label: 'E-Lite', min: 0, max: 2000, color: '#00c853' },
  { label: 'T-Rific', min: 2000, max: 4000, color: '#66bb6a' },
  { label: 'D-Cent', min: 4000, max: 6000, color: '#ffa726' },
  { label: 'F-Ort', min: 6000, max: 8000, color: '#ef5350' },
];

// =============================================================================
// Shuffle Module
// =============================================================================

/**
 * Generates a random permutation of the 26 letters A-Z.
 * Uses Fisher-Yates shuffle algorithm.
 * @returns {string[]} Array of 26 unique letters in random order
 */
function generateShuffle() {
  const letters = ALPHABET.slice();
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = letters[i];
    letters[i] = letters[j];
    letters[j] = temp;
  }
  return letters;
}

// =============================================================================
// Scoring Module
// =============================================================================

/**
 * Calculates the distance between two slot indices.
 * @param {number} correctIndex - The correct slot index (0-25)
 * @param {number} placedIndex - The slot where the letter was placed (0-25)
 * @returns {number} Absolute difference between indices
 */
function calculateDistance(correctIndex, placedIndex) {
  return Math.min(25, Math.max(0, Math.abs(correctIndex - placedIndex)));
}

/**
 * Calculates the round score.
 * @param {number} elapsedHundredths - Time in hundredths of a second
 * @param {number} distance - Placement distance (0 = correct)
 * @returns {number} Score = elapsedHundredths + distance² × 8
 */
function calculateScore(elapsedHundredths, distance) {
  return elapsedHundredths + distance * distance * 8;
}

/**
 * Calculates cumulative score from an array of round scores.
 * @param {number[]} roundScores - Array of individual round scores
 * @returns {number} Sum of all round scores
 */
function calculateCumulativeScore(roundScores) {
  return roundScores.reduce((sum, score) => sum + score, 0);
}

// =============================================================================
// Feedback Module
// =============================================================================

/**
 * Calculates feedback color based on placement distance.
 * Distance 0 returns green; distance 1-12 interpolates yellow to red;
 * distance >= 13 returns red.
 * @param {number} distance - Placement distance (0 = green, 1-13+ = yellow-to-red)
 * @returns {string} CSS rgb color string
 */
function getFeedbackColor(distance) {
  if (distance === 0) {
    return 'rgb(0,200,83)';
  }
  if (distance >= MAX_DISTANCE_FOR_COLOR) {
    return 'rgb(255,0,0)';
  }
  // Linear interpolation: green channel goes from 255 (yellow at distance 1) to 0 (red at distance 13)
  const g = Math.round(255 * (1 - (distance - 1) / (MAX_DISTANCE_FOR_COLOR - 1)));
  return `rgb(255,${g},0)`;
}

// =============================================================================
// Timer Module
// =============================================================================

/**
 * Formats elapsed hundredths of a second as "X.XX" string.
 * @param {number} hundredths - Elapsed time in hundredths of a second
 * @returns {string} Formatted time string (e.g., "12.34")
 */
function formatTime(hundredths) {
  const seconds = Math.floor(hundredths / 100);
  const remainder = hundredths % 100;
  return `${seconds}.${String(remainder).padStart(2, '0')}`;
}

// =============================================================================
// GameState Module
// =============================================================================

/**
 * Creates a new game state with a fresh shuffle.
 * @returns {Object} Initial game state
 */
function createGameState() {
  return {
    shuffle: generateShuffle(),
    currentRound: 0,
    roundScores: [],
    roundTimes: [],
    roundDistances: [],
    roundPlacedSlots: [],
    roundModes: [],
    cumulativeScore: 0,
  };
}

/**
 * Returns the current letter to be placed.
 * @param {Object} state - Current game state
 * @returns {string|null} Current letter, or null if game is complete
 */
function getCurrentLetter(state) {
  if (state.currentRound >= TOTAL_ROUNDS) {
    return null;
  }
  return state.shuffle[state.currentRound];
}

/**
 * Advances the game state after a valid drop.
 * @param {Object} state - Current game state
 * @param {number} slotIndex - Index of the slot where letter was dropped (0-25)
 * @param {number} elapsedHundredths - Time taken for this round
 * @param {number} [mode] - The difficulty mode at time of drop (0, 1, or 2)
 * @returns {Object} New game state with updated round and score
 */
function advanceRound(state, slotIndex, elapsedHundredths, mode) {
  const currentLetter = getCurrentLetter(state);
  const correctIndex = ALPHABET.indexOf(currentLetter);
  const distance = calculateDistance(correctIndex, slotIndex);
  const score = calculateScore(elapsedHundredths, distance);
  const newRoundScores = [...state.roundScores, score];
  const roundMode = (typeof mode === 'number') ? mode : 0;

  return {
    shuffle: state.shuffle,
    currentRound: state.currentRound + 1,
    roundScores: newRoundScores,
    roundTimes: [...state.roundTimes, elapsedHundredths],
    roundDistances: [...state.roundDistances, distance],
    roundPlacedSlots: [...(state.roundPlacedSlots || []), slotIndex],
    roundModes: [...(state.roundModes || []), roundMode],
    cumulativeScore: calculateCumulativeScore(newRoundScores),
  };
}

/**
 * Checks if the game is complete (all 26 letters placed).
 * @param {Object} state - Current game state
 * @returns {boolean} True if all rounds are complete
 */
function isGameComplete(state) {
  return state.currentRound >= TOTAL_ROUNDS;
}

// =============================================================================
// UI Controller
// =============================================================================

/**
 * Initializes the game UI: renders slots, sets up drag-and-drop,
 * wires event handlers, and starts the first game.
 */
function initGame() {
  // ---- DOM references ----
  const letterDisplay = document.getElementById('letter-display');
  const slotBar = document.getElementById('slot-bar');
  const timerDisplay = document.getElementById('timer-display');
  const scoreboard = document.getElementById('scoreboard');
  const newGameBtn = document.getElementById('new-game-btn');
  const modeSlider = document.getElementById('mode-slider');
  const modeLabels = document.querySelectorAll('.mode-label');

  // ---- Game variables ----
  let gameState = null;
  let timerInterval = null;
  let timerHundredths = 0;
  let totalHundredths = 0;
  let dropSucceeded = false;
  let gameActive = false;
  let letterSelected = false; // for tap-to-place on mobile

  // Mode: 0 = "A Ok" (show letters), 1 = "B Careful" (glow only), 2 = "C of Trouble" (nothing)
  function getMode() {
    return modeSlider ? parseInt(modeSlider.value, 10) : 0;
  }

  function updateModeLabels() {
    var mode = getMode();
    modeLabels.forEach(function (label) {
      label.classList.toggle('active', parseInt(label.dataset.mode, 10) === mode);
    });
  }

  /**
   * Returns the displayed score: sum of each round's score × that round's mode multiplier.
   */
  function getDisplayedScore() {
    if (!gameState) return 0;
    var total = 0;
    for (var i = 0; i < gameState.roundScores.length; i++) {
      var roundMode = (gameState.roundModes && gameState.roundModes[i] != null)
        ? gameState.roundModes[i] : 0;
      total += gameState.roundScores[i] * MODE_MULTIPLIERS[roundMode];
    }
    return Math.round(total);
  }

  /**
   * Returns the effective mode multiplier — the average across all completed
   * rounds plus the current in-progress round's mode.
   */
  function getEffectiveModeMultiplier() {
    if (!gameState) return MODE_MULTIPLIERS[getMode()];
    var modes = gameState.roundModes || [];
    var total = 0;
    for (var i = 0; i < modes.length; i++) {
      total += MODE_MULTIPLIERS[modes[i]];
    }
    // Include the current round's mode
    total += MODE_MULTIPLIERS[getMode()];
    return total / (modes.length + 1);
  }

  /**
   * Returns the tier boundary scale factor.
   * Base tiers are calibrated for B Careful (0.8×).
   * Easier modes (higher multiplier) get tighter boundaries.
   * Harder modes (lower multiplier) get more generous boundaries.
   */
  function getTierScale() {
    var BASE_MULT = 0.8; // B Careful
    return BASE_MULT / getEffectiveModeMultiplier();
  }

  /**
   * Returns the tier color corresponding to the projected final score,
   * with tier boundaries scaled by the effective mode multiplier.
   */
  function getProjectedTierColor() {
    var scale = getTierScale();
    if (!gameState || gameState.currentRound === 0) {
      if (timerHundredths === 0) return SCORE_TIERS[0].color;
      var singleRoundMin = timerHundredths * MODE_MULTIPLIERS[getMode()];
      var projected = singleRoundMin * TOTAL_ROUNDS;
      for (var i = 0; i < SCORE_TIERS.length; i++) {
        if (projected < SCORE_TIERS[i].max * scale) return SCORE_TIERS[i].color;
      }
      return SCORE_TIERS[SCORE_TIERS.length - 1].color;
    }
    var completedScore = getDisplayedScore();
    var currentRoundMinScore = timerHundredths * MODE_MULTIPLIERS[getMode()];
    var roundsDone = gameState.currentRound;
    var projected = Math.round((completedScore + currentRoundMinScore) * TOTAL_ROUNDS / (roundsDone + 1));
    for (var j = 0; j < SCORE_TIERS.length; j++) {
      if (projected < SCORE_TIERS[j].max * scale) return SCORE_TIERS[j].color;
    }
    return SCORE_TIERS[SCORE_TIERS.length - 1].color;
  }

  /**
   * Updates the scoreboard text and colors it to the projected tier.
   */
  function updateScoreboard() {
    scoreboard.textContent = String(getDisplayedScore());
    scoreboard.style.color = getProjectedTierColor();
  }

  // ---- Task 8.1: DOM initialization ----

  /**
   * Renders 26 slot divs inside the slot bar, each with a label (A-Z)
   * and an empty slot-letter span.
   */
  function renderSlots() {
    slotBar.innerHTML = '';
    for (let i = 0; i < ALPHABET.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.index = String(i);

      const letter = document.createElement('span');
      letter.className = 'slot-letter';
      letter.textContent = '';

      slot.appendChild(letter);
      slotBar.appendChild(slot);
    }
  }

  /**
   * Displays the current letter in the letter display area.
   * If the game is complete, triggers game-over flow.
   */
  function showCurrentLetter() {
    const letter = getCurrentLetter(gameState);
    if (letter === null) {
      // Game complete
      showGameOver();
      return;
    }
    letterDisplay.textContent = letter;
    // Only enable draggable on non-touch devices to avoid drag/click conflicts
    if (!isTouchDevice()) {
      letterDisplay.setAttribute('draggable', 'true');
    } else {
      letterDisplay.setAttribute('draggable', 'false');
    }
    startTimer();
  }

  /**
   * Detects if the device supports touch input.
   */
  function isTouchDevice() {
    return (typeof window !== 'undefined') &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  /**
   * Starts a new game: resets state, clears slots, and shows first letter.
   */
  function startNewGame() {
    stopTimer();
    gameState = createGameState();
    gameActive = true;
    letterSelected = false;
    letterDisplay.classList.remove('selected');
    timerHundredths = 0;
    totalHundredths = 0;
    timerDisplay.textContent = formatTime(0);
    scoreboard.textContent = '0';
    scoreboard.style.color = '';
    // Clear the placement visualization and score bar if present
    var viz = document.getElementById('placement-viz');
    if (viz) viz.remove();
    var vizTop = document.getElementById('placement-viz-top');
    if (vizTop) vizTop.remove();
    var sb = document.getElementById('score-bar');
    if (sb) sb.remove();
    slotBar.classList.remove('viz-active');
    renderSlots();
    attachSlotListeners();
    showCurrentLetter();
  }

  /**
   * Shows the idle state on page load — no letter, not draggable.
   */
  function showIdleState() {
    stopTimer();
    gameActive = false;
    letterSelected = false;
    letterDisplay.classList.remove('selected');
    letterDisplay.textContent = '';
    letterDisplay.setAttribute('draggable', 'false');
    timerDisplay.textContent = formatTime(0);
    scoreboard.textContent = '0';
    scoreboard.style.color = '';
    renderSlots();
    attachSlotListeners();
  }

  // ---- Task 8.3: Timer display ----

  /**
   * Starts the round timer, updating the display every TIMER_INTERVAL_MS.
   */
  function startTimer() {
    stopTimer();
    timerHundredths = 0;
    timerInterval = setInterval(function () {
      timerHundredths++;
      totalHundredths++;
      timerDisplay.textContent = formatTime(totalHundredths);
      scoreboard.style.color = getProjectedTierColor();
    }, TIMER_INTERVAL_MS);
  }

  /**
   * Stops the round timer.
   */
  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // ---- Task 8.4: Feedback rendering ----

  /**
   * Applies feedback color to the correct slot and places the letter text.
   * After HIGHLIGHT_DURATION_MS, fades back to original color.
   * @param {string} letter - The letter that was placed
   * @param {number} distance - The placement distance
   */
  function applyFeedback(letter, distance) {
    const correctIndex = ALPHABET.indexOf(letter);
    const correctSlot = slotBar.children[correctIndex];
    if (!correctSlot) return;

    var mode = getMode();
    var slotLetter = correctSlot.querySelector('.slot-letter');

    if (mode === 0) {
      // A Ok: show the letter in the correct slot
      slotLetter.textContent = letter;
    } else if (mode === 1) {
      // B Careful: light blue glow on the correct slot, no letter
      correctSlot.classList.add('placed-glow');
    }
    // C of Trouble (mode 2): nothing persists

    // Apply feedback color (temporary flash for all modes)
    const color = getFeedbackColor(distance);
    correctSlot.style.backgroundColor = color;

    // After HIGHLIGHT_DURATION_MS, fade back
    setTimeout(function () {
      correctSlot.style.backgroundColor = '';
    }, HIGHLIGHT_DURATION_MS);
  }

  // ---- Task 8.2: Drag-and-drop event handlers ----

  /**
   * Attaches dragover, dragleave, and drop listeners to all slot elements.
   */
  function attachSlotListeners() {
    const slots = slotBar.querySelectorAll('.slot');
    slots.forEach(function (slot) {
      slot.addEventListener('dragover', handleDragOver);
      slot.addEventListener('dragleave', handleDragLeave);
      slot.addEventListener('drop', handleDrop);
    });
  }

  /**
   * Finds the nearest slot element to the given screen coordinates.
   */
  function findNearestSlot(x, y) {
    var slots = slotBar.querySelectorAll('.slot');
    var nearest = null;
    var nearestDist = Infinity;
    slots.forEach(function (slot) {
      var rect = slot.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = slot;
      }
    });
    return nearest;
  }

  function handleDragOver(e) {
    e.preventDefault();
    // Clear all other drag-over highlights first for clean single-highlight
    clearDragOverHighlights();
    this.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }

  /**
   * Removes the drag-over class from all slots.
   */
  function clearDragOverHighlights() {
    var slots = slotBar.querySelectorAll('.slot.drag-over');
    slots.forEach(function (s) { s.classList.remove('drag-over'); });
  }

  function handleDrop(e) {
    e.preventDefault();
    clearDragOverHighlights();

    if (!gameActive || !gameState) return;

    const letter = e.dataTransfer.getData('text/plain');
    if (!letter) return;

    const slotIndex = parseInt(this.dataset.index, 10);
    if (isNaN(slotIndex)) return;

    // Mark drop as successful
    dropSucceeded = true;
    letterSelected = false;
    letterDisplay.classList.remove('selected');

    placeLetter(slotIndex);
  }

  // dragstart handler on the letter display
  letterDisplay.addEventListener('dragstart', function (e) {
    dropSucceeded = false;
    letterSelected = false;
    letterDisplay.classList.remove('selected');
    e.dataTransfer.setData('text/plain', letterDisplay.textContent);
  });

  // dragend handler: if drop was outside any slot, return letter to display
  letterDisplay.addEventListener('dragend', function (e) {
    clearDragOverHighlights();
    if (!dropSucceeded) {
      // Letter was not dropped on a valid slot — keep it in the display
    }
  });

  // ---- Tap-to-place (mobile support) ----

  /**
   * Places the current letter into the given slot index.
   * Shared by both drag-and-drop and tap-to-place.
   */
  function placeLetter(slotIndex, clickedSlot) {
    if (!gameActive || !gameState) return;

    stopTimer();
    var elapsed = timerHundredths;

    var currentLetter = getCurrentLetter(gameState);
    var correctIndex = ALPHABET.indexOf(currentLetter);
    var distance = calculateDistance(correctIndex, slotIndex);

    // Pop the clicked slot (visual only, doesn't affect layout)
    if (clickedSlot) {
      clickedSlot.classList.add('click-pop');
      setTimeout(function () {
        clickedSlot.classList.remove('click-pop');
      }, 500);
    }

    gameState = advanceRound(gameState, slotIndex, elapsed, getMode());

    applyFeedback(currentLetter, distance);
    updateScoreboard();
    showCurrentLetter();
  }

  // Tap letter display to select it
  letterDisplay.addEventListener('click', function (e) {
    if (!gameActive || !gameState) return;
    if (!getCurrentLetter(gameState)) return;
    letterSelected = !letterSelected;
    letterDisplay.classList.toggle('selected', letterSelected);
  });

  // Tap/click a slot to place the current letter directly
  function handleSlotTap(e) {
    if (!gameActive || !gameState) return;
    if (!getCurrentLetter(gameState)) return;

    // Find the slot element — click might land on a child span
    var slot = this.closest ? this : e.target.closest('.slot');
    if (!slot) return;

    var slotIndex = parseInt(slot.dataset.index, 10);
    if (isNaN(slotIndex)) return;

    letterSelected = false;
    letterDisplay.classList.remove('selected');
    placeLetter(slotIndex);
  }

  // ---- Game-over summary ----

  function showGameOver() {
    stopTimer();
    gameActive = false;
    letterDisplay.textContent = '';
    letterDisplay.setAttribute('draggable', 'false');
    var displayedScore = getDisplayedScore();

    // Build placement visualization and score bar
    buildPlacementViz();
    buildScoreBar(displayedScore);
  }

  /**
   * Builds a horizontal score bar showing where the player's score falls
   * across four tiers: E-Lite, T-Rific, D-Cent, F-Ort.
   */
  function buildScoreBar(score) {
    var existing = document.getElementById('score-bar');
    if (existing) existing.remove();

    var mult = getTierScale();
    var TIERS = SCORE_TIERS;
    var MAX_SCORE = 8000 * mult;

    var container = document.createElement('div');
    container.id = 'score-bar';
    container.className = 'score-bar';

    var track = document.createElement('div');
    track.className = 'score-bar-track';

    for (var i = 0; i < TIERS.length; i++) {
      var tier = TIERS[i];
      var scaledMin = tier.min * mult;
      var scaledMax = tier.max * mult;
      var segment = document.createElement('div');
      segment.className = 'score-bar-segment';
      segment.style.backgroundColor = tier.color;
      segment.style.width = ((scaledMax - scaledMin) / MAX_SCORE * 100) + '%';

      var tierLabel = document.createElement('span');
      tierLabel.className = 'score-bar-tier-label';
      tierLabel.textContent = tier.label;
      segment.appendChild(tierLabel);

      track.appendChild(segment);
    }

    // Marker for the player's score
    var markerPos = Math.min(score / MAX_SCORE, 1) * 100;
    var marker = document.createElement('div');
    marker.className = 'score-bar-marker';
    marker.style.left = markerPos + '%';

    var markerLabel = document.createElement('div');
    markerLabel.className = 'score-bar-marker-label';
    markerLabel.textContent = String(score);
    // Shift label left when near the right edge to prevent overflow
    if (markerPos > 85) {
      markerLabel.style.left = 'auto';
      markerLabel.style.right = '0';
      markerLabel.style.transform = 'none';
    }
    marker.appendChild(markerLabel);

    track.appendChild(marker);
    container.appendChild(track);

    // Determine which tier the player is in
    var tierName = 'F-Ort';
    for (var t = 0; t < TIERS.length; t++) {
      if (score < TIERS[t].max * mult) {
        tierName = TIERS[t].label;
        break;
      }
    }
    var ratingEl = document.createElement('div');
    ratingEl.className = 'score-bar-rating';
    ratingEl.textContent = tierName + '!';
    container.appendChild(ratingEl);

    // Insert after the placement viz (or after slot bar if no viz)
    var vizEl = document.getElementById('placement-viz');
    var insertAfter = vizEl || slotBar;
    insertAfter.parentNode.insertBefore(container, insertAfter.nextSibling);
  }

  /**
   * Builds a visualization below the slot bar showing where each letter
   * was placed, with lines proportional to placement time.
   */
  function buildPlacementViz() {
    // Remove any existing viz
    var existing = document.getElementById('placement-viz');
    if (existing) existing.remove();
    var existingTop = document.getElementById('placement-viz-top');
    if (existingTop) existingTop.remove();

    // Build slot data map
    var maxTime = Math.max.apply(null, gameState.roundTimes);
    if (maxTime === 0) maxTime = 1;
    var MAX_LINE_HEIGHT = 120;

    var slotData = {};
    for (var i = 0; i < gameState.shuffle.length; i++) {
      var placedSlot = gameState.roundPlacedSlots[i];
      if (!slotData[placedSlot]) slotData[placedSlot] = [];
      slotData[placedSlot].push({
        letter: gameState.shuffle[i],
        time: gameState.roundTimes[i],
        distance: gameState.roundDistances[i],
      });
    }

    buildMobileViz(slotData, maxTime, MAX_LINE_HEIGHT);
  }

  function buildVizCol(slotData, slotIndex, maxTime, maxLineHeight, flipped) {
    var col = document.createElement('div');
    col.className = 'viz-col';

    var entries = slotData[slotIndex];
    if (!entries) return col;

    // Build elements in order: line then letter (or reversed if flipped)
    for (var e = 0; e < entries.length; e++) {
      var data = entries[e];
      var lineHeight = Math.max(2, Math.round((data.time / maxTime) * maxLineHeight));

      var line = document.createElement('div');
      line.className = 'viz-line';
      line.style.height = lineHeight + 'px';
      line.style.backgroundColor = getFeedbackColor(data.distance);

      var letterEl = document.createElement('div');
      letterEl.className = 'viz-letter';
      letterEl.textContent = data.letter;
      letterEl.style.color = getFeedbackColor(data.distance);

      if (flipped) {
        // Letter on top, line below (viz goes upward from slots)
        col.appendChild(letterEl);
        col.appendChild(line);
      } else {
        col.appendChild(line);
        col.appendChild(letterEl);
      }
    }
    return col;
  }

  function buildDesktopViz(slotData, maxTime, maxLineHeight) {
    var viz = document.createElement('div');
    viz.id = 'placement-viz';
    viz.className = 'placement-viz viz-hidden';

    for (var s = 0; s < 26; s++) {
      viz.appendChild(buildVizCol(slotData, s, maxTime, maxLineHeight, false));
    }

    slotBar.parentNode.insertBefore(viz, slotBar.nextSibling);

    // Fade in after a brief frame to let the browser paint the hidden state
    setTimeout(function () {
      viz.classList.remove('viz-hidden');
    }, 50);
  }

  function buildMobileViz(slotData, maxTime, maxLineHeight) {
    // Top viz (slots 0-12, row 1) — flipped so lines go up from slots
    var vizTop = document.createElement('div');
    vizTop.id = 'placement-viz-top';
    vizTop.className = 'placement-viz placement-viz-top viz-hidden';

    for (var s = 0; s < 13; s++) {
      vizTop.appendChild(buildVizCol(slotData, s, maxTime, maxLineHeight, true));
    }

    // Bottom viz (slots 13-25, row 2) — normal direction
    var vizBottom = document.createElement('div');
    vizBottom.id = 'placement-viz';
    vizBottom.className = 'placement-viz placement-viz-bottom viz-hidden';

    for (var s2 = 13; s2 < 26; s2++) {
      vizBottom.appendChild(buildVizCol(slotData, s2, maxTime, maxLineHeight, false));
    }

    // Insert: top viz before slot bar, bottom viz after slot bar
    slotBar.parentNode.insertBefore(vizTop, slotBar);
    slotBar.parentNode.insertBefore(vizBottom, slotBar.nextSibling);

    // Animate: add class to trigger slot bar spacing, then fade in viz
    slotBar.classList.add('viz-active');

    // Fade in after a short delay to let the spacing transition settle
    setTimeout(function () {
      vizTop.classList.remove('viz-hidden');
      vizBottom.classList.remove('viz-hidden');
    }, 300);
  }

  // ---- Wire new game button ----
  newGameBtn.addEventListener('click', startNewGame);

  // ---- Mode slider: update slot display when mode changes mid-game ----
  if (modeSlider) {
    updateModeLabels();
    modeSlider.addEventListener('input', function () {
      updateModeLabels();
      applyModeToSlots();
    });
  }

  /**
   * Re-applies the current mode to all already-placed slots.
   * Called when the player changes the mode slider mid-game.
   */
  function applyModeToSlots() {
    if (!gameState) return;
    var mode = getMode();
    var slots = slotBar.querySelectorAll('.slot');

    // First, clear all placed indicators
    for (var s = 0; s < 26; s++) {
      var slotLetter = slots[s].querySelector('.slot-letter');
      slotLetter.textContent = '';
      slots[s].classList.remove('placed-glow');
    }

    // Re-apply based on current mode
    for (var i = 0; i < gameState.currentRound; i++) {
      var letter = gameState.shuffle[i];
      var correctIndex = ALPHABET.indexOf(letter);
      if (mode === 0) {
        slots[correctIndex].querySelector('.slot-letter').textContent = letter;
      } else if (mode === 1) {
        slots[correctIndex].classList.add('placed-glow');
      }
      // mode 2: nothing
    }
  }

  // ---- Show idle state on page load (player clicks New Game to start) ----
  // Slot bar delegated listeners (added once, not per new game)
  slotBar.addEventListener('dragover', function (e) {
    e.preventDefault();
  });
  slotBar.addEventListener('drop', function (e) {
    if (e.target !== slotBar) return;
    e.preventDefault();
    if (!gameActive || !gameState) return;
    var nearestSlot = findNearestSlot(e.clientX, e.clientY);
    if (nearestSlot) {
      var dropEvent = new Event('drop', { bubbles: false });
      dropEvent.dataTransfer = e.dataTransfer;
      dropEvent.preventDefault = function () {};
      nearestSlot.dispatchEvent(dropEvent);
    }
  });
  slotBar.addEventListener('click', function (e) {
    if (!gameActive || !gameState) return;
    if (!getCurrentLetter(gameState)) return;
    var slot = e.target.closest ? e.target.closest('.slot') : null;
    if (!slot) return;
    var slotIndex = parseInt(slot.dataset.index, 10);
    if (isNaN(slotIndex)) return;
    letterSelected = false;
    letterDisplay.classList.remove('selected');
    placeLetter(slotIndex, slot);
  });

  showIdleState();
}

// ---- Browser initialization ----
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initGame);
}

// ---- Export for testing (Node.js / fast-check) ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ALPHABET,
    TOTAL_ROUNDS,
    MAX_DISTANCE_FOR_COLOR,
    HIGHLIGHT_DURATION_MS,
    TIMER_INTERVAL_MS,
    MODE_MULTIPLIERS,
    SCORE_TIERS,
    generateShuffle,
    calculateDistance,
    calculateScore,
    calculateCumulativeScore,
    getFeedbackColor,
    formatTime,
    createGameState,
    getCurrentLetter,
    advanceRound,
    isGameComplete,
    initGame,
  };
}
