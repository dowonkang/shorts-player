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

    // Setup intersection observer (lazy video creation)
    // TODO: Implement in next phase
    // this.setupIntersectionObserver();

    // Load poster if present
    // TODO: Implement in next phase
    // this.loadPosterIfPresent();

    this._initialized = true;
  }

  disconnectedCallback() {
    // Cleanup with microtask (handles DOM moves vs removals) (research.md:506-514)
    queueMicrotask(() => {
      if (!this.isConnected) {
        this._abortController?.abort(); // Remove ALL listeners
        // TODO: Implement full cleanup
        // this._cleanupPlayer();
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
}

// Register custom element
customElements.define('shorts-player', ShortsPlayer);
