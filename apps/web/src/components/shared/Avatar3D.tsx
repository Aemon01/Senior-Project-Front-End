"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";

function pickLoopClip(names: string[]) {
  const lower = names.map((n) => n.toLowerCase());

  const idleIdx = lower.findIndex((n) => n.includes("idle"));
  if (idleIdx >= 0) return names[idleIdx];

  const walkIdx = lower.findIndex((n) => n.includes("walk"));
  if (walkIdx >= 0) return names[walkIdx];

  const runIdx = lower.findIndex((n) => n.includes("run"));
  if (runIdx >= 0) return names[runIdx];

  return names[0] ?? null;
}

function AnimatedAvatar({ url }: { url: string }) {
  const rootRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const { actions, names, mixer } = useAnimations(gltf.animations, rootRef);

  useEffect(() => {
    if (!names?.length) return;

    names.forEach((n) => actions[n]?.stop());

    const clip = pickLoopClip(names);
    if (!clip) return;

    const action = actions[clip];
    action?.reset();
    action?.setLoop(THREE.LoopRepeat, Infinity);
    action?.fadeIn(0.2);
    action?.play();

    return () => {
      names.forEach((n) => actions[n]?.stop());
    };
  }, [actions, names, url]);

  useFrame((_, dt) => {
    mixer?.update(dt);
  });

  return (
    <group ref={rootRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

export default function Avatar3D({
  modelUrl,
  className,
  modelScale = 2.0,
  modelPosition = [0, -1.3, 0],
  cameraPosition = [0, 1.25, 1.8],
  cameraFov = 42,
}: {
  modelUrl: string;
  className?: string;
  modelScale?: number;
  modelPosition?: [number, number, number];
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!modelUrl) return;
    try {
      useGLTF.preload(modelUrl);
    } catch {
      setFailed(true);
    }
  }, [modelUrl]);

  if (!modelUrl || failed) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
          fontSize: 10,
          opacity: 0.7,
        }}
      >
        Avatar unavailable
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label="Avatar 3D frame"
    >
      <Canvas
        camera={{ position: cameraPosition as any, fov: cameraFov }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 3]} intensity={1.1} />

        <Suspense fallback={null}>
          <group position={modelPosition as any} scale={modelScale} rotation={[-0.1, 0.3, 0]}>
            <AnimatedAvatar key={modelUrl} url={modelUrl} />
          </group>
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}