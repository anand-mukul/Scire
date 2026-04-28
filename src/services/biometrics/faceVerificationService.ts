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
const DEFAULT_MONITORING_INTERVAL_MS = 3000; // Check face every 3 seconds
const FACE_SIMILARITY_THRESHOLD = 0.65; // Below this = possible different person

class FaceVerificationService {
  private provider: IFaceVerificationProvider;
  private baseline: number[] | null = null;
  private latestSimilarity: number = 1.0; // Start neutral (no violation)
  private latestDetection: FaceDetectionResult | null = null;
  private monitoringTimer: ReturnType<typeof setInterval> | null = null;
  private _initPromise: Promise<void> | null = null;
  private currentVideoElement: HTMLVideoElement | null = null;

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

  // Consecutive failure counter — only emit violations after sustained failures
  private _consecutiveFailures: number = 0;
  private static readonly CONSECUTIVE_FAILURE_THRESHOLD = 3; // 3 checks × 3s = 9s

  /**
   * Start periodic face verification.
   * Silently checks every intervalMs that the same person is still present.
   * Only flags a violation after 3+ consecutive failures (9+ seconds of missing/mismatched face).
   */
  public startMonitoring(
    videoElement: HTMLVideoElement,
    intervalMs: number = DEFAULT_MONITORING_INTERVAL_MS
  ): void {
    this.stopMonitoring(); // Prevent duplicate timers

    if (!this.baseline) {
      console.warn('[FaceVerification] No baseline found. Identity matching is disabled, but general face presence monitoring will continue.');
    }

    console.log(`[FaceVerification] Monitoring started (every ${intervalMs / 1000}s)`);

    this.currentVideoElement = videoElement;
    this._consecutiveFailures = 0; // Reset on start

    this.monitoringTimer = setInterval(async () => {
      try {
        // Don't check if video is paused or not playing
        if (videoElement.paused || videoElement.ended || videoElement.readyState < 2) {
          return;
        }

        const { result, similarity } = await this.verifyFace(videoElement);

        if (similarity < FACE_SIMILARITY_THRESHOLD) {
          this._consecutiveFailures++;

          if (this._consecutiveFailures >= FaceVerificationService.CONSECUTIVE_FAILURE_THRESHOLD) {
            // Sustained failure — fire violation event
            window.dispatchEvent(new CustomEvent('viva:face_missing', {
              detail: { similarity, consecutiveFailures: this._consecutiveFailures }
            }));
          } else {
            // Transient failure — log but don't flag yet
            console.debug(
              `[FaceVerification] Transient miss (${this._consecutiveFailures}/${FaceVerificationService.CONSECUTIVE_FAILURE_THRESHOLD}), ` +
              `similarity: ${similarity.toFixed(3)}`
            );
          }
        } else {
          // Success — reset counter and broadcast presence
          this._consecutiveFailures = 0;
          window.dispatchEvent(new CustomEvent('viva:face_present', { detail: { similarity } }));
        }
      } catch (error) {
        console.error('[FaceVerification] Monitoring check failed:', error);
        // Don't increment failure counter on technical errors (model glitch, canvas error)
      }
    }, intervalMs);
  }

  /** Stop continuous monitoring. */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      this._consecutiveFailures = 0;
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

  /** Captures a low-resolution base64 JPEG from the active video stream for backend verification. */
  getSnapshotBase64(): string | null {
    if (!this.currentVideoElement || this.currentVideoElement.readyState < 2) {
      return null;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.currentVideoElement, 0, 0, 320, 240);
        return canvas.toDataURL('image/jpeg', 0.6);
      }
    } catch (err) {
      console.warn('[FaceVerification] Snapshot failed:', err);
    }
    return null;
  }

  // ── Cleanup ─────────────────────────────────────────────────

  /** Full cleanup: stop monitoring, release provider resources, clear state. */
  dispose(): void {
    this.stopMonitoring();
    this.provider.dispose();
    this.baseline = null;
    this.latestSimilarity = 1.0;
    this.latestDetection = null;
    this.currentVideoElement = null;
    this._initPromise = null;
  }
}

// ── Singleton Export ─────────────────────────────────────────
export const faceVerificationService = new FaceVerificationService();
