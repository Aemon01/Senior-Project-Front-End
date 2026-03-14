"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function ErrorCatcher({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError: (err?: unknown) => void;
}) {
  try {
    return <>{children}</>;
  } catch (e) {
    onError(e);
    return null;
  }
}

/** ตัวนี้จะถูก remount ทุกครั้งเมื่อ url เปลี่ยน เพราะเราใส่ key ตอนเรียก */
function GLBAnimator({
  url,
  onClipCount,
}: {
  url: string;
  onClipCount?: (n: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(url);

  const clipCount = gltf.animations?.length ?? 0;
  useEffect(() => {
    onClipCount?.(clipCount);
  }, [clipCount, onClipCount]);

  const { actions, names, mixer } = useAnimations(gltf.animations, group);

  // ✅ เล่น “ทุก clip” พร้อมกัน
  useEffect(() => {
    if (!names?.length) return;

    // stop ก่อนกันค้าง
    names.forEach((n) => actions[n]?.stop());

    names.forEach((n) => {
      const a = actions[n];
      a?.reset();
      a?.fadeIn(0.15);
      a?.play();
    });

    return () => {
      names.forEach((n) => actions[n]?.stop());
    };
  }, [actions, names, url]);

  useFrame((state, dt) => {
    mixer?.update(dt);

    // idle bobbing เบา ๆ เพิ่ม (กันกรณีบาง clip เป็น pose/นิ่ง)
    if (group.current) {
      const t = state.clock.getElapsedTime();
      group.current.position.y = Math.sin(t * 2.0) * 0.02;
      group.current.rotation.y = 0;
    }
  });

  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}

export default function Avatar3D({
  modelUrl,
  className,
  modelScale = 1.8,
  modelPosition = [0, -1.1, 0],
  cameraPosition = [0, 1.2, 2.3],
  cameraFov = 38,
}: {
  modelUrl: string;
  className?: string;
  modelScale?: number;
  modelPosition?: [number, number, number];
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}) {
  const [failed, setFailed] = useState(false);
  const [clipCount, setClipCount] = useState(0);

  useEffect(() => {
    setFailed(false);
    setClipCount(0);
    try {
      useGLTF.preload(modelUrl);
    } catch {}
  }, [modelUrl]);

  if (failed) {
    return (
      <div
        className={className}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.7 }}
      >
        Model failed to load
      </div>
    );
  }

  return (
    <div className={className} aria-label="Avatar 3D frame">
      <Canvas camera={{ position: cameraPosition as any, fov: cameraFov }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 3]} intensity={1.1} />

        <Suspense fallback={null}>
          <group position={modelPosition as any} scale={modelScale}>
            <ErrorCatcher
              onError={(e) => {
                console.error("Avatar3D error:", modelUrl, e);
                setFailed(true);
              }}
            >
              {/* สำคัญที่สุด: key บังคับ remount */}
              <GLBAnimator key={modelUrl} url={modelUrl} onClipCount={setClipCount} />
            </ErrorCatcher>
          </group>
        </Suspense>

        {/* ล็อกไม่ให้หมุน/ซูม/เลื่อน */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>

      <div style={{ textAlign: "center", marginTop: 6, fontSize: 12, opacity: 0.6 }}>
        clips: {clipCount}
      </div>
    </div>
  );
}