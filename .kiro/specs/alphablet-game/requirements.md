# Requirements Document

## Introduction

AlphaBlet is a single-player browser-based alphabet placement game. The player is presented with a randomized letter and must place it in the correct slot among 26 blank slots (two rows of 13) as quickly and accurately as possible. The game supports click/tap-to-place on all devices and drag-and-drop on desktop. Three difficulty modes control visual feedback. The game tracks time and accuracy, producing a composite score where lower is better. It runs entirely client-side and is deployable as a static site on GitHub Pages.

## Glossary

- **Game**: The AlphaBlet web application.
- **Letter_Display**: The UI component in the top-right that shows the current letter to place.
- **Slot_Bar**: Two rows of 13 blank slots (A–M top, N–Z bottom) where the player places letters.
- **Slot**: An individual placement target, taller than wide (2:3 aspect ratio).
- **Timer**: Tracks total elapsed time across all rounds in hundredths of a second.
- **Scoreboard**: Displays the running cumulative score, colored to indicate the projected tier.
- **Distance**: Absolute difference between the correct slot index and the placed slot index.
- **Round**: A single letter-placement attempt.
- **Shuffle**: A randomized permutation of the 26 letters determining presentation order.
- **Mode**: Difficulty setting (A Ok, B Careful, C of Trouble) controlling visual feedback and score multiplier.
- **Mode_Multiplier**: Per-round scoring factor: A Ok = 1.0, B Careful = 0.8, C of Trouble = 0.6.
- **Score_Tier**: Rating category (E-Lite, T-Rific, D-Cent, F-Ort) with boundaries scaled by mode.

## Requirements

### Requirement 1: Game Layout

#### Acceptance Criteria

1. THE header SHALL be a 3-column grid: New Game button (left, spanning 3 rows), title + time/score + mode slider (center, 3 rows, centered), letter display (right, spanning 3 rows).
2. THE Slot_Bar SHALL always display as two rows of 13 slots using a CSS grid.
3. THE Slots SHALL be blank (unlabeled) with a 2:3 aspect ratio (taller than wide).
4. THE time and score displays SHALL use fixed-width formatting (min-width 5.5em, right-aligned, tabular-nums) to prevent layout shifts.

### Requirement 2: Letter Randomization

#### Acceptance Criteria

1. WHEN a new game starts, THE Game SHALL generate a Shuffle of all 26 letters.
2. THE Game SHALL present letters one at a time in Shuffle order.
3. THE Shuffle SHALL contain each of the 26 letters exactly once.

### Requirement 3: Interaction — Click/Tap-to-Place

#### Acceptance Criteria

1. WHEN the player clicks or taps a Slot, THE Game SHALL place the current letter in that Slot and proceed to the next Round.
2. THE clicked Slot SHALL display a pop animation (scale to 1.4× for 500ms) as visual confirmation.
3. Click handling SHALL use event delegation on the Slot_Bar (registered once, not per new game) to prevent duplicate placements.

### Requirement 4: Interaction — Drag-and-Drop (Desktop)

#### Acceptance Criteria

1. ON non-touch devices, THE Letter_Display SHALL be draggable.
2. ON touch devices, THE Letter_Display SHALL NOT be draggable (to avoid drag/click conflicts).
3. WHEN dragging, only one Slot SHALL highlight at a time (all others cleared on dragover).
4. All drag-over highlights SHALL be cleared on drop and dragend.
5. THE Slot_Bar SHALL accept drops in gaps between slots by delegating to the nearest slot.

### Requirement 5: Placement Feedback

#### Acceptance Criteria

1. WHEN placed correctly, THE correct Slot SHALL flash green for 1 second.
2. WHEN placed incorrectly, THE correct Slot SHALL flash yellow-to-red (interpolated by distance, clamped at 13) for 1 second.

### Requirement 6: Timer

#### Acceptance Criteria

1. THE per-round timer SHALL reset each round; THE display SHALL show cumulative total time.
2. THE Timer SHALL update at minimum 10 times per second.
3. THE Timer SHALL stop on placement and restart on the next round.

### Requirement 7: Scoring

#### Acceptance Criteria

1. Raw round score = `elapsed_time_hundredths + distance² × 8`.
2. Displayed round score = raw score × Mode_Multiplier at time of placement.
3. THE Scoreboard SHALL display the cumulative displayed score, updated after each round.
4. THE Scoreboard text color SHALL update every timer tick to reflect the projected score tier.

### Requirement 8: Difficulty Modes

#### Acceptance Criteria

1. Three modes via slider: A Ok (0), B Careful (1, default), C of Trouble (2).
2. A Ok: placed letters shown in correct slots. B Careful: correct slots glow light blue. C of Trouble: nothing persists.
3. Mode is recorded per round at placement time; changing mid-game updates visual state but not past scores.

### Requirement 9: Game Completion

#### Acceptance Criteria

1. WHEN all 26 letters are placed, THE Game SHALL show a placement visualization and score bar.
2. Row 1 viz (A–M) SHALL appear above the slots (letters above lines); row 2 viz (N–Z) below (lines then letters).
3. THE slots SHALL animate apart (margin transition 300ms), then viz SHALL fade in (opacity transition 400ms).
4. THE score bar SHALL show four tiers with a marker at the player's score. Marker label shifts left when near the right edge.
5. Tier boundaries SHALL scale by `0.8 / effective_mode_multiplier`.

### Requirement 10: New Game

#### Acceptance Criteria

1. THE New Game button SHALL be in the left column of the header, spanning all 3 rows, with "New" and "Game" on separate lines.
2. WHEN activated, THE Game SHALL reset score, timer, shuffle, slots, and clear any visualization or score bar.

### Requirement 11: Idle State on Load

#### Acceptance Criteria

1. WHEN the page loads, THE Game SHALL display an idle state with no letter and the display not interactive.
2. THE player SHALL click New Game to begin.

### Requirement 12: Responsive Design

#### Acceptance Criteria

1. THE two-row slot layout SHALL be used at all screen sizes.
2. ON screens ≤600px: compact spacing, smaller fonts, smaller letter display and button.
3. THE mode slider SHALL fill the available center column width (max 640px).
4. `touch-action: manipulation` SHALL prevent unwanted zoom/scroll.

### Requirement 13: Static Deployment

#### Acceptance Criteria

1. THE Game SHALL consist exclusively of static assets (HTML, CSS, JavaScript).
2. THE Game SHALL function on GitHub Pages and in modern browsers without plugins.

### Requirement 14: Shuffle Integrity

#### Acceptance Criteria

1. Sorting any Shuffle SHALL produce A through Z. Length SHALL be 26.

### Requirement 15: Score Calculation Integrity

#### Acceptance Criteria

1. Raw score = `elapsed_time_hundredths + distance² × 8`.
2. Score ≥ elapsed time. Smaller distance → smaller or equal score for equal time.
