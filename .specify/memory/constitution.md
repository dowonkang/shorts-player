<!--
Sync Impact Report - Constitution v1.0.0
================================================================================
Version Change: [NEW] → 1.0.0 (Initial ratification)
Ratification Date: 2025-11-27

Modified Principles:
- [NEW] I. Performance Under Stress - Smooth scrolling and crash prevention are non-negotiable
- [NEW] II. Minimal Dependencies - Only hls.js; no frameworks, no heavy libraries
- [NEW] III. Test-First Development (NON-NEGOTIABLE) - TDD mandatory, especially for intersection logic
- [NEW] IV. Web Standards Native - Use Web Components, Intersection Observer, native APIs
- [NEW] V. Simplicity & Resource Efficiency - Minimal controls, aggressive resource cleanup

Added Sections:
- Core Principles (5 principles defined)
- Performance Constraints (specific scroll/intersection requirements)
- Development Workflow (review process, stress testing gates)
- Governance (amendment procedures, versioning)

Removed Sections: N/A (initial version)

Templates Requiring Updates:
- ✅ .specify/templates/plan-template.md - Constitution Check section references principles
- ✅ .specify/templates/spec-template.md - User scenarios align with performance-first principle
- ✅ .specify/templates/tasks-template.md - Test-first tasks structure enforced

Follow-up TODOs: None
================================================================================
-->

# Shorts Player Constitution

## Core Principles

### I. Performance Under Stress (NON-NEGOTIABLE)

The component MUST maintain smooth scrolling performance even during super-fast scrolling:
- Scrolling MUST remain smooth (no janking, no frame drops) regardless of scroll speed
- Component MUST NOT crash under any scrolling scenario (rapid scroll, reverse scroll, scroll spam)
- Intersection calculations MUST be throttled/debounced appropriately
- Resource cleanup (video elements, HLS instances) MUST be aggressive and immediate
- Memory leaks are considered critical bugs

**Rationale**: The primary use case involves users rapidly scrolling through video feeds. Any performance degradation or crash destroys the user experience. Smooth scrolling is the foundation; all features are secondary.

### II. Minimal Dependencies

Dependencies are strictly limited:
- **Allowed**: hls.js (HLS streaming support)
- **Forbidden**: React, Vue, Angular, jQuery, Lodash, or any other general-purpose library
- **Required**: Use native Web APIs exclusively (Web Components, Intersection Observer, native video)
- New dependencies MUST be justified with:
  - Why native APIs are insufficient
  - Bundle size impact analysis
  - Performance impact measurement

**Rationale**: Every dependency adds weight, complexity, and potential performance overhead. For a component focused on scroll performance, native APIs provide maximum control and minimum overhead. hls.js is justified because native HLS support is Safari-only.

### III. Test-First Development (NON-NEGOTIABLE)

All features MUST follow Test-Driven Development:
- Tests written → Tests fail → Then implement → Tests pass
- Red-Green-Refactor cycle strictly enforced
- **Critical test areas**:
  - Intersection Observer logic (play/pause triggers)
  - Resource cleanup (no memory leaks)
  - HLS lifecycle (load, play, dispose)
  - Edge cases (rapid scroll, element removal during playback, DOM mutations)
- Integration tests MUST simulate scroll scenarios
- Performance tests MUST measure scroll frame rate and memory usage

**Rationale**: The intersection logic (play when >50% visible + >50% viewport filled) is complex and error-prone. Resource management in a dynamic scroll environment is critical. Without tests, regressions will cause crashes and performance degradation in production.

### IV. Web Standards Native

The component MUST leverage native web standards:
- **Web Components**: Custom elements, Shadow DOM for encapsulation
- **Intersection Observer API**: For viewport detection (NOT scroll event listeners)
- **Native `<video>` element**: For playback (hls.js augments but doesn't replace)
- **requestAnimationFrame**: For any visual updates requiring animation frame timing
- **ResizeObserver**: For responsive behavior if needed
- NO framework-specific patterns (virtual DOM, reactive state, component lifecycle wrappers)

**Rationale**: Native APIs are optimized by browser engines and provide the best performance. Intersection Observer is specifically designed for scroll-based visibility detection with built-in performance optimizations. Fighting web standards creates unnecessary complexity.

### V. Simplicity & Resource Efficiency

Keep the component minimal:
- **Single control**: Play button only (no seek bar, volume, fullscreen, etc.)
- **Aggressive cleanup**: Dispose video resources immediately when out of view
- **No state management libraries**: Use native properties and attributes
- **No build complexity**: Plain JavaScript that works without heavy transpilation
- **Clear lifecycle**: `connectedCallback` → observe → play/pause → `disconnectedCallback` → cleanup

**Rationale**: Complexity compounds in scroll scenarios where many instances may exist simultaneously. A minimal surface area reduces bugs, improves performance, and makes the component easier to debug and maintain.

## Performance Constraints

These are NON-NEGOTIABLE requirements:

### Scrolling Performance
- **Frame Rate**: 60fps maintained during fast scrolling (measure with Chrome DevTools Performance)
- **Jank Budget**: Zero layout thrashing; batch DOM reads/writes
- **Event Throttling**: Intersection Observer callbacks MUST be efficient (<16ms execution time)
- **Passive Listeners**: All event listeners MUST use `passive: true` where applicable

### Viewport Intersection Rules
Auto-play triggers when BOTH conditions are met:
1. **>50% of video player area** is visible in viewport (Intersection Observer threshold: 0.5)
2. **>50% of viewport height** is occupied by the video player

Auto-pause triggers when either condition fails.

### Resource Management
- **Video Element Lifecycle**: Create on intersection start, destroy on intersection end
- **HLS.js Lifecycle**: `attachMedia` → `loadSource` → `destroy` (never leave instances attached)
- **Memory Budget**: No leaks detectable in Chrome DevTools Memory profiler after 100+ scroll cycles
- **Lazy Loading**: Video elements only created when potentially visible (not all instances eagerly)

### Crash Prevention
Component MUST handle:
- Rapid scrolling (scroll wheel spam, gesture fling)
- DOM mutations while playing (element removed, parent changed)
- Network failures (HLS load errors, stream interruptions)
- Multiple instances on same page (no shared state conflicts)
- Edge cases: 0-height elements, display:none, visibility:hidden

## Development Workflow

### Code Review Requirements
- All PRs MUST verify Core Principles compliance
- Performance impact MUST be measured:
  - Chrome DevTools Performance recording with fast scroll
  - Memory heap snapshot before/after scroll cycles
  - Frame rate analysis (no drops below 60fps)
- TDD compliance MUST be verified (tests written first, commit history as evidence)
- Crash scenarios MUST be tested (rapid scroll test suite)

### Quality Gates
- **No merge without passing tests**: Unit, integration, stress tests
- **No merge if performance regression**: Frame rate, memory, intersection timing
- **No merge if crash detected**: Stress test suite must pass
- **No merge if new dependency**: Without explicit constitution amendment

### Testing Requirements
- **Unit Tests**: Intersection logic, HLS lifecycle, resource cleanup
- **Integration Tests**: Complete playback cycle (load → play → pause → cleanup)
- **Stress Tests**:
  - Rapid scroll simulation (100+ elements scrolled in <5 seconds)
  - Memory leak detection (heap size stable after 100 scroll cycles)
  - Concurrent playback (multiple instances visible simultaneously)
- **Browser Tests**: Chrome, Firefox, Safari (hls.js native HLS fallback)

### Performance Testing Tools
Required for all performance-related PRs:
- Chrome DevTools Performance profiler (frame rate, layout thrashing)
- Chrome DevTools Memory profiler (heap snapshots, allocation timeline)
- Lighthouse (performance score, no regressions)
- Manual testing: Trackpad fast scroll, mouse wheel spam

## Development Constraints

### Forbidden Patterns
These patterns are BANNED due to performance implications:
- ❌ `scroll` event listeners (use Intersection Observer only)
- ❌ Synchronous layout reads in loops (causes layout thrashing)
- ❌ Keeping video elements in DOM when not visible
- ❌ Global state or singleton patterns across instances
- ❌ Heavy computation in intersection callbacks

### Required Patterns
These patterns are MANDATORY:
- ✅ Intersection Observer with threshold 0.5
- ✅ `passive: true` on all touch/wheel listeners
- ✅ `requestAnimationFrame` for visual updates
- ✅ Explicit `hls.destroy()` on cleanup
- ✅ WeakMap for instance-specific state (no memory leaks)

## Governance

### Amendment Procedure
1. Propose changes via PR to `.specify/memory/constitution.md`
2. Document rationale and performance impact analysis
3. Update version according to semantic versioning (see below)
4. Update all dependent templates (plan, spec, tasks, commands)
5. Obtain approval from project maintainers
6. Include migration plan if changes affect existing code

### Versioning Policy
- **MAJOR** (X.0.0): Backward-incompatible governance changes (e.g., allowing new dependencies, removing TDD requirement)
- **MINOR** (1.X.0): New principle added, materially expanded guidance, new mandatory sections
- **PATCH** (1.0.X): Clarifications, wording improvements, typo fixes, non-semantic refinements

### Compliance Review
- Constitution compliance MUST be checked during code review
- Performance violations MUST be measured and documented
- Complexity additions MUST be justified in Complexity Tracking section of `plan.md`
- Repeated violations trigger architecture review

### Runtime Development Guidance
For active development sessions, developers should refer to:
- This constitution for non-negotiable principles and performance constraints
- User stories in `specs/[feature]/spec.md` for requirements
- Implementation plan in `specs/[feature]/plan.md` for technical approach
- Task list in `specs/[feature]/tasks.md` for execution sequence

**Version**: 1.0.0 | **Ratified**: 2025-11-27 | **Last Amended**: 2025-11-27
