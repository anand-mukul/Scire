/**
 * Face Verification Service
 *
 * Singleton service wrapping the active face verification provider.
 * Manages baseline capture, continuous monitoring, and similarity tracking.
 *
 * To swap providers: change the import on line 11 to a different provider.
 * Example: import { RekognitionProvider } from './providers/rekognitionProvider';
 */

import { FaceApiProvider } from './providers/faceApiProvider';
import type { IFaceVerificationProvider, FaceDetectionResult } from './types';

// ── Configuration ──────────────────────────────────────────────
const DEFAULT_MONITORING_INTERVAL_MS = 30_000; // Check face every 30 seconds
const FACE_SIMILARITY_THRESHOLD = 0.65; // Below this = possible different person

class FaceVerificationService {
  private provider: IFaceVerificationProvider;
  private baseline: number[] | null = null;
  private latestSimilarity: number = 1.0; // Start neutral (no violation)
  private latestDetection: FaceDetectionResult | null = null;
  private monitoringTimer: ReturnType<typeof setInterval> | null = null;
  private _initPromise: Promise<void> | null = null;

  constructor() {
    // ── Swap provider here ──
    // To migrate to AWS Rekognition:
    //   this.provider = new RekognitionProvider();
    this.provider = new FaceApiProvider();
  }

  // ── Initialization ──────────────────────────────────────────

  /**
   * Initialize the face verification provider (load ML models).
   * Safe to call multiple times — will only init once.
   */
  async initialize(): Promise<void> {
    if (this.provider.isInitialized()) return;
    if (this._initPromise) {
      await this._initPromise;
      return;
    }
    this._initPromise = this.provider.initialize();
    await this._initPromise;
  }

  isReady(): boolean {
    return this.provider.isInitialized();
  }

  // ── Baseline Management ─────────────────────────────────────

  /**
   * Detect face and capture the baseline descriptor.
   * Called during calibration/onboarding.
   */
  async captureBaseline(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceDetectionResult> {
    await this.initialize();
    const result = await this.provider.detectFace(input);

    if (result.detected && result.descriptor) {
      this.baseline = result.descriptor;
      this.latestSimilarity = 1.0;
      console.log(
        `[FaceVerification] Baseline captured (${result.descriptor.length}-dim, ` +
        `confidence: ${result.confidence.toFixed(2)})`
      );
    }

    return result;
  }

  /** Set a previously stored baseline (e.g., loaded from backend). */
  setBaseline(descriptor: number[]): void {
    this.baseline = descriptor;
    this.latestSimilarity = 1.0;
  }

  /** Get the baseline descriptor for persistence. */
  getBaseline(): number[] | null {
    return this.baseline;
  }

  hasBaseline(): boolean {
    return this.baseline !== null && this.baseline.length > 0;
  }

  // ── Face Detection ──────────────────────────────────────────

  /**
   * Detect a face in the given input.
   * Does NOT compare to baseline — use verifyFace() for that.
   */
  async detectFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceDetectionResult> {
    await this.initialize();
    const result = await this.provider.detectFace(input);
    this.latestDetection = result;
    return result;
  }

  /**
   * Detect face and compare to baseline.
   * Updates latestSimilarity.
   */
  async verifyFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<{ result: FaceDetectionResult; similarity: number }> {
    const result = await this.detectFace(input);

    if (!result.detected || !result.descriptor) {
      // No face detected — similarity = 0 (triggers FACE_MISSING rules)
      this.latestSimilarity = 0.0;
      return { result, similarity: 0.0 };
    }

    if (!this.baseline) {
      // No baseline yet — can't compare
      return { result, similarity: 1.0 };
    }

    const similarity = this.provider.compareFaces(this.baseline, result.descriptor);
    this.latestSimilarity = similarity;

    if (similarity < FACE_SIMILARITY_THRESHOLD) {
      console.warn(
        `[FaceVerification] Low similarity: ${similarity.toFixed(3)} ` +
        `(threshold: ${FACE_SIMILARITY_THRESHOLD})`
      );
    }

    return { result, similarity };
  }

  // ── Continuous Monitoring ───────────────────────────────────

  /**
   * Start periodic face verification.
   * Silently checks every intervalMs that the same person is still present.
   */
  startMonitoring(
    videoElement: HTMLVideoElement,
    intervalMs: number = DEFAULT_MONITORING_INTERVAL_MS
  ): void {
    this.stopMonitoring(); // Prevent duplicate timers

    if (!this.baseline) {
      console.warn('[FaceVerification] Cannot start monitoring without baseline');
      return;
    }

    console.log(`[FaceVerification] Monitoring started (every ${intervalMs / 1000}s)`);

    this.monitoringTimer = setInterval(async () => {
      try {
        // Don't check if video is paused or not playing
        if (videoElement.paused || videoElement.ended || videoElement.readyState < 2) {
          return;
        }

        await this.verifyFace(videoElement);
      } catch (error) {
        console.error('[FaceVerification] Monitoring check failed:', error);
      }
    }, intervalMs);
  }

  /** Stop continuous monitoring. */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('[FaceVerification] Monitoring stopped');
    }
  }

  /** Whether monitoring is currently active. */
  isMonitoring(): boolean {
    return this.monitoringTimer !== null;
  }

  // ── Getters ─────────────────────────────────────────────────

  /** Latest face similarity score (0-1). Used by integrityService. */
  getLatestSimilarity(): number {
    return this.latestSimilarity;
  }

  /** Latest face detection result. */
  getLatestDetection(): FaceDetectionResult | null {
    return this.latestDetection;
  }

  // ── Cleanup ─────────────────────────────────────────────────

  /** Full cleanup: stop monitoring, release provider resources, clear state. */
  dispose(): void {
    this.stopMonitoring();
    this.provider.dispose();
    this.baseline = null;
    this.latestSimilarity = 1.0;
    this.latestDetection = null;
    this._initPromise = null;
  }
}

// ── Singleton Export ─────────────────────────────────────────
export const faceVerificationService = new FaceVerificationService();
