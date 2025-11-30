# Feature Specification: Shorts Player Web Component

**Feature Branch**: `001-shorts-player-component`
**Created**: 2025-11-27
**Status**: Draft
**Input**: User description: "Web component video player with auto-play when >50% visible and >50% viewport, HLS.js support, super-fast scrolling performance, simple grey-ish gradient skeleton UI, no whiteout page during fast scrolling. No controls - focus on scroll interaction only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seamless Auto-Play Video Scrolling (Priority: P1)

A user scrolls through a feed of short-form videos. As each video enters the viewport and becomes prominent, it automatically begins playing without requiring any interaction. When the user scrolls past the video, it automatically pauses. The scrolling experience remains buttery smooth even during rapid scrolling, with no blank white spaces or layout shifts.

**Why this priority**: This is the core and ONLY user interaction for this component. The entire value proposition is smooth, automatic playback triggered by scroll position. This is the complete MVP.

**Independent Test**: Load a page with multiple video player instances, scroll through them at various speeds (slow, medium, fast), and verify that videos auto-play/pause correctly while scrolling remains smooth at 60fps with no whiteout pages.

**Acceptance Scenarios**:

1. **Given** a page with multiple video players, **When** user scrolls and a video meets either condition: (a) more than 50% of the video area is visible, OR (b) the video is taller than the viewport AND occupies more than 50% of the viewport height, **Then** the video automatically starts playing
2. **Given** a video is currently playing, **When** user scrolls so that both conditions fail: (a) less than 50% of the video area is visible, AND (b) either the video is not taller than viewport OR occupies less than 50% of viewport height, **Then** the video automatically pauses
3. **Given** multiple video players on a page, **When** user performs super-fast scrolling (rapid scroll wheel or gesture fling), **Then** scrolling remains smooth at 60fps with no frame drops
4. **Given** user is scrolling quickly through videos, **When** scrolling through empty space between videos, **Then** skeleton UI (grey gradient) is immediately visible with no white/blank page flashes
5. **Given** a video is loading, **When** the video hasn't loaded yet but is in viewport, **Then** a grey gradient skeleton placeholder is shown immediately
6. **Given** a video is partially visible (e.g., 30% visible), **When** viewport threshold is not met, **Then** the video remains paused and shows skeleton UI

---

### User Story 2 - HLS Streaming Support (Priority: P2)

A user's device encounters videos in HLS (HTTP Live Streaming) format. The player detects HLS streams and plays them using appropriate technology, falling back to native HLS support where available (Safari) or using HLS.js for browsers without native support (Chrome, Firefox).

**Why this priority**: HLS is the standard for adaptive bitrate streaming and is essential for production-quality video delivery. However, basic playback can work with MP4 files initially, making this lower priority than core auto-play behavior.

**Independent Test**: Load a video player with an HLS stream URL (.m3u8), verify it plays correctly in Chrome (via hls.js), Firefox (via hls.js), and Safari (native), and observe adaptive quality switching on network throttling.

**Acceptance Scenarios**:

1. **Given** a video player with an HLS stream source (.m3u8), **When** loaded in Safari, **Then** the video plays using native HLS support
2. **Given** a video player with an HLS stream source (.m3u8), **When** loaded in Chrome or Firefox, **Then** the video plays using hls.js library
3. **Given** an HLS stream is playing, **When** network conditions change (simulated throttling), **Then** the player adapts quality seamlessly without buffering interruptions
4. **Given** a video player with a standard MP4 source, **When** the player loads, **Then** it plays directly without HLS.js initialization

---

### Edge Cases

- What happens when user scrolls extremely rapidly (scroll wheel spam, gesture fling at maximum speed)?
- What happens when network is slow or fails during HLS stream loading?
- What happens when a video element is removed from DOM while playing?
- What happens when browser tab is backgrounded while video is playing?
- What happens when multiple video players are stacked vertically and both meet the >50% visibility threshold simultaneously?
- What happens when a video player is initially hidden (display:none or visibility:hidden) and then shown?
- What happens when viewport is resized while video is playing?
- What happens when video source URL returns 404 or invalid format?
- What happens on mobile devices with limited memory (100+ video instances on page)?
- What happens when only one threshold is met (e.g., >50% visible but occupies only 30% of viewport)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Component MUST be implemented as a native Web Component (Custom Element) with no framework dependencies
- **FR-002**: Component MUST auto-play video when either condition is met: (1) more than 50% of player area is visible in viewport, OR (2) player is taller than viewport AND occupies more than 50% of viewport height
- **FR-003**: Component MUST auto-pause video when both conditions fail: (1) less than 50% of player area visible, AND (2) either player is not taller than viewport OR occupies less than 50% of viewport height
- **FR-004**: Component MUST use Intersection Observer API for viewport detection (NOT scroll event listeners)
- **FR-005**: Component MUST display a simple grey gradient skeleton UI as placeholder before video loads and when video is not playing
- **FR-006**: Component MUST maintain skeleton UI visibility during fast scrolling to prevent white/blank page flashes
- **FR-007**: Component MUST NOT include any playback controls (no play/pause button, no seek bar, no volume control)
- **FR-008**: Component MUST support HLS streaming via hls.js library for non-Safari browsers
- **FR-009**: Component MUST use native HLS support on Safari (no hls.js initialization)
- **FR-010**: Component MUST support standard MP4 video sources without HLS.js overhead
- **FR-011**: Component MUST aggressively clean up video resources (video element, HLS instance) when out of viewport
- **FR-012**: Component MUST maintain smooth 60fps scrolling performance during rapid scrolling
- **FR-013**: Component MUST NOT crash or cause page unresponsiveness under stress (100+ instances, rapid scrolling)
- **FR-014**: Component MUST use passive event listeners where applicable to prevent scroll blocking
- **FR-015**: Component MUST handle errors gracefully (network failures, invalid sources, HLS load errors) without breaking the page
- **FR-016**: Component MUST expose programmatic API for external controls to play/pause if needed (for button implementation outside component)

### Performance Requirements

- **PR-001**: Scrolling MUST maintain 60fps frame rate during fast scrolling scenarios
- **PR-002**: Intersection Observer callbacks MUST execute in less than 16ms to avoid janking
- **PR-003**: Memory usage MUST remain stable after 100+ scroll cycles (no memory leaks)
- **PR-004**: Video resources MUST be disposed within 100ms of leaving viewport threshold
- **PR-005**: Skeleton UI MUST render immediately (within one frame) to prevent whiteout

### Key Entities

- **Video Player Instance**: Represents a single video player web component instance with properties: video source URL, play state (playing/paused), visibility state (in viewport/out), HLS instance reference (if applicable), intersection observer reference
- **Skeleton Placeholder**: Visual placeholder shown before video loads or when video is paused, consisting of a grey gradient background to prevent layout shift and whiteout pages

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can scroll through 50+ video instances at maximum scroll speed without experiencing frame drops below 60fps
- **SC-002**: Videos automatically begin playing within 200ms of meeting viewport visibility thresholds
- **SC-003**: Videos automatically pause within 100ms of failing viewport visibility thresholds
- **SC-004**: Page remains visually stable during fast scrolling with zero instances of white/blank page flashes
- **SC-005**: Memory usage remains stable (no growth greater than 10%) after scrolling through 100+ video instances
- **SC-006**: Component successfully plays HLS streams in Chrome, Firefox, and Safari without errors
- **SC-007**: Component handles 100+ simultaneous instances on a single page without crashing or degrading scroll performance
- **SC-008**: Component gracefully handles network errors and invalid video sources by dispatching error events for external handling (no console spam, no built-in error UI)
- **SC-009**: Component loads and initializes in under 50KB bundle size (excluding hls.js, which loads conditionally)
- **SC-010**: Skeleton UI displays instantly on page load with no flash of unstyled content

### Assumptions

- Users will ONLY interact via scrolling (no manual controls within component)
- External play/pause buttons will be implemented outside the component and will use the programmatic API
- Video sources will be provided via HTML attributes or JavaScript properties
- Page will use standard vertical scrolling layout (not horizontal or complex scroll containers)
- HLS.js library will be loaded separately and available globally (not bundled with component)
- Typical use case involves 10-100 video instances per page (not 1000s)
- Videos are short-form content (15-120 seconds typical duration)
- Skeleton UI can be a simple static gradient (no animated shimmer effects needed for MVP)
- Component will be styled minimally; parent page provides sizing and layout
