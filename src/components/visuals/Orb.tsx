
'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

const OrbParticles = ({ count, radius, color, size, speed, layers }: { count: number, radius: number, color: string, size: number, speed: number, layers: number }) => {
    const mesh = useRef<THREE.Points>(null);
    const hover = useRef(false);


    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);

            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(theta);

            temp.push(x, y, z);
        }
        return new Float32Array(temp);
    }, [count, radius]);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uSize: { value: size }
    }), [color, size]);

    useFrame((state) => {
        const { clock } = state;
        if (mesh.current) {

            (mesh.current.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.getElapsedTime() * speed;
            (mesh.current.material as THREE.ShaderMaterial).uniforms.uColor.value = new THREE.Color(color);
        }
    });

    const vertexShader = `
        precision mediump float;
        uniform float uTime;
        uniform float uSize;
        varying float vAlpha;
        
        void main() {
            vAlpha = 1.0;
            vec3 pos = position;
            
            // Breathing effect
            float breath = sin(uTime + position.x * 2.0) * 0.1;
            pos = pos * (1.0 + breath);

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

const MouseHandler = ({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) => {
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            mouse.current = {
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: -(event.clientY / window.innerHeight) * 2 + 1
            };
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useFrame(() => {
        if (groupRef.current) {
            const targetX = mouse.current.y * 0.2;
            const targetY = mouse.current.x * 0.4;

            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.1);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.1);
        }
    });
    return null;
};

export const Orb = ({ hue = 0, hoverIntensity = 0.5, className = "", followCursor = false, color = "#8B5CF6" }) => {
    const groupRef = useRef<THREE.Group>(null);
    return (
        <div className={`w-full h-full min-h-[300px] relative ${className}`}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: true, antialias: true }}>
                <ambientLight intensity={0.5} />
                <group ref={groupRef}>
                    <OrbParticles count={300} radius={1.5} color={color} size={0.15} speed={1.5} layers={1} />
                    <OrbParticles count={500} radius={2.5} color={color} size={0.08} speed={1} layers={2} />
                    <OrbParticles count={200} radius={3.5} color={color} size={0.05} speed={0.5} layers={3} />
                </group>
                {followCursor && <MouseHandler groupRef={groupRef} />}
                <OrbitControls enableZoom={false} enablePan={false} autoRotate={!followCursor} autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
};
