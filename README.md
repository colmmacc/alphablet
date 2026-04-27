# Alphablet

A fast-paced alphabet placement game. Place randomized letters into their correct slot — the faster and more accurate you are, the better your score. Works on desktop (drag-and-drop) and mobile (tap-to-place). Built as a zero-dependency static web app for GitHub Pages.

## How to Play

1. Click **New Game** to start. A random letter appears in the display area.
2. Place it where you think it belongs among the 26 blank slots:
   - **Desktop**: drag the letter to a slot
   - **Mobile**: tap the letter to select it (it glows), then tap a slot to place it
3. The letter snaps to its correct slot with color feedback:
   - **Green** = correct placement
   - **Yellow → Red** = incorrect, with intensity showing how far off you were
4. Place all 26 letters. Lower score is better.

## Difficulty Modes

Use the slider at the top to choose your difficulty. The mode is locked in per letter at the moment you place it, so you can switch mid-game.

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

When the game ends, a placement visualization fades in showing where you placed each letter. Each letter appears connected to its drop slot by a line whose length is proportional to how long that letter took (normalized to the slowest). Colors match the feedback for that placement's accuracy.

On mobile (two-row layout), row 1 (A–M) visualization appears above the slots with lines going up, and row 2 (N–Z) appears below with lines going down. The slots animate apart to make room before the viz fades in.

## Mobile Support

- **Tap-to-place**: tap the letter to select it, then tap a slot — works alongside drag-and-drop on desktop
- **Two-row slot layout**: on screens ≤600px, slots split into A–M / N–Z rows for larger touch targets
- **Larger slider thumb**: 24px for easy touch interaction
- **Compact layout**: reduced padding, font sizes, and spacing on narrow screens

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
