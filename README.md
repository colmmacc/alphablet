# Alphablet

A fast-paced alphabet placement game. Place randomized letters into their correct slot — the faster and more accurate you are, the better your score. Works on desktop and mobile. Built as a zero-dependency static web app for GitHub Pages.

## How to Play

1. Click **New Game** to start. A random letter appears in the top-right corner.
2. Click or tap any of the 26 blank slots (arranged in two rows: A–M, N–Z) to place the letter there.
3. The letter snaps to its correct slot with color feedback:
   - **Green** = correct placement
   - **Yellow → Red** = incorrect, with intensity showing how far off you were
4. The clicked slot pops briefly to confirm your selection.
5. Place all 26 letters. Lower score is better.

On desktop you can also drag the letter to a slot.

## Layout

The header is a 3-column grid:
- **Left**: New Game button (spans full height)
- **Center**: title, time/score, and mode slider (3 rows, all centered)
- **Right**: current letter display (spans full height)

Slots are always displayed in two rows of 13 (A–M on top, N–Z below), with a 2:3 aspect ratio.

## Difficulty Modes

Use the slider to choose your difficulty. The mode is locked in per letter at the moment you place it, so you can switch mid-game.

| Mode | What you see | Score multiplier |
|------|-------------|-----------------|
| **A Ok** | Placed letters shown in their correct slots | 1.0× (full score) |
| **B Careful** (default) | Correct slots glow light blue, no letters shown | 0.8× |
| **C of Trouble** | Nothing shown after the feedback flash | 0.6× |

## Scoring

Each letter's score is calculated as:

```
round_score = time_in_hundredths + distance² × 8
```

- **Time**: how long you took to place the letter (in hundredths of a second)
- **Distance**: how many slots away from the correct position you placed it (0 = correct)
- The distance penalty is quadratic — being far off hurts much more than being close
- Speed alone can't save you from bad accuracy

The displayed score applies the mode multiplier per round: `sum(round_score × mode_multiplier)`.

### Tier Ratings

At game end, a score bar shows your tier. Boundaries are calibrated for B Careful mode and scale by difficulty:

| Tier | A Ok | B Careful | C of Trouble |
|------|------|-----------|--------------|
| **E-Lite** | 0–1,600 | 0–2,000 | 0–2,667 |
| **T-Rific** | 1,600–3,200 | 2,000–4,000 | 2,667–5,333 |
| **D-Cent** | 3,200–4,800 | 4,000–6,000 | 5,333–8,000 |
| **F-Ort** | 4,800–6,400 | 6,000–8,000 | 8,000–10,667 |

The running score changes color in real time to show which tier you're trending toward.

## Game-Over Visualization

When the game ends, a placement visualization fades in around the slots. Row 1 (A–M) letters appear above the top row with lines going up; row 2 (N–Z) letters appear below with lines going down. Line length is proportional to placement time (normalized to the slowest letter). Colors match the feedback for each placement's accuracy. The slots animate apart to make room before the viz fades in.

A score bar below shows your final tier with a marker at your score position.

## Tech Stack

- Pure HTML, CSS, and JavaScript — no build step, no dependencies
- Property-based tests with [fast-check](https://github.com/dubzzz/fast-check) and [vitest](https://vitest.dev/)
- Deployable as a static site on GitHub Pages

## Development

```bash
# Play locally
open index.html

# Run tests
npm install
npm test
```

## Deployment

Push to GitHub and enable GitHub Pages in Settings → Pages → Deploy from branch (main, root). The game will be served at `https://<username>.github.io/<repo-name>/`.

## License

See [LICENSE](LICENSE) for details.
