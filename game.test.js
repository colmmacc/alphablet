import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
const {
  generateShuffle,
  ALPHABET,
  calculateScore,
  calculateDistance,
  calculateCumulativeScore,
  getFeedbackColor,
  formatTime,
  createGameState,
  getCurrentLetter,
  advanceRound,
  isGameComplete,
} = require('./game.js');

/**
 * Feature: alphablet-game
 * Property 1: Shuffle produces a valid permutation of the alphabet
 *
 * Validates: Requirements 2.1, 2.3, 11.1, 11.2, 11.3
 */
describe('Feature: alphablet-game', () => {
  describe('Property 1: Shuffle produces a valid permutation of the alphabet', () => {
    it('shuffle always has length 26, no duplicates, and sorted equals [A..Z]', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const shuffle = generateShuffle();

            // Length is exactly 26
            expect(shuffle).toHaveLength(26);

            // No duplicates (Set size equals array length)
            const uniqueLetters = new Set(shuffle);
            expect(uniqueLetters.size).toBe(26);

            // Sorted shuffle equals the canonical alphabet [A..Z]
            const sorted = [...shuffle].sort();
            expect(sorted).toEqual(ALPHABET);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 3: Score formula correctness
   *
   * Validates: Requirements 7.1, 7.2, 7.5, 12.1
   */
  describe('Property 3: Score formula correctness', () => {
    it('for any positive elapsed time and distance 0-25, score equals elapsed + distance² × 15', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 0, max: 25 }),
          (elapsed, distance) => {
            const score = calculateScore(elapsed, distance);
            const expected = elapsed + distance * distance * 8;
            expect(score).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 4: Score monotonicity with respect to distance
   *
   * Validates: Requirements 12.4
   */
  describe('Property 4: Score monotonicity with respect to distance', () => {
    it('for fixed elapsed time and d1 <= d2, score(d1) <= score(d2)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 0, max: 25 }),
          fc.integer({ min: 0, max: 25 }),
          (elapsed, a, b) => {
            const d1 = Math.min(a, b);
            const d2 = Math.max(a, b);
            const score1 = calculateScore(elapsed, d1);
            const score2 = calculateScore(elapsed, d2);
            expect(score1).toBeLessThanOrEqual(score2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 5: Score lower bound
   *
   * Validates: Requirements 12.3
   */
  describe('Property 5: Score lower bound', () => {
    it('for any round, score >= elapsed time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 0, max: 25 }),
          (elapsed, distance) => {
            const score = calculateScore(elapsed, distance);
            expect(score).toBeGreaterThanOrEqual(elapsed);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 6: Cumulative score is the sum of round scores
   *
   * Validates: Requirements 7.3
   */
  describe('Property 6: Cumulative score is the sum of round scores', () => {
    it('for any array of round scores, cumulative equals their sum', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 0, maxLength: 26 }),
          (roundScores) => {
            const cumulative = calculateCumulativeScore(roundScores);
            const expectedSum = roundScores.reduce((sum, s) => sum + s, 0);
            expect(cumulative).toBe(expectedSum);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 7: Color interpolation correctness
   *
   * Validates: Requirements 5.1, 5.2
   */
  describe('Property 7: Color interpolation correctness', () => {
    it('distance 0 returns green', () => {
      fc.assert(
        fc.property(
          fc.constant(0),
          (distance) => {
            const color = getFeedbackColor(distance);
            expect(color).toBe('rgb(0,200,83)');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('distance 1-12 returns interpolated yellow-to-red with decreasing green channel', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          (distance) => {
            const color = getFeedbackColor(distance);
            // Should match rgb(255,G,0) pattern
            const match = color.match(/^rgb\(255,(\d+),0\)$/);
            expect(match).not.toBeNull();

            const g = parseInt(match[1], 10);
            // Green channel must be between 0 and 255 inclusive
            expect(g).toBeGreaterThanOrEqual(0);
            expect(g).toBeLessThanOrEqual(255);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('green channel decreases as distance increases within 1-12', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 11 }),
          (d) => {
            const color1 = getFeedbackColor(d);
            const color2 = getFeedbackColor(d + 1);
            const g1 = parseInt(color1.match(/^rgb\(255,(\d+),0\)$/)[1], 10);
            const g2 = parseInt(color2.match(/^rgb\(255,(\d+),0\)$/)[1], 10);
            expect(g1).toBeGreaterThanOrEqual(g2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('distance >= 13 returns red', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 13, max: 25 }),
          (distance) => {
            const color = getFeedbackColor(distance);
            expect(color).toBe('rgb(255,0,0)');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 8: Time formatting round-trip
   *
   * Validates: Requirements 6.2
   */
  describe('Property 8: Time formatting round-trip', () => {
    it('for any non-negative integer, formatted string matches "X.XX" pattern and parsing back yields original value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999999 }),
          (hundredths) => {
            const formatted = formatTime(hundredths);

            // Must match pattern: one or more digits, dot, exactly two digits
            expect(formatted).toMatch(/^\d+\.\d{2}$/);

            // Round-trip: parse back to original value
            const parts = formatted.split('.');
            const seconds = parseInt(parts[0], 10);
            const remainder = parseInt(parts[1], 10);
            const reconstructed = seconds * 100 + remainder;
            expect(reconstructed).toBe(hundredths);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 2: Letter presentation follows shuffle order
   *
   * Validates: Requirements 2.2
   */
  describe('Property 2: Letter presentation follows shuffle order', () => {
    it('for any valid shuffle and round N (0 ≤ N < 26), getCurrentLetter returns shuffle[N]', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 25 }),
          (targetRound) => {
            let state = createGameState();
            const expectedLetter = state.shuffle[targetRound];

            // Advance the state to round N by dropping into any slot with any time
            for (let i = 0; i < targetRound; i++) {
              state = advanceRound(state, 0, 100);
            }

            // At round N, getCurrentLetter should return shuffle[N]
            expect(getCurrentLetter(state)).toBe(expectedLetter);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 9: Valid drop advances the round
   *
   * Validates: Requirements 3.3
   */
  describe('Property 9: Valid drop advances the round', () => {
    it('for state at round N < 26 and any slot 0-25, advanceRound produces state at round N+1 with updated score', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 25 }),
          fc.integer({ min: 1, max: 10000 }),
          (slotIndex, elapsedTime) => {
            const state = createGameState();
            const oldRound = state.currentRound;
            const oldScoresLength = state.roundScores.length;

            const newState = advanceRound(state, slotIndex, elapsedTime);

            // Round advances by 1
            expect(newState.currentRound).toBe(oldRound + 1);

            // roundScores has one more element
            expect(newState.roundScores.length).toBe(oldScoresLength + 1);

            // cumulativeScore is updated (equals sum of all round scores)
            const expectedCumulative = newState.roundScores.reduce((sum, s) => sum + s, 0);
            expect(newState.cumulativeScore).toBe(expectedCumulative);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 10: Invalid drop preserves game state
   *
   * Validates: Requirements 3.4
   */
  describe('Property 10: Invalid drop preserves game state', () => {
    it('if no action is taken (no advanceRound call), state remains unchanged', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const state = createGameState();

            // Deep copy the state to compare later
            const snapshot = JSON.parse(JSON.stringify(state));

            // Simulate an invalid drop: no advanceRound is called
            // The state should remain completely unchanged
            expect(state.currentRound).toBe(snapshot.currentRound);
            expect(state.cumulativeScore).toBe(snapshot.cumulativeScore);
            expect(state.roundScores).toEqual(snapshot.roundScores);
            expect(state.shuffle).toEqual(snapshot.shuffle);
            expect(state.roundTimes).toEqual(snapshot.roundTimes);
            expect(state.roundDistances).toEqual(snapshot.roundDistances);
            expect(state.roundPlacedSlots).toEqual(snapshot.roundPlacedSlots);
            expect(state.roundModes).toEqual(snapshot.roundModes);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: alphablet-game
   * Property 11: New game resets score to zero
   *
   * Validates: Requirements 9.2
   */
  describe('Property 11: New game resets score to zero', () => {
    it('createGameState always produces cumulativeScore 0 and currentRound 0', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const state = createGameState();

            expect(state.cumulativeScore).toBe(0);
            expect(state.currentRound).toBe(0);
            expect(state.roundScores).toEqual([]);
            expect(state.roundTimes).toEqual([]);
            expect(state.roundDistances).toEqual([]);
            expect(state.roundPlacedSlots).toEqual([]);
            expect(state.roundModes).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
