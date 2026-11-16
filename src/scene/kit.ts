// 共用的小工具：材質快取、基本形狀、可重現的亂數。所有 3D 物件都用程式組成，不需外部模型檔。
import * as THREE from 'three';

const matCache = new Map<string, THREE.Material>();

export function mat(color: string, opts: { emissive?: string; emissiveIntensity?: number; opacity?: number; metalness?: number; roughness?: number } = {}) {
  const key = JSON.stringify([color, opts]);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0.05,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.emissiveIntensity ?? 1,
      transparent: opts.opacity !== undefined,
      opacity: opts.opacity ?? 1,
      depthWrite: opts.opacity === undefined,
    });
    matCache.set(key, m);
  }
  return m;
}

export function glow(color: string, intensity = 1.6) {
  return mat(color, { emissive: color, emissiveIntensity: intensity });
}

export function mesh(geo: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  return m;
}

export const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) =>
  mesh(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z);

export const sphere = (r: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 12) =>
  mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), m, x, y, z);

export const cyl = (rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 10) =>
  mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);

export const cone = (r: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 8) =>
  mesh(new THREE.ConeGeometry(r, h, seg), m, x, y + h / 2, z);

/** 依字串產生可重現的亂數，讓每次載入的島嶼長得一樣。 */
export function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 每幀要更新的動畫（旋轉、上下漂浮等）。 */
export type Tick = (t: number, dt: number) => void;
