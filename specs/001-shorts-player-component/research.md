# Research: Shorts Player Web Component

**Phase 0 Output** - Technical research to inform Phase 1 design decisions

**Date**: 2025-11-29

---

## 1. Testing Framework Selection

### Decision
**Playwright** for end-to-end and component testing

### Rationale
- User-specified requirement
- Excellent browser automation for testing scroll behavior
- Supports performance metrics collection (frame rate, memory usage)
- Built-in video element interaction capabilities
- Cross-browser testing (Chrome, Firefox, Safari)
- Can simulate rapid scrolling and stress scenarios

### Implementation Notes
- Use Playwright's experimental component testing for unit tests
- Use full browser automation for integration/stress tests
- Performance tests will measure scroll FPS using Performance API
- Memory leak tests will use `performance.memory` with heap snapshots

---

## 2. DOM Architecture: Light DOM vs Shadow DOM

### Decision
**Light DOM with shared template**

### Rationale
- Shadow DOM adds ~2x performance penalty for bulk rendering
- With 100+ instances, this compounds significantly during scroll
- Light DOM with template cloning is the fastest technique for many instances
- Research: "For components that need to appear thousands of times, Light DOM is optimal"
- CSS containment provides sufficient rendering isolation without Shadow DOM overhead
- **Constitution Principle I (Performance Under Stress) is NON-NEGOTIABLE** - performance takes priority

### Alternatives Considered
- **Shadow DOM**: Rejected - 2x rendering penalty unacceptable with 100+ instances
- **innerHTML**: Rejected - 500x slower than template cloning
- **createElement()**: Fast, but template cloning is still faster for repeated structures

### Implementation Pattern

**Global Styles** (in main HTML or CSS file):
```css
/* Component container */
.shorts-player {
  display: block;
  aspect-ratio: 9 / 16;
  contain: layout paint size;
  position: relative;
}

/* Skeleton placeholder */
.shorts-player__skeleton {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 50%, #e0e0e0 100%);
  transition: opacity 200ms ease-out;
}

.shorts-player__skeleton.hidden {
  opacity: 0;
}

/* Video element */
.shorts-player__video {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.shorts-player__video.loaded {
  opacity: 1;
}

/* FOUC prevention - before component is defined */
shorts-player:not(:defined) {
  display: block;
  aspect-ratio: 9 / 16;
  background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 50%, #e0e0e0 100%);
}
```

**Component JavaScript**:
```javascript
// Shared template created once at module level
const SHARED_TEMPLATE = document.createElement('template');
SHARED_TEMPLATE.innerHTML = `
  <div class="shorts-player">
    <div class="shorts-player__skeleton"></div>
  </div>
`;

class ShortsPlayer extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;

    // Fast template cloning
    this.appendChild(SHARED_TEMPLATE.content.cloneNode(true));

    // Apply CSS containment
    this.style.contain = 'layout paint size';
    const ratio = this.getAttribute('aspect-ratio') || '9/16';
    this.style.aspectRatio = ratio;

    // Cache DOM references
    this._container = this.querySelector('.shorts-player');
    this._skeleton = this.querySelector('.shorts-player__skeleton');

    // Lazy initialization - defer to IntersectionObserver
    this.setupIntersectionObserver();

    this._initialized = true;
  }
}

customElements.define('shorts-player', ShortsPlayer);
```

---

## 3. Intersection Observer Pattern

### Decision
**Single shared IntersectionObserver instance** with dual threshold detection:
- Threshold: `[0, 0.5, 1.0]` for element visibility
- Manual viewport occupancy calculation in callback

### Rationale
- Multiple observers create O(n) overhead where n = number of instances
- Research confirms "Using one IntersectionObserver per element causes memory leaks"
- Single observer provides built-in batching during rapid scroll
- Intersection Observer callbacks are non-blocking and asynchronous
- Viewport height calculation requires custom logic (not natively supported by IntersectionObserver)

### Alternatives Considered
- **Per-component observers**: Rejected due to memory leaks with 100+ instances
- **Scroll event listeners**: Rejected due to constitution ban (Principle IV - forbidden patterns)
- **Multiple thresholds for viewport height**: Not possible - IntersectionObserver only measures element visibility ratio, not viewport occupancy

### Implementation Pattern
```javascript
class VideoIntersectionManager {
  constructor() {
    if (VideoIntersectionManager.instance) {
      return VideoIntersectionManager.instance;
    }

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { threshold: [0, 0.5, 1.0] }
    );

    this.componentMap = new WeakMap(); // Auto GC when elements removed
    VideoIntersectionManager.instance = this;
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const component = this.componentMap.get(entry.target);
      if (!component?.isConnected) return;

      // Dual condition check (FR-002, FR-003)
      const visibilityRatio = entry.intersectionRatio;
      const viewportOccupancy = entry.boundingClientRect.height /
                                 (entry.rootBounds?.height || 1);

      const shouldPlay = visibilityRatio > 0.5 && viewportOccupancy > 0.5;

      if (shouldPlay !== component._isPlaying) {
        // Defer heavy operations to avoid blocking callback
        requestIdleCallback(() => {
          component.updatePlayState(shouldPlay);
        }, { timeout: 50 });
      }
    });
  }

  observe(element, component) {
    this.componentMap.set(element, component);
    this.observer.observe(element);
  }

  unobserve(element) {
    this.observer.unobserve(element);
    this.componentMap.delete(element);
  }
}
```

### Critical Performance Requirements
- Callback execution must be <16ms (PR-002)
- Use `requestIdleCallback()` for heavy operations
- Early bailout checks before video operations
- Never call `getBoundingClientRect()` inside callbacks (use `entry.boundingClientRect`)

---

## 4. HLS.js Integration Strategy

### Decision
**Conditional loading with aggressive cleanup**:
- Native HLS for Safari (detect with `canPlayType()`)
- HLS.js for Chrome/Firefox (detect with `Hls.isSupported()`)
- Deferred cleanup with 200ms grace period for scroll bounces
- Object pooling for video elements (limit: 3-5 instances)

### Rationale
- Native HLS on Safari is more efficient (no MediaSource overhead)
- HLS.js has known memory leaks requiring explicit `destroy()` calls
- Rapid create/destroy cycles during scrolling cause performance degradation
- 200ms deferred cleanup handles scroll direction changes gracefully
- Object pooling amortizes allocation costs

### Alternatives Considered
- **Always use HLS.js**: Rejected - unnecessary overhead on Safari
- **Immediate cleanup**: Rejected - causes janky experience during scroll bounces
- **No object pooling**: Rejected - creates layout thrashing with 100+ instances

### HLS.js Configuration (Scroll-Optimized)
```javascript
new Hls({
  debug: false,
  enableWorker: true,              // Offload parsing to Web Worker

  // ABR - Conservative for mobile
  startLevel: -1,                  // Auto-select (usually lowest)
  capLevelToPlayerSize: true,      // Match quality to player dimensions

  // Buffer - Aggressive for scroll
  maxBufferLength: 10,             // Only 10 seconds ahead
  maxMaxBufferLength: 20,          // Hard cap at 20 seconds
  backBufferLength: 5,             // Minimal back buffer

  // Bandwidth - Start conservative
  abrEwmaDefaultEstimate: 500000,  // Start at 500kbps
  abrBandWidthFactor: 0.7,         // Use 70% of estimated bandwidth

  // Loading
  startFragPrefetch: false,        // Don't prefetch (save bandwidth)
  testBandwidth: false,            // Don't test on startup

  // Limits
  maxBufferSize: 30 * 1000 * 1000, // 30MB buffer limit
})
```

### Cleanup Sequence (Critical)
1. Stop observation → 2. Destroy HLS → 3. Pause video → 4. Clear src → 5. Call load() → 6. Remove element

```javascript
_cleanupPlayer() {
  // 1. Stop observation FIRST to prevent callbacks during cleanup
  if (this._observer) {
    this._observer.unobserve(this);
  }

  // 2. Destroy HLS BEFORE clearing src
  if (this._hlsInstance) {
    this._hlsInstance.stopLoad();
    this._hlsInstance.detachMedia();
    this._hlsInstance.destroy();
    this._hlsInstance = null;
  }

  // 3. Pause playback
  if (this._videoElement) {
    this._videoElement.pause();
  }

  // 4. Clear source and release media buffers
  if (this._videoElement) {
    this._videoElement.removeAttribute('src');
    this._videoElement.src = '';
    this._videoElement.load(); // CRITICAL: releases media buffers
    this._videoElement.remove();
    this._videoElement = null;
  }
}
```

---

## 5. Video Element Memory Management

### Decision
**Object pooling with aggressive cleanup**

### Rationale
- Creating/destroying DOM elements is extremely slow (especially video)
- Browser memory leaks documented in Chrome (#255456, #969049) and Firefox (#1054170)
- Object pooling reduces allocation overhead by ~10x
- Virtual scrolling with element reuse is industry standard (Facebook, YouTube)
- Scroll feeds benefit from reuse: users often scroll back

### Alternatives Considered
- **Create/destroy per instance**: Rejected - causes layout thrashing
- **Keep all elements in DOM with display:none**: Rejected - doesn't free memory
- **Large pool (10+ elements)**: Rejected - wastes memory on brief scroll views

### Pool Configuration
- **Pool size**: 3-5 video elements (covers viewport + 1-2 offscreen)
- **Cleanup trigger**: <50% visible OR <50% viewport height
- **Cleanup delay**: 200ms grace period (handles scroll bounces)

### Browser-Specific Quirks
- **Firefox**: Use `preload="none"` (most aggressive memory consumer, 30-80MB per HD video with preload="auto")
- **Chrome**: Generally better cleanup, but still leaks with repeated cycles
- **Safari**: Best memory management, use native HLS

### Implementation Pattern
```javascript
class VideoPool {
  constructor(maxSize = 5) {
    this.pool = [];
    this.active = new Set();
    this.maxSize = maxSize;
  }

  acquire() {
    let video = this.pool.pop();
    if (!video) {
      video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('preload', 'none'); // Critical for Firefox
      video.className = 'shorts-player__video';
    }
    this.active.add(video);
    return video;
  }

  release(video) {
    if (!this.active.has(video)) return;

    // Aggressive cleanup before returning to pool
    video.pause();
    video.removeAttribute('src');
    video.src = '';
    video.load(); // Force media buffer release

    this.active.delete(video);
    if (this.pool.length < this.maxSize) {
      this.pool.push(video);
    }
  }
}
```

---

## 6. Skeleton UI Implementation (Light DOM)

### Decision
**Static CSS gradient** with global stylesheet

### Rationale
- Static gradients have zero CPU/GPU cost during scrolling
- Animated skeletons cause "absurd CPU hit" (research evidence)
- With 100+ instances, animation overhead compounds significantly
- Spec states "simple grey gradient" - no animation required
- Light DOM uses global styles for all instances (single parse, shared rendering)

### Alternatives Considered
- **Shadow DOM with Constructable Stylesheets**: Rejected - 2x rendering penalty
- **Canvas-based**: Rejected - requires JavaScript, CPU-intensive
- **Animated shimmer**: Rejected - ongoing GPU cost with 100+ instances
- **SVG gradients**: Rejected - more complex than CSS, no performance benefit
- **`will-change` property**: Rejected - enforces continuous memory allocation

### Global CSS Pattern
```css
/* Skeleton placeholder - static gradient */
.shorts-player__skeleton {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    #e0e0e0 0%,
    #f5f5f5 50%,
    #e0e0e0 100%
  );
  transition: opacity 200ms ease-out;
}

.shorts-player__skeleton.hidden {
  opacity: 0;
}

/* Video overlay */
.shorts-player__video {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.shorts-player__video.loaded {
  opacity: 1;
}
```

### Layout Shift Prevention
- **`aspect-ratio`**: Reserves space before video loads (modern CSS)
- **`contain: layout paint size`**: Isolates rendering
- **`position: absolute`**: Overlay video on skeleton without layout shift
- **Result**: Zero Cumulative Layout Shift (CLS)

### Skeleton-to-Video Transition
```javascript
async _showVideo() {
  const video = this._videoElement;
  const skeleton = this._skeleton;

  // Wait for video ready
  await new Promise(resolve => {
    if (video.readyState >= 2) resolve();
    else video.addEventListener('loadeddata', resolve, { once: true });
  });

  // Crossfade (GPU-accelerated via opacity)
  video.classList.add('loaded');
  skeleton.classList.add('hidden');

  // Cleanup skeleton after transition
  setTimeout(() => {
    if (skeleton.parentNode) {
      skeleton.remove();
    }
  }, 200);
}
```

---

## 7. Lifecycle Optimization

### Decision
Use lightweight lifecycle callbacks with deferred initialization

### Implementation Pattern
```javascript
// Shared template - created once at module level
const SHARED_TEMPLATE = document.createElement('template');
SHARED_TEMPLATE.innerHTML = `
  <div class="shorts-player">
    <div class="shorts-player__skeleton"></div>
  </div>
`;

class ShortsPlayer extends HTMLElement {
  // Minimal observed attributes
  static observedAttributes = ['src', 'aspect-ratio'];

  constructor() {
    super();
    // ONLY set initial state - no DOM access
    this._abortController = null;
    this._initialized = false;
    this._isPlaying = false;
  }

  connectedCallback() {
    if (this._initialized) return;

    // Fast template cloning
    this.appendChild(SHARED_TEMPLATE.content.cloneNode(true));

    // Apply CSS containment
    this.style.contain = 'layout paint size';
    const ratio = this.getAttribute('aspect-ratio') || '9/16';
    this.style.aspectRatio = ratio;

    // Cache references
    this._container = this.querySelector('.shorts-player');
    this._skeleton = this.querySelector('.shorts-player__skeleton');

    // Setup event listeners with AbortController
    this._abortController = new AbortController();
    const { signal } = this._abortController;

    // Passive listeners for scroll performance
    this.addEventListener('touchstart', this.handleTouch, {
      passive: true,
      signal
    });

    // Setup IntersectionObserver (lazy video creation)
    this.setupIntersectionObserver();

    this._initialized = true;
  }

  disconnectedCallback() {
    // Cleanup with microtask (handles DOM moves vs removals)
    queueMicrotask(() => {
      if (!this.isConnected) {
        this._abortController?.abort(); // Remove ALL listeners
        this._cleanupPlayer();
      }
    });
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._initialized) return;

    // Batch updates using requestAnimationFrame
    if (!this._updateScheduled) {
      this._updateScheduled = true;
      requestAnimationFrame(() => {
        this.update();
        this._updateScheduled = false;
      });
    }
  }

  handleTouch = (e) => {
    // Passive listener - cannot call preventDefault
  };
}

customElements.define('shorts-player', ShortsPlayer);
```

---

## 8. Performance Validation Strategy

### Decision
Use Chrome DevTools + Playwright for automated testing

### Memory Testing
```javascript
test('should not leak memory after scrolling', async ({ page }) => {
  await page.goto('/scroll-feed.html');

  const initialMemory = await page.evaluate(() =>
    performance.memory.usedJSHeapSize
  );

  // Scroll through 100 videos
  for (let i = 0; i < 100; i++) {
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(100);
  }

  // Force GC (requires --expose-gc flag)
  await page.evaluate(() => window.gc && window.gc());

  const finalMemory = await page.evaluate(() =>
    performance.memory.usedJSHeapSize
  );

  const growth = ((finalMemory - initialMemory) / initialMemory) * 100;
  expect(growth).toBeLessThan(10); // SC-005 requirement
});
```

### Frame Rate Testing
```javascript
test('should maintain 60fps during rapid scroll', async ({ page }) => {
  await page.goto('/scroll-feed.html');

  const { fps, frameDrops } = await page.evaluate(async () => {
    const frames = [];
    let lastTime = performance.now();

    return new Promise((resolve) => {
      let count = 0;
      const measureFrame = (time) => {
        const delta = time - lastTime;
        frames.push(1000 / delta);
        lastTime = time;

        // Rapid scroll during measurement
        if (count < 50) {
          window.scrollBy(0, 1000);
          count++;
          requestAnimationFrame(measureFrame);
        } else {
          const avgFps = frames.reduce((a, b) => a + b) / frames.length;
          const drops = frames.filter(f => f < 55).length;
          resolve({ fps: avgFps, frameDrops: drops });
        }
      };

      requestAnimationFrame(measureFrame);
    });
  });

  expect(fps).toBeGreaterThan(58); // PR-001 requirement
  expect(frameDrops).toBe(0); // SC-001 requirement
});
```

### Intersection Timing Testing
```javascript
test('should auto-play within 200ms', async ({ page }) => {
  await page.goto('/scroll-feed.html');

  const timing = await page.evaluate(async () => {
    const player = document.querySelector('shorts-player');
    const startTime = performance.now();

    // Scroll into view
    player.scrollIntoView({ behavior: 'instant', block: 'center' });

    // Wait for play event
    const video = player.querySelector('video');
    await new Promise(resolve => {
      video.addEventListener('play', resolve, { once: true });
    });

    return performance.now() - startTime;
  });

  expect(timing).toBeLessThan(200); // SC-002 requirement
});
```

---

## Summary: Technical Decisions

| Area | Decision | Key Requirement Met |
|------|----------|---------------------|
| **DOM Architecture** | Light DOM with shared template constant | Principle I (2x faster rendering) |
| **Styling** | Global CSS for all component styles | Light DOM requirement, single parse |
| **Template** | Module-level `SHARED_TEMPLATE` constant | Fast cloning, no DOM dependency |
| **Testing** | Playwright component + E2E testing | Principle III (TDD requirement) |
| **Intersection Observer** | Single shared instance, WeakMap, dual thresholds | PR-002 (<16ms callbacks) |
| **HLS Integration** | Conditional native/hls.js, deferred cleanup, pooling | FR-008, FR-009, FR-010 |
| **Memory Management** | Object pooling (3-5 elements), aggressive cleanup | PR-003, SC-005 (<10% growth) |
| **Skeleton UI** | Static CSS gradient in global stylesheet | PR-005 (instant render), SC-004 (no whiteout) |
| **Lifecycle** | Lightweight callbacks, AbortController, batched updates | PR-001 (60fps scrolling) |
| **Performance Testing** | Automated Playwright tests for FPS, memory, timing | SC-001, SC-002, SC-005 |

---

## Next Phase: Design Artifacts

Phase 1 will generate:
- **data-model.md**: Entity definitions for Video Player Instance, Skeleton Placeholder
- **contracts/**: Component API definition (HTML attributes, JavaScript properties, events)
- **quickstart.md**: Developer guide with code examples

All design decisions are now research-backed and align with constitution principles.
