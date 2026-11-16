// 島長（穿太空裝的原創角色）與動物混合精靈島民，全部用基本幾何組成。
import * as THREE from 'three';
import { cone, cyl, glow, mat, mesh, sphere } from './kit';

function eyes(g: THREE.Group, y: number, z: number, spread: number, r = 0.09) {
  for (const s of [-1, 1]) {
    g.add(sphere(r, mat('#ffffff'), s * spread, y, z, 10));
    g.add(sphere(r * 0.55, mat('#262a4d'), s * spread, y, z + r * 0.6, 8));
  }
}

function helmet(g: THREE.Group, y: number, r: number) {
  const h = sphere(r, new THREE.MeshStandardMaterial({ color: '#dff4ff', transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.1, depthWrite: false }), 0, y, 0, 16);
  g.add(h);
}

/** 島長：圓滾滾的太空人，帽頂天線星星顏色依島嶼而變 */
export function buildChief(accent: string, glowColor: string) {
  const g = new THREE.Group();
  g.add(cyl(0.42, 0.5, 0.9, mat('#fffaf0'), 0, 0, 0, 12));
  g.add(cyl(0.44, 0.44, 0.18, mat(accent), 0, 0.5, 0, 12)); // 腰帶
  g.add(sphere(0.42, mat('#ffe4d2'), 0, 1.25, 0, 14)); // 臉
  eyes(g, 1.3, 0.36, 0.14);
  g.add(sphere(0.05, mat('#ff9fb0'), 0.24, 1.18, 0.34, 6));
  g.add(sphere(0.05, mat('#ff9fb0'), -0.24, 1.18, 0.34, 6));
  helmet(g, 1.25, 0.6);
  g.add(cyl(0.025, 0.025, 0.45, mat('#f4f1ff'), 0, 1.8, 0, 6));
  g.add(mesh(new THREE.OctahedronGeometry(0.14), glow(glowColor, 2.2), 0, 2.32, 0));
  // 披風
  const cape = mesh(new THREE.ConeGeometry(0.55, 1.0, 8, 1, true, Math.PI * 0.6, Math.PI * 0.8), mat(accent), 0, 0.5, -0.05);
  g.add(cape);
  // 手臂
  for (const s of [-1, 1]) {
    const arm = cyl(0.1, 0.1, 0.5, mat('#fffaf0'), s * 0.5, 0.35, 0, 8);
    arm.rotation.z = s * 0.4;
    g.add(arm);
  }
  return g;
}

/** 貓頭鷹 × 章魚 */
function owlOctopus() {
  const g = new THREE.Group();
  g.add(sphere(0.55, mat('#bfa8ff'), 0, 0.85, 0, 14));
  eyes(g, 1.0, 0.42, 0.2, 0.14);
  g.add(cone(0.08, 0.15, mat('#ffd36b'), 0, 0.78, 0.5, 6));
  for (const s of [-1, 1]) {
    const tuft = cone(0.12, 0.35, mat('#9c86e8'), s * 0.3, 1.3, 0, 5);
    tuft.rotation.z = -s * 0.4;
    g.add(tuft);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const t = cyl(0.07, 0.11, 0.45, mat('#9c86e8'), Math.cos(a) * 0.38, 0.05, Math.sin(a) * 0.38, 6);
    t.rotation.x = Math.sin(a) * 0.5;
    t.rotation.z = -Math.cos(a) * 0.5;
    g.add(t);
  }
  helmet(g, 0.95, 0.75);
  return g;
}

/** 烏龜 × 狐狸 */
function turtleFox() {
  const g = new THREE.Group();
  const shell = mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#9fd8c3'), 0, 0.35, -0.1);
  g.add(shell);
  g.add(mesh(new THREE.TorusGeometry(0.6, 0.05, 6, 24), glow('#ffd36b', 0.8), 0, 0.37, -0.1)).children;
  (g.children[g.children.length - 1] as THREE.Mesh).rotation.x = Math.PI / 2;
  g.add(sphere(0.33, mat('#ffb98a'), 0, 0.75, 0.45, 12));
  g.add(cone(0.12, 0.3, mat('#fff3e6'), 0, 0.65, 0.78, 6)).children;
  (g.children[g.children.length - 1] as THREE.Mesh).rotation.x = Math.PI / 2;
  eyes(g, 0.85, 0.72, 0.12, 0.07);
  for (const s of [-1, 1]) g.add(cone(0.11, 0.3, mat('#ff9f6b'), s * 0.18, 0.98, 0.4, 4));
  const tail = cone(0.16, 0.6, mat('#ff9f6b'), 0, 0.3, -0.7, 6);
  tail.rotation.x = -1.2;
  g.add(tail);
  for (const [x, z] of [[-0.35, 0.25], [0.35, 0.25], [-0.35, -0.4], [0.35, -0.4]]) g.add(sphere(0.12, mat('#b9e6c9'), x, 0.12, z, 8));
  helmet(g, 0.8, 0.5);
  return g;
}

/** 河狸 × 蝴蝶 */
function beaverButterfly() {
  const g = new THREE.Group();
  g.add(sphere(0.5, mat('#c99b7a'), 0, 0.6, 0, 12));
  g.add(sphere(0.36, mat('#d9ad8c'), 0, 1.15, 0.1, 12));
  eyes(g, 1.22, 0.4, 0.12, 0.08);
  g.add(mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), mat('#ffffff'), 0, 1.0, 0.44));
  const tail = mesh(new THREE.BoxGeometry(0.5, 0.08, 0.7), mat('#8c6b5a'), 0, 0.15, -0.6);
  g.add(tail);
  const wings = new THREE.Group();
  for (const s of [-1, 1]) {
    const w = mesh(new THREE.CircleGeometry(0.55, 5), mat(s < 0 ? '#ffb4d0' : '#bcd4ff', { emissive: '#ffd6e6', emissiveIntensity: 0.25 }), s * 0.5, 0.95, -0.25);
    (w.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    w.rotation.y = s * 0.5;
    wings.add(w);
  }
  g.add(wings);
  for (const s of [-1, 1]) g.add(sphere(0.06, glow('#ffe7a8', 2), s * 0.15, 1.6, 0.1, 6));
  g.userData.flap = wings;
  helmet(g, 1.15, 0.48);
  return g;
}

/** 海豚 × 鸚鵡 */
function dolphinParrot() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.35, 0.6, 4, 10), mat('#8fc5ff'), 0, 0.75, 0);
  body.rotation.x = 0.35;
  g.add(body);
  g.add(cone(0.12, 0.3, mat('#ffd36b'), 0, 1.0, 0.45, 6)).children;
  (g.children[g.children.length - 1] as THREE.Mesh).rotation.x = Math.PI / 2;
  eyes(g, 1.15, 0.3, 0.15, 0.08);
  for (let i = 0; i < 3; i++) {
    const f = cone(0.07, 0.4, mat(['#ff8f8f', '#ffd36b', '#9fd8c3'][i]), (i - 1) * 0.1, 1.45, -0.1, 4);
    f.rotation.z = (i - 1) * 0.4;
    g.add(f);
  }
  const fin = cone(0.18, 0.4, mat('#6fb0f0'), 0, 1.0, -0.3, 3);
  fin.rotation.x = -0.6;
  g.add(fin);
  const tail = mesh(new THREE.BoxGeometry(0.6, 0.06, 0.25), mat('#6fb0f0'), 0, 0.2, -0.35);
  g.add(tail);
  helmet(g, 1.05, 0.45);
  return g;
}

/** 穿山甲 × 白鷺 */
function pangolinEgret() {
  const g = new THREE.Group();
  for (const s of [-0.12, 0.12]) g.add(cyl(0.03, 0.03, 0.6, mat('#ffcf6b'), s, 0, 0, 6));
  g.add(sphere(0.45, mat('#fffaf0'), 0, 0.9, 0, 12));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 1.6 - Math.PI * 0.3;
    const sc = mesh(new THREE.ConeGeometry(0.16, 0.22, 4), mat('#c9a27a'), Math.sin(a) * 0.4, 0.9 + Math.cos(a) * 0.38, -0.15 - Math.abs(Math.cos(a)) * 0.15);
    sc.rotation.x = -0.6;
    g.add(sc);
  }
  const neck = cyl(0.07, 0.1, 0.5, mat('#fffaf0'), 0, 1.2, 0.2, 8);
  neck.rotation.x = 0.4;
  g.add(neck);
  g.add(sphere(0.2, mat('#fffaf0'), 0, 1.72, 0.38, 10));
  eyes(g, 1.78, 0.52, 0.1, 0.05);
  const beak = cone(0.05, 0.4, mat('#ffcf6b'), 0, 1.66, 0.62, 6);
  beak.rotation.x = Math.PI / 2;
  g.add(beak);
  helmet(g, 1.6, 0.36);
  return g;
}

const spirits: Record<string, () => THREE.Group> = { owlOctopus, turtleFox, beaverButterfly, dolphinParrot, pangolinEgret };

export function buildResident(model: string) {
  return (spirits[model] ?? owlOctopus)();
}

/** 角色腳下的發光圓圈，提示「可以點我」 */
export function tapRing(color: string) {
  const ring = mesh(new THREE.RingGeometry(0.6, 0.78, 24), mat(color, { emissive: color, emissiveIntensity: 1.6, opacity: 0.85 }), 0, 0.03, 0);
  ring.rotation.x = -Math.PI / 2;
  return ring;
}
