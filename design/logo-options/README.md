# SitNext logo options

Six directions for the SitNext mark, drawn on one 40×40 grid with matching
stroke weights so they differ on idea rather than on accidental size. This
folder is a decision aid, not shipped code — delete it once a direction is
chosen and wired into `src/components/layout/logo.tsx`.

| # | Name | Idea | Smallest usable size |
| --- | --- | --- | --- |
| 01 | Open Seat | A round table, five seats taken, one still open. Currently shipped. | 32px — needs the simplified `public/icon-16.svg` below that |
| 02 | The Chair | A seat head-on: backrest, green cushion, two legs. | 32px — the legs close up below that |
| 03 | Dot Above | The *i* of "Sit", and a seated figure. The wordmark carries the idea. | 16px |
| 04 | Two Arcs | Two sides of a table with a gap, and someone in the gap. | 16px |
| 05 | The Bench | Three seats taken, a clear gap, then the one waiting for you. | 32px — the gap closes at 16 |
| 06 | Geometric S | A single-letter monogram. The most conventional, the most robust. | 16px |

Each option ships two files:

- `NN-name-mark.svg` — the mark alone on a transparent ground, for the header
  lockup next to the wordmark.
- `NN-name-icon.svg` — the same mark on the app-icon tile, for favicons, PWA
  icons and social cards.

Colours are the palette tokens: `#A855F7` orchid for the structure, `#4ADE64`
parrot for the open seat, on the `#1D1433` → `#0A0711` noir tile. The one green
element is always the seat being offered — that is the constant across all six.

Options 01, 02 and 05 lose detail at favicon size and need a simplified 16px
variant, the way the shipped mark has `public/icon-16.svg`. Options 03, 04 and
06 do not.
