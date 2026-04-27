// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  ALPHABET,
  initGame,
} = require('./game.js');

/**
 * Sets up the DOM structure matching index.html so initGame() can find its elements.
 */
function setupDOM() {
  document.body.innerHTML = `
    <div class="game-container">
      <h1 class="game-title">Alphablet</h1>
      <div class="top-controls">
        <div class="mode-selector">
          <input type="range" id="mode-slider" min="0" max="2" value="1" step="1">
          <div class="mode-labels">
            <span class="mode-label" data-mode="0">A Ok</span>
            <span class="mode-label" data-mode="1">B Careful</span>
            <span class="mode-label" data-mode="2">C of Trouble</span>
          </div>
        </div>
        <button id="new-game-btn" class="new-game-btn">New Game</button>
      </div>
      <div class="info-bar">
        <div class="timer-section">
          <span class="label">Time:</span>
          <span id="timer-display" class="timer-display">0.00</span>
        </div>
        <div class="score-section">
          <span class="label">Score:</span>
          <span id="scoreboard" class="scoreboard">0</span>
        </div>
      </div>
      <div id="letter-display" class="letter-display" draggable="true"></div>
      <div id="slot-bar" class="slot-bar"></div>
    </div>
  `;
}

function clickNewGame() {
  document.getElementById('new-game-btn').click();
}

function simulateDrop(slotBar, slotIndex, letter) {
  const targetSlot = slotBar.children[slotIndex];
  const dropEvent = new Event('drop', { bubbles: true });
  dropEvent.dataTransfer = {
    getData: vi.fn().mockReturnValue(letter),
  };
  dropEvent.preventDefault = vi.fn();
  targetSlot.dispatchEvent(dropEvent);
}

describe('UI Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupDOM();
    initGame();
    vi.advanceTimersByTime(0);
  });

  describe('Idle state on page load', () => {
    it('letter display is empty and not draggable on load', () => {
      const letterDisplay = document.getElementById('letter-display');
      expect(letterDisplay.textContent.trim()).toBe('');
      expect(letterDisplay.getAttribute('draggable')).toBe('false');
    });

    it('clicking New Game starts the game with a letter', () => {
      clickNewGame();
      vi.advanceTimersByTime(0);
      const letterDisplay = document.getElementById('letter-display');
      const letter = letterDisplay.textContent.trim();
      expect(letter).toHaveLength(1);
      expect(ALPHABET).toContain(letter);
      expect(letterDisplay.getAttribute('draggable')).toBe('true');
    });
  });

  describe('Slot rendering', () => {
    it('renders 26 slots in the slot bar', () => {
      const slotBar = document.getElementById('slot-bar');
      const slots = slotBar.querySelectorAll('.slot');
      expect(slots.length).toBe(26);
    });

    it('slots do not have letter labels', () => {
      const slotBar = document.getElementById('slot-bar');
      const labels = slotBar.querySelectorAll('.slot-label');
      expect(labels.length).toBe(0);
    });
  });

  describe('Letter display draggable after New Game', () => {
    it('letter display has draggable="true" after starting game', () => {
      clickNewGame();
      vi.advanceTimersByTime(0);
      const letterDisplay = document.getElementById('letter-display');
      expect(letterDisplay.getAttribute('draggable')).toBe('true');
    });

    it('letter display contains a valid letter after starting game', () => {
      clickNewGame();
      vi.advanceTimersByTime(0);
      const letterDisplay = document.getElementById('letter-display');
      const letter = letterDisplay.textContent.trim();
      expect(letter).toHaveLength(1);
      expect(ALPHABET).toContain(letter);
    });
  });

  describe('Game-over after 26 rounds', () => {
    it('shows placement viz and score bar after all 26 letters', () => {
      clickNewGame();
      vi.advanceTimersByTime(0);

      const slotBar = document.getElementById('slot-bar');
      const letterDisplay = document.getElementById('letter-display');

      for (let i = 0; i < 26; i++) {
        const currentLetter = letterDisplay.textContent.trim();
        expect(currentLetter.length).toBe(1);
        vi.advanceTimersByTime(50);
        simulateDrop(slotBar, 0, currentLetter);
        vi.advanceTimersByTime(10);
      }

      // Placement visualization should exist
      const viz = document.getElementById('placement-viz');
      expect(viz).not.toBeNull();
      expect(viz.querySelectorAll('.viz-col').length).toBe(26);

      // Score bar should exist
      const scoreBar = document.getElementById('score-bar');
      expect(scoreBar).not.toBeNull();
    });
  });

  describe('New game resets visible state', () => {
    it('resets scoreboard, timer, viz, score bar, and letter display on new game', () => {
      clickNewGame();
      vi.advanceTimersByTime(0);

      const slotBar = document.getElementById('slot-bar');
      const letterDisplay = document.getElementById('letter-display');
      const scoreboard = document.getElementById('scoreboard');
      const timerDisplay = document.getElementById('timer-display');
      const newGameBtn = document.getElementById('new-game-btn');

      for (let i = 0; i < 26; i++) {
        const currentLetter = letterDisplay.textContent.trim();
        vi.advanceTimersByTime(50);
        simulateDrop(slotBar, 0, currentLetter);
        vi.advanceTimersByTime(10);
      }

      expect(document.getElementById('placement-viz')).not.toBeNull();
      expect(document.getElementById('score-bar')).not.toBeNull();

      newGameBtn.click();
      vi.advanceTimersByTime(0);

      expect(scoreboard.textContent).toBe('0');
      expect(timerDisplay.textContent).toBe('0.00');
      expect(document.getElementById('placement-viz')).toBeNull();
      expect(document.getElementById('score-bar')).toBeNull();

      const newLetter = letterDisplay.textContent.trim();
      expect(newLetter).toHaveLength(1);
      expect(ALPHABET).toContain(newLetter);
    });
  });

  describe('Tap-to-place (mobile)', () => {
    it('tapping letter display selects it, tapping slot places it', () => {
      clickNewGame();
      vi.advanceTimersByTime(0);

      const slotBar = document.getElementById('slot-bar');
      const letterDisplay = document.getElementById('letter-display');
      const firstLetter = letterDisplay.textContent.trim();

      // Tap the letter to select it
      letterDisplay.click();
      expect(letterDisplay.classList.contains('selected')).toBe(true);

      // Tap a slot to place it
      vi.advanceTimersByTime(50);
      slotBar.children[0].click();

      // Letter should advance to next
      const nextLetter = letterDisplay.textContent.trim();
      expect(nextLetter).not.toBe('');
      expect(letterDisplay.classList.contains('selected')).toBe(false);
    });
  });
});
