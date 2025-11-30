# Quickstart Guide: Shorts Player Web Component

**Phase 1 Output** - Developer guide for implementing the shorts player

**Date**: 2025-11-29

---

## Quick Start

### 1. Basic Setup

**index.html**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shorts Player Demo</title>

  <!-- Global styles -->
  <link rel="stylesheet" href="src/shorts-player.css">
</head>
<body>
  <shorts-player
    src="https://example.com/video.mp4"
    poster="https://example.com/poster.jpg">
  </shorts-player>

  <!-- HLS.js for streaming support -->
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

  <!-- Component -->
  <script type="module" src="src/shorts-player.js"></script>
</body>
</html>
```

**src/shorts-player.css** (Global styles):
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

.shorts-player__poster {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.shorts-player__poster.loaded {
  opacity: 1;
}

.shorts-player__poster.hidden {
  opacity: 0;
}

.shorts-player__video {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.shorts-player__video.loaded {
  opacity: 1;
}
```

**src/shorts-player.js**:
```javascript
// Shared template - created once at module level
const SHARED_TEMPLATE = document.createElement('template');
SHARED_TEMPLATE.innerHTML = `<div class="shorts-player"></div>`;

class ShortsPlayer extends HTMLElement {
  static observedAttributes = ['src', 'poster', 'aspect-ratio'];

  constructor() {
    super();
    this._initialized = false;
  }

  connectedCallback() {
    if (this._initialized) return;

    // Clone template
    this.appendChild(SHARED_TEMPLATE.content.cloneNode(true));

    // Apply aspect ratio
    const ratio = this.getAttribute('aspect-ratio') || '9/16';
    this.style.aspectRatio = ratio;

    // Setup (implementation details from research/data-model)
    this.setupIntersectionObserver();
    this.loadPosterIfPresent();

    this._initialized = true;
  }

  // ... rest of implementation
}

customElements.define('shorts-player', ShortsPlayer);
```

---

## Usage Examples

### Single Video

```html
<shorts-player
  src="video.mp4"
  poster="poster.jpg">
</shorts-player>
```

### Scroll Feed

```html
<div class="video-feed">
  <shorts-player src="video1.mp4" poster="poster1.jpg"></shorts-player>
  <shorts-player src="video2.mp4" poster="poster2.jpg"></shorts-player>
  <shorts-player src="video3.m3u8" poster="poster3.jpg"></shorts-player>
  <!-- Add as many as needed -->
</div>

<style>
  .video-feed {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  shorts-player {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }
</style>
```

### Different Aspect Ratios

```html
<!-- Vertical (default) -->
<shorts-player src="video.mp4" aspect-ratio="9/16"></shorts-player>

<!-- Horizontal -->
<shorts-player src="video.mp4" aspect-ratio="16/9"></shorts-player>

<!-- Square -->
<shorts-player src="video.mp4" aspect-ratio="1/1"></shorts-player>
```

---

## Common Patterns

### Pattern 1: External Play/Pause Controls

```html
<div class="player-container">
  <shorts-player id="player" src="video.mp4" poster="poster.jpg"></shorts-player>

  <div class="controls">
    <button id="play-btn">Play</button>
    <button id="pause-btn">Pause</button>
    <span id="status">Paused</span>
  </div>
</div>

<script>
  const player = document.getElementById('player');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const status = document.getElementById('status');

  playBtn.addEventListener('click', () => {
    player.play().catch(err => {
      console.error('Play failed:', err);
      alert('Autoplay blocked. Please interact with the page first.');
    });
  });

  pauseBtn.addEventListener('click', () => {
    player.pause();
  });

  // Update status
  player.addEventListener('play', () => {
    status.textContent = 'Playing';
  });

  player.addEventListener('pause', () => {
    status.textContent = 'Paused';
  });
</script>
```

---

### Pattern 2: Dynamic Source Swapping

```javascript
const player = document.querySelector('shorts-player');

function changeVideo(newSrc, newPoster) {
  player.src = newSrc;
  player.poster = newPoster;
  // Component automatically handles cleanup and reload
}

// Example: Next video button
document.getElementById('next-btn').addEventListener('click', () => {
  changeVideo('next-video.mp4', 'next-poster.jpg');
});
```

---

### Pattern 3: Analytics Integration

```javascript
const player = document.querySelector('shorts-player');
let playStartTime = null;
let totalWatchTime = 0;

player.addEventListener('play', () => {
  playStartTime = Date.now();

  analytics.track('video_play', {
    videoId: extractVideoId(player.src),
    timestamp: new Date().toISOString()
  });
});

player.addEventListener('pause', () => {
  if (playStartTime) {
    const sessionDuration = Date.now() - playStartTime;
    totalWatchTime += sessionDuration;

    analytics.track('video_pause', {
      videoId: extractVideoId(player.src),
      sessionDuration,
      totalWatchTime
    });

    playStartTime = null;
  }
});

player.addEventListener('visibilitychange', (e) => {
  analytics.track('visibility_change', {
    videoId: extractVideoId(player.src),
    visible: e.detail.visible,
    visibilityRatio: e.detail.visibilityRatio,
    viewportOccupancy: e.detail.viewportOccupancy
  });
});

function extractVideoId(src) {
  return src.split('/').pop().split('.')[0];
}
```

---

### Pattern 4: Error Handling & Retry

```javascript
const player = document.querySelector('shorts-player');
let retryCount = 0;
const MAX_RETRIES = 3;

player.addEventListener('error', (e) => {
  const { type, message } = e.detail;

  console.error(`[${type}] ${message}`);

  if (type === 'video' || type === 'hls') {
    handleVideoError();
  } else if (type === 'poster') {
    console.warn('Poster load failed, skeleton will show');
  }
});

function handleVideoError() {
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`);

    setTimeout(() => {
      player.reload();
    }, 2000 * retryCount); // Exponential backoff
  } else {
    showErrorUI();
  }
}

function showErrorUI() {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-overlay';
  errorDiv.innerHTML = `
    <p>Video failed to load</p>
    <button onclick="location.reload()">Reload Page</button>
  `;
  player.appendChild(errorDiv);
}
```

---

## Custom Styling

### Customize Skeleton Gradient

```css
shorts-player {
  /* Dark theme skeleton */
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
}
```

### Responsive Sizing

```css
@media (max-width: 768px) {
  shorts-player {
    width: 100vw;
  }
}

@media (min-width: 769px) {
  shorts-player {
    width: 500px;
    margin: 0 auto;
  }
}
```

---

## Performance Tips

### 1. Optimize Poster Images

```bash
# Resize to player dimensions
convert poster.jpg -resize 500x889 poster-optimized.jpg

# Use WebP format
cwebp poster.jpg -q 80 -o poster.webp

# Target: ~50KB per poster
```

### 2. Preconnect to Video CDN

```html
<head>
  <!-- Establish early connection to video CDN -->
  <link rel="preconnect" href="https://video-cdn.example.com">
  <link rel="dns-prefetch" href="https://video-cdn.example.com">
</head>
```

---

## Troubleshooting

### Videos not auto-playing

**Check intersection conditions**:
```javascript
player.addEventListener('visibilitychange', (e) => {
  console.log('Visibility ratio:', e.detail.visibilityRatio);
  console.log('Viewport occupancy:', e.detail.viewportOccupancy);
  console.log('Should play:', e.detail.visible);
});
```

**Test manual play** (check for autoplay policy):
```javascript
player.play().catch(err => {
  console.error('Autoplay blocked:', err);
  // User interaction required
});
```

---

### HLS streams not working

**Verify HLS.js is loaded**:
```javascript
console.log('HLS.js available:', typeof Hls !== 'undefined');
console.log('HLS.js supported:', Hls.isSupported());
```

**Check CORS headers**:
```javascript
fetch('stream.m3u8', { mode: 'cors' })
  .then(r => console.log('CORS OK'))
  .catch(e => console.error('CORS error:', e));
```

**Listen for HLS errors**:
```javascript
player.addEventListener('error', (e) => {
  if (e.detail.type === 'hls') {
    console.error('HLS error:', e.detail.message);
  }
});
```

---

### Memory leaks / Performance degradation

**Monitor memory usage**:
```javascript
setInterval(() => {
  if (performance.memory) {
    console.log('Heap:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
  }
}, 5000);
```

---

## Project Structure

```
project/
├── index.html              # Demo page
├── src/
│   ├── shorts-player.js    # Main component (includes inline HLS logic)
│   ├── shorts-player.css   # Global styles
│   ├── intersection-manager.js
│   └── video-pool.js
├── examples/
│   ├── basic.html
│   ├── scroll-feed.html
│   └── hls-demo.html
└── tests/
    ├── unit/
    ├── integration/
    └── stress/
```

---

## Next Steps

- **[Component API Reference](./contracts/component-api.md)**: Full API documentation
- **[Data Model](./data-model.md)**: Internal architecture and state management
- **[Research](./research.md)**: Performance optimizations and design decisions
