// 各學組的 3D 地標，皆以基本幾何組成並加上宇宙元素。
import * as THREE from 'three';
import { box, cone, cyl, glow, mat, mesh, sphere, type Tick } from './kit';

interface Landmark {
  group: THREE.Group;
  ticks: Tick[];
}

type Palette = { grass: string; path: string; accent: string; glow: string };

/** 資訊應用：星碼全息塔（程式方塊環繞、浮空螢幕） */
function holoTower(p: Palette): Landmark {
  const g = new THREE.Group();
  const ticks: Tick[] = [];
  g.add(cyl(1.1, 1.4, 0.5, mat('#f4f1ff')));
  g.add(cyl(0.55, 0.8, 3.6, mat('#dfe8ff'), 0, 0.5));
  g.add(cyl(0.9, 0.55, 0.5, mat(p.accent), 0, 4.1));
  const core = sphere(0.45, glow(p.glow, 2.2), 0, 5.0, 0);
  g.add(core);
  // 浮空螢幕
  const screens = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Group();
    s.add(box(1.3, 0.85, 0.06, mat('#1d2550')));
    s.add(box(1.1, 0.65, 0.07, glow(i === 1 ? '#ffe7a8' : p.glow, 1.3), 0, 0.1, 0));
    const a = (i / 3) * Math.PI * 2;
    s.position.set(Math.cos(a) * 1.8, 2.4, Math.sin(a) * 1.8);
    s.lookAt(0, 2.4, 0);
    screens.add(s);
  }
  g.add(screens);
  // 環繞的程式碼方塊
  const cubes = new THREE.Group();
  const colors = ['#ffb4b4', '#ffe7a8', '#bcd4ff', '#c9f2e0'];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    cubes.add(mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), glow(colors[i % 4], 0.9), Math.cos(a) * 1.3, 4.6 + Math.sin(i) * 0.2, Math.sin(a) * 1.3));
  }
  g.add(cubes);
  ticks.push((t) => {
    screens.rotation.y = t * 0.25;
    cubes.rotation.y = -t * 0.8;
    core.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
  });
  return { group: g, ticks };
}

/** 文化資產：掃描光環古亭（傳統屋頂＋旋轉的 3D 掃描環） */
function scanPavilion(p: Palette): Landmark {
  const g = new THREE.Group();
  const ticks: Tick[] = [];
  g.add(cyl(1.7, 1.9, 0.4, mat('#f6e9d6'), 0, 0, 0, 6));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    g.add(cyl(0.13, 0.13, 2.1, mat('#e98c8c'), Math.cos(a) * 1.3, 0.4, Math.sin(a) * 1.3, 8));
  }
  const roof = cone(2.4, 1.2, mat(p.accent), 0, 2.5, 0, 6);
  g.add(roof);
  g.add(cone(1.4, 0.9, mat('#ffd36b'), 0, 3.4, 0, 6));
  g.add(sphere(0.2, glow('#ffd36b', 2), 0, 4.45, 0));
  // 簷角翹起
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(sphere(0.14, glow('#fff3c4', 1.6), Math.cos(a) * 2.35, 2.55, Math.sin(a) * 2.35, 8));
  }
  // 掃描光環
  const ring = mesh(new THREE.TorusGeometry(2.3, 0.05, 6, 64), glow(p.glow, 2.2), 0, 1, 0);
  ring.rotation.x = Math.PI / 2;
  const beam = mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.04, 48, 1, true), mat(p.glow, { emissive: p.glow, emissiveIntensity: 1, opacity: 0.25 }), 0, 1, 0);
  g.add(ring, beam);
  ticks.push((t) => {
    const y = 0.6 + (Math.sin(t * 1.2) * 0.5 + 0.5) * 3.2;
    ring.position.y = y;
    beam.position.y = y;
  });
  return { group: g, ticks };
}

/** 產品與媒體設計：星星列印工坊（3D 列印機框架＋正在成形的星星） */
function printerForge(p: Palette): Landmark {
  const g = new THREE.Group();
  const ticks: Tick[] = [];
  g.add(box(3.2, 0.4, 3.2, mat('#f4f1ff')));
  const frame = mat('#9fb5e8');
  for (const [x, z] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) g.add(box(0.18, 3.4, 0.18, frame, x, 0.4, z));
  g.add(box(3.1, 0.18, 0.18, frame, 0, 3.8, -1.4));
  g.add(box(3.1, 0.18, 0.18, frame, 0, 3.8, 1.4));
  const gantry = box(0.2, 0.2, 3.0, mat(p.accent), 0, 3.4, 0);
  const head = new THREE.Group();
  head.add(box(0.5, 0.45, 0.5, mat('#ffffff')));
  head.add(cone(0.15, 0.3, glow('#ffe7a8', 2), 0, -0.3, 0));
  head.children[1].rotation.x = Math.PI;
  head.position.y = 3.0;
  g.add(gantry, head);
  // 正在成形的星星
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? 0.45 : 1.0;
    if (i === 0) shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const starGeo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  starGeo.rotateX(-Math.PI / 2);
  const star = mesh(starGeo, mat('#ffe7a8', { emissive: '#ffcf6b', emissiveIntensity: 0.4 }), 0, 0.4, 0);
  g.add(star);
  // 三腳架相機（媒體設計）
  const cam = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const leg = cyl(0.04, 0.04, 1.5, mat('#6b5aa6'));
    leg.rotation.z = 0.3;
    leg.rotation.y = (i / 3) * Math.PI * 2;
    cam.add(leg);
  }
  cam.add(box(0.6, 0.4, 0.4, mat('#3b3f6b'), 0, 1.4, 0));
  cam.add(cyl(0.14, 0.14, 0.3, glow('#bcd4ff', 1.2), 0.0, 1.45, 0.25));
  cam.children[cam.children.length - 1].rotation.x = Math.PI / 2;
  cam.position.set(2.4, 0, 1.2);
  cam.rotation.y = -0.6;
  g.add(cam);
  ticks.push((t) => {
    const k = (Math.sin(t * 0.7) * 0.5 + 0.5) * 0.85 + 0.15;
    star.scale.set(1, k, 1);
    head.position.x = Math.sin(t * 2.3) * 0.9;
    head.position.z = Math.cos(t * 1.7) * 0.9;
    head.position.y = 0.6 + k + 0.5;
    gantry.position.x = head.position.x;
  });
  return { group: g, ticks };
}

/** 傳播：衛星天線攝影棚（ON AIR 燈＋旋轉天線＋訊號波） */
function dishStudio(p: Palette): Landmark {
  const g = new THREE.Group();
  const ticks: Tick[] = [];
  g.add(box(3.0, 1.8, 2.4, mat('#fffaf0')));
  g.add(box(3.2, 0.25, 2.6, mat(p.accent), 0, 1.8, 0));
  g.add(box(1.2, 0.35, 0.05, glow('#ff8f8f', 2.4), 0, 1.2, 1.22));
  g.add(box(0.9, 0.9, 0.04, mat('#3b3f6b'), -0.8, 0.2, 1.22));
  const dish = new THREE.Group();
  dish.add(cyl(0.12, 0.12, 1.0, mat('#dfe8ff')));
  const bowl = mesh(new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), mat('#ffffff', { roughness: 0.4 }), 0, 1.4, 0);
  bowl.rotation.x = Math.PI * 0.75;
  dish.add(bowl);
  dish.add(sphere(0.12, glow(p.glow, 2.5), 0, 1.3, 0.55));
  dish.position.y = 2.05;
  g.add(dish);
  const waves: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const w = mesh(new THREE.TorusGeometry(0.6, 0.04, 6, 32, Math.PI), mat(p.glow, { emissive: p.glow, emissiveIntensity: 1.5, opacity: 0.8 }), 0, 4.0, 0);
    waves.push(w);
    g.add(w);
  }
  ticks.push((t) => {
    dish.rotation.y = t * 0.4;
    waves.forEach((w, i) => {
      const k = ((t * 0.6 + i / 3) % 1);
      w.scale.setScalar(0.6 + k * 2.4);
      w.position.y = 3.6 + k * 1.6;
      w.rotation.y = t * 0.4;
      (w.material as THREE.MeshStandardMaterial).opacity = 0.9 * (1 - k);
    });
  });
  // 每個訊號波需要獨立材質才能各自淡出
  waves.forEach((w) => (w.material = (w.material as THREE.Material).clone()));
  return { group: g, ticks };
}

/** 建築：星際穹頂老屋（斜屋頂老屋＋網格穹頂） */
function domeHouse(p: Palette): Landmark {
  const g = new THREE.Group();
  const ticks: Tick[] = [];
  g.add(box(2.4, 1.4, 1.8, mat('#f6e9d6')));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.35, 2.7, 3, 1), mat('#d98b7a'));
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.scale.set(1, 1, 0.75);
  roof.position.set(0, 1.85, 0);
  g.add(roof);
  g.add(box(0.5, 0.8, 0.05, mat('#8c6b5a'), 0, 0, 0.92));
  g.add(box(0.45, 0.4, 0.05, glow('#fff1a8', 1.4), -0.75, 0.6, 0.92));
  g.add(box(0.45, 0.4, 0.05, glow('#fff1a8', 1.4), 0.75, 0.6, 0.92));
  g.add(box(0.3, 0.8, 0.3, mat('#b58f80'), 0.7, 1.6, -0.3));
  const dome = mesh(new THREE.IcosahedronGeometry(2.6, 1), new THREE.MeshBasicMaterial({ color: p.glow, wireframe: true, transparent: true, opacity: 0.75 }), 0, 0.6, 0);
  const shell = mesh(new THREE.IcosahedronGeometry(2.58, 1), mat('#cfe0ff', { opacity: 0.12 }), 0, 0.6, 0);
  g.add(dome, shell);
  ticks.push((t) => {
    dome.rotation.y = t * 0.12;
  });
  return { group: g, ticks };
}

/** 學院星港：消息看板 */
export function newsBoard(): Landmark {
  const g = new THREE.Group();
  const ticks: Tick[] = [];
  g.add(cyl(0.12, 0.12, 2.2, mat('#f4f1ff'), -1.4));
  g.add(cyl(0.12, 0.12, 2.2, mat('#f4f1ff'), 1.4));
  g.add(box(3.4, 1.8, 0.2, mat('#6b5aa6'), 0, 1.4));
  g.add(box(3.0, 1.4, 0.22, glow('#fff3c4', 0.6), 0, 1.6));
  for (let i = 0; i < 3; i++) g.add(box(2.4 - i * 0.5, 0.14, 0.24, mat(['#ffb4b4', '#8fb8ff', '#ffd36b'][i]), -0.2 + i * 0.1, 2.6 - i * 0.4));
  const star = mesh(new THREE.OctahedronGeometry(0.4), glow('#ffe7a8', 2), 0, 3.9, 0);
  g.add(star);
  ticks.push((t) => {
    star.rotation.y = t;
    star.position.y = 3.9 + Math.sin(t * 2) * 0.15;
  });
  return { group: g, ticks };
}

const builders: Record<string, (p: Palette) => Landmark> = { holoTower, scanPavilion, printerForge, dishStudio, domeHouse };

export function buildLandmark(type: string, palette: Palette): Landmark {
  return (builders[type] ?? holoTower)(palette);
}
