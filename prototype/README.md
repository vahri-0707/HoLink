# HoLink Page Editor prototype

Live preview: **http://localhost:5173**. Requires Node.js 20+; no package installation or build step. The QR encoder is vendored locally with its MIT license.

Hosted prototype: [vahri-0707.github.io/HoLink](https://vahri-0707.github.io/HoLink/). `npm run build:pages` creates the static `dist/` directory for GitHub Pages; the workflow at `../.github/workflows/deploy-pages.yml` deploys it automatically from `main`. Static output disables development live reload, resolves assets relative to the deployed app, and preserves canonical saved asset paths.

The searchable **15-type block catalogue**, mixed-content examples, solid primary buttons, component organization, and current verification are documented in [BLOCKS.md](./BLOCKS.md).

```sh
cd /Users/vahrimaulana/Documents/ChatGPT/HoLink/prototype
npm run dev
```

## Navigation and brand

The collapsed navigation is 72 px wide. Expanded navigation is a **272 px floating drawer**, with an 8 px viewport inset, 16 px radius, and dimmed backdrop. It keeps the editor’s position and width. The toggle, Escape, and clicking the backdrop close it and restore focus. Keyboard focus stays inside the open drawer.

Menu, Tools, and Help follow the supplied references. Help opens Editor guide and Setup checklist directly beneath its row. The checklist updates from the actual page and preview state. The redundant “My HoLink” heading is removed; the original logo and HoLink wordmark remain.

Both collapsed header dividers end at exactly **y = 72**. Their padding is horizontal so the 40 px toggle plus padding and border cannot accidentally create a 73 px header.

## Icon system

All 94 local SVGs were retrieved through **better-icons**: 47 matched Phosphor Regular / Fill pairs, kept identical in the prototype and Figma asset folders.

| Surface | Default | Selected |
| --- | --- | --- |
| Sidebar | Regular outline | Fill |
| Header | Regular outline | Fill |
| Page Settings | Regular outline | Fill |
| Blocks and Collection preview | Regular outline | Regular outline |
| Stack / Grid | Regular outline | Regular outline |

Regular uses one consistent source weight: 16 units on a 256-unit grid, equivalent to 1.5 at 24 px. Phosphor encodes outlines as path geometry. Do not mix Thin, Light, or Bold into outline states. Block selection uses its border, background, text color, and native checkbox instead of a filled glyph.

Icons inherit semantic color through CSS masks. Sizes follow the 16 / 20 / 24 px hierarchy, with 18 px optical sizes beside regular text and a 14 px checkbox check. Interactive icon targets are 40 × 40 px.

```sh
# Requested skill command, executed and read in full
npx skills use "https://github.com/better-auth/better-icons" --skill "better-icons"

# Regenerate and validate all shared SVGs
node scripts/sync-icons.mjs
npm run check:icons
```

Source IDs are recorded in `assets/icons/manifest.json` and `src/icons.js`. Both asset directories include the Phosphor MIT license. HoLink branding and original evidence screenshots are preserved.

## Main flow

1. Choose **Add to Collection** in Portfolio or its properties.
2. Search by title/domain and select existing blocks; filtering preserves selection.
3. Choose **Move**. The list and preview update together without duplication.
4. Choose **Undo**, or Cmd/Ctrl+Z, to restore the original grouping and order.

Cancel or Escape discards staged selection. Opening and closing navigation preserves it. New links can be added directly to a Collection. Other interactions include Collection creation/rename, Stack/Grid, title visibility, link editing, bulk move, action menus, drag or Alt+Arrow reordering, and Edit/Preview modes.

Page edits persist locally. Support / Editor guide includes **Reset demo**, which is undoable. The floating navigation starts closed on reload.

## Atomic organization

| Level | Source | Responsibility |
| --- | --- | --- |
| Foundations | `styles/tokens.css` | HoLink palette, spacing, radii, typography, elevation and dimensions |
| Atoms | `src/components.js`, `src/icons.js` | Buttons, icons, fields, badges and native controls |
| Molecules | `src/components.js` | Block/candidate rows, links, tabs and layout choices |
| Organisms | `src/navigation.js`, `src/app.js` | Drawer, checklist, Collection, list, preview and inspector |
| Template | `styles/app.css`, `styles/navigation.css` | Three-panel and compact editor states |
| Data | `src/model.js` | Immutable moves, ownership, ordering, validation and history |

Figma keeps Refinement, Foundations, and Components pages: **90 variables, 9 text styles, 149 main components, and 17 component sets**. Navigation has Collapsed / Expanded variants; layout choices have Stack / Grid × Default / Selected variants. Navigation and Page Settings expose separate outline / filled icon slots. Main components use Auto Layout; imported SVG artwork remains editable vector geometry.

## Verification

```sh
npm run check:icons
npm test
npm run check
```

All **16 tests** (13 model and 3 static-deployment tests), JavaScript syntax checks, and **94 SVG checks** pass. Tests cover all 15 content types, mixed moves, stable order, duplicate prevention, Undo/Redo, provider and URL validation, the 20-block limit, preservation of saved content during the v1 upgrade, project-path assets, and the packaged static site.

Browser checks cover Move/Undo, retained selection across drawer open/close, header and Page Settings filled states, outlined selected block icons, Help hierarchy, focus trapping, Escape/backdrop dismissal, and unchanged editor geometry. At 654 × 722 there is no horizontal page overflow; the drawer is x = 8, y = 8, width = 272.

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | Local Manrope, forms, labels, grid and navigation states | Consistent hierarchy |
| Surfaces | Measured divider, drawer and card bounds | Shared insets and aligned borders |
| Animations | Transition properties, keyboard/reduced-motion CSS | Instant frequent actions; restrained press feedback |
| Icons | Manifest, every SVG and rendered state metadata | One family; Fill limited to the requested contexts |
| Performance | Local assets, dependency-free runtime, console | No third-party icon requests or layout animations |

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| Medium | Navigation CSS | Expanded sidebar resized the editor | Floating drawer with backdrop | Preserves context and matches the reference |
| Medium | Header rows | Padding plus border produced a 1 px mismatch | Fixed 72 px border-box rows | Continuous divider |
| Medium | Icon consumers | Fill across selected block/layout controls | Fill only in sidebar, header, Page Settings | Follows the revised rule |
| Low | Header | Duplicate My HoLink title | One HoLink brand mark | Clearer hierarchy |
| Low | Icon assets | Mixed geometry and small glyphs | Verified Regular / Fill pairs | Consistent visual weight |
| Medium | Help | Child links could survive collapse | Children follow Help and hide when collapsed | Correct hierarchy and no overflow |
| Medium | Collection | Extra row indentation | Shared full-width rows and Add action | Straight card edges |
| Medium | Audience Preview | Collection links retained the Edit selection inset | Stack cards share both edges and a 12 px gap | Consistent reading and tap targets |
| Medium | Scroll containers | Scrollbars changed insets | Stable gutter with measured compensation | Fields and actions stay aligned |

Preview alignment was checked in the desktop canvas and the compact Preview dialog: all four stack cards are 290 px wide, share identical left/right edges, and have 12 px gaps. The Edit selection frame retains its 8 px inset. Captures: `screenshots/05-preview-alignment.jpg` and `screenshots/06-compact-preview-alignment.jpg`.

Rejected: replacing the brand palette, stronger preview-card shadows, and animated selection. They add noise or inconsistency.

Verdict: **Approve for this desktop prototype.** Not verified: physical touch devices, a complete mobile interface, screen-reader use, performance profiling, or slow-motion recording of press feedback.

## Figma and assets

- [Editor states](https://www.figma.com/design/mLcMwe2h5guYPYIuYbIBbc/Untitled?node-id=10-4679)
- [Navigation variants](https://www.figma.com/design/mLcMwe2h5guYPYIuYbIBbc/Untitled?node-id=14-7585)
- Original HoLink logo/gradient and the documented Manrope substitute for Aeonik are preserved.
- Figma refinements: `../figma-design/migrate-icon-family.js`, `navigation-refinement.js`, `finish-icon-policy.js`.
- Browser captures: `screenshots/`. Figma PNGs: `../figma-design/exports/`.

Analytics, SEO, QR, Business Card, Billing, Settings and Invite remain contextual references outside this focused editor prototype.
