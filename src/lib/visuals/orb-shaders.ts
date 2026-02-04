/**
 * AI Orb Shaders
 * Ported from three_orb.html reference implementation.
 * Soft glowing particle dots with additive blending.
 */

// Core particles - highest intensity
export const coreVertexShader = `
attribute float size;
varying float vAlpha;

void main() {
  vAlpha = 1.0;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * 380.0 / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const coreFragmentShader = `
uniform vec3 color;
varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if (dist > 0.5) discard;
  
  float alpha = (1.0 - dist * 2.0) * vAlpha;
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  
  gl_FragColor = vec4(color, alpha * glow * 1.2);
}
`;

// Inner particles - medium intensity
export const innerVertexShader = `
attribute float size;
varying float vAlpha;

void main() {
  vAlpha = 1.0;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * 350.0 / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const innerFragmentShader = `
uniform vec3 color;
varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if (dist > 0.5) discard;
  
  float alpha = (1.0 - dist * 2.0) * vAlpha;
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  
  gl_FragColor = vec4(color, alpha * glow);
}
`;

// Outer particles - softest intensity
export const outerVertexShader = `
attribute float size;
varying float vAlpha;

void main() {
  vAlpha = 0.7;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * 380.0 / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const outerFragmentShader = `
uniform vec3 color;
varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if (dist > 0.5) discard;
  
  float alpha = (1.0 - dist * 2.0) * vAlpha;
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  
  gl_FragColor = vec4(color, alpha * glow * 0.85);
}
`;
