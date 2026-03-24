"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import ExploreHud from "./ExploreHud";
import MapCanvas from "./MapCanvas";
import {
  AVATAR_FOCUS_DIST,
  BUILDING_FOCUS_DIST,
  BUILDING_FOCUS_Y,
  CAMERA_PITCH,
  CAMERA_YAW_A,
  CAMERA_YAW_B,
  CAMERA_YAW_RANGE,
  FLY_DURATION_MS,
  FOOT_Y_OFFSET,
} from "../constants";
import {
  buildCompanyIndex,
  buildFallbackCompany,
  resolveCompanyByMeshName,
} from "../data/companies";
import { useCompanies } from "../hooks/useCompanies";
import type { CamAnimState, Company, HoverBuildingPayload, YawAnimState } from "../types";
import { angleDiff, nearestRoadPointToBuilding, samplePointOnMesh } from "../utils/three";
import type { NavItem } from "@/lib/config/student/routes";
import { STUDENT_SIDEBAR_ITEMS } from "@/lib/config/student/routes";

type CurrentStudent = {
  user_id: string;
  std_id: string;
  first_name: string;
  last_name: string;
  level: number;
  xp: number;
  xp_max: number;
  avatar_choice: string | null;
  profile_image_url: string | null;
  avatar_model_url: string | null;
  avatar_image_url: string | null;
};

export default function ExploreScene() {
  const router = useRouter();
  const { companies } = useCompanies();
  const companyIndex = useMemo(() => buildCompanyIndex(companies), [companies]);

  const resolveCompany = useCallback(
    (meshName: string) => resolveCompanyByMeshName(meshName, companyIndex),
    [companyIndex]
  );

  const roadsRef = useRef<THREE.Mesh[]>([]);
  const spawnedRef = useRef(false);

  const [avatarPosState, setAvatarPosState] = useState<THREE.Vector3 | null>(null);
  const avatarPosRef = useRef(new THREE.Vector3());
  const avatarRef = useRef<THREE.Group | null>(null);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [hoverBuilding, setHoverBuilding] = useState<HoverBuildingPayload>(null);

  const [me, setMe] = useState<CurrentStudent | null>(null);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const camAnimRef = useRef<CamAnimState | null>(null);
  const yawAnimRef = useRef<YawAnimState | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      const r = await fetch("/api/student", { cache: "no-store" });
      const json = await r.json().catch(() => null);

      if (!r.ok || !json?.ok) return;

      const s = json?.data?.student_info;
      if (!s) return;

      if (!cancelled) {
        setMe({
          user_id: s.user_id ?? "",
          std_id: s.std_id ?? "",
          first_name: s.first_name ?? "",
          last_name: s.last_name ?? "",
          level: Number(s.level ?? 1),
          xp: 0,
          xp_max: Number(s.xp_max ?? 100),
          avatar_choice: s.avatar_choice ?? null,
          profile_image_url: s.profile_image_url ?? null,
          avatar_model_url: s.avatar_model_url ?? null,
          avatar_image_url: s.avatar_image_url ?? null,
        });
      }
    } catch {}
  })();

  return () => {
    cancelled = true;
  };
}, []);

  const handleRoadsOnce = useCallback((roads: THREE.Mesh[]) => {
    roadsRef.current = roads;

    if (spawnedRef.current) return;
    spawnedRef.current = true;

    const mesh = roads[Math.floor(Math.random() * roads.length)];
    const p = samplePointOnMesh(mesh);
    if (!p) return;

    p.y += FOOT_Y_OFFSET;
    avatarPosRef.current.copy(p);
    setAvatarPosState(p.clone());
  }, [samplePointOnMesh]);

  const handlePickRoad = useCallback((p: THREE.Vector3) => {
    camAnimRef.current = null;

    const pp = p.clone();
    pp.y += FOOT_Y_OFFSET;
    avatarPosRef.current.copy(pp);
    setAvatarPosState(pp);
  }, []);

  const flyTo = useCallback(
    (target: THREE.Vector3, dist: number, pendingCompany: Company | null) => {
      const ctrls = controlsRef.current;
      const cam = cameraRef.current;
      if (!ctrls || !cam) return;

      isAnimatingRef.current = true;

      const off = cam.position.clone().sub(ctrls.target);
      const curYaw = Math.atan2(off.z, off.x);

      const dA = Math.abs(angleDiff(curYaw, CAMERA_YAW_A));
      const dB = Math.abs(angleDiff(curYaw, CAMERA_YAW_B));
      const yaw = dA <= dB ? CAMERA_YAW_A : CAMERA_YAW_B;

      ctrls.minAzimuthAngle = yaw - CAMERA_YAW_RANGE;
      ctrls.maxAzimuthAngle = yaw + CAMERA_YAW_RANGE;

      const dir = new THREE.Vector3(
        Math.cos(CAMERA_PITCH) * Math.cos(yaw),
        Math.sin(CAMERA_PITCH),
        Math.cos(CAMERA_PITCH) * Math.sin(yaw)
      ).normalize();

      const toPos = target.clone().add(dir.multiplyScalar(dist));

      camAnimRef.current = {
        active: true,
        t0: performance.now(),
        duration: FLY_DURATION_MS,
        fromPos: cam.position.clone(),
        toPos,
        fromTarget: ctrls.target.clone(),
        toTarget: target.clone(),
        pendingCompany,
      };

      setSelectedCompany(null);
    },
    []
  );

  const toggleView = useCallback(() => {
    const ctrls = controlsRef.current;
    const cam = cameraRef.current;
    if (!ctrls || !cam) return;

    isAnimatingRef.current = true;

    const curYaw = ctrls.getAzimuthalAngle();
    const dA = Math.abs(angleDiff(curYaw, CAMERA_YAW_A));
    const dB = Math.abs(angleDiff(curYaw, CAMERA_YAW_B));
    const nextYaw = dA <= dB ? CAMERA_YAW_B : CAMERA_YAW_A;

    ctrls.minAzimuthAngle = -Infinity;
    ctrls.maxAzimuthAngle = Infinity;

    const prevEnableDamping = ctrls.enableDamping;
    ctrls.enableDamping = false;

    yawAnimRef.current = {
      active: true,
      t0: performance.now(),
      duration: 380,
      fromYaw: curYaw,
      toYaw: nextYaw,
      pitch: CAMERA_PITCH,
      range: CAMERA_YAW_RANGE,
      prevEnableDamping,
    };
  }, []);

  const handlePickBuilding = useCallback(
    (payload: { meshName: string; worldPos: THREE.Vector3; company: Company | null }) => {
      const company = payload.company ?? buildFallbackCompany(payload.meshName);

      const roads = roadsRef.current ?? [];
      const roadP = nearestRoadPointToBuilding(payload.worldPos, roads);
      if (roadP) {
        const avatarP = roadP.clone();
        avatarP.y += FOOT_Y_OFFSET;
        avatarPosRef.current.copy(avatarP);
        setAvatarPosState(avatarP);
      }

      const target = payload.worldPos.clone();
      target.y += BUILDING_FOCUS_Y;
      flyTo(target, BUILDING_FOCUS_DIST, company);
    },
    [flyTo]
  );

  const focusOnAvatar = useCallback(() => {
    const target = avatarPosRef.current.clone();
    flyTo(target, AVATAR_FOCUS_DIST, null);
  }, [flyTo]);

  const handleNavItem = useCallback(
    (item: NavItem) => {
      if (item.enabled === false) return;
      router.push(item.href);
    },
    [router]
  );

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        background: "#EEE7DE",
        overflow: "hidden",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ExploreHud
        selectedCompany={selectedCompany}
        onCloseCompany={() => setSelectedCompany(null)}
        onToggleView={toggleView}
        onFocusAvatar={focusOnAvatar}
        onNavigate={handleNavItem}
        navItems={STUDENT_SIDEBAR_ITEMS}
        userName={me?.first_name || ""}
        level={me?.level ?? 1}
        xpCurrent={me?.xp ?? 0}
        xpMax={me?.xp_max ?? 100}
        avatarModelUrl={me?.avatar_model_url || ""}
      />

      <MapCanvas
        controlsRef={controlsRef}
        cameraRef={cameraRef}
        camAnimRef={camAnimRef}
        yawAnimRef={yawAnimRef}
        isAnimatingRef={isAnimatingRef}
        avatarRef={avatarRef}
        avatarPos={avatarPosState}
        userName={me?.first_name || ""}
        avatarModelUrl={me?.avatar_model_url || ""}
        hoverBuilding={hoverBuilding}
        onRoadMeshesOnce={handleRoadsOnce}
        onPickRoadPoint={handlePickRoad}
        onPickBuilding={handlePickBuilding}
        onHoverBuilding={setHoverBuilding}
        onCameraAnimDone={(company) => {
          if (company) setSelectedCompany(company);
        }}
        resolveCompany={resolveCompany}
      />
    </div>
  );
}