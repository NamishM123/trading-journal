# Trading Journal

A Next.js App Router trading journal. Dark space theme with a galaxy background from `src/components/GalaxyKit.jsx`.

## Copy And Writing Rules

These rules apply to every piece of user visible text in the app. UI copy, titles, labels, buttons, hints, placeholders, error messages, and any new page content.

1. Never use em dashes. Rewrite the sentence with a comma, a period, or the word "and" or "or" instead.
2. Never use colons in copy. Rewrite as a full sentence instead.
3. Never use semicolons in copy. Split into two sentences instead.
4. Capitalize the first letter of every word in every title, heading, label, and button. For example "Trade Details", "Win Rate", "New Recap", "Log Out".

## Design Rules

1. Use the Apple system font stack for all text. Do not add Google Fonts or any external font. The stack lives in `src/app/globals.css` as `--font-sans` and `--font-mono`.
2. No decorative squares, dots, or bullets next to titles.
3. No logo mark. The brand is the plain text "Don't Be A Monkey" and the header title always stays on one line.
4. Titles are large and use normal case. Never style titles or labels as all uppercase.
5. Every button is the same size. Pill shape, `px-5 py-2.5 text-base font-semibold rounded-full`, via the shared `Button` component in `src/components/ui.tsx`. Links styled as buttons match it exactly.
6. All circular icon buttons are the same size, `h-9 w-9`.
7. Everything on a page lives inside the standard `Card` container from `src/components/ui.tsx`. No one-off container styles.
8. Content inside a container must never overlap or collide. When space runs out, stack vertically and skip a line instead. Form grids collapse to one column on phones. Badges truncate long text on one line instead of wrapping into tall bubbles.
9. Progress bars are thick, `h-4`, with rounded ends.
10. No native `details` markers. Summary toggles hide the triangle with `list-none [&::-webkit-details-marker]:hidden`.
11. The header is two rows on phones. Brand plus the New Recap button on top, nav links with Log Out below. One row on desktop.
12. The page must never scroll horizontally. `html, body` use `overflow-x: clip`, cards use `overflow: hidden`, and wide content scrolls inside its own `overflow-x-auto` wrapper.
13. Titles stand alone. No hint text, descriptions, or subheadings under any title or heading. `SectionTitle` has no hint prop.
14. No page header cards that only repeat the page name. The nav already shows where you are.
15. Exactly three font sizes exist. `text-2xl` for every title, heading, and hero number. `text-base` for all body text, buttons, chips, badges, inputs, and labels. `text-sm` for meta text like dates, captions, and calendar cells. Never use any other size class. Weight and color create hierarchy, not new sizes.
16. Filter chips and count badges share one pill size, `px-4 py-2 text-base`.
17. Day grades read "A Day", "B Day", "C Day", never "Day A".
18. On phones the header has no visible Log Out. Double tapping the brand reveals it. Desktop shows the Log Out button normally.
19. Save actions never show a blank error page. Database failures return `{ error }` with the real message and render inside the form.
20. No emojis anywhere in the UI.
21. Stats breakdown rows always show the full detail line, trades, wins and losses record, win rate, avg R, and dollars per trade, plus a thin comparison bar.
