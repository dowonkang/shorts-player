/**
 * Shorts Player Web Component
 * High-performance scroll-triggered auto-play video player
 */

// Shared template - created once at module level for performance (research.md:96-102)
const SHARED_TEMPLATE = document.createElement('template');
SHARED_TEMPLATE.innerHTML = `<div class="shorts-player"></div>`;

// Export for testing
if (typeof window !== 'undefined') {
  window.SHARED_TEMPLATE = SHARED_TEMPLATE;
}

class ShortsPlayer extends HTMLElement {
  static observedAttributes = ['src', 'aspect-ratio', 'poster'];

  constructor() {
    super();
    this._initialized = false;
    this._isPlaying = false;
    this._isVisible = false;
    this._videoElement = null;
    this._hlsInstance = null;
    this._posterElement = null;
    this._cleanupTimer = null;
    this._abortController = null;
  }

  connectedCallback() {
    if (this._initialized) return;

    // Fast template cloning (research.md:475-503)
    this.appendChild(SHARED_TEMPLATE.content.cloneNode(true));

    // Apply CSS containment for performance (research.md:111-114)
    this.style.contain = 'layout paint size';
    const ratio = this.getAttribute('aspect-ratio') || '9/16';
    this.style.aspectRatio = ratio;

    // Setup AbortController for event cleanup (research.md:491-497)
    this._abortController = new AbortController();

    // Cache DOM references
    this._container = this.querySelector('.shorts-player');

    // Setup intersection observer (T053 - data-model.md:190-194)
    if (typeof window !== 'undefined' && window.VideoIntersectionManager) {
      window.VideoIntersectionManager.instance.observe(this, this);
    }

    // Load poster if present (T063 - data-model.md:83-85)
    this._loadPosterIfPresent();

    this._initialized = true;
  }

  // T063: Load poster image if poster attribute exists
  _loadPosterIfPresent() {
    const posterUrl = this.getAttribute('poster');
    if (!posterUrl) return;

    // T063: Create HTMLImageElement (data-model.md:161-167)
    const poster = document.createElement('img');
    poster.className = 'shorts-player__poster';
    poster.src = posterUrl;

    // T069: Apply positioning and z-index
    poster.style.position = 'absolute';
    poster.style.width = '100%';
    poster.style.height = '100%';
    poster.style.objectFit = 'cover';
    poster.style.opacity = '0';
    poster.style.zIndex = '2';
    poster.style.transition = 'opacity 200ms ease-out';

    // T065: Fade in on load (data-model.md:83-85)
    poster.addEventListener('load', () => {
      poster.classList.add('loaded');
      poster.style.opacity = '1';
    }, { once: true, signal: this._abortController.signal });

    // T067: Remove poster on error (data-model.md:85, 169-174)
    poster.addEventListener('error', () => {
      console.warn(`[ShortsPlayer] Failed to load poster: ${posterUrl}`);
      if (poster.parentNode) {
        poster.remove();
      }
      this._posterElement = null;
    }, { once: true, signal: this._abortController.signal });

    this.appendChild(poster);
    this._posterElement = poster;
  }

  disconnectedCallback() {
    // Cleanup with microtask (handles DOM moves vs removals) (research.md:506-514)
    queueMicrotask(() => {
      if (!this.isConnected) {
        // T060: Unobserve from VideoIntersectionManager
        if (typeof window !== 'undefined' && window.VideoIntersectionManager) {
          window.VideoIntersectionManager.instance.unobserve(this);
        }

        // Abort all event listeners (T054)
        this._abortController?.abort();

        // TODO: Implement full video cleanup in later phase
        // this._cleanupVideo();

        this._initialized = false;
      }
    });
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._initialized) return;

    // Batch updates using requestAnimationFrame (research.md:521-528)
    if (!this._updateScheduled) {
      this._updateScheduled = true;
      requestAnimationFrame(() => {
        this.update();
        this._updateScheduled = false;
      });
    }
  }

  update() {
    // TODO: Implement attribute change handling
  }

  // T083: Update play state based on visibility (called by VideoIntersectionManager)
  updatePlayState(shouldPlay, entry) {
    if (shouldPlay === this._isPlaying) {
      return; // No state change
    }

    this._isPlaying = shouldPlay;
    this._isVisible = shouldPlay; // Track visibility state

    if (shouldPlay) {
      // T091: Cancel cleanup timer on re-entry (scroll bounce)
      if (this._cleanupTimer) {
        clearTimeout(this._cleanupTimer);
        this._cleanupTimer = null;
      }

      // T083: Create and play video when visible
      if (!this._videoElement) {
        this._createVideo();
      } else {
        // Resume existing video
        this._videoElement.play().catch(err => {
          console.warn('[ShortsPlayer] Play failed:', err.message);
        });
      }
    } else {
      // T087: Auto-pause when <50% visible
      if (this._videoElement) {
        this._videoElement.pause();
      }

      // T089: Schedule cleanup with 200ms grace period (data-model.md:90)
      this._scheduleCleanup();
    }
  }

  // T089: Schedule cleanup with grace period for scroll bounces
  _scheduleCleanup() {
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
    }

    this._cleanupTimer = setTimeout(() => {
      this._cleanupVideo();
      this._cleanupTimer = null;
    }, 200); // 200ms grace period
  }

  // Placeholder for cleanup (will be implemented in T092-T098)
  _cleanupVideo() {
    // TODO: Implement full video cleanup in next section
    console.log('[ShortsPlayer] Cleanup scheduled (not yet implemented)');
  }

  // T072: Create video element from VideoPool (data-model.md:86-88)
  _createVideo() {
    if (this._videoElement) {
      return this._videoElement; // Already created
    }

    // T070: Acquire video from pool
    if (!window.VideoPool?.instance) {
      console.error('[ShortsPlayer] VideoPool not available');
      return null;
    }

    const video = window.VideoPool.instance.acquire();
    video.className = 'shorts-player__video';

    // T074: Assign src
    const src = this.getAttribute('src');
    if (src) {
      video.src = src;
    }

    // T078: Apply video styles
    video.style.position = 'absolute';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.opacity = '0';
    video.style.zIndex = '3';
    video.style.transition = 'opacity 200ms ease-out';

    // T076: Listen for loadeddata event (data-model.md:88)
    video.addEventListener('loadeddata', () => {
      // T077: Add loaded class for fade-in
      video.classList.add('loaded');
      video.style.opacity = '1';

      // T080: Remove poster after video starts playing (data-model.md:88, 160-164)
      if (this._posterElement) {
        setTimeout(() => {
          if (this._posterElement && this._posterElement.parentNode) {
            this._posterElement.remove();
            this._posterElement = null;
          }
        }, 200); // Wait for fade transition
      }

      // Attempt to play
      video.play().catch(err => {
        console.warn('[ShortsPlayer] Auto-play prevented:', err.message);
      });
    }, { once: true, signal: this._abortController.signal });

    this.appendChild(video);
    this._videoElement = video;

    return video;
  }
}

// Register custom element
customElements.define('shorts-player', ShortsPlayer);
