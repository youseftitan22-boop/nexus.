import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

let sharedDracoLoader: DRACOLoader | null = null;
let sharedGLTFLoader: GLTFLoader | null = null;

/**
 * Initializes and returns a singleton DRACOLoader with background Web Worker decompression.
 * Decompresses Draco-compressed geometry off the main thread to avoid UI stalls.
 */
export function getDracoLoader(): DRACOLoader {
  if (!sharedDracoLoader) {
    sharedDracoLoader = new DRACOLoader();
    // Use official Google Draco Web Workers for main-thread offloading
    sharedDracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    sharedDracoLoader.setDecoderConfig({ type: 'js' });
    
    // Allocate workers based on CPU core availability (capped to 4 to preserve device battery)
    const workerLimit = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? Math.min(navigator.hardwareConcurrency, 4)
      : 2;
    sharedDracoLoader.setWorkerLimit(workerLimit);
    
    // Preload decoding workers in the background
    sharedDracoLoader.preload();
  }
  return sharedDracoLoader;
}

/**
 * Returns a pre-configured GLTFLoader attached to the background Draco Web Worker decoder.
 */
export function getOptimizedGLTFLoader(): GLTFLoader {
  if (!sharedGLTFLoader) {
    sharedGLTFLoader = new GLTFLoader();
    sharedGLTFLoader.setDRACOLoader(getDracoLoader());
  }
  return sharedGLTFLoader;
}

/**
 * Disposes Draco workers if needed during complete app unload.
 */
export function disposeDracoLoader(): void {
  if (sharedDracoLoader) {
    sharedDracoLoader.dispose();
    sharedDracoLoader = null;
    sharedGLTFLoader = null;
  }
}

// Global registry for telemetry and runtime inspection
if (typeof window !== 'undefined') {
  (window as any).__nexus_draco_worker_active = true;
}
