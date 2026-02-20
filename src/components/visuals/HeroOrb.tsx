'use client';

import { useRef, useMemo } from 'react';
import { usePerformance } from '@/hooks/use-performance';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const HeroOrbParticles = ({ count = 3000, radius = 2.0, color = "#f97316", size = 0.2 }) => {
    const mesh = useRef<THREE.Points>(null);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const phi = Math.random() * Math.PI * 2; // Azimuthal angle
            const theta = Math.acos(2 * Math.random() - 1); // Polar angle

            // Standard Y-up spherical coordinates
            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.cos(theta); // Y is Up
            const z = radius * Math.sin(theta) * Math.sin(phi);

            temp.push(x, y, z);
        }
        return new Float32Array(temp);
    }, [count, radius]);

    const uniforms = useMemo(() => ({
        uColor: { value: new THREE.Color(color) },
        uSize: { value: size }
    }), [color, size]);

    // Update color if prop changes
    useFrame(() => {
        if (mesh.current) {
            (mesh.current.material as THREE.ShaderMaterial).uniforms.uColor.value = new THREE.Color(color);
        }
    });

    const vertexShader = `
        precision mediump float;
        uniform float uSize;
        varying float vAlpha;
        
        void main() {
            vAlpha = 1.0;
            vec3 pos = position;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = max(1.0, uSize * (300.0 / -mvPosition.z));
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        precision mediump float;
        uniform vec3 uColor;
        varying float vAlpha;
        
        void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            if (dist > 0.5) discard;
            float alpha = (1.0 - dist * 2.0) * vAlpha;
            float glow = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(uColor, alpha * glow);
        }
    `;

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.length / 3}
                    array={particles}
                    itemSize={3}
                    args={[particles, 3]}
                />
            </bufferGeometry>
            <shaderMaterial
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </points>
    );
};

const RotatingGroup = ({ children, speed = 0.05 }: { children: React.ReactNode, speed?: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += speed * delta; // Rotates around X-axis (Vertical tumble)
        }
    });
    return <group ref={groupRef}>{children}</group>;
};

export const HeroOrb = ({
    className = "",
    color = "#f97316",
    rotationSpeed = 0.05
}) => {
    const { isLowPerformance } = usePerformance();

    return (
        <div className={`w-full h-full relative ${className}`}>
            {/* Ambient inner glow - Visible on all devices */}
            <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none z-0" />
            <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

            {!isLowPerformance && (
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: true, antialias: true }} className="relative z-10 transition-opacity duration-1000">
                    <ambientLight intensity={0.5} />
                    <RotatingGroup speed={rotationSpeed}>
                        {/* Inner Dense Core - Fixed configuration for the Horizon effect */}
                        <HeroOrbParticles count={1500} radius={2.0} size={0.15} color={color} />
                    </RotatingGroup>
                </Canvas>
            )}

            {/* Fallback Core for low-end devices */}
            {isLowPerformance && (
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-orange-500/30 blur-[60px] rounded-full pointer-events-none z-10 animate-pulse" />
            )}
        </div>
    );
};
