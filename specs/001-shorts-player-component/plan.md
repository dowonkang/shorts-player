# Implementation Plan: Shorts Player Web Component

**Branch**: `001-shorts-player-component` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-shorts-player-component/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a native Web Component (`<shorts-player>`) for auto-playing short-form videos triggered by scroll position. The component uses Intersection Observer API to detect when >50% of the player is visible AND occupies >50% of viewport height, then auto-plays the video. It supports HLS streaming via hls.js (Chrome/Firefox) with native fallback (Safari), maintains 60fps scrolling performance even during rapid scrolling, displays grey gradient skeleton UI to prevent whiteout pages, and aggressively cleans up video resources when out of viewport. No playback controls are included—interaction is purely scroll-based.

## Technical Context

**Language/Version**: JavaScript (ES2020+)
**Primary Dependencies**: hls.js (HLS streaming for non-Safari browsers)
**Storage**: N/A (client-side component, no persistence)
**Testing**: Playwright (component testing with browser automation)
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
**Project Type**: Web (single web component library)
**Performance Goals**: 60fps scrolling, <16ms Intersection Observer callbacks, <200ms video auto-play trigger, <100ms video auto-pause trigger
**Constraints**: <50KB bundle size (excluding hls.js), no memory leaks after 100+ scroll cycles, zero frame drops during rapid scrolling
**Scale/Scope**: Support 100+ simultaneous instances per page without performance degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Performance Under Stress (NON-NEGOTIABLE)
**Status**: ✅ PASS
**Rationale**: This feature IS the performance-under-stress requirement. The spec explicitly mandates 60fps scrolling, <16ms callbacks, aggressive resource cleanup, and crash prevention. All success criteria (SC-001 through SC-010) are performance-focused.

### Principle II: Minimal Dependencies
**Status**: ✅ PASS
**Rationale**: Only dependency is hls.js (explicitly allowed by constitution). No frameworks, no libraries. Native Web Components, Intersection Observer, and native `<video>` element only.

### Principle III: Test-First Development (NON-NEGOTIABLE)
**Status**: ✅ PASS (Enforced via workflow)
**Rationale**: Implementation MUST follow TDD with Playwright. Tests for intersection logic, HLS lifecycle, resource cleanup, and stress scenarios (rapid scroll, 100+ instances) must be written BEFORE implementation. Phase 2 tasks will enforce Red-Green-Refactor cycle.

### Principle IV: Web Standards Native
**Status**: ✅ PASS
**Rationale**: Spec mandates Web Components (FR-001), Intersection Observer API (FR-004), and passive event listeners (FR-014). No framework-specific patterns allowed.

### Principle V: Simplicity & Resource Efficiency
**Status**: ✅ PASS
**Rationale**: Spec explicitly states "no controls" (FR-007), aggressive resource cleanup (FR-011), and minimal API surface. Component is single-purpose: scroll-triggered auto-play only.

### Performance Constraints Compliance
**Status**: ✅ PASS
**Rationale**:
- Scrolling Performance: 60fps requirement (PR-001, SC-001)
- Viewport Intersection Rules: >50% visible AND >50% viewport height (FR-002, FR-003)
- Resource Management: Video element + HLS lifecycle cleanup on viewport exit (FR-011, PR-004)
- Crash Prevention: Stress testing for 100+ instances, rapid scroll, edge cases (FR-013, SC-007)

### Overall Gate Status: ✅ PROCEED TO PHASE 0

No violations. No complexity justifications needed.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── shorts-player.js          # Main Web Component definition
├── shorts-player.css         # Global styles (skeleton gradient, FOUC prevention)
├── intersection-manager.js   # Intersection Observer singleton logic
└── video-pool.js            # Video element pooling singleton

tests/
├── unit/
│   ├── shared-template.spec.js
│   ├── intersection-manager.spec.js
│   ├── video-pool.spec.js
│   └── shorts-player.spec.js
├── integration/
│   ├── auto-play.spec.js
│   ├── hls-chrome.spec.js
│   ├── hls-firefox.spec.js
│   └── hls-safari.spec.js
└── stress/
    ├── rapid-scroll.spec.js
    ├── memory-leak.spec.js
    └── 100-instances.spec.js

examples/
├── basic.html               # Single instance demo
├── scroll-feed.html         # Multiple instances scroll demo
└── hls-demo.html           # HLS streaming demo

dist/                        # Build output (bundled component)
└── shorts-player.min.js
```

**Structure Decision**: Single project structure chosen. This is a standalone web component library with no backend or mobile components. The `src/` directory contains the modular component logic, `tests/` separates unit/integration/stress tests as mandated by constitution (TDD requirement), and `examples/` provides demo pages for manual testing and documentation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations detected. All complexity is justified by core requirements.

---

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design artifacts (research.md, data-model.md, contracts/)*

### Principle I: Performance Under Stress (NON-NEGOTIABLE)
**Status**: ✅ PASS
**Design Verification**:
- Light DOM architecture confirmed (research.md: 2x faster than Shadow DOM)
- Single shared IntersectionObserver pattern (data-model.md)
- Video object pooling with 3-5 max instances (data-model.md)
- Aggressive cleanup with 200ms grace period (data-model.md)
- Static skeleton (no animation overhead) (research.md)
- No skeleton element, just host background CSS (data-model.md: zero DOM overhead)
- All performance budgets maintained in design

### Principle II: Minimal Dependencies
**Status**: ✅ PASS
**Design Verification**:
- Only dependency: hls.js (explicitly allowed by constitution)
- No framework dependencies confirmed (research.md: native Web Components)
- Light DOM eliminates Shadow DOM polyfill needs
- All patterns use native Web APIs

### Principle III: Test-First Development (NON-NEGOTIABLE)
**Status**: ✅ PASS (Workflow Ready)
**Design Verification**:
- Testing framework selected: Playwright (research.md)
- Test patterns documented for all critical paths (research.md: memory, FPS, intersection timing)
- TDD enforcement deferred to Phase 2 (tasks.md generation)
- No code written yet, so TDD compliance pending implementation phase

### Principle IV: Web Standards Native
**Status**: ✅ PASS
**Design Verification**:
- Web Components (Custom Elements) API used (contracts/component-api.md)
- Intersection Observer for visibility detection (data-model.md)
- Scroll event listeners forbidden and not used (research.md)
- Passive event listeners specified (research.md)
- AbortController for event cleanup (research.md)
- requestAnimationFrame for visual updates (research.md)

### Principle V: Simplicity & Resource Efficiency
**Status**: ✅ PASS
**Design Verification**:
- No controls in component (contracts/component-api.md: play/pause for external use only)
- Minimal API surface (contracts/component-api.md: 3 attributes, 5 properties, 3 methods)
- Aggressive resource cleanup (data-model.md: cleanup checklist)
- Light DOM simpler than Shadow DOM (research.md)
- Host element serves as skeleton (data-model.md: no extra DOM element)

### Performance Constraints Compliance
**Status**: ✅ PASS
**Design Verification**:
- Scrolling Performance: Light DOM + shared observer + no animation (research.md)
- Viewport Intersection Rules: Corrected OR logic documented (data-model.md: >50% visible OR (larger AND >50% viewport))
- Resource Management: Pooling + aggressive cleanup patterns (data-model.md)
- Crash Prevention: Error handling in all layers (contracts/component-api.md: error events)

### Overall Gate Status: ✅ APPROVED FOR PHASE 2

Design artifacts comply with all constitutional requirements. Ready to proceed to task generation (/speckit.tasks).
