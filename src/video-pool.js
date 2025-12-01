/**
 * VideoPool - Singleton pool of reusable HTMLVideoElement instances
 * Implements object pooling for performance (research.md:323-358, data-model.md:221-254)
 */

class VideoPool {
  constructor(maxSize = 5) {
    // Singleton pattern
    if (VideoPool.instance) {
      return VideoPool.instance;
    }

    this.pool = []; // Available video elements
    this.active = new Set(); // Currently active elements
    this.maxSize = maxSize; // Maximum pool size (data-model.md:234)

    VideoPool.instance = this;
  }

  /**
   * Acquire video element from pool or create new (data-model.md:237-240)
   */
  acquire() {
    let video = this.pool.pop();

    if (!video) {
      // Create new video element (data-model.md:239, research.md:334-338)
      video = document.createElement('video');
      video.setAttribute('playsinline', ''); // iOS inline playback
      video.setAttribute('muted', ''); // Required for autoplay
      video.setAttribute('preload', 'none'); // Critical for Firefox (research.md:318)
      video.className = 'shorts-player__video';
    }

    this.active.add(video);
    return video;
  }

  /**
   * Clean video and return to pool (data-model.md:242-254, research.md:344-357)
   */
  release(video) {
    if (!this.active.has(video)) return;

    // Aggressive cleanup before returning to pool (data-model.md:250-254)
    video.pause();
    video.removeAttribute('src'); // Remove src attribute
    video.src = ''; // Clear src property
    video.load(); // Force media buffer release (critical for memory)

    this.active.delete(video);

    // Only keep if pool not full (data-model.md:254)
    if (this.pool.length < this.maxSize) {
      this.pool.push(video);
    }
    // Otherwise let garbage collector handle it
  }
}

// Export singleton instance
const poolInstance = new VideoPool();

// Export for browser access
if (typeof window !== 'undefined') {
  window.VideoPool = VideoPool;
}

export default poolInstance;
export { VideoPool };
