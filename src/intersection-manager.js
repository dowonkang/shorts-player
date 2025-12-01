/**
 * VideoIntersectionManager - Singleton observer for all video players
 * Implements shared IntersectionObserver pattern for performance (research.md:153-198)
 */

class VideoIntersectionManager {
  constructor() {
    // Singleton pattern (research.md:154-158)
    if (VideoIntersectionManager.instance) {
      return VideoIntersectionManager.instance;
    }

    // Create IntersectionObserver with thresholds for smooth detection
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: [0, 0.5, 1.0]
      }
    );

    // WeakMap for automatic garbage collection (data-model.md:188)
    this.componentMap = new WeakMap();

    VideoIntersectionManager.instance = this;
  }

  /**
   * Register element for observation (data-model.md:194)
   */
  observe(element, component) {
    this.componentMap.set(element, component);
    this.observer.observe(element);
  }

  /**
   * Stop observing element (data-model.md:195)
   */
  unobserve(element) {
    this.observer.unobserve(element);
    this.componentMap.delete(element);
  }

  /**
   * Process intersection changes (data-model.md:196-218, research.md:168-186)
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      const component = this.componentMap.get(entry.target);
      if (!component?.isConnected) return;

      const shouldPlay = this._checkShouldPlay(entry);

      if (shouldPlay !== component._isPlaying) {
        // Defer heavy operations to avoid blocking callback (research.md:182-185)
        requestIdleCallback(() => {
          if (component.isConnected) {
            component.updatePlayState(shouldPlay, entry);
          }
        }, { timeout: 50 });
      }
    });
  }

  /**
   * Check if video should play based on intersection logic
   * Two scenarios for auto-play (data-model.md:199-218):
   * 1. Normal case: >50% of video area is visible
   * 2. Large video case: Video taller than viewport AND occupies >50% of viewport
   */
  _checkShouldPlay(entry) {
    const visibilityRatio = entry.intersectionRatio; // % of video visible
    const videoHeight = entry.boundingClientRect.height;
    const viewportHeight = entry.rootBounds?.height || 1;

    const videoLargerThanViewport = videoHeight > viewportHeight;

    // Calculate how much of the viewport the visible portion occupies
    const visibleVideoHeight = videoHeight * visibilityRatio;
    const viewportOccupancy = visibleVideoHeight / viewportHeight;

    // OR condition: either scenario triggers play (data-model.md:213-214)
    return visibilityRatio > 0.5 ||
           (videoLargerThanViewport && viewportOccupancy > 0.5);
  }
}

// Export singleton instance
const managerInstance = new VideoIntersectionManager();

// Export for browser access
if (typeof window !== 'undefined') {
  window.VideoIntersectionManager = VideoIntersectionManager;
}

export default managerInstance;
export { VideoIntersectionManager };
