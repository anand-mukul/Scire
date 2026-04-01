/**
 * Face Verification Provider Interface & Types
 *
 * Defines the contract for face verification providers, enabling
 * easy swapping between face-api.js, AWS Rekognition, Azure Face, etc.
 */

export interface FaceDetectionResult {
  /** Whether a face was detected in the frame */
  detected: boolean;
  /** 128-dim face embedding (descriptor) for comparison. Null if no face found. */
  descriptor: number[] | null;
  /** Detection confidence score 0-1 */
  confidence: number;
  /** Bounding box of the detected face */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Optional head pose estimation for Gaze Tracking */
  headPose?: {
    pitch: number; // up/down
    yaw: number;   // left/right
    roll: number;  // tilt
  };
  /** Illumination variance (brightness score) for Screen Reflection cheat detection */
  illuminationVariance?: number;
}

export interface IFaceVerificationProvider {
  /**
   * Initialize the provider (load ML models, etc.).
   * Must be called before any other method.
   */
  initialize(): Promise<void>;

  /** Whether the provider has been initialized */
  isInitialized(): boolean;

  /**
   * Detect a face in a video/image/canvas element.
   * Returns detection result with embedding if found.
   */
  detectFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceDetectionResult>;

  /**
   * Compare two face descriptors and return similarity score.
   * @returns Similarity score between 0.0 (different person) and 1.0 (same person).
   */
  compareFaces(baseline: number[], current: number[]): number;

  /**
   * Release resources (models, memory, etc.)
   */
  dispose(): void;
}
