# Mobile board spacing — 14 October 2026

The board selector and options menu occupy the first row; Archive board and New task occupy the second. Controls have consistent 44 px heights and 10 px gaps. The selector's chevron stays inside its border; long names truncate within the selector. Search and Filters share a 44 px row, with the count below. Desktop styles and planner operations are unchanged. CSS version 58 invalidates the previous cached stylesheet.

Checked in Chrome at simulated 320 and 414 px phone widths: no document horizontal overflow, all control bounds within the viewport, consistent heights and aligned rows. The board selector opens, accepts a long name and returns to My Life. These are browser simulations, not physical iPhone tests. Screenshot evidence is stored locally in outputs/mobile-board-spacing.png. Rollback checkpoint: GitHub master 7890d85cc0c686df71656b4ea964256ea89a0a48.
