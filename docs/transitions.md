# Transitions

From here on, **every state change in the UI must be animated** - hover, focus,
open/close, expand/collapse, selection. Nothing should snap instantly unless
there's a specific reason (e.g. `prefers-reduced-motion`, or a state that must
be perceived as immediate like a drag).

This file exists because we've shipped "instant" UI a few times already
without meaning to - not from skipping `transition-*` classes, but from two
specific, easy-to-repeat mistakes below. Read those before adding a new
animated component.

## The two mistakes that keep causing "abrupt" UI

### 1. `data-open:` / `data-closed:` don't match Radix

Radix primitives (Dialog, Sheet, DropdownMenu, Select, Tooltip, NavigationMenu,
Sidebar) set **`data-state="open"` / `data-state="closed"`** on their content -
never a bare `data-open` or `data-closed` attribute.

```tsx
// ❌ Silently does nothing. Tailwind compiles this to [data-open], which
// never exists on the element. The animate-in/out classes never fire, and
// the whole thing pops open/closed with zero transition.
'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0';

// ✅ Matches the attribute Radix actually renders.
'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0';
```

This bug shipped in `sheet.tsx`, `dialog.tsx`, `dropdown-menu.tsx`,
`select.tsx`, `tooltip.tsx`, `sidebar.tsx`, and `navigation-menu.tsx` at the
same time, because they were all built from the same broken pattern. If you
copy an animated variant from one `ui/*` component to write a new one, grep
the result for `data-open:` / `data-closed:` before shipping it.

Some Radix parts use different state values - e.g. `Tooltip.Content` also has
a `delayed-open` state, `NavigationMenu.Viewport` uses `visible`/`hidden` on
its _indicator_ (not its viewport). Check the actual attribute the specific
primitive renders rather than assuming `open`/`closed` everywhere.

### 2. `slide-in-from-{side}-10` is 40px, not "from off-screen"

In `tw-animate-css`, the numbered slide utilities are spacing multiples, not
percentages:

```
slide-in-from-right-10   →  translateX: 10 * 0.25rem = 40px
slide-in-from-right-full →  translateX: 100%
```

A Sheet/drawer using the `-10` variant will fade in from just 40px away,
which reads as a quick fade with a nudge, not a slide - even once the
`data-[state=]` fix above is in place and the animation is genuinely firing.
For anything that should look like it's sliding in from off-canvas (sheets,
drawers, the mobile sidebar), use the `-full` variant on all four sides:
`slide-in-from-{side}-full` / `slide-out-to-{side}-full`.

Reach for a numbered step (`-10`, `-2`, etc.) only for small "settle into
place" nudges - dropdown menus, popovers, tooltips - where the element is
already basically in its final position and only needs a few pixels of
motion plus a fade.

## Duration and easing

Don't rely on the bare `transition`/`transition-all` default (150ms, no
explicit easing) for anything you want to visibly read as smooth - state it
explicitly. Rough guide, tuned from what's actually in this codebase:

| Motion                                                            | Duration                      | Easing        | Example                                 |
| ----------------------------------------------------------------- | ----------------------------- | ------------- | --------------------------------------- |
| Hover/focus micro-interactions (color, radius, small transforms)  | `duration-300`                | `ease-out`    | `Button` hover roundness                |
| Popovers / dropdowns / tooltips (small, already-in-place)         | `duration-150`–`duration-200` | default       | `DropdownMenuContent`, `TooltipContent` |
| Sheets / drawers (large travel distance, full-width/height slide) | `duration-400`–`duration-450` | `ease-in-out` | `SheetContent`                          |
| Backdrop/overlay fade behind a sheet or dialog                    | `duration-200`                | default       | `SheetOverlay`                          |

Sheets need a longer duration than a dropdown precisely _because_ they now
travel the full `-full` distance (see above) - a 40px nudge can get away with
150ms, a full-width slide at 150ms reads as a snap even though it's
technically animated.

Always pick an explicit `duration-*`/`ease-*` pair rather than leaving it
implicit, so the timing is a deliberate choice next time someone tunes it,
not an accident of whatever Tailwind's default happens to be.
