# Implementation Plan: AlphaBlet Game

## Overview

Implement AlphaBlet as a single-page static web application (HTML/CSS/JS) with no dependencies. Pure game logic (shuffle, scoring, feedback, timer, state) is separated from DOM manipulation for testability. Property-based tests use fast-check to validate 11 correctness properties. The implementation builds incrementally: core logic first, then UI wiring, then integration.

## Tasks

- [x] 1. Set up project structure and constants
  - Create `index.html` with game layout: title "Alphablet", letter display area, 26-slot bar (A–Z), timer display, scoreboard, new game button, and game-over summary container
  - Create `style.css` with base styling for layout, slots, letter display, drag-over highlights, green/yellow/red feedback colors, fade animation (1s), and game-over summary
  - Create `game.js` with the ALPHABET constant, TOTAL_ROUNDS, MAX_DISTANCE_FOR_COLOR, HIGHLIGHT_DURATION_MS, TIMER_INTERVAL_MS, and module scaffolding (Shuffle, Scoring, Feedback, Timer, GameState, UI Controller)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2_

- [ ] 2. Implement Shuffle module
  - [x] 2.1 Implement `generateShuffle()` using Fisher-Yates algorithm
    - Returns an array of 26 unique letters in random order
    - _Requirements: 2.1, 2.3, 11.1, 11.2, 11.3_

  - [x] 2.2 Write property test: Shuffle produces a valid permutation (Property 1)
    - **Property 1: Shuffle produces a valid permutation of the alphabet**
    - Verify sorted shuffle equals [A..Z], length is 26, no duplicates
    - **Validates: Requirements 2.1, 2.3, 11.1, 11.2, 11.3**

- [ ] 3. Implement Scoring module
  - [x] 3.1 Implement `calculateDistance(correctIndex, placedIndex)`
    - Returns absolute difference between indices, clamped to 0–25
    - _Requirements: 7.1, 7.2, 12.1_

  - [x] 3.2 Implement `calculateScore(elapsedHundredths, distance)`
    - Returns elapsedHundredths × max(1, distance)
    - _Requirements: 7.1, 7.2, 7.5, 12.1_

  - [x] 3.3 Implement `calculateCumulativeScore(roundScores)`
    - Returns sum of all round scores in the array
    - _Requirements: 7.3_

  - [x] 3.4 Write property test: Score formula correctness (Property 3)
    - **Property 3: Score formula correctness**
    - For any positive elapsed time and distance 0–25, score equals elapsed × max(1, distance)
    - **Validates: Requirements 7.1, 7.2, 7.5, 12.1**

  - [x] 3.5 Write property test: Score monotonicity with respect to distance (Property 4)
    - **Property 4: Score monotonicity with respect to distance**
    - For fixed elapsed time and d1 ≤ d2, score(d1) ≤ score(d2)
    - **Validates: Requirements 12.4**

  - [x] 3.6 Write property test: Score lower bound (Property 5)
    - **Property 5: Score lower bound**
    - For any round, score ≥ elapsed time
    - **Validates: Requirements 12.3**

  - [x] 3.7 Write property test: Cumulative score is sum of round scores (Property 6)
    - **Property 6: Cumulative score is the sum of round scores**
    - For any array of round scores, cumulative equals their sum
    - **Validates: Requirements 7.3**

- [ ] 4. Implement Feedback and Timer modules
  - [x] 4.1 Implement `getFeedbackColor(distance)`
    - Distance 0 returns green; distance 1–12 interpolates yellow to red; distance ≥ 13 returns red
    - Linear interpolation between yellow (rgb 255,255,0) and red (rgb 255,0,0) clamped at MAX_DISTANCE_FOR_COLOR
    - _Requirements: 4.1, 5.1, 5.2_

  - [x] 4.2 Implement `formatTime(hundredths)`
    - Formats integer hundredths as "X.XX" string (e.g., 1234 → "12.34")
    - _Requirements: 6.2_

  - [x] 4.3 Write property test: Color interpolation correctness (Property 7)
    - **Property 7: Color interpolation correctness**
    - Distance 0 → green; distance 1–12 → interpolated yellow-to-red; distance ≥ 13 → same red
    - **Validates: Requirements 5.1, 5.2**

  - [x] 4.4 Write property test: Time formatting round-trip (Property 8)
    - **Property 8: Time formatting**
    - For any non-negative integer, formatted string matches "X.XX" pattern and parsing back yields original value
    - **Validates: Requirements 6.2**

- [x] 5. Checkpoint - Ensure all pure logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement GameState module
  - [x] 6.1 Implement `createGameState()`
    - Returns a new GameState with fresh shuffle, currentRound 0, empty score arrays, cumulativeScore 0
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [x] 6.2 Implement `getCurrentLetter(state)`
    - Returns shuffle[currentRound] or null if currentRound ≥ 26
    - _Requirements: 2.2_

  - [x] 6.3 Implement `advanceRound(state, slotIndex, elapsedHundredths)`
    - Calculates distance, score; appends to roundScores/roundTimes/roundDistances; increments currentRound; updates cumulativeScore
    - Returns new GameState (immutable update)
    - _Requirements: 3.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 6.4 Implement `isGameComplete(state)`
    - Returns true when currentRound ≥ 26
    - _Requirements: 8.1_

  - [x] 6.5 Write property test: Letter presentation follows shuffle order (Property 2)
    - **Property 2: Letter presentation follows shuffle order**
    - For any valid shuffle and round N (0 ≤ N < 26), getCurrentLetter returns shuffle[N]
    - **Validates: Requirements 2.2**

  - [x] 6.6 Write property test: Valid drop advances the round (Property 9)
    - **Property 9: Valid drop advances the round**
    - For state at round N < 26 and any slot 0–25, advanceRound produces state at round N+1 with updated score
    - **Validates: Requirements 3.3**

  - [x] 6.7 Write property test: Invalid drop preserves game state (Property 10)
    - **Property 10: Invalid drop preserves game state**
    - If drop is outside valid slot, state remains unchanged
    - **Validates: Requirements 3.4**

  - [x] 6.8 Write property test: New game resets score to zero (Property 11)
    - **Property 11: New game resets score to zero**
    - createGameState always produces cumulativeScore 0 and currentRound 0
    - **Validates: Requirements 9.2**

- [x] 7. Checkpoint - Ensure all game logic and state tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement UI Controller and drag-and-drop
  - [x] 8.1 Implement DOM initialization
    - Render 26 slots in the Slot_Bar with labels A–Z
    - Set up letter display as draggable element with `draggable="true"`
    - Wire new game button click handler
    - Initialize game state via `createGameState()` and display first letter
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 9.1_

  - [x] 8.2 Implement drag-and-drop event handlers
    - `dragstart`: set drag data with current letter
    - `dragover`: prevent default on slots to allow drop, add visual drop-target indicator
    - `dragleave`: remove drop-target indicator
    - `drop`: read slot index, stop timer, call `advanceRound`, apply feedback color, update scoreboard, load next letter
    - `dragend`: if drop was outside any slot, return letter to display without advancing round
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 8.3 Implement timer display
    - Start a `setInterval` at TIMER_INTERVAL_MS (10ms) on round start
    - Update timer DOM element with `formatTime()` output each tick
    - Stop interval on valid drop
    - Reset on new round start
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 8.4 Implement feedback rendering
    - On drop: apply `getFeedbackColor(distance)` as background color to the target slot
    - Place the letter text into the correct slot (regardless of where dropped)
    - After HIGHLIGHT_DURATION_MS (1000ms), fade slot back to original color using CSS transition
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_

  - [x] 8.5 Implement scoreboard updates
    - Update scoreboard DOM element with `cumulativeScore` after each round
    - _Requirements: 7.3, 7.4_

- [ ] 9. Implement game completion and new game flow
  - [x] 9.1 Implement game-over summary
    - When `isGameComplete()` returns true, display summary overlay/section
    - Show final cumulative score and total elapsed time across all rounds
    - Show "New Game" button in summary
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.2 Implement new game reset
    - On new game button click: call `createGameState()`, reset scoreboard to 0, reset timer to 0, clear all slot contents and highlights, hide game-over summary, display first letter from new shuffle
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.3 Write unit tests for UI integration
    - Test that slots render with correct A–Z labels
    - Test that draggable attribute is set on letter display
    - Test that game-over summary appears after 26 rounds
    - Test that new game resets visible state
    - _Requirements: 1.3, 1.4, 3.1, 8.1, 9.1_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 11 universal correctness properties from the design using fast-check
- Unit tests validate specific UI behaviors and edge cases
- All JavaScript lives in a single `game.js` file with logical module separation (no build step)
- The game is pure static HTML/CSS/JS with no external dependencies (except fast-check for testing)
