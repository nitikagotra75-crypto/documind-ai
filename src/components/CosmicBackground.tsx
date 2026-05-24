import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Two colliding spiral galaxies rendered as point clouds.
 * Smooth, slow, parallax-aware. Sits behind the entire page.
 */
export default function CosmicBackground() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0814, 0.03);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Starfield background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 60 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.6 })
    );
    scene.add(stars);

    // Galaxy builder
    function buildGalaxy(color1: number, color2: number, arms = 4) {
      const count = 12000;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const c1 = new THREE.Color(color1);
      const c2 = new THREE.Color(color2);
      const radius = 6;
      for (let i = 0; i < count; i++) {
        const r = Math.pow(Math.random(), 0.6) * radius;
        const branch = (i % arms) / arms;
        const spin = r * 1.2;
        const angle = branch * Math.PI * 2 + spin;
        const scatter = 0.35 * r;
        const sx = (Math.random() - 0.5) * scatter;
        const sy = (Math.random() - 0.5) * scatter * 0.3;
        const sz = (Math.random() - 0.5) * scatter;
        positions[i * 3] = Math.cos(angle) * r + sx;
        positions[i * 3 + 1] = sy;
        positions[i * 3 + 2] = Math.sin(angle) * r + sz;
        const mixed = c1.clone().lerp(c2, r / radius);
        colors[i * 3] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.07,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geo, mat);
    }

    const galaxyA = buildGalaxy(0xb47bff, 0xff4fbf, 4);
    const galaxyB = buildGalaxy(0x4fb8ff, 0x6affd0, 5);
    scene.add(galaxyA);
    scene.add(galaxyB);

    // Core glows
    const addCore = (color: number, intensity = 1) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color,
          transparent: true,
          opacity: 0.7 * intensity,
          blending: THREE.AdditiveBlending,
        })
      );
      sprite.scale.set(3, 3, 3);
      return sprite;
    };
    const coreA = addCore(0xff7fe0);
    const coreB = addCore(0x66c8ff);
    scene.add(coreA);
    scene.add(coreB);

    const mouse = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      const t = clock.getElapsedTime();
      frame++;

      // Slow orbit / collision: galaxies drift toward each other and rotate
      const orbit = t * 0.06;
      const dist = 7 + Math.sin(t * 0.15) * 1.5; // breathing collision distance
      galaxyA.position.set(Math.cos(orbit) * -dist, Math.sin(t * 0.1) * 0.6, Math.sin(orbit) * -dist * 0.3);
      galaxyB.position.set(Math.cos(orbit + Math.PI) * -dist, Math.sin(t * 0.1 + 1) * -0.6, Math.sin(orbit + Math.PI) * -dist * 0.3);

      galaxyA.rotation.y = t * 0.12;
      galaxyA.rotation.x = Math.sin(t * 0.1) * 0.25;
      galaxyB.rotation.y = -t * 0.1;
      galaxyB.rotation.x = Math.cos(t * 0.1) * 0.25;
      galaxyB.rotation.z = Math.sin(t * 0.05) * 0.4;

      coreA.position.copy(galaxyA.position);
      coreB.position.copy(galaxyB.position);

      stars.rotation.y = t * 0.005;

      // Parallax camera
      camera.position.x += (mouse.x * 2 - camera.position.x) * 0.02;
      camera.position.y += (-mouse.y * 1.2 + 2 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      starsGeo.dispose();
      galaxyA.geometry.dispose();
      (galaxyA.material as THREE.Material).dispose();
      galaxyB.geometry.dispose();
      (galaxyB.material as THREE.Material).dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      void frame;
    };
  }, []);

  return (
    <div
      ref={mount}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 20% 10%, oklch(0.2 0.08 290 / 0.6), transparent 60%), radial-gradient(ellipse at 80% 90%, oklch(0.2 0.1 220 / 0.5), transparent 60%), oklch(0.08 0.02 270)",
      }}
    />
  );
}
