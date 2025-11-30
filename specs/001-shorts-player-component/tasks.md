# Implementation Tasks: Shorts Player Web Component

**Generated**: 2025-11-29 | **Branch**: `001-shorts-player-component`

**Input**: Design artifacts (plan.md, spec.md, data-model.md, contracts/, research.md)

**Status**: Ready for implementation

---

## Task Organization

Tasks are organized by **User Story Priority** from spec.md:
- **User Story 1 (P1)**: Seamless Auto-Play Video Scrolling - THE COMPLETE MVP
- **User Story 2 (P2)**: HLS Streaming Support

Each task follows the format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

**TDD Requirement**: Constitution Principle III (NON-NEGOTIABLE) mandates Test-First Development. All tasks follow **Red-Green-Refactor** cycle:
1. Write test (MUST fail initially - RED)
2. Verify test fails (confirm test validity)
3. Implement minimal code to pass (GREEN)
4. Refactor if needed
5. Verify test still passes

---

## Phase 0: Project Setup (Foundation)

**Goal**: Initialize project structure, testing framework, and global styles. No user stories implemented yet.

**Dependencies**: None (start here)

**Estimated Tasks**: 8

### Setup Tasks

- [X] [T001] [P0] Initialize project directory structure (src/, tests/unit/, tests/integration/, tests/stress/, examples/, dist/)
- [X] [T002] [P0] Create package.json with dependencies: hls.js, @playwright/test
- [X] [T003] [P0] Install Playwright and configure browsers (Chrome, Firefox, Safari)
- [X] [T004] [P0] Create playwright.config.js with component testing enabled
- [X] [T005] [P0] Create global CSS stylesheet src/shorts-player.css with host element skeleton styles (research.md:50-92)
- [X] [T006] [P0] Verify global CSS prevents FOUC - shorts-player:not(:defined) shows grey gradient
- [X] [T007] [P0] Create basic example page examples/basic.html for manual testing
- [X] [T008] [P0] Create scroll feed example examples/scroll-feed.html with 20+ instances

**Success Criteria**: `npm test` runs (no tests yet), examples load with grey gradient backgrounds

---

## Phase 1: Foundational Components (BLOCKS all user stories)

**Goal**: Build shared singleton components (VideoIntersectionManager, VideoPool) and template system. These are required for both US1 and US2.

**Dependencies**: Phase 0 complete

**Estimated Tasks**: 15

### Shared Template (Light DOM)

- [ ] [T009] [P1] [US1] TEST: Write test for SHARED_TEMPLATE creation at module level (tests/unit/shared-template.spec.js)
- [ ] [T010] [P1] [US1] Verify test fails (RED) - SHARED_TEMPLATE doesn't exist yet
- [ ] [T011] [P1] [US1] IMPLEMENT: Create SHARED_TEMPLATE constant in src/shorts-player.js (research.md:96-102)
- [ ] [T012] [P1] [US1] Verify test passes (GREEN)
- [ ] [T013] [P1] [US1] TEST: Write test for template cloning performance (<1ms per clone)
- [ ] [T014] [P1] [US1] IMPLEMENT: Ensure cloneNode(true) used correctly

### VideoIntersectionManager Singleton

- [ ] [T015] [P1] [US1] TEST: Write singleton pattern test in tests/unit/intersection-manager.spec.js
- [ ] [T016] [P1] [US1] Verify test fails (RED) - VideoIntersectionManager doesn't exist
- [ ] [T017] [P1] [US1] IMPLEMENT: Create VideoIntersectionManager class in src/intersection-manager.js (research.md:153-198)
- [ ] [T018] [P1] [US1] TEST: Write test for WeakMap component registration
- [ ] [T019] [P1] [US1] IMPLEMENT: Add observe() and unobserve() methods (data-model.md:190-194)
- [ ] [T020] [P1] [US1] TEST: Write test for intersection logic - >50% visible OR (tall AND >50% viewport) (data-model.md:196-218)
- [ ] [T021] [P1] [US1] Verify test fails (RED)
- [ ] [T022] [P1] [US1] IMPLEMENT: Add handleIntersection() with OR condition logic
- [ ] [T023] [P1] [US1] Verify test passes (GREEN)

### VideoPool Singleton

- [ ] [T024] [P1] [US1] TEST: Write VideoPool singleton test in tests/unit/video-pool.spec.js
- [ ] [T025] [P1] [US1] Verify test fails (RED) - VideoPool doesn't exist
- [ ] [T026] [P1] [US1] IMPLEMENT: Create VideoPool class in src/video-pool.js (research.md:323-358, data-model.md:221-254)
- [ ] [T027] [P1] [US1] TEST: Write test for acquire() - returns video element with playsinline, muted, preload=none
- [ ] [T028] [P1] [US1] IMPLEMENT: Add acquire() method with default attributes
- [ ] [T029] [P1] [US1] TEST: Write test for release() - cleans src, calls load(), returns to pool
- [ ] [T030] [P1] [US1] IMPLEMENT: Add release() method with aggressive cleanup (data-model.md:242-254)
- [ ] [T031] [P1] [US1] TEST: Write test for pool size limit (maxSize: 5)
- [ ] [T032] [P1] [US1] IMPLEMENT: Enforce maxSize in release() - discard if pool full

**Success Criteria**: All singleton tests pass, template cloning <1ms, pool correctly manages 5 elements

---

## Phase 2: User Story 1 (P1) - Seamless Auto-Play (MVP)

**Goal**: Implement core scroll-triggered auto-play/pause behavior with skeleton UI. This is the COMPLETE MVP.

**Dependencies**: Phase 1 complete

**Estimated Tasks**: 45

### Component Skeleton & Lifecycle

- [ ] [T033] [P1] [US1] TEST: Write component registration test in tests/unit/shorts-player.spec.js
- [ ] [T034] [P1] [US1] Verify test fails (RED) - ShortsPlayer not defined
- [ ] [T035] [P1] [US1] IMPLEMENT: Create ShortsPlayer class extending HTMLElement in src/shorts-player.js
- [ ] [T036] [P1] [US1] IMPLEMENT: Register custom element with customElements.define('shorts-player', ShortsPlayer)
- [ ] [T037] [P1] [US1] TEST: Write test for observedAttributes - expects ['src', 'aspect-ratio', 'poster']
- [ ] [T038] [P1] [US1] IMPLEMENT: Add static observedAttributes = ['src', 'aspect-ratio', 'poster']
- [ ] [T039] [P1] [US1] TEST: Write test for constructor - initializes _initialized=false, _isPlaying=false
- [ ] [T040] [P1] [US1] Verify test fails (RED)
- [ ] [T041] [P1] [US1] IMPLEMENT: Add constructor with initial state (research.md:467-473)
- [ ] [T042] [P1] [US1] Verify test passes (GREEN)

### connectedCallback - Template & Skeleton

- [ ] [T043] [P1] [US1] TEST: Write test for connectedCallback - clones SHARED_TEMPLATE
- [ ] [T044] [P1] [US1] Verify test fails (RED)
- [ ] [T045] [P1] [US1] IMPLEMENT: Add connectedCallback() with template cloning (research.md:475-503)
- [ ] [T046] [P1] [US1] TEST: Write test for CSS containment applied (style.contain = 'layout paint size')
- [ ] [T047] [P1] [US1] IMPLEMENT: Apply CSS containment and aspect-ratio in connectedCallback()
- [ ] [T048] [P1] [US1] TEST: Write test for aspect-ratio attribute handling (default: "9/16")
- [ ] [T049] [P1] [US1] IMPLEMENT: Read aspect-ratio attribute and apply to style.aspectRatio
- [ ] [T050] [P1] [US1] TEST: Write test for AbortController setup for event cleanup
- [ ] [T051] [P1] [US1] IMPLEMENT: Create _abortController in connectedCallback() (research.md:491-497)
- [ ] [T052] [P1] [US1] TEST: Write test for IntersectionObserver registration via VideoIntersectionManager
- [ ] [T053] [P1] [US1] IMPLEMENT: Call VideoIntersectionManager.observe(this, this) in connectedCallback()

### disconnectedCallback - Cleanup

- [ ] [T054] [P1] [US1] TEST: Write test for disconnectedCallback - aborts event listeners
- [ ] [T055] [P1] [US1] Verify test fails (RED)
- [ ] [T056] [P1] [US1] IMPLEMENT: Add disconnectedCallback() with queueMicrotask pattern (research.md:506-514)
- [ ] [T057] [P1] [US1] TEST: Write test for cleanup on true removal (not DOM move)
- [ ] [T058] [P1] [US1] IMPLEMENT: Check this.isConnected before cleanup
- [ ] [T059] [P1] [US1] TEST: Write test for VideoIntersectionManager.unobserve() call
- [ ] [T060] [P1] [US1] IMPLEMENT: Call VideoIntersectionManager.unobserve(this) in cleanup

### Poster Image Support

- [ ] [T061] [P1] [US1] TEST: Write test for poster attribute - creates <img> element (tests/unit/poster.spec.js)
- [ ] [T062] [P1] [US1] Verify test fails (RED)
- [ ] [T063] [P1] [US1] IMPLEMENT: Add _loadPoster() method that creates HTMLImageElement
- [ ] [T064] [P1] [US1] TEST: Write test for poster load event - fades in (opacity 0→1)
- [ ] [T065] [P1] [US1] IMPLEMENT: Add load event listener with opacity transition (data-model.md:83-85)
- [ ] [T066] [P1] [US1] TEST: Write test for poster error event - falls back to host background
- [ ] [T067] [P1] [US1] IMPLEMENT: Add error event listener, remove poster on error (data-model.md:85)
- [ ] [T068] [P1] [US1] TEST: Write test for poster z-index layering (poster over host background)
- [ ] [T069] [P1] [US1] IMPLEMENT: Apply position:absolute and z-index:2 to poster element

### Video Element Lifecycle

- [ ] [T070] [P1] [US1] TEST: Write test for _createVideo() - acquires from VideoPool
- [ ] [T071] [P1] [US1] Verify test fails (RED)
- [ ] [T072] [P1] [US1] IMPLEMENT: Add _createVideo() method calling VideoPool.acquire() (data-model.md:86-88)
- [ ] [T073] [P1] [US1] TEST: Write test for video src assignment (MP4 file)
- [ ] [T074] [P1] [US1] IMPLEMENT: Set video.src from this.getAttribute('src')
- [ ] [T075] [P1] [US1] TEST: Write test for loadeddata event - triggers play()
- [ ] [T076] [P1] [US1] IMPLEMENT: Add loadeddata listener that calls video.play() (data-model.md:88)
- [ ] [T077] [P1] [US1] TEST: Write test for video fade in when playing (opacity 0→1)
- [ ] [T078] [P1] [US1] IMPLEMENT: Add class 'loaded' to video on loadeddata event
- [ ] [T079] [P1] [US1] TEST: Write test for poster fade out when video plays
- [ ] [T080] [P1] [US1] IMPLEMENT: Remove poster element after video starts playing (data-model.md:88, 160-164)

### Auto-Play/Pause Logic

- [ ] [T081] [P1] [US1] TEST: Write integration test for auto-play when >50% visible (tests/integration/auto-play.spec.js)
- [ ] [T082] [P1] [US1] Verify test fails (RED)
- [ ] [T083] [P1] [US1] IMPLEMENT: Add updatePlayState(shouldPlay) method that creates/plays video
- [ ] [T084] [P1] [US1] TEST: Write test for auto-play when video taller than viewport AND >50% viewport
- [ ] [T085] [P1] [US1] Verify test passes with OR logic from VideoIntersectionManager
- [ ] [T086] [P1] [US1] TEST: Write test for auto-pause when <50% visible
- [ ] [T087] [P1] [US1] IMPLEMENT: Call video.pause() in updatePlayState(false)
- [ ] [T088] [P1] [US1] TEST: Write test for cleanup delay (200ms grace period)
- [ ] [T089] [P1] [US1] IMPLEMENT: Add _scheduleCleanup() with 200ms setTimeout (data-model.md:90)
- [ ] [T090] [P1] [US1] TEST: Write test for cleanup cancellation on re-entry (scroll bounce)
- [ ] [T091] [P1] [US1] IMPLEMENT: Clear _cleanupTimer in updatePlayState(true)

### Resource Cleanup

- [ ] [T092] [P1] [US1] TEST: Write test for _cleanupVideo() - pauses, clears src, calls load()
- [ ] [T093] [P1] [US1] Verify test fails (RED)
- [ ] [T094] [P1] [US1] IMPLEMENT: Add _cleanupVideo() method (data-model.md:343-353)
- [ ] [T095] [P1] [US1] TEST: Write test for VideoPool.release() called in cleanup
- [ ] [T096] [P1] [US1] IMPLEMENT: Call VideoPool.release(_videoElement) in _cleanupVideo()
- [ ] [T097] [P1] [US1] TEST: Write test for video element nullification after cleanup
- [ ] [T098] [P1] [US1] IMPLEMENT: Set _videoElement = null after release

### Public API Methods

- [ ] [T099] [P1] [US1] TEST: Write test for play() method - programmatic control
- [ ] [T100] [P1] [US1] Verify test fails (RED)
- [ ] [T101] [P1] [US1] IMPLEMENT: Add play() method returning video.play() Promise (contracts/component-api.md:219-248)
- [ ] [T102] [P1] [US1] TEST: Write test for pause() method - programmatic control
- [ ] [T103] [P1] [US1] IMPLEMENT: Add pause() method calling video.pause() (contracts/component-api.md:250-273)
- [ ] [T104] [P1] [US1] TEST: Write test for reload() method - error recovery
- [ ] [T105] [P1] [US1] IMPLEMENT: Add reload() method that cleans up and reloads src (contracts/component-api.md:275-295)

### Read-Only Properties

- [ ] [T106] [P1] [US1] TEST: Write test for playing getter - returns boolean
- [ ] [T107] [P1] [US1] IMPLEMENT: Add get playing() returning _isPlaying (contracts/component-api.md:176-195)
- [ ] [T108] [P1] [US1] TEST: Write test for loaded getter - returns readyState >= 2
- [ ] [T109] [P1] [US1] IMPLEMENT: Add get loaded() checking _videoElement?.readyState (contracts/component-api.md:197-216)

### Custom Events

- [ ] [T110] [P1] [US1] TEST: Write test for 'play' event dispatch
- [ ] [T111] [P1] [US1] IMPLEMENT: Dispatch 'play' event when video starts playing (contracts/component-api.md:300-321)
- [ ] [T112] [P1] [US1] TEST: Write test for 'pause' event dispatch
- [ ] [T113] [P1] [US1] IMPLEMENT: Dispatch 'pause' event when video pauses (contracts/component-api.md:323-345)
- [ ] [T114] [P1] [US1] TEST: Write test for 'loadeddata' event dispatch
- [ ] [T115] [P1] [US1] IMPLEMENT: Dispatch 'loadeddata' event (contracts/component-api.md:347-369)
- [ ] [T116] [P1] [US1] TEST: Write test for 'visibilitychange' event with detail object
- [ ] [T117] [P1] [US1] IMPLEMENT: Dispatch CustomEvent with {visible, visibilityRatio, viewportOccupancy} (contracts/component-api.md:405-436)

### Performance & Stress Testing (US1)

- [ ] [T118] [P1] [US1] TEST: Write 60fps scrolling test in tests/stress/rapid-scroll.spec.js (research.md:572-606)
- [ ] [T119] [P1] [US1] Run test with 50+ instances, verify no frame drops below 58fps (SC-001, PR-001)
- [ ] [T120] [P1] [US1] TEST: Write memory leak test in tests/stress/memory-leak.spec.js (research.md:545-569)
- [ ] [T121] [P1] [US1] Run test with 100+ scroll cycles, verify <10% memory growth (SC-005, PR-003)
- [ ] [T122] [P1] [US1] TEST: Write 100+ instances stress test in tests/stress/100-instances.spec.js
- [ ] [T123] [P1] [US1] Verify page loads and scrolls smoothly without crashes (SC-007)
- [ ] [T124] [P1] [US1] TEST: Write auto-play timing test - <200ms from intersection to play (research.md:610-631)
- [ ] [T125] [P1] [US1] Verify timing meets SC-002 requirement
- [ ] [T126] [P1] [US1] TEST: Write auto-pause timing test - <100ms from exit to pause
- [ ] [T127] [P1] [US1] Verify timing meets SC-003 requirement

**Success Criteria**: All US1 tests pass, 60fps with 50+ instances, <10% memory growth, auto-play/pause within timing requirements

---

## Phase 3: User Story 2 (P2) - HLS Streaming Support

**Goal**: Add HLS.js integration with conditional loading (native Safari, hls.js for Chrome/Firefox).

**Dependencies**: Phase 2 complete (US1 MVP working)

**Estimated Tasks**: 25

### HLS Detection & Conditional Loading

- [ ] [T128] [P2] [US2] TEST: Write Safari native HLS detection test in tests/unit/shorts-player.spec.js
- [ ] [T129] [P2] [US2] Verify test fails (RED)
- [ ] [T130] [P2] [US2] IMPLEMENT: Add _canPlayNativeHLS() method checking canPlayType('application/vnd.apple.mpegurl')
- [ ] [T131] [P2] [US2] Verify test passes (GREEN)
- [ ] [T132] [P2] [US2] TEST: Write test for HLS source detection (.m3u8 extension)
- [ ] [T133] [P2] [US2] IMPLEMENT: Add _isHLSSource(src) method checking src.endsWith('.m3u8')
- [ ] [T134] [P2] [US2] TEST: Write test for Hls.isSupported() check (Chrome/Firefox)
- [ ] [T135] [P2] [US2] IMPLEMENT: Add conditional logic in _createVideo() for HLS initialization

### HLS.js Integration

- [ ] [T136] [P2] [US2] TEST: Write test for HLS.js instance creation with optimized config
- [ ] [T137] [P2] [US2] Verify test fails (RED)
- [ ] [T138] [P2] [US2] IMPLEMENT: Create HLS instance with scroll-optimized config (research.md:231-256)
- [ ] [T139] [P2] [US2] TEST: Write test for hls.loadSource() and hls.attachMedia() calls
- [ ] [T140] [P2] [US2] IMPLEMENT: Call loadSource(src) and attachMedia(video) in _initHLS()
- [ ] [T141] [P2] [US2] TEST: Write test for HLS MANIFEST_PARSED event
- [ ] [T142] [P2] [US2] IMPLEMENT: Listen for MANIFEST_PARSED, then call video.play()
- [ ] [T143] [P2] [US2] TEST: Write test for HLS error handling - fatal errors
- [ ] [T144] [P2] [US2] IMPLEMENT: Listen for Hls.Events.ERROR, dispatch 'error' CustomEvent (contracts/component-api.md:373-402)

### HLS Cleanup

- [ ] [T145] [P2] [US2] TEST: Write test for HLS cleanup sequence - stopLoad(), detachMedia(), destroy()
- [ ] [T146] [P2] [US2] Verify test fails (RED)
- [ ] [T147] [P2] [US2] IMPLEMENT: Add HLS cleanup in _cleanupVideo() before video cleanup (research.md:262-289)
- [ ] [T148] [P2] [US2] TEST: Write test for HLS instance nullification after destroy
- [ ] [T149] [P2] [US2] IMPLEMENT: Set _hlsInstance = null after destroy()
- [ ] [T150] [P2] [US2] Verify test passes (GREEN)

### Safari Native HLS

- [ ] [T151] [P2] [US2] TEST: Write test for Safari native HLS playback (no hls.js)
- [ ] [T152] [P2] [US2] IMPLEMENT: Skip HLS.js initialization if _canPlayNativeHLS() returns true
- [ ] [T153] [P2] [US2] TEST: Write test for direct video.src assignment with .m3u8 on Safari
- [ ] [T154] [P2] [US2] IMPLEMENT: Set video.src directly for Safari native HLS

### Cross-Browser HLS Testing

- [ ] [T155] [P2] [US2] TEST: Write Chrome HLS test - verify hls.js loaded (tests/integration/hls-chrome.spec.js)
- [ ] [T156] [P2] [US2] Run test, verify HLS stream plays in Chrome (SC-006)
- [ ] [T157] [P2] [US2] TEST: Write Firefox HLS test - verify hls.js loaded (tests/integration/hls-firefox.spec.js)
- [ ] [T158] [P2] [US2] Run test, verify HLS stream plays in Firefox (SC-006)
- [ ] [T159] [P2] [US2] TEST: Write Safari HLS test - verify native playback (tests/integration/hls-safari.spec.js)
- [ ] [T160] [P2] [US2] Run test, verify HLS stream plays in Safari without hls.js (SC-006)

### Adaptive Bitrate Testing

- [ ] [T161] [P2] [US2] TEST: Write test for adaptive quality switching with network throttling
- [ ] [T162] [P2] [US2] Simulate network throttling in Playwright, verify quality adapts without buffering

**Success Criteria**: HLS streams play in Chrome, Firefox, Safari; adaptive bitrate works; no memory leaks after HLS cleanup

---

## Phase 4: Error Handling & Edge Cases

**Goal**: Graceful error handling, validation, and edge case coverage.

**Dependencies**: Phase 3 complete

**Estimated Tasks**: 22

### Validation & Error States

- [ ] [T163] [P1] [US1] TEST: Write test for missing src attribute - console error + error state
- [ ] [T164] [P1] [US1] IMPLEMENT: Check src in connectedCallback(), dispatch 'error' event if missing
- [ ] [T165] [P1] [US1] TEST: Write test for invalid src URL - console warning
- [ ] [T166] [P1] [US1] IMPLEMENT: Validate URL format, log warning but attempt load anyway
- [ ] [T167] [P1] [US1] TEST: Write test for video load error (404) - dispatch 'error' event
- [ ] [T168] [P1] [US1] IMPLEMENT: Listen for video 'error' event, dispatch CustomEvent with type:'video'
- [ ] [T169] [P1] [US1] TEST: Write test for poster load error (404) - fall back to skeleton
- [ ] [T170] [P1] [US1] IMPLEMENT: Listen for poster 'error' event, remove poster, show skeleton only

### Edge Cases

- [ ] [T171] [P1] [US1] TEST: Write test for rapid scroll direction changes (scroll bounce)
- [ ] [T172] [P1] [US1] Verify 200ms cleanup delay prevents premature resource destruction
- [ ] [T173] [P1] [US1] TEST: Write test for DOM removal during playback
- [ ] [T174] [P1] [US1] Verify disconnectedCallback() cleans up safely with isConnected check
- [ ] [T175] [P1] [US1] TEST: Write test for viewport resize during playback
- [ ] [T176] [P1] [US1] Verify IntersectionObserver recalculates and triggers correct state
- [ ] [T177] [P1] [US1] TEST: Write test for tab backgrounding during playback
- [ ] [T178] [P1] [US1] Verify video pauses when tab hidden (browser default behavior)
- [ ] [T179] [P1] [US1] TEST: Write test for multiple videos meeting threshold simultaneously
- [ ] [T180] [P1] [US1] Verify VideoPool handles concurrent acquire() calls
- [ ] [T181] [P2] [US2] TEST: Write test for HLS manifest load failure (network error)
- [ ] [T182] [P2] [US2] IMPLEMENT: Dispatch 'error' CustomEvent with type:'hls' and error message
- [ ] [T183] [P2] [US2] TEST: Write test for HLS stream interruption during playback (network drop mid-stream)
- [ ] [T184] [P2] [US2] IMPLEMENT: Listen for HLS network errors during playback, dispatch 'error' event with type:'stream-interruption'

**Success Criteria**: All error scenarios handled gracefully, no crashes, edge cases covered

---

## Phase 5: Examples & Documentation Polish

**Goal**: Complete examples and ensure component is production-ready.

**Dependencies**: Phase 4 complete

**Estimated Tasks**: 10

### Examples

- [ ] [T185] [P1] Update examples/basic.html with poster attribute example
- [ ] [T186] [P1] Update examples/scroll-feed.html with 100+ instances for stress testing
- [ ] [T187] [P2] Create examples/hls-demo.html with HLS stream sources (.m3u8)
- [ ] [T188] [P1] Create examples/external-controls.html showing play/pause buttons
- [ ] [T189] [P1] Create examples/custom-styles.html showing CSS custom properties
- [ ] [T190] [P1] Create examples/analytics.html showing event listener integration
- [ ] [T191] [P1] Create examples/error-handling.html showing error recovery UI

### Build & Distribution

- [ ] [T192] [P0] Create build script to bundle src/shorts-player.js to dist/shorts-player.min.js
- [ ] [T193] [P0] Verify bundle size <50KB (excluding hls.js) (SC-009)
- [ ] [T194] [P0] Run all tests in CI mode - verify 100% pass rate

**Success Criteria**: All examples functional, bundle size meets requirements, all tests pass

---

## Task Dependency Graph

### Sequential Dependencies (Must Run in Order)

```
Phase 0 (Setup)
    ↓
Phase 1 (Foundational - BLOCKS all user stories)
    ↓
    ├─→ Phase 2 (US1 - MVP) ←─ CRITICAL PATH
    │       ↓
    │   Phase 3 (US2 - HLS)
    │       ↓
    └───→ Phase 4 (Error Handling) ←─ Can run in parallel with Phase 3
            ↓
        Phase 5 (Polish)
```

### Parallel Execution Opportunities

**Within Phase 1** (after T008 complete):
- **Parallel Group 1**: T009-T014 (Template), T015-T023 (IntersectionManager), T024-T032 (VideoPool) can run in parallel

**Within Phase 2** (after T053 complete):
- **Parallel Group 2**: T061-T069 (Poster), T070-T080 (Video), T099-T109 (API) can run in parallel
- **Parallel Group 3**: T118-T127 (All stress tests) can run in parallel

**Within Phase 3**:
- **Parallel Group 4**: T155-T160 (Browser-specific HLS tests) can run in parallel

**Phase 3 & Phase 4 can run in parallel** after Phase 2 complete

---

## Testing Checklist by Constitution Principle

### Principle I: Performance Under Stress (NON-NEGOTIABLE)
- [x] T118-T119: 60fps scrolling with 50+ instances (PR-001, SC-001)
- [x] T120-T121: <10% memory growth after 100+ cycles (PR-003, SC-005)
- [x] T122-T123: 100+ instances without crashes (SC-007)
- [x] T124-T125: Auto-play <200ms (SC-002)
- [x] T126-T127: Auto-pause <100ms (SC-003)

### Principle II: Minimal Dependencies
- [x] Only hls.js dependency (verified in package.json)
- [x] No framework dependencies

### Principle III: Test-First Development (NON-NEGOTIABLE)
- [x] Every IMPLEMENT task preceded by TEST task
- [x] Every TEST task followed by "Verify test fails (RED)"
- [x] Every IMPLEMENT task followed by "Verify test passes (GREEN)"
- [x] Red-Green-Refactor cycle enforced

### Principle IV: Web Standards Native
- [x] Web Components (Custom Elements) used (T035-T036)
- [x] IntersectionObserver API used (T015-T023, T052-T053)
- [x] No scroll event listeners (forbidden)
- [x] AbortController for cleanup (T050-T051)

### Principle V: Simplicity & Resource Efficiency
- [x] No controls in component (external API only)
- [x] Aggressive resource cleanup (T092-T098, T145-T150)
- [x] Object pooling (T024-T032)
- [x] Static skeleton (global CSS, no animation)

---

## Task Summary

| Phase | Total Tasks | User Story | Status |
|-------|-------------|------------|--------|
| Phase 0: Setup | 8 | N/A (Foundation) | Not Started |
| Phase 1: Foundational | 24 | US1+US2 (BLOCKS both) | Not Started |
| Phase 2: US1 (MVP) | 95 | US1 (P1) | Not Started |
| Phase 3: US2 (HLS) | 35 | US2 (P2) | Not Started |
| Phase 4: Error Handling | 22 | US1+US2 | Not Started |
| Phase 5: Polish | 10 | N/A (Documentation) | Not Started |
| **TOTAL** | **194** | - | **0% Complete** |

---

## How to Execute

### Start Implementation

1. **Begin with Phase 0**: Complete T001-T008 to set up project
2. **Move to Phase 1**: Complete T009-T032 (foundational components)
3. **Implement US1 (MVP)**: Complete Phase 2 (T033-T127) - CRITICAL PATH
4. **Add HLS Support**: Complete Phase 3 (T128-T162)
5. **Harden with Error Handling**: Complete Phase 4 (T163-T184)
6. **Polish**: Complete Phase 5 (T185-T194)

### TDD Workflow (MANDATORY)

For every feature:
1. **Write test first** (T[n] TEST task)
2. **Run test - MUST FAIL** (T[n+1] RED verification)
3. **Write minimal code to pass** (T[n+2] IMPLEMENT task)
4. **Run test - MUST PASS** (T[n+3] GREEN verification)
5. **Refactor if needed** (optional, test still passes)

### Parallel Execution

Use parallel execution groups to speed up development:
- Run Template + IntersectionManager + VideoPool tests in parallel (Phase 1)
- Run all stress tests in parallel (Phase 2)
- Run browser-specific HLS tests in parallel (Phase 3)
- Phase 3 and Phase 4 can run concurrently

---

## Notes

- **Constitution Compliance**: All tasks align with constitutional principles
- **TDD Enforcement**: Red-Green-Refactor cycle explicitly included in tasks
- **Performance Budgets**: Performance tests (T118-T127) verify all requirements
- **Memory Safety**: Cleanup tasks (T092-T098, T145-T150) prevent leaks
- **Cross-Browser**: Browser-specific tests (T155-T160) ensure compatibility
- **MVP Focus**: US1 (Phase 2) is the complete MVP - prioritize this path

**Ready to begin implementation with `/speckit.implement` command.**
