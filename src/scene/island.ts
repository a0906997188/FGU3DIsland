// 六角形島嶼：19 塊六角地磚拼成一座漂浮在星空中的微縮小鎮，底下是發光的岩石根部。
import * as THREE from 'three';
import { box, cone, cyl, glow, mat, mesh, seeded, sphere, type Tick } from './kit';

export const HEX_R = 2; // 地磚外接圓半徑
const SQ3 = Math.sqrt(3);

export interface Tile {
  q: number;
  r: number;
  x: number;
  z: number;
  top: number; // 地磚頂面高度
  kind: 'center' | 'path' | 'grass';
}

export interface BuiltIsland {
  group: THREE.Group;
  tiles: Tile[];
  ticks: Tick[];
  /** 給角色或地標站立的位置（島內座標） */
  spot: (q: number, r: number) => THREE.Vector3;
}

export function axialToXZ(q: number, r: number) {
  return { x: HEX_R * SQ3 * (q + r / 2), z: HEX_R * 1.5 * r };
}

function hexRing(radius: number) {
  const out: [number, number][] = [];
  if (radius === 0) return [[0, 0] as [number, number]];
  const dirs = [
    [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
  ];
  let q = -radius;
  let r = radius;
  for (const [dq, dr] of dirs) {
    for (let i = 0; i < radius; i++) {
      out.push([q, r]);
      q += dq;
      r += dr;
    }
  }
  return out;
}

interface IslandOptions {
  id: string;
  rings: number;
  grass: string;
  path: string;
  accent: string;
  glowColor: string;
  /** 從中心通往橋的方向（世界座標 xz 的單位向量），會鋪成步道 */
  pathDirs: THREE.Vector2[];
  /** 保留給角色、地標的地磚 */
  reserved: [number, number][];
}

export function buildIsland(o: IslandOptions): BuiltIsland {
  const rand = seeded(o.id);
  const group = new THREE.Group();
  const ticks: Tick[] = [];
  const tiles: Tile[] = [];

  const coords: [number, number][] = [];
  for (let ring = 0; ring <= o.rings; ring++) coords.push(...hexRing(ring));

  // 判斷步道：地磚中心靠近任一步道方向的射線
  const isPath = (x: number, z: number) =>
    o.pathDirs.some((d) => {
      const along = x * d.x + z * d.y;
      if (along < 0.5) return false;
      const perp = Math.abs(x * d.y - z * d.x);
      return perp < HEX_R * 0.95;
    });

  const reservedKey = new Set(o.reserved.map(([q, r]) => `${q},${r}`));
  const earth = mat('#e9dcff');
  const earthDark = mat('#c9b8ef');
  const grassMat = mat(o.grass);
  const pathMat = mat(o.path);
  const topGeo = new THREE.CylinderGeometry(HEX_R * 0.96, HEX_R * 0.96, 0.3, 6);

  for (const [q, r] of coords) {
    const { x, z } = axialToXZ(q, r);
    const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
    const kind: Tile['kind'] = ring === 0 ? 'center' : isPath(x, z) ? 'path' : 'grass';
    const h = kind === 'center' ? 1.6 : kind === 'path' ? 1.2 : 1.1 + rand() * 0.7 - ring * 0.08;
    const body = mesh(new THREE.CylinderGeometry(HEX_R * 0.96, HEX_R * 0.9, h, 6), ring % 2 ? earthDark : earth, x, h / 2, z);
    const top = mesh(topGeo, kind === 'grass' ? grassMat : pathMat, x, h + 0.15, z);
    group.add(body, top);
    tiles.push({ q, r, x, z, top: h + 0.3, kind });
  }

  // 底部發光岩石根部
  const rootR = HEX_R * SQ3 * (o.rings + 0.6);
  const root = mesh(new THREE.ConeGeometry(rootR, rootR * 1.1, 6), mat('#6b5aa6'), 0, -rootR * 0.55 + 0.05, 0);
  root.rotation.x = Math.PI;
  root.rotation.y = Math.PI / 6;
  group.add(root);
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2;
    const d = rootR * (0.25 + rand() * 0.45);
    const crystal = mesh(new THREE.OctahedronGeometry(0.35 + rand() * 0.35), glow(o.glowColor, 1.2), Math.cos(a) * d, -1 - rand() * rootR * 0.5, Math.sin(a) * d);
    group.add(crystal);
  }
  // 漂浮光環
  const halo = mesh(new THREE.TorusGeometry(rootR * 0.95, 0.06, 6, 48), glow(o.glowColor, 0.9), 0, -0.6, 0);
  halo.rotation.x = Math.PI / 2;
  group.add(halo);

  // 小鎮道具：樹、路燈、小屋
  for (const t of tiles) {
    if (t.kind === 'center' || reservedKey.has(`${t.q},${t.r}`)) continue;
    if (t.kind === 'path') {
      if (rand() < 0.45) {
        const side = rand() < 0.5 ? -1 : 1;
        const lamp = new THREE.Group();
        lamp.add(cyl(0.06, 0.06, 1.3, mat('#f4f1ff')));
        lamp.add(sphere(0.18, glow('#fff1a8', 2)));
        lamp.children[1].position.y = 1.4;
        lamp.position.set(t.x + side * 1.1, t.top, t.z + 0.6);
        group.add(lamp);
      }
      continue;
    }
    const roll = rand();
    if (roll < 0.42) {
      const tree = new THREE.Group();
      tree.add(cyl(0.12, 0.16, 0.6, mat('#a78a7a')));
      if (rand() < 0.5) tree.add(cone(0.7, 1.5, mat(rand() < 0.5 ? '#9fd8c3' : '#b9e6c9'), 0, 0.5));
      else tree.add(sphere(0.65, mat(rand() < 0.5 ? '#ffc7d4' : '#b9e6c9'), 0, 1.05));
      tree.position.set(t.x + (rand() - 0.5) * 1.2, t.top, t.z + (rand() - 0.5) * 1.2);
      tree.scale.setScalar(0.8 + rand() * 0.5);
      group.add(tree);
    } else if (roll < 0.72) {
      const house = new THREE.Group();
      const w = 0.9 + rand() * 0.5;
      const h = 0.7 + rand() * 0.6;
      house.add(box(w, h, w, mat(rand() < 0.5 ? '#fffaf0' : '#fff0f0')));
      const roof = cone(w * 0.85, 0.6, mat(o.accent), 0, h, 0, 4);
      roof.rotation.y = Math.PI / 4;
      house.add(roof);
      house.add(box(0.22, 0.22, 0.02, glow('#fff1a8', 1.4), 0, h * 0.4, w / 2 + 0.01));
      house.position.set(t.x + (rand() - 0.5) * 0.6, t.top, t.z + (rand() - 0.5) * 0.6);
      house.rotation.y = Math.floor(rand() * 6) * (Math.PI / 3);
      group.add(house);
    } else if (roll < 0.82) {
      // 漂浮的小星星：學習地標的點綴
      const star = mesh(new THREE.OctahedronGeometry(0.28), glow(o.glowColor, 1.8), t.x, t.top + 1.2, t.z);
      const base = star.position.y;
      const phase = rand() * 6;
      ticks.push((time) => {
        star.position.y = base + Math.sin(time * 1.6 + phase) * 0.2;
        star.rotation.y = time + phase;
      });
      group.add(star);
    }
  }

  const spot = (q: number, r: number) => {
    const t = tiles.find((tt) => tt.q === q && tt.r === r);
    const { x, z } = axialToXZ(q, r);
    return new THREE.Vector3(x, t ? t.top : 1.5, z);
  };

  return { group, tiles, ticks, spot };
}

/** 兩座島之間的星光橋：一片片木板沿弧線排列，兩側有發光柱。 */
export function buildBridge(a: THREE.Vector3, b: THREE.Vector3, color: string) {
  const group = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const n = Math.max(6, Math.round(len / 0.75));
  const plankGeo = new THREE.BoxGeometry(1.5, 0.14, 0.55);
  const plankMat = mat('#fdf6e3');
  const plankAlt = mat('#ffe7c2');
  const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  const point = (t: number) => new THREE.Vector3().lerpVectors(a, b, t).add(new THREE.Vector3(0, Math.sin(t * Math.PI) * len * 0.06, 0));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = point(t);
    const next = point(Math.min(1, t + 0.01));
    const plank = mesh(plankGeo, i % 2 ? plankAlt : plankMat, p.x, p.y, p.z);
    plank.lookAt(next.x, p.y, next.z);
    group.add(plank);
    if (i % 4 === 0) {
      for (const s of [-1, 1]) {
        const post = new THREE.Group();
        post.add(cyl(0.05, 0.05, 0.7, mat('#f4f1ff')));
        post.add(sphere(0.12, glow(color, 2), 0, 0.78, 0));
        post.position.copy(p).addScaledVector(side, s * 0.8);
        group.add(post);
      }
    }
  }
  return group;
}
