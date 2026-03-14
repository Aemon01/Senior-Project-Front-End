import * as THREE from "three";

export type Company = {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  tags?: string[];
  logoText?: string;
  meshKeys?: string[];
};

export type PickBuildingPayload = {
  meshName: string;
  worldPos: THREE.Vector3;
  company: Company | null;
};

export type HoverBuildingPayload = PickBuildingPayload | null;

export type CamAnimState = {
  active: boolean;
  t0: number;
  duration: number;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  pendingCompany: Company | null;
};

export type YawAnimState = {
  active: boolean;
  t0: number;
  duration: number;
  fromYaw: number;
  toYaw: number;
  pitch: number;
  range: number;
  prevEnableDamping: boolean;
};
