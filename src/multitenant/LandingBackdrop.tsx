import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { animate, stagger } from 'animejs';

/**
 * Fixed full-viewport visual backdrop for the company landing page.
 *
 * - Subtle wireframe grid plane in 3D space ("gravity-bend" effect: vertices
 *   are displaced toward the cursor like a flexible sheet pulled from below).
 * - A drifting glow particle field on top, also nudged by the cursor.
 * - Anime.js entrance staggers a few brand-coloured arcs in for the first ~1s
 *   so the scene doesn't feel static at first paint.
 * - Respects prefers-reduced-motion: renders one static frame, no rAF loop,
 *   no mouse reactivity.
 *
 * Drops into the DOM as a `<canvas>` + lightweight wrapper; sits behind any
 * content via z-index in CSS.
 */

type Props = {
  /** Hex string, used to tint the grid lines + glow particles. */
  brandPrimary?: string;
  /** Hex string, used as a secondary accent on the orbit particle. */
  brandAccent?: string;
};

function hexToVec3(hex: string, fallback: [number, number, number]): [number, number, number] {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [
    ((n >> 16) & 0xff) / 255,
    ((n >> 8) & 0xff) / 255,
    (n & 0xff) / 255,
  ];
}

export default function LandingBackdrop({
  brandPrimary = '#ff1b23',
  brandAccent = '#63cdff',
}: Props): JSX.Element {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const arcsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070b, 0.045);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 6.8, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // fully transparent — CSS gradient under it shows through
    mount.appendChild(renderer.domElement);

    // --- Gravity-bend wireframe grid --------------------------------------
    const SEGMENTS_X = 64;
    const SEGMENTS_Y = 40;
    const PLANE_W = 56;
    const PLANE_H = 36;
    const geom = new THREE.PlaneGeometry(PLANE_W, PLANE_H, SEGMENTS_X, SEGMENTS_Y);
    geom.rotateX(-Math.PI / 2.4);

    // Cache the initial Y positions (after rotation) so we can morph from baseline.
    const positions = geom.attributes.position;
    const basePositions = new Float32Array(positions.array.length);
    basePositions.set(positions.array as Float32Array);

    const primaryRgb = hexToVec3(brandPrimary, [1, 0.1, 0.14]);
    const gridColor = new THREE.Color(primaryRgb[0], primaryRgb[1], primaryRgb[2]).multiplyScalar(0.62);

    const gridMaterial = new THREE.LineBasicMaterial({
      color: gridColor,
      transparent: true,
      opacity: 0.42,
    });
    const grid = new THREE.LineSegments(new THREE.WireframeGeometry(geom), gridMaterial);
    grid.position.y = -1.2;
    scene.add(grid);

    // --- Glow particle field ----------------------------------------------
    const PARTICLE_COUNT = 220;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleSeeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      particlePositions[i * 3] = (Math.random() - 0.5) * PLANE_W * 0.95;
      particlePositions[i * 3 + 1] = Math.random() * 7 + 0.4;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * PLANE_H * 0.95;
      particleSeeds[i] = Math.random() * Math.PI * 2;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const accentRgb = hexToVec3(brandAccent, [0.39, 0.81, 1]);
    const particleColor = new THREE.Color(accentRgb[0], accentRgb[1], accentRgb[2]);
    const particleMat = new THREE.PointsMaterial({
      color: particleColor,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // --- Cursor target -----------------------------------------------------
    // mouseTarget is in world coords on the grid plane. Smoothed each frame.
    const mouseNDC = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const planeForPicking = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.2);
    const cursorWorld = new THREE.Vector3(0, 0, 0);
    const cursorTarget = new THREE.Vector3(0, 0, 0);

    function onPointerMove(event: PointerEvent) {
      const rect = mount!.getBoundingClientRect();
      mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(planeForPicking, cursorTarget);
    }
    if (!reduceMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    function onResize() {
      const w = mount!.clientWidth || window.innerWidth;
      const h = mount!.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize, { passive: true });

    // --- Render loop -------------------------------------------------------
    let rafId = 0;
    let last = performance.now();
    const tmpVec = new THREE.Vector3();
    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // smooth cursor pos
      cursorWorld.lerp(cursorTarget, Math.min(dt * 4.5, 1));

      // gravity-bend the grid vertices: pull each vertex toward cursor (downward)
      // intensity falls off with distance squared.
      const arr = positions.array as Float32Array;
      const time = now / 1000;
      for (let i = 0; i < arr.length; i += 3) {
        const bx = basePositions[i];
        const by = basePositions[i + 1];
        const bz = basePositions[i + 2];
        const dx = bx - cursorWorld.x;
        const dz = bz - cursorWorld.z;
        const distSq = dx * dx + dz * dz;
        // gravity well: stronger near cursor, falls off ~1/(d^2+1)
        const pull = 3.6 / (distSq * 0.18 + 1);
        // baseline ripple so the grid breathes even without cursor input
        const ripple = Math.sin(time * 0.6 + bx * 0.18 + bz * 0.21) * 0.08;
        arr[i] = bx;
        arr[i + 1] = by - pull + ripple;
        arr[i + 2] = bz;
      }
      positions.needsUpdate = true;
      // Rebuild wireframe edges so the LineSegments reflect new vertex positions.
      (grid.geometry as THREE.BufferGeometry).dispose();
      grid.geometry = new THREE.WireframeGeometry(geom);

      // Particles: lazy drift + slight cursor attraction
      const pArr = particleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        const i3 = i * 3;
        const seed = particleSeeds[i];
        const phase = time * 0.4 + seed;
        // drift in xz
        pArr[i3] += Math.cos(phase) * 0.0035;
        pArr[i3 + 2] += Math.sin(phase * 1.13) * 0.0035;
        // gentle bob in y
        pArr[i3 + 1] = (i % 8) * 0.6 + 0.6 + Math.sin(phase * 0.8) * 0.18;
        // cursor attraction (weak)
        tmpVec.set(pArr[i3] - cursorWorld.x, 0, pArr[i3 + 2] - cursorWorld.z);
        const lenSq = tmpVec.lengthSq();
        if (lenSq < 35) {
          const k = (35 - lenSq) / 35 * 0.012;
          pArr[i3] -= tmpVec.x * k;
          pArr[i3 + 2] -= tmpVec.z * k;
        }
        // wrap horizontally so particles never leave the plane
        if (pArr[i3] > PLANE_W / 2) pArr[i3] = -PLANE_W / 2;
        else if (pArr[i3] < -PLANE_W / 2) pArr[i3] = PLANE_W / 2;
        if (pArr[i3 + 2] > PLANE_H / 2) pArr[i3 + 2] = -PLANE_H / 2;
        else if (pArr[i3 + 2] < -PLANE_H / 2) pArr[i3 + 2] = PLANE_H / 2;
      }
      particleGeom.attributes.position.needsUpdate = true;

      // Camera parallax — subtle tilt toward cursor
      camera.position.x = cursorWorld.x * 0.10;
      camera.position.z = 12 + cursorWorld.z * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      if (!reduceMotion) rafId = requestAnimationFrame(tick);
    }
    if (reduceMotion) {
      renderer.render(scene, camera);
    } else {
      rafId = requestAnimationFrame(tick);
    }

    // --- Anime.js entrance: stagger the brand arcs in ----------------------
    const arcs = arcsRef.current?.querySelectorAll<HTMLDivElement>('.landing-backdrop-arc');
    if (arcs && arcs.length && !reduceMotion) {
      animate(arcs, {
        opacity: [0, 0.55],
        scale: [0.6, 1],
        delay: stagger(140, { start: 220 }),
        duration: 1100,
        ease: 'outCubic',
      });
    } else if (arcs && reduceMotion) {
      arcs.forEach((a) => { a.style.opacity = '0.5'; a.style.transform = 'scale(1)'; });
    }

    // --- Cleanup ----------------------------------------------------------
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      gridMaterial.dispose();
      particleMat.dispose();
      geom.dispose();
      particleGeom.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [brandPrimary, brandAccent]);

  return (
    <div className="landing-backdrop" aria-hidden="true">
      <div className="landing-backdrop-canvas" ref={mountRef} />
      <div className="landing-backdrop-arcs" ref={arcsRef}>
        <div className="landing-backdrop-arc landing-backdrop-arc-a" />
        <div className="landing-backdrop-arc landing-backdrop-arc-b" />
        <div className="landing-backdrop-arc landing-backdrop-arc-c" />
      </div>
      <div className="landing-backdrop-vignette" />
    </div>
  );
}
