# SitNext logo options — built from the business model

SitNext is two products in one: a **review directory** (find a place, trust the
rating) and a **dinner club** (six strangers, one table, every Wednesday). Each
mark below is judged on whether it says something true about that, not on
whether it looks nice.

This folder is a decision aid, not shipped code — delete it once a direction is
chosen and wired into `src/components/layout/logo.tsx`.

| # | Name | The argument | Honest weakness |
| --- | --- | --- | --- |
| 01 | The Overlap | Two circles — places, and people. The business is the overlap, and the overlap is the only part filled in. | Can read as an eclipse or a generic Venn |
| 02 | Rated Table | The rating star every directory lives on, with a table cut out of the middle. | The cut-out closes below ~32px and it becomes a plain star |
| 03 | Word of Mouth | A review is someone talking. The bubble is the directory; the six dots are the table it seats you at. | The dots muddy into a smear at 16px |
| 04 | Wednesday | The product has a heartbeat: one table, every Wednesday. | Holds at every size, but a calendar icon says "scheduling app" |
| 05 | Plate & Pin | A pin whose head is a plate — a place on a map, and what is on the table when you arrive. | Still reads first as a stock map pin |
| 06 | Verified Seat | A seat with a tick. Both halves rest on one promise: the review is honest and the seat is really yours. | The chair loses to the tick; it reads as a checkbox |

Every mark uses `currentColor` and, where it has a hole, `fill-rule="evenodd"`
rather than a shape painted in the background colour. That matters: a knockout
filled with the page colour stops being a logo the moment it lands on a
surface you did not anticipate — a partner's press page, a printed receipt.
These are genuinely one colour on any background.

Each ships two files:

- `NN-name-mark.svg` — the mark alone, colour inherited, for the header lockup.
- `NN-name-icon.svg` — the same mark on the app tile, for favicons and social cards.

**Recommendation: 01, The Overlap.** It is the only one whose *idea* survives
at 16px in a single colour — the others either lose the concept when they
shrink (02, 03) or keep the shape while saying something generic (04, 05, 06).
