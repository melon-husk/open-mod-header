## Description

<!-- Describe the changes implemented in this pull request and the rationale behind them. -->

## Type of Change

- [ ] `bugfix` — Fixes an issue
- [ ] `feature` — Adds a new feature
- [ ] `docs` — Documentation updates
- [ ] `refactor` — Code refactoring without functionality changes
- [ ] `chore` — Maintenance tasks

## Verification Checklist

- [ ] Code compiles without errors (`pnpm compile`)
- [ ] Extension builds successfully (`pnpm build`)

### Accessibility & WCAG 2.1 AA Compliance

- [ ] **Keyboard Navigation:** Verified all interactive controls (buttons, switches, tabs, dialogs) are operable via keyboard (`Tab`, `Enter`, `Space`, `Escape`, arrow keys) and include focus trapping where required.
- [ ] **Screen Reader & ARIA Labels:** Verified all form controls, input fields, selects, and icon-only buttons expose explicit accessible names (`aria-label`, `aria-labelledby`, or `<label>`).
- [ ] **Color Contrast:** Verified text and visual controls meet WCAG 2.1 AA minimum contrast ratios (>= 4.5:1 for normal text, >= 3:1 for UI components).
- [ ] **Static Accessibility Linting:** Executed `pnpm lint:a11y` with zero reported accessibility violations.
