// 3D 群島世界：渲染器、相機控制、星空、點選偵測、飛行鏡頭、島名標籤。
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { IslandData } from '../types';
import { buildBridge, buildIsland, axialToXZ } from './island';
import { buildLandmark, newsBoard } from './landmarks';
import { buildChief, buildResident, tapRing } from './characters';
import { glow, mat, mesh, sphere, type Tick } from './kit';

export type PickRole = 'island' | 'chief' | 'resident' | 'landmark' | 'board';
export interface PickEvent {
  islandId: string;
  role: PickRole;
}

export interface World {
  flyToIsland(id: string): void;
  overview(): void;
  setFocus(id: string | null): void;
  dispose(): void;
}

const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeGlowTexture(inner: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildSky(scene: THREE.Scene, ticks: Tick[]) {
  // 星星
  const n = 1800;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const palette = [new THREE.Color('#ffffff'), new THREE.Color('#bcd4ff'), new THREE.Color('#ffe7a8'), new THREE.Color('#ffc2c2')];
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(160 + Math.random() * 200);
    pos.set([v.x, v.y, v.z], i * 3);
    const c = palette[i % palette.length];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.4, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false }));
  scene.add(stars);
  ticks.push((t) => (stars.rotation.y = t * 0.004));

  // 粉彩星雲：柔和的藍、黃、淡紅
  const nebula = [
    ['rgba(143,184,255,0.55)', -120, -10, -140, 190],
    ['rgba(255,214,120,0.40)', 140, 20, -110, 160],
    ['rgba(255,160,170,0.42)', 30, -40, 160, 200],
    ['rgba(190,160,255,0.40)', -150, 30, 90, 170],
  ] as const;
  for (const [color, x, y, z, s] of nebula) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.position.set(x, y, z);
    sp.scale.setScalar(s);
    scene.add(sp);
  }

  // 遠方的小行星與環
  const planet = new THREE.Group();
  planet.add(sphere(9, mat('#ffc2c2'), 0, 0, 0, 24));
  const ring = mesh(new THREE.TorusGeometry(14, 0.6, 4, 64), mat('#ffe7a8', { emissive: '#ffe7a8', emissiveIntensity: 0.3 }));
  ring.rotation.x = Math.PI / 2.4;
  planet.add(ring);
  planet.position.set(-90, 45, -120);
  scene.add(planet);
  const moon = sphere(4, mat('#cfe0ff'), 95, 30, -60, 18);
  scene.add(moon);
  ticks.push((t) => {
    planet.rotation.y = t * 0.05;
  });
}

export function createWorld(container: HTMLElement, data: IslandData, onPick: (e: PickEvent) => void): World {
  // 若瀏覽器不支援 WebGL，這行會丟出錯誤，由呼叫端切換成清單模式
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
  labelRenderer.domElement.className = 'label-layer';
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0f1433');
  scene.fog = new THREE.Fog('#0f1433', 230, 520);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 900);
  const OVERVIEW_POS = new THREE.Vector3(0, 62, 70);
  // 直式手機畫面較窄：鏡頭拉遠並稍微俯視，讓整個群島放得進畫面
  const overviewPos = () => {
    const aspect = container.clientWidth / container.clientHeight;
    const k = Math.max(1, 0.95 / aspect);
    return new THREE.Vector3(0, OVERVIEW_POS.y * k * (aspect < 1 ? 1.15 : 1), OVERVIEW_POS.z * k * (aspect < 1 ? 0.8 : 1));
  };

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 10;
  controls.maxDistance = 240;
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.screenSpacePanning = false;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.HemisphereLight('#e6ecff', '#4a3d7a', 1.5));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.2);
  sun.position.set(40, 80, 30);
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#ffb4d0', 0.8);
  rim.position.set(-50, 20, -60);
  scene.add(rim);

  const ticks: Tick[] = [];
  buildSky(scene, ticks);

  const pickables: THREE.Object3D[] = [];
  const islandCenters = new Map<string, THREE.Vector3>();
  const labels = new Map<string, HTMLButtonElement>();
  const bobbers: { obj: THREE.Object3D; base: number; phase: number }[] = [];

  const tag = (obj: THREE.Object3D, islandId: string, role: PickRole) => {
    obj.traverse((o) => (o.userData.pick = { islandId, role }));
    pickables.push(obj);
  };

  const addLabel = (parent: THREE.Object3D, id: string, title: string, sub: string, y: number) => {
    const el = document.createElement('button');
    el.className = 'island-label';
    el.type = 'button';
    el.innerHTML = `<strong></strong><span></span>`;
    el.querySelector('strong')!.textContent = title;
    el.querySelector('span')!.textContent = sub;
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      onPick({ islandId: id, role: 'island' });
    });
    const obj = new CSS2DObject(el);
    obj.position.set(0, y, 0);
    parent.add(obj);
    labels.set(id, el);
  };

  // 中央星港
  const hub = data.hub;
  const hubPos = new THREE.Vector3(hub.position[0], 0, hub.position[1]);
  const hubDirs = data.islands.map((is) => new THREE.Vector2(is.position[0] - hub.position[0], is.position[1] - hub.position[1]).normalize());
  const hubIsland = buildIsland({ id: hub.id, rings: 1, grass: hub.color, path: '#fff8e6', accent: '#ffb4b4', glowColor: '#ffe7a8', pathDirs: hubDirs, reserved: [] });
  hubIsland.group.position.copy(hubPos);
  ticks.push(...hubIsland.ticks);
  const board = newsBoard();
  board.group.position.copy(hubIsland.spot(0, 0));
  hubIsland.group.add(board.group);
  ticks.push(...board.ticks);
  tag(board.group, hub.id, 'board');
  tag(hubIsland.group, hub.id, 'island');
  addLabel(hubIsland.group, hub.id, hub.name, hub.subtitle, 6.2);
  scene.add(hubIsland.group);
  islandCenters.set(hub.id, hubPos);

  // 各學組島嶼
  const RINGS = 2;
  const edge = (from: THREE.Vector3, to: THREE.Vector3, rings: number) => {
    const d = new THREE.Vector3().subVectors(to, from).setY(0).normalize();
    return from.clone().addScaledVector(d, 2 * Math.sqrt(3) * (rings + 0.35)).setY(1.35);
  };

  for (const is of data.islands) {
    const center = new THREE.Vector3(is.position[0], 0, is.position[1]);
    const toHub = new THREE.Vector2(hub.position[0] - is.position[0], hub.position[1] - is.position[1]).normalize();
    const built = buildIsland({
      id: is.id,
      rings: RINGS,
      grass: is.palette.grass,
      path: is.palette.path,
      accent: is.palette.accent,
      glowColor: is.palette.glow,
      pathDirs: [toHub],
      reserved: [[1, 0], [-1, 1], [0, -1], [-1, 0], [1, -1]],
    });
    built.group.position.copy(center);
    ticks.push(...built.ticks);
    tag(built.group, is.id, 'island');

    const lm = buildLandmark(is.landmark.type, is.palette);
    lm.group.position.copy(built.spot(0, 0));
    built.group.add(lm.group);
    ticks.push(...lm.ticks);
    tag(lm.group, is.id, 'landmark');

    // 島長與島民站在面向星港的那一側
    const facing = Math.atan2(toHub.x, toHub.y);
    const pickSpots = (): [[number, number], [number, number]] => {
      // 依面向星港的方向，選兩塊靠前的保留地磚
      const cands: [number, number][] = [[1, 0], [-1, 1], [0, -1], [-1, 0], [1, -1], [0, 1]];
      const scored = cands
        .map((c) => {
          const { x, z } = axialToXZ(c[0], c[1]);
          return { c, s: x * toHub.x + z * toHub.y, path: built.tiles.find((t) => t.q === c[0] && t.r === c[1])?.kind === 'path' };
        })
        .filter((c) => !c.path)
        .sort((a, b) => b.s - a.s);
      return [scored[0].c, scored[1].c];
    };
    const [chiefSpot, resSpot] = pickSpots();

    const chief = buildChief(is.palette.accent, is.palette.glow);
    chief.position.copy(built.spot(...chiefSpot));
    chief.rotation.y = facing;
    chief.add(tapRing(is.palette.glow));
    built.group.add(chief);
    tag(chief, is.id, 'chief');
    bobbers.push({ obj: chief, base: chief.position.y, phase: 0 });

    const res = buildResident(is.resident.model);
    res.position.copy(built.spot(...resSpot));
    res.rotation.y = facing;
    res.add(tapRing('#ffe7a8'));
    built.group.add(res);
    tag(res, is.id, 'resident');
    bobbers.push({ obj: res, base: res.position.y, phase: 1.7 });
    if (res.userData.flap) {
      const wings = res.userData.flap as THREE.Group;
      ticks.push((t) => wings.children.forEach((w, i) => (w.rotation.y = (i ? 1 : -1) * (0.5 + Math.sin(t * 6) * 0.35))));
    }

    addLabel(built.group, is.id, is.name, is.landmark.name, 8.4);
    scene.add(built.group);
    islandCenters.set(is.id, center);

    // 星光橋：每座島連回星港
    const a = edge(hubPos, center, 1);
    const b = edge(center, hubPos, RINGS);
    scene.add(buildBridge(a, b, is.palette.glow));
  }

  // 跨島任務的兩座島之間多一座橋
  const crossPairs: [string, string][] = [['info', 'heritage']];
  for (const [x, y] of crossPairs) {
    const ca = islandCenters.get(x);
    const cb = islandCenters.get(y);
    if (ca && cb) scene.add(buildBridge(edge(ca, cb, RINGS), edge(cb, ca, RINGS), '#ffe7a8'));
  }

  // 選取中的島下方光柱
  const focusMat = new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const focusBeam = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 6.5, 1.2, 6, 1, true), focusMat);
  focusBeam.rotation.y = Math.PI / 6;
  focusBeam.visible = false;
  scene.add(focusBeam);

  // ------- 點選（滑鼠與觸控都用 pointer 事件，移動距離小才算「點」，避免與旋轉衝突） -------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down: { x: number; y: number; t: number } | null = null;
  const el = renderer.domElement;

  const pickAt = (clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickables, true);
    // 角色與地標優先於島本身
    const order: PickRole[] = ['chief', 'resident', 'board', 'landmark', 'island'];
    let best: PickEvent | null = null;
    for (const h of hits.slice(0, 8)) {
      const p = h.object.userData.pick as PickEvent | undefined;
      if (!p) continue;
      if (!best || order.indexOf(p.role) < order.indexOf(best.role)) best = p;
      if (best.role !== 'island') break;
    }
    return best;
  };

  el.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() }));
  el.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 500;
    down = null;
    if (moved > 8 || !quick) return;
    const p = pickAt(e.clientX, e.clientY);
    if (p) onPick(p);
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || down) return;
    el.style.cursor = pickAt(e.clientX, e.clientY) ? 'pointer' : 'grab';
  });

  // ------- 飛行鏡頭 -------
  let flight: { fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; start: number; dur: number } | null = null;
  const flyTo = (target: THREE.Vector3, pos: THREE.Vector3) => {
    if (reduceMotion) {
      camera.position.copy(pos);
      controls.target.copy(target);
      return;
    }
    flight = { fromPos: camera.position.clone(), toPos: pos, fromTarget: controls.target.clone(), toTarget: target, start: performance.now(), dur: 1100 };
  };

  const world: World = {
    flyToIsland(id) {
      const c = islandCenters.get(id);
      if (!c) return;
      // 從星港方向看向島嶼，讓島長與島民面對鏡頭
      const away = c.clone().setY(0);
      if (away.lengthSq() < 1) away.set(0, 0, 1);
      away.normalize();
      const narrow = container.clientWidth < 700;
      const dist = narrow ? 46 : 24;
      const target = c.clone().add(new THREE.Vector3(0, 2.5, 0));
      const pos = c.clone().addScaledVector(away, -dist * 0.15).add(new THREE.Vector3(0, dist * 0.62, 0)).addScaledVector(away.clone().negate(), dist * 0.75);
      // 手機底部有面板：目標往下移，讓島出現在畫面上半部
      if (narrow) target.y -= 9;
      // 桌面右側有面板：鏡頭整體往右平移，讓島出現在畫面左半部
      else {
        const right = new THREE.Vector3().crossVectors(away, new THREE.Vector3(0, 1, 0)).normalize();
        const shift = Math.min(9, container.clientWidth / 140);
        target.addScaledVector(right, shift);
        pos.addScaledVector(right, shift);
      }
      flyTo(target, pos);
    },
    overview() {
      flyTo(new THREE.Vector3(0, 0, 0), overviewPos());
    },
    setFocus(id) {
      labels.forEach((l, key) => l.classList.toggle('is-focus', key === id));
      const c = id ? islandCenters.get(id) : null;
      focusBeam.visible = Boolean(c);
      if (c) focusBeam.position.set(c.x, -0.6, c.z);
    },
    dispose() {
      cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };

  // ------- 尺寸與動畫 -------
  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  };
  window.addEventListener('resize', resize);
  camera.position.copy(overviewPos());

  const clock = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    if (flight) {
      const k = Math.min(1, (performance.now() - flight.start) / flight.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(flight.fromPos, flight.toPos, e);
      controls.target.lerpVectors(flight.fromTarget, flight.toTarget, e);
      if (k >= 1) flight = null;
    }
    if (!reduceMotion) {
      for (const tk of ticks) tk(t, dt);
      for (const b of bobbers) b.obj.position.y = b.base + Math.abs(Math.sin(t * 2 + b.phase)) * 0.18;
    }
    focusMat.opacity = 0.25 + Math.sin(t * 3) * 0.12;
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };
  loop();

  return world;
}
