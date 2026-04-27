# Requirements Document

## Introduction

AlphaBlet is a single-player browser-based alphabet placement game. The player is presented with a randomized letter of the alphabet and must place it in the correct slot among 26 blank horizontal slots as quickly and accurately as possible. The game supports both drag-and-drop (desktop) and tap-to-place (mobile) interaction. Three difficulty modes control how much visual feedback the player receives. The game tracks time and accuracy, producing a composite score where lower is better. It runs entirely client-side and is deployable as a static site on GitHub Pages.

## Glossary

- **Game**: The AlphaBlet web application that manages the full gameplay loop.
- **Letter_Display**: The UI component that shows the current randomized letter the player must place.
- **Slot_Bar**: The row of 26 blank slots where the player places letters. Displays as a single row on desktop, two rows (A–M / N–Z) on mobile.
- **Slot**: An individual placement target within the Slot_Bar, each corresponding to one letter of the alphabet.
- **Timer**: The component that tracks total elapsed time across all rounds in hundredths of a second.
- **Scoreboard**: The component that displays the player's running cumulative score, colored to indicate the projected tier.
- **Distance**: The absolute difference between the index of the correct slot and the index of the slot where the player placed the letter (0 for correct placement).
- **Round**: A single letter-placement attempt, from letter presentation through placement resolution.
- **Shuffle**: A randomized permutation of the 26 letters that determines presentation order.
- **Mode**: The difficulty setting (A Ok, B Careful, C of Trouble) that controls visual feedback and score multiplier.
- **Mode_Multiplier**: A per-round scoring factor based on the mode at the time of placement: A Ok = 1.0, B Careful = 0.8, C of Trouble = 0.6.
- **Score_Tier**: A rating category (E-Lite, T-Rific, D-Cent, F-Ort) based on the final score, with boundaries scaled by mode difficulty.

## Requirements

### Requirement 1: Game Layout and Title

**User Story:** As a player, I want to see the game title and a clear layout, so that I understand what game I am playing and where to interact.

#### Acceptance Criteria

1. THE Game SHALL display the title "Alphablet" at the top of the page.
2. THE Game SHALL display a mode slider and New Game button at the top of the page.
3. THE Game SHALL display the time and score above the Letter_Display.
4. THE Game SHALL display the Letter_Display below the info bar.
5. THE Game SHALL display the Slot_Bar below the Letter_Display as blank (unlabeled) Slots.
6. THE Slots SHALL scale responsively to always fit without wrapping — single row on desktop, two rows (A–M / N–Z) on mobile (≤600px).

### Requirement 2: Letter Randomization

**User Story:** As a player, I want the letters to appear in a random order, so that each game is a unique challenge.

#### Acceptance Criteria

1. WHEN a new game starts, THE Game SHALL generate a Shuffle of all 26 letters of the alphabet.
2. THE Game SHALL present letters to the player one at a time in the order determined by the Shuffle.
3. THE Shuffle SHALL contain each of the 26 letters exactly once.

### Requirement 3: Interaction — Drag-and-Drop (Desktop)

**User Story:** As a desktop player, I want to drag the displayed letter to a slot, so that I can place it where I think it belongs.

#### Acceptance Criteria

1. THE Letter_Display SHALL present the current letter as a draggable element.
2. WHEN the player drags the letter over a Slot, only that Slot SHALL highlight as a valid drop target.
3. WHEN the player drops the letter onto a Slot, THE Game SHALL evaluate the placement and proceed to the next Round.
4. IF the player drops the letter outside of any Slot, THEN THE Game SHALL return the letter to the Letter_Display without advancing the Round.
5. THE Slot_Bar SHALL accept drops in the gaps between slots by delegating to the nearest slot.
6. WHEN a drop or drag ends, all drag-over highlights SHALL be cleared.

### Requirement 4: Interaction — Tap-to-Place (Mobile)

**User Story:** As a mobile player, I want to tap to select and place letters, since drag-and-drop doesn't work on touch devices.

#### Acceptance Criteria

1. WHEN the player taps the Letter_Display, THE letter SHALL toggle a selected state with a visual highlight.
2. WHEN a letter is selected and the player taps a Slot, THE Game SHALL place the letter in that Slot and proceed to the next Round.
3. THE selected state SHALL be cleared after placement, on New Game, or when tapped again to deselect.

### Requirement 5: Correct Placement Feedback

**User Story:** As a player, I want visual feedback when I place a letter correctly, so that I know I got it right.

#### Acceptance Criteria

1. WHEN the player places a letter in the correct Slot, THE correct Slot SHALL display a green highlight.
2. THE highlight SHALL fade back to its original color after 1 second.

### Requirement 6: Incorrect Placement Feedback

**User Story:** As a player, I want visual feedback proportional to how wrong my placement was, so that I can gauge my accuracy.

#### Acceptance Criteria

1. WHEN the player places a letter incorrectly, THE correct Slot SHALL display a color on a gradient from yellow (Distance 1) to red (Distance ≥ 13).
2. THE Game SHALL interpolate linearly between yellow and red based on Distance, clamped at 13.
3. THE highlight SHALL fade back to its original color after 1 second.

### Requirement 7: Timer

**User Story:** As a player, I want to see how long the game is taking, so that I can try to improve my speed.

#### Acceptance Criteria

1. WHEN a new Round begins, THE per-round timer SHALL reset to zero and start counting.
2. THE display SHALL show total elapsed time across all rounds in hundredths of a second (e.g., "12.34").
3. WHEN the player places a letter, THE per-round timer SHALL stop for that Round.
4. THE Timer SHALL update at a minimum frequency of 10 times per second.

### Requirement 8: Scoring

**User Story:** As a player, I want a score that reflects both my speed and accuracy, so that I have a single metric to optimize.

#### Acceptance Criteria

1. FOR ALL Rounds, THE Game SHALL compute the raw round score as: `elapsed_time_hundredths + distance² × 8`.
2. THE displayed round score SHALL be the raw score multiplied by the Mode_Multiplier active at the time of placement.
3. THE Scoreboard SHALL display the cumulative displayed score.
4. THE Scoreboard SHALL update immediately after each Round completes.
5. THE Scoreboard text color SHALL update in real time (every timer tick) to reflect the projected score tier.

### Requirement 9: Difficulty Modes

**User Story:** As a player, I want to choose how much help I get, so that I can challenge myself at different levels.

#### Acceptance Criteria

1. THE Game SHALL provide three modes via a slider: A Ok (0), B Careful (1), C of Trouble (2).
2. THE default mode SHALL be B Careful.
3. IN A Ok mode, placed letters SHALL be shown in their correct slots.
4. IN B Careful mode, correct slots SHALL display a light blue glow, no letter text.
5. IN C of Trouble mode, no persistent visual indicator SHALL be shown after the feedback flash.
6. THE mode SHALL be recorded per round at placement time and SHALL NOT retroactively change past scores.
7. Changing the mode mid-game SHALL immediately update the visual state of already-placed slots.

### Requirement 10: Game Completion

**User Story:** As a player, I want to know when the game is over and see how I did.

#### Acceptance Criteria

1. WHEN all 26 letters are placed, THE Game SHALL display a placement visualization and score bar.
2. THE placement visualization SHALL show each letter connected to its drop slot by a line proportional to placement time.
3. ON mobile, row 1 (A–M) visualization SHALL appear above the slots (lines going up) and row 2 (N–Z) below (lines going down), with an animated transition.
4. ON desktop, the visualization SHALL fade in below the slots.
5. THE score bar SHALL display four tiers with a marker at the player's score and the tier name.
6. THE score bar tier boundaries SHALL scale by the effective mode multiplier (base calibrated for B Careful).

### Requirement 11: New Game

**User Story:** As a player, I want to start a new game at any time.

#### Acceptance Criteria

1. THE Game SHALL provide a visible New Game button at the top.
2. WHEN activated, THE Game SHALL reset score, timer, shuffle, slots, and clear any visualization or score bar.

### Requirement 12: Idle State on Load

**User Story:** As a player, I want the game to wait for me before starting.

#### Acceptance Criteria

1. WHEN the page loads, THE Game SHALL display an idle state with no letter and the display not interactive.
2. THE player SHALL click New Game to begin.

### Requirement 13: Mobile Responsiveness

**User Story:** As a mobile player, I want the game to be playable on my phone.

#### Acceptance Criteria

1. ON screens ≤600px, THE Slot_Bar SHALL display as two rows (A–M, N–Z) using CSS grid.
2. THE layout SHALL use compact spacing, smaller fonts, and reduced padding on narrow screens.
3. THE mode slider thumb SHALL be at least 24px for touch accessibility.
4. THE Game SHALL use `touch-action: manipulation` to prevent unwanted zoom/scroll during play.

### Requirement 14: Static Deployment Compatibility

**User Story:** As a developer, I want the game to run entirely in the browser with no server-side code.

#### Acceptance Criteria

1. THE Game SHALL consist exclusively of static assets (HTML, CSS, JavaScript).
2. THE Game SHALL require no server-side processing.
3. THE Game SHALL function on GitHub Pages and in modern browsers without plugins.

### Requirement 15: Shuffle Integrity

#### Acceptance Criteria

1. THE Shuffle SHALL produce a permutation of exactly 26 unique letters.
2. Sorting any Shuffle SHALL produce A through Z.
3. Every Shuffle SHALL have length 26.

### Requirement 16: Score Calculation Integrity

#### Acceptance Criteria

1. FOR ALL Rounds, raw score = `elapsed_time_hundredths + distance² × 8`.
2. FOR ALL Rounds, score ≥ elapsed time.
3. FOR equal elapsed times, smaller Distance → smaller or equal score.
