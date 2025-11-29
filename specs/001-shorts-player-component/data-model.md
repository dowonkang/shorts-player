# Data Model: Shorts Player Web Component

**Phase 1 Output** - Entity definitions and state management

**Date**: 2025-11-29

---

## Entities

### 1. Video Player Instance

Represents a single `<shorts-player>` web component instance on the page.

#### Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `src` | String (URL) | Yes | - | Video source URL (MP4 or .m3u8 for HLS) |
| `poster` | String (URL) | No | - | Poster image URL to show before video loads |
| `aspectRatio` | String | No | `"9/16"` | CSS aspect-ratio value (e.g., "9/16", "16/9") |
| `_isPlaying` | Boolean | - | `false` | Internal: Current playback state |
| `_isVisible` | Boolean | - | `false` | Internal: Meets viewport visibility threshold |
| `_videoElement` | HTMLVideoElement | - | `null` | Internal: Reference to video DOM element (lazy created) |
| `_hlsInstance` | Hls | - | `null` | Internal: HLS.js instance reference (if HLS stream) |
| `_posterElement` | HTMLImageElement | - | `null` | Internal: Reference to poster image element |
| `_initialized` | Boolean | - | `false` | Internal: Tracks if connectedCallback has run |
| `_cleanupTimer` | Number | - | `null` | Internal: Timer ID for deferred cleanup (200ms grace period) |

#### State Machine

```
┌─────────────┐
│ UNINITIALIZED│ (Component not yet connected to DOM)
└──────┬──────┘
       │ connectedCallback()
       ▼
┌─────────────┐
│  SKELETON   │ (Host element with grey gradient background)
└──────┬──────┘
       │ If poster attribute exists
       ▼
┌─────────────┐
│POSTER LOADING│ (Host background visible, poster image loading)
└──────┬──────┘
       │ poster load event
       ▼
┌─────────────┐
│POSTER VISIBLE│ (Poster displayed over host background)
└──────┬──────┘
       │ Intersection: >50% visible OR (larger than viewport AND >50% viewport)
       ▼
┌─────────────┐
│VIDEO LOADING│ (Video element created, loading source)
└──────┬──────┘
       │ loadeddata event
       ▼
┌─────────────┐
│   PLAYING   │ (Video visible and playing, poster faded out)
└──────┬──────┘
       │ Intersection: <50% visible AND (<50% viewport OR not larger than viewport)
       ▼
┌─────────────┐
│   PAUSED    │ (Video paused)
└──────┬──────┘
       │ After 200ms grace period
       ▼
┌─────────────┐
│   CLEANUP   │ (Video element removed, back to poster or skeleton)
└──────┬──────┘
       │ disconnectedCallback()
       ▼
┌─────────────┐
│  DESTROYED  │ (Component removed from DOM)
└─────────────┘
```

#### State Transitions

| From | To | Trigger | Actions |
|------|-----|---------|---------|
| UNINITIALIZED | SKELETON | `connectedCallback()` | Clone template, apply styles, setup IntersectionObserver |
| SKELETON | POSTER LOADING | `poster` attribute exists | Create `<img>` element, set src, start loading |
| POSTER LOADING | POSTER VISIBLE | `load` event on image | Fade in poster (opacity 0→1) |
| POSTER LOADING | SKELETON | `error` event on image | Log warning, stay on skeleton (host background) |
| POSTER VISIBLE | VIDEO LOADING | Intersection conditions met | Create video element, initialize HLS if needed |
| SKELETON | VIDEO LOADING | Intersection conditions met (no poster) | Create video element, initialize HLS if needed |
| VIDEO LOADING | PLAYING | `loadeddata` event | Call `video.play()`, fade out poster, fade in video |
| PLAYING | PAUSED | Intersection conditions NOT met | Call `video.pause()` |
| PAUSED | CLEANUP | 200ms timer expires | Destroy HLS, clear video src, remove video element, return to pool |
| CLEANUP | POSTER VISIBLE | Re-enter viewport (if poster exists) | Show poster again |
| CLEANUP | SKELETON | Re-enter viewport (no poster) | Show host background |
| ANY | DESTROYED | `disconnectedCallback()` | Abort listeners, cleanup resources, unobserve |

#### Validation Rules

| Property | Validation | Error Behavior |
|----------|------------|----------------|
| `src` | Must be valid URL | Console warning, show error state |
| `src` | Must be .mp4, .webm, or .m3u8 | Console warning, attempt playback anyway |
| `poster` | Must be valid image URL | Console warning, fall back to skeleton only |
| `poster` | Should be same aspect ratio as video | No validation, may cause visual jump |
| `aspectRatio` | Must be valid CSS aspect-ratio syntax | Fall back to default "9/16" |

#### Relationships

- **0:1** with Poster Image (optional, if `poster` attribute provided)
- **0:1** with HTMLVideoElement (lazy created, destroyed on cleanup)
- **0:1** with HLS Instance (only if src is .m3u8 and browser needs it)
- **N:1** with VideoIntersectionManager (shared singleton observer)
- **N:1** with VideoPool (shared pool, acquires video elements)

---

### 2. Poster Image

Optional image displayed on top of host background before video loads.

#### Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `element` | HTMLImageElement | No | - | DOM reference to poster `<img>` element |
| `src` | String (URL) | Yes (if poster used) | - | Poster image URL from `poster` attribute |
| `loaded` | Boolean | - | `false` | Whether image has successfully loaded |

#### State Machine

```
┌─────────────┐
│   LOADING   │ (opacity: 0, loading image)
└──────┬──────┘
       │ load event
       ▼
┌─────────────┐
│   VISIBLE   │ (opacity: 1, showing poster)
└──────┬──────┘
       │ Video ready to play
       ▼
┌─────────────┐
│  FADING OUT │ (opacity: 1 → 0, transition 200ms)
└──────┬──────┘
       │ Transition complete
       ▼
┌─────────────┐
│   REMOVED   │ (Element removed from DOM)
└─────────────┘
```

#### CSS Classes

| Class | State | Description |
|-------|-------|-------------|
| `.shorts-player__poster` | LOADING/VISIBLE | Default state, opacity transitions |
| `.shorts-player__poster.loaded` | VISIBLE | Applied after image loads, opacity: 1 |
| `.shorts-player__poster.hidden` | FADING OUT | Applied when video plays, opacity: 0 |

#### Lifecycle

1. **Created**: When component has `poster` attribute during `connectedCallback()`
2. **Loading**: Image src set, opacity 0, loading in background
3. **Visible**: After `load` event, fade in to opacity 1
4. **Fading**: When video `loadeddata` event fires
5. **Removed**: After 200ms fade-out transition completes

#### Error Handling

| Error | Trigger | Behavior |
|-------|---------|----------|
| Invalid URL | `poster` attribute has bad URL | Console warning, no poster created |
| Load failure | Image `error` event | Console warning, remove poster element, show host background only |
| Slow loading | Image takes >2 seconds | Host background remains visible (prevents whiteout) |

---

### 3. Video Intersection Manager (Singleton)

Shared IntersectionObserver instance managing all player components.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `instance` | VideoIntersectionManager | Static singleton instance |
| `observer` | IntersectionObserver | Native IntersectionObserver with thresholds [0, 0.5, 1.0] |
| `componentMap` | WeakMap<HTMLElement, ShortsPlayer> | Maps DOM elements to component instances |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `observe()` | `element`, `component` | void | Register element for observation |
| `unobserve()` | `element` | void | Stop observing element, delete from map |
| `handleIntersection()` | `entries` | void | Process intersection changes, trigger play/pause |

#### Intersection Logic (Corrected)

```javascript
// Two scenarios for auto-play:
// 1. Normal case: >50% of video area is visible
// 2. Large video case: Video taller than viewport AND occupies >50% of viewport

const visibilityRatio = entry.intersectionRatio; // % of video visible
const videoHeight = entry.boundingClientRect.height;
const viewportHeight = entry.rootBounds.height;
const viewportOccupancy = videoHeight / viewportHeight; // % of viewport occupied

const videoLargerThanViewport = videoHeight > viewportHeight;

// OR condition: either scenario triggers play
const shouldPlay = visibilityRatio > 0.5 ||
                   (videoLargerThanViewport && viewportOccupancy > 0.5);
```

**Examples**:
- Video 400px tall, viewport 800px → Play when >50% of video visible (200px+)
- Video 1200px tall, viewport 800px → Play when video occupies >50% of viewport (400px+)

---

### 4. Video Pool (Singleton)

Shared pool of reusable HTMLVideoElement instances.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pool` | Array<HTMLVideoElement> | Available video elements ready for reuse |
| `active` | Set<HTMLVideoElement> | Currently active (in-use) video elements |
| `maxSize` | Number | Maximum pool size (default: 5) |

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `acquire()` | - | HTMLVideoElement | Get video element from pool or create new |
| `release()` | `video` | void | Clean video and return to pool (if space available) |

#### Lifecycle

**Acquire Flow**:
1. Check if pool has available element
2. If yes: pop from pool, mark as active
3. If no: create new video element with default attributes
4. Return video element to component

**Release Flow**:
1. Pause video
2. Clear src (`video.src = ''`)
3. Call `video.load()` to release media buffers
4. If pool not full: push to pool
5. If pool full: let GC handle element

---

## Visual Layering

### Z-Index Stack (bottom to top)

```
┌─────────────────────────────────┐
│                                 │
│   Layer 3: Video (z-index: 3)   │  ← Fades in when ready
│   opacity: 0 → 1                │
├─────────────────────────────────┤
│                                 │
│   Layer 2: Poster (z-index: 2)  │  ← Fades in when loaded
│   opacity: 0 → 1 → 0            │  ← Fades out when video plays
├─────────────────────────────────┤
│                                 │
│   Layer 1: Host Element         │  ← Grey gradient background
│   <shorts-player> background    │  ← Always visible (prevents whiteout)
│   Grey gradient (global CSS)    │  ← Works even if :not(:defined)
│                                 │
└─────────────────────────────────┘
```

### Global CSS for Host Element (Skeleton)

```css
/* Applied before component is defined - prevents FOUC */
shorts-player:not(:defined) {
  display: block;
  aspect-ratio: 9 / 16;
  background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 50%, #e0e0e0 100%);
}

/* Applied after component is defined */
shorts-player {
  display: block;
  aspect-ratio: 9 / 16;
  contain: layout paint size;
  position: relative;
  background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 50%, #e0e0e0 100%);
}
```

### Loading Sequence

**Without poster**:
1. Host background visible (instant, even before `:defined`)
2. Video loads → Video fades in → Host background remains underneath

**With poster**:
1. Host background visible (instant, even before `:defined`)
2. Poster loads → Poster fades in over host background
3. Video loads → Video fades in, Poster fades out → Host background remains underneath

---

## Derived State

### Component Computed Properties

| Property | Computation | Used For |
|----------|-------------|----------|
| `isInViewport` | `visibilityRatio > 0.5 \|\| (videoLargerThanViewport && viewportOccupancy > 0.5)` | Play/pause decision |
| `needsHLS` | `src.endsWith('.m3u8') && !canPlayNative` | HLS.js initialization |
| `canPlayNative` | `video.canPlayType('application/vnd.apple.mpegurl')` | Safari native HLS detection |
| `hasVideo` | `_videoElement !== null` | Whether video is currently loaded |
| `hasPoster` | `getAttribute('poster') !== null` | Whether poster should be shown |
| `posterLoaded` | `_posterElement?.complete === true` | Whether poster has loaded |
| `videoLargerThanViewport` | `videoHeight > viewportHeight` | Large video scenario detection |

---

## Memory Management

### Resource Ownership

| Resource | Owner | Lifecycle | Cleanup Trigger |
|----------|-------|-----------|-----------------|
| Host Element | Component | Created by browser | Never (host element persists) |
| Template Clone | Component | Created in `connectedCallback()` | Cleaned in `disconnectedCallback()` |
| Poster Image | Component | Created if `poster` attribute exists | Removed after video plays |
| Video Element | VideoPool (shared) | Acquired on viewport entry | Released after 200ms out of viewport |
| HLS Instance | Component | Created on video load | Destroyed before video cleanup |
| Event Listeners | Component | Registered via AbortController | Aborted in `disconnectedCallback()` |
| IntersectionObserver | VideoIntersectionManager (shared) | Created on first component | Persists for page lifetime |

### Cleanup Checklist

When component leaves viewport:
- [x] Cancel `_cleanupTimer` if pending
- [x] Call `hls.destroy()` if HLS instance exists
- [x] Call `video.pause()`
- [x] Clear `video.src`
- [x] Call `video.load()` to release buffers
- [x] Return video to pool via `VideoPool.release()`
- [x] Keep poster (for re-entry)
- [x] Host background remains (CSS, not removed)
- [x] Set video/HLS references to `null`

When component is removed from DOM:
- [x] Abort `AbortController` (removes all listeners)
- [x] Call `unobserve()` on IntersectionObserver
- [x] Remove poster image if exists
- [x] Execute cleanup checklist above
- [x] Set `_initialized = false`
- [x] Host element removed by browser (not our responsibility)

---

## Edge Cases & Constraints

### Edge Case: Poster Load Failure

**Scenario**: `poster` attribute provided but image fails to load (404, CORS, etc.).

**Handling**:
- Poster `<img>` element listens for `error` event
- On error: log warning, remove poster element
- Host background gradient remains visible (prevents whiteout)
- Video loading proceeds normally when viewport conditions met

### Edge Case: Slow Poster Loading

**Scenario**: Poster image is large and takes >2 seconds to load.

**Handling**:
- Host background visible immediately (prevents whiteout)
- Poster fades in when ready (may be after user scrolls past)
- If video loads before poster: video takes priority, poster loading cancelled

### Edge Case: Rapid Scroll Direction Changes

**Scenario**: User scrolls past video, then immediately scrolls back.

**Handling**:
- 200ms cleanup delay prevents premature resource destruction
- Poster and host background remain (instant re-display)
- Video re-acquired from pool if timer hasn't expired
- If timer expired: show poster → reload video

### Edge Case: Large Video (Taller than Viewport)

**Scenario**: Video is 1200px tall, viewport is 800px tall.

**Handling**:
- IntersectionObserver detects: `visibilityRatio` may be <0.5 (only partial video visible)
- BUT `viewportOccupancy` is >0.5 (fills >50% of viewport)
- Intersection logic uses OR: auto-play triggered
- Example: User scrolls to middle of tall video → video plays

### Edge Case: Tiny Video (Much Smaller than Viewport)

**Scenario**: Video is 200px tall, viewport is 800px tall.

**Handling**:
- Video must be >50% visible to play (`visibilityRatio > 0.5`)
- `viewportOccupancy` is 0.25 (25% of viewport) → doesn't meet second condition
- Intersection logic uses OR: first condition is sufficient → plays when >100px visible

### Edge Case: Poster and Video Different Aspect Ratios

**Scenario**: Poster is 16:9 but video is 9:16.

**Handling**:
- Component uses `aspect-ratio` from attribute or default 9/16
- Both poster and video use `object-fit: cover` (fill container)
- May cause visual "jump" if aspect ratios differ significantly
- Recommendation: Poster should match video aspect ratio (not validated)

### Edge Case: DOM Removal During Playback

**Scenario**: Component removed from DOM while video is playing.

**Handling**:
- `disconnectedCallback()` uses `queueMicrotask()` to detect true removal vs. DOM move
- Immediate cleanup if `!this.isConnected`
- Race condition protection: check `isConnected` before all DOM operations

### Constraint: Memory Budget

**Requirement**: Stable memory after 100+ scroll cycles (PR-003, SC-005)

**Enforcement**:
- Video pool capped at 5 elements max
- Poster images kept in DOM until video plays (minimal memory: ~50KB each for optimized images)
- Aggressive video cleanup after 200ms out of viewport
- HLS buffer limited to 10-20 seconds
- Automated Playwright tests validate <10% memory growth

### Constraint: Performance Budget

**Requirement**: 60fps scrolling, <16ms intersection callbacks (PR-001, PR-002)

**Enforcement**:
- Single shared IntersectionObserver (not per-component)
- `requestIdleCallback()` for heavy operations
- Light DOM (2x faster than Shadow DOM)
- No skeleton element (just host background via CSS)
- Poster uses native `<img>` (browser-optimized decoding)

---

## Summary

| Entity | Instances Per Page | Lifetime | Memory Impact |
|--------|-------------------|----------|---------------|
| Video Player Component | 100+ | Page load → user navigation | ~1KB each (minimal template) |
| Host Background (CSS) | 100+ (part of host element) | Component creation → destruction | 0 bytes (CSS only) |
| Poster Image | 0-100 (if provided) | Component creation → video plays | ~50KB each (optimized image) |
| Video Element | 3-5 (pooled) | Viewport entry → 200ms after exit | ~2MB each (with buffers) |
| HLS Instance | 0-3 (active videos) | Video load → cleanup | ~500KB each |
| IntersectionObserver | 1 (singleton) | First component → page unload | ~10KB |
| VideoPool | 1 (singleton) | First component → page unload | ~5KB |

**Total estimated memory for 100 components** (with posters):
- Components: 100 × 1KB = 100KB
- Host backgrounds: 0 bytes (CSS only)
- Posters: 100 × 50KB = 5MB (all loaded)
- Pooled videos: 5 × 2MB = 10MB (worst case, all buffered)
- Singletons: ~15KB
- **Total: ~15.1MB** (within acceptable range)
