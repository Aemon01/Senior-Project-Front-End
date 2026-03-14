import * as THREE from "three";

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function angleDiff(a: number, b: number) {
  return THREE.MathUtils.euclideanModulo(a - b + Math.PI, Math.PI * 2) - Math.PI;
}

export function getWorldCenter(obj: THREE.Object3D): THREE.Vector3 {
  const box = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  box.getCenter(center);
  return center;
}

export function samplePointOnMesh(mesh: THREE.Mesh): THREE.Vector3 | null {
  const geo = mesh.geometry as THREE.BufferGeometry;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!pos) return null;

  const index = geo.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;
  if (triCount <= 0) return null;

  const tri = Math.floor(Math.random() * triCount);

  const aIdx = index ? index.getX(tri * 3) : tri * 3;
  const bIdx = index ? index.getX(tri * 3 + 1) : tri * 3 + 1;
  const cIdx = index ? index.getX(tri * 3 + 2) : tri * 3 + 2;

  const a = new THREE.Vector3(pos.getX(aIdx), pos.getY(aIdx), pos.getZ(aIdx));
  const b = new THREE.Vector3(pos.getX(bIdx), pos.getY(bIdx), pos.getZ(bIdx));
  const c = new THREE.Vector3(pos.getX(cIdx), pos.getY(cIdx), pos.getZ(cIdx));

  let r1 = Math.random();
  let r2 = Math.random();
  if (r1 + r2 > 1) {
    r1 = 1 - r1;
    r2 = 1 - r2;
  }

  const pLocal = a
    .clone()
    .add(b.clone().sub(a).multiplyScalar(r1))
    .add(c.clone().sub(a).multiplyScalar(r2));

  return pLocal.applyMatrix4(mesh.matrixWorld);
}

export function nearestRoadPointToBuilding(
  buildingWorldPos: THREE.Vector3,
  roadMeshes: THREE.Mesh[]
) {
  if (!roadMeshes.length) return null;

  const best = { p: null as THREE.Vector3 | null, d2: Number.POSITIVE_INFINITY };
  const tmpBox = new THREE.Box3();
  const tmpClosest = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);

  for (const road of roadMeshes) {
    tmpBox.setFromObject(road);
    tmpBox.clampPoint(buildingWorldPos, tmpClosest);

    const origin = new THREE.Vector3(tmpClosest.x, tmpClosest.y + 50, tmpClosest.z);
    raycaster.set(origin, down);

    const hits = raycaster.intersectObject(road, true);
    if (!hits.length) continue;

    const hit = hits[0].point.clone();
    const dx = hit.x - buildingWorldPos.x;
    const dz = hit.z - buildingWorldPos.z;
    const d2 = dx * dx + dz * dz;

    if (d2 < best.d2) {
      best.d2 = d2;
      best.p = hit;
    }
  }

  return best.p;
}
