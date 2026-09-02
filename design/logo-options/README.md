# SitNext logo options — professional set

Six directions drawn on one 40×40 grid with one stroke language. This folder is
a decision aid, not shipped code — delete it once a direction is chosen and
wired into `src/components/layout/logo.tsx`.

Every mark uses `currentColor`, so a single file serves the brand lockup and
both monochrome uses. That is deliberate: **the monochrome test is what
separates a logo from an illustration**, and the mark currently on the site has
never been put through it — it depends on two tones to read.

| # | Name | Idea | Honest weakness |
| --- | --- | --- | --- |
| 01 | Table of Six | A table ring cut into six equal seats | The six segments blur into a plain ring below ~32px |
| 02 | Pin & Table | A map pin whose head is a table — the only mark carrying both halves of the business | Reads as a generic map pin; the concept lives in the name more than the pixels |
| 03 | Place Setting | Plate between fork and knife, from above | Can read as a pause button or a text cursor |
| 04 | The Seat | One chair from above with someone in it | At small sizes it flattens into an arch or a keycap |
| 05 | Monogram S | A constructed letterform | Durable but generic — it says nothing about the business |
| 06 | Six Figures | The current mark, reduced to one colour and a heavier stroke | Still becomes a rosette below ~32px |

Each ships two files:

- `NN-name-mark.svg` — the mark alone, colour inherited, for the header lockup.
- `NN-name-icon.svg` — the same mark on the app tile, for favicons and social cards.

**Recommendation: 03, Place Setting.** It is the only one that is simultaneously
distinctive, unmistakably about eating, and unchanged at 16px in one colour. 02
carries the better idea but draws as a stock pin; 05 is the safe choice and 01
the best fit for the dinner half, but both give something up.
