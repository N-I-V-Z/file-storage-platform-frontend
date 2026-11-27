# UI refresh plan

## Goal

Polish the existing Vietnamese file-storage UI across the landing page, authentication, workspace, file explorer, API keys, audit, and admin reports. Preserve current routes, API behavior, and the `UX-CONTRACT.md` interaction rules.

## Direction

Use the existing “quiet file index” identity from `DESIGN.md`: crisp navy text, purposeful blue for actions, restrained white surfaces, and monospace metadata. Make hierarchy visible through layout and type rather than more decorative cards. Keep labels and feedback direct.

## Steps

1. Consolidate color, spacing, type, focus, and component state tokens in the global stylesheet. Improve the landing and authentication surfaces.
2. Refine dashboard navigation, project rail, usage, explorer, upload, trash, and API-key surfaces with one shared visual rhythm. Retain all existing actions and state messages.
3. Bring audit and admin tables into the same system; ensure narrow layouts scroll without clipped controls.
4. Check responsive breakpoints, keyboard focus, contrast, and reduced motion. Run format, lint, typecheck, tests, and build. Commit each coherent UI area separately.

## Constraints

- No backend changes, new dependencies, or changes to API contracts.
- Avoid hiding an action on mobile; all controls remain reachable at 375px.
- Current protected content stays hidden during authentication checks.
