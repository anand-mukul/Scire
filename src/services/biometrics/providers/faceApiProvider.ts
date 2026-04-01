/**
 * Face-api.js Provider
 *
 * Implements IFaceVerificationProvider using @vladmandic/face-api.
 * Models are loaded from CDN (jsdelivr) at runtime — no need to
 * bundle models in the app, keeping the Vercel deployment small.
 *
 * To swap to AWS Rekognition or Azure Face, create a new provider
 * implementing IFaceVerificationProvider and update faceVerificationService.ts.
 */

import type { IFaceVerificationProvider, FaceDetectionResult } from '../types';

// CDN URL for face-api.js models (serves from npm package via jsdelivr)
const MODEL_URL =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// We dynamically import face-api to avoid SSR issues in Next.js
let faceapi: typeof import('@vladmandic/face-api') | null = null;

export class FaceApiProvider implements IFaceVerificationProvider {
  private _initialized = false;
  private _initializing: Promise<void> | null = null;

  isInitialized(): boolean {
    return this._initialized;
  }

  async initialize(): Promise<void> {
    // Prevent duplicate initialization
    if (this._initialized) return;
    if (this._initializing) {
      await this._initializing;
      return;
    }

    this._initializing = this._doInit();
    await this._initializing;
  }

  private async _doInit(): Promise<void> {
    try {
      // Dynamic import to avoid SSR/Node.js issues
      const mod = await import('@vladmandic/face-api');
      faceapi = mod;

      // Load the three models we need:
      // 1. SSD MobileNet v1 — face detection
      // 2. FaceLandmark68 — facial landmark detection
      // 3. FaceRecognition — 128-dim face descriptor extraction
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      this._initialized = true;
      console.log('[FaceApiProvider] Models loaded successfully from CDN');
    } catch (error) {
      this._initializing = null;
      console.error('[FaceApiProvider] Failed to initialize:', error);
      throw error;
    }
  }

  async detectFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceDetectionResult> {
    if (!this._initialized || !faceapi) {
      console.warn('[FaceApiProvider] Not initialized, calling initialize()');
      await this.initialize();
    }

    if (!faceapi) {
      return { detected: false, descriptor: null, confidence: 0 };
    }

    try {
      // Detect single face with landmarks and descriptor
      const detection = await faceapi
        .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.5,  // Reasonable threshold for exam conditions
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return { detected: false, descriptor: null, confidence: 0 };
      }

      const box = detection.detection.box;
      const landmarks = detection.landmarks.positions;

      // ── Head Pose Estimation (Yaw & Pitch) ──
      // Approximation using 68-point landmarks:
      // Left Eye center (avg 36-41), Right Eye center (avg 42-47), Nose Tip (30), Jaw bottom (8)
      let headPose;
      if (landmarks && landmarks.length === 68) {
        let leftEyeX = 0, leftEyeY = 0;
        let rightEyeX = 0, rightEyeY = 0;
        
        for (let i = 36; i <= 41; i++) { leftEyeX += landmarks[i].x; leftEyeY += landmarks[i].y; }
        for (let i = 42; i <= 47; i++) { rightEyeX += landmarks[i].x; rightEyeY += landmarks[i].y; }
        
        leftEyeX /= 6; leftEyeY /= 6;
        rightEyeX /= 6; rightEyeY /= 6;

        const noseX = landmarks[30].x;
        const noseY = landmarks[30].y;
        const jawY = landmarks[8].y;

        // Yaw: Horizontal ratio of Nose to Eyes
        const eyeDist = rightEyeX - leftEyeX;
        const yaw = eyeDist > 0 ? (noseX - leftEyeX) / eyeDist - 0.5 : 0; // Negative = looking right (screen left), Positive = looking left

        // Pitch: Vertical ratio of Nose to Eyes vs Jaw
        const avgEyeY = (leftEyeY + rightEyeY) / 2;
        const faceHeight = jawY - avgEyeY;
        const pitch = faceHeight > 0 ? (noseY - avgEyeY) / faceHeight - 0.5 : 0; // Positive = looking down

        // Roll: Angle between eyes
        const roll = Math.atan2(rightEyeY - leftEyeY, rightEyeX - leftEyeX);

        headPose = { yaw, pitch, roll };
      }

      // ── Illumination Extraction (For Screen Reflection) ──
      let illuminationVariance = 0;
      if (input instanceof HTMLVideoElement || input instanceof HTMLCanvasElement || input instanceof HTMLImageElement) {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Sample a 32x32 center patch of the face
            canvas.width = 32;
            canvas.height = 32;
            const drawX = Math.max(0, box.x);
            const drawY = Math.max(0, box.y);
            const drawW = Math.max(1, box.width);
            const drawH = Math.max(1, box.height);
            
            ctx.drawImage(input, drawX, drawY, drawW, drawH, 0, 0, 32, 32);
            const imageData = ctx.getImageData(0, 0, 32, 32);
            const data = imageData.data;
            let sumLuminance = 0;
            
            // Calculate average luminance (brightness)
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i+1], b = data[i+2];
              // Relative luminance (Rec. 709)
              const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              sumLuminance += L;
            }
            illuminationVariance = sumLuminance / (1024); // avg brightness 0-255
          }
        } catch(e) { /* ignore canvas tainted errors */ }
      }

      return {
        detected: true,
        descriptor: Array.from(detection.descriptor),
        confidence: detection.detection.score,
        boundingBox: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        headPose,
        illuminationVariance
      };
    } catch (error) {
      console.error('[FaceApiProvider] Detection failed:', error);
      return { detected: false, descriptor: null, confidence: 0 };
    }
  }

  compareFaces(baseline: number[], current: number[]): number {
    if (!baseline || !current || baseline.length !== current.length) {
      return 0;
    }

    // Euclidean distance between descriptors
    let sum = 0;
    for (let i = 0; i < baseline.length; i++) {
      const diff = baseline[i] - current[i];
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);

    // Convert distance to similarity score [0, 1]
    // face-api.js descriptors: typical same-person distance < 0.6, different person > 0.6
    // Max meaningful distance is ~1.6
    const similarity = Math.max(0, Math.min(1, 1 - distance / 1.6));

    return similarity;
  }

  dispose(): void {
    // face-api.js doesn't have a dispose method for models,
    // but we reset our state so re-init is possible
    this._initialized = false;
    this._initializing = null;
    faceapi = null;
    console.log('[FaceApiProvider] Disposed');
  }
}
