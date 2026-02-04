'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    coreVertexShader, coreFragmentShader,
    innerVertexShader, innerFragmentShader,
    outerVertexShader, outerFragmentShader,
} from '@/lib/visuals/orb-shaders';
import { DeviceTier } from '@/lib/visuals/capability';

interface OrbParticlesProps {
    tier: DeviceTier;
    audioLevel: number;
    targetColor: THREE.Color;
}

// Particle counts based on device tier
const PARTICLE_COUNTS = {
    HIGH: { core: 400, inner: 300, outer: 280 },
    MEDIUM: { core: 200, inner: 150, outer: 140 },
    LOW: { core: 0, inner: 0, outer: 0 },
};

const RADII = { core: 0.8, inner: 1.5, outer: 2.3 };

// Particle data class
class Dot {
    originalPos: THREE.Vector3;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    repulsionForce: THREE.Vector3;
    size: number;
    baseSize: number;
    phase: number;
    speed: number;
    pulsePhase: number;
    layer: 'core' | 'inner' | 'outer';
    hoverScale: number;
    audioReactivity: number;

    constructor(radius: number, layer: 'core' | 'inner' | 'outer') {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);

        this.originalPos = new THREE.Vector3(
            radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.sin(theta) * Math.sin(phi),
            radius * Math.cos(theta)
        );

        this.position = this.originalPos.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.repulsionForce = new THREE.Vector3(0, 0, 0);

        if (layer === 'core') {
            this.size = 0.05 + Math.random() * 0.03;
        } else if (layer === 'inner') {
            this.size = 0.08 + Math.random() * 0.04;
        } else {
            this.size = 0.06 + Math.random() * 0.03;
        }

        this.baseSize = this.size;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = 0.5 + Math.random() * 0.5;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.layer = layer;
        this.hoverScale = 1.0;
        this.audioReactivity = 0.7 + Math.random() * 0.6;
    }

    update(time: number, rotation: number, audioLevel: number) {
        let waveAmp = 0.12;
        if (this.layer === 'core') waveAmp = 0.08;
        else if (this.layer === 'inner') waveAmp = 0.10;

        const wave = Math.sin(time * this.speed + this.phase) * waveAmp;
        const baseRadius = RADII[this.layer];

        let audioExpansion = 0;
        if (this.layer === 'core') {
            audioExpansion = audioLevel * 0.4 * this.audioReactivity;
        } else if (this.layer === 'inner') {
            audioExpansion = audioLevel * 0.5 * this.audioReactivity;
        } else {
            audioExpansion = audioLevel * 0.6 * this.audioReactivity;
        }

        const targetRadius = baseRadius + wave + audioExpansion;

        const rotatedOriginal = this.originalPos.clone();
        let rotSpeed = rotation;
        if (this.layer === 'core') rotSpeed *= 0.5;
        else if (this.layer === 'inner') rotSpeed *= 0.8;

        rotatedOriginal.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);

        const targetPos = rotatedOriginal.normalize().multiplyScalar(targetRadius);

        this.repulsionForce.multiplyScalar(0.92);
        this.hoverScale += (1.0 - this.hoverScale) * 0.1;

        this.velocity.add(this.repulsionForce);
        this.velocity.multiplyScalar(0.9);

        const spring = targetPos.clone().sub(this.position).multiplyScalar(0.06);
        this.velocity.add(spring);

        this.position.add(this.velocity);

        const pulse = Math.sin(time * 2 + this.pulsePhase) * 0.15;
        const audioPulse = audioLevel * 0.3 * this.audioReactivity;
        this.size = this.baseSize * (1 + pulse * 0.3 + audioPulse) * this.hoverScale;
    }
}

// Single particle layer component
const ParticleLayer: React.FC<{
    count: number;
    radius: number;
    layer: 'core' | 'inner' | 'outer';
    vertexShader: string;
    fragmentShader: string;
    audioLevel: number;
    targetColor: THREE.Color;
    autoRotation: React.MutableRefObject<number>;
    smoothAudioLevel: React.MutableRefObject<number>;
}> = ({ count, radius, layer, vertexShader, fragmentShader, audioLevel, targetColor, autoRotation, smoothAudioLevel }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const particlesRef = useRef<Dot[]>([]);
    const currentColor = useRef(new THREE.Color(0x0f766e));

    // Initialize particles
    useEffect(() => {
        particlesRef.current = Array.from({ length: count }, () => new Dot(radius, layer));
    }, [count, radius, layer]);

    // Create geometry with attributes
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        // Initialize with random positions on sphere
        for (let i = 0; i < count; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
            positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            positions[i * 3 + 2] = radius * Math.cos(theta);
            sizes[i] = 0.05;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geo;
    }, [count, radius]);

    // Create material
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x0f766e) },
                time: { value: 0 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }, [vertexShader, fragmentShader]);

    // Manual Cleanup
    useEffect(() => {
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [geometry, material]);

    useFrame((state) => {
        if (!pointsRef.current || particlesRef.current.length === 0) return;

        const t = state.clock.getElapsedTime();
        const geo = pointsRef.current.geometry;
        const posAttr = geo.attributes.position as THREE.BufferAttribute;
        const sizeAttr = geo.attributes.size as THREE.BufferAttribute;

        // Smooth audio interpolation
        smoothAudioLevel.current += (audioLevel - smoothAudioLevel.current) * 0.15;
        const al = smoothAudioLevel.current;

        // Smooth color interpolation
        currentColor.current.lerp(targetColor, 0.12);

        // Update particles
        for (let i = 0; i < particlesRef.current.length; i++) {
            particlesRef.current[i].update(t, autoRotation.current, al);
            posAttr.array[i * 3] = particlesRef.current[i].position.x;
            posAttr.array[i * 3 + 1] = particlesRef.current[i].position.y;
            posAttr.array[i * 3 + 2] = particlesRef.current[i].position.z;
            sizeAttr.array[i] = particlesRef.current[i].size;
        }

        posAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;

        // Update material color
        material.uniforms.color.value.copy(currentColor.current);
        material.uniforms.time.value = t;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
};

export const OrbParticles: React.FC<OrbParticlesProps> = ({ tier, audioLevel, targetColor }) => {
    const counts = PARTICLE_COUNTS[tier];
    const autoRotation = useRef(0);
    const smoothAudioLevel = useRef(0);

    // Update auto rotation
    useFrame((_, delta) => {
        autoRotation.current += 0.003;
    });

    if (counts.core === 0) return null;

    return (
        <group>
            <ParticleLayer
                count={counts.core}
                radius={RADII.core}
                layer="core"
                vertexShader={coreVertexShader}
                fragmentShader={coreFragmentShader}
                audioLevel={audioLevel}
                targetColor={targetColor}
                autoRotation={autoRotation}
                smoothAudioLevel={smoothAudioLevel}
            />
            <ParticleLayer
                count={counts.inner}
                radius={RADII.inner}
                layer="inner"
                vertexShader={innerVertexShader}
                fragmentShader={innerFragmentShader}
                audioLevel={audioLevel}
                targetColor={targetColor}
                autoRotation={autoRotation}
                smoothAudioLevel={smoothAudioLevel}
            />
            <ParticleLayer
                count={counts.outer}
                radius={RADII.outer}
                layer="outer"
                vertexShader={outerVertexShader}
                fragmentShader={outerFragmentShader}
                audioLevel={audioLevel}
                targetColor={targetColor}
                autoRotation={autoRotation}
                smoothAudioLevel={smoothAudioLevel}
            />
        </group>
    );
};
