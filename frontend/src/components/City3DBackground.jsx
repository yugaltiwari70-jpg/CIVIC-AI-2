import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';

export default function City3DBackground() {
  const mountRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 18, 38);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0e1b38, 2.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x22d3ee, 2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    const violetLight = new THREE.PointLight(0x7c3aed, 3, 80);
    violetLight.position.set(-20, 15, -10);
    scene.add(violetLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 4, 70);
    cyanLight.position.set(15, 10, 15);
    scene.add(cyanLight);

    // 1. Grid Floor (Glowing Roads / Matrix)
    const gridHelper = new THREE.GridHelper(120, 40, 0x00f2fe, 0x1e293b);
    gridHelper.position.y = -0.5;
    if (gridHelper.material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.45;
    }
    scene.add(gridHelper);

    // 2. City Buildings (Low-poly translucent blocks with glowing edges)
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshPhongMaterial({
      color: 0x09152e,
      emissive: 0x060f24,
      specular: 0x22d3ee,
      shininess: 40,
      transparent: true,
      opacity: 0.85
    });

    const edgeMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.6 });

    // Seed deterministic random buildings
    const buildingPositions = [];
    for (let x = -30; x <= 30; x += 4) {
      for (let z = -30; z <= 30; z += 4) {
        // Leave central plaza open for interactive pins
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;

        // Skip random blocks to create roads & open spaces
        const hash = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        const rand = hash - Math.floor(hash);
        if (rand < 0.4) continue;

        const h = 2 + rand * 14;
        const bMesh = new THREE.Mesh(buildingGeo, buildingMat);
        bMesh.scale.set(2.8, h, 2.8);
        bMesh.position.set(x, h / 2 - 0.5, z);
        cityGroup.add(bMesh);

        // Wireframe edges
        const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.8, h, 2.8));
        const wireframe = new THREE.LineSegments(edges, edgeMat);
        wireframe.position.set(x, h / 2 - 0.5, z);
        cityGroup.add(wireframe);

        buildingPositions.push({ x, z, h });
      }
    }

    // 3. Central Holographic Scanner Pin (for Report & Issue pages)
    const pinGroup = new THREE.Group();
    pinGroup.position.set(0, 3, 0);

    // Pin Cone
    const coneGeo = new THREE.ConeGeometry(1.2, 3, 16);
    coneGeo.rotateX(Math.PI);
    const coneMat = new THREE.MeshPhongMaterial({ color: 0x22d3ee, emissive: 0x0891b2, transparent: true, opacity: 0.9, shininess: 100 });
    const pinMesh = new THREE.Mesh(coneGeo, coneMat);
    pinMesh.position.y = 2.5;
    pinGroup.add(pinMesh);

    // Pin Orbit Ring 1
    const ring1Geo = new THREE.RingGeometry(1.8, 2.1, 32);
    ring1Geo.rotateX(Math.PI / 2);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat1);
    ring1.position.y = 0.2;
    pinGroup.add(ring1);

    // Pin Orbit Ring 2
    const ring2Geo = new THREE.RingGeometry(2.6, 2.8, 32);
    ring2Geo.rotateX(Math.PI / 2);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x7c3aed, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const ring2 = new THREE.Mesh(ring2Geo, ringMat2);
    ring2.position.y = 0.1;
    pinGroup.add(ring2);

    scene.add(pinGroup);

    // 4. Ambient Data Particles Field
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 1] = Math.random() * 30 + 1;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      particleScales[i] = Math.random() * 0.4 + 0.1;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.45,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. Data Packet Beams (Glowing lines moving across the city)
    const lineCount = 12;
    const lineGroup = new THREE.Group();
    for (let i = 0; i < lineCount; i++) {
      const lineMat = new THREE.LineBasicMaterial({ color: i % 2 === 0 ? 0x00f2fe : 0x34d399, transparent: true, opacity: 0.8 });
      const points = [
        new THREE.Vector3((Math.random() - 0.5) * 40, 0.2, (Math.random() - 0.5) * 40),
        new THREE.Vector3((Math.random() - 0.5) * 40, 8 + Math.random() * 8, (Math.random() - 0.5) * 40)
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, lineMat);
      lineGroup.add(line);
    }
    scene.add(lineGroup);

    // Mouse Interaction Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Base rotation and camera target based on route
      const path = location.pathname;

      if (path === '/') {
        // Dynamic camera orbit on home
        camera.position.x = Math.sin(elapsedTime * 0.15) * 36 + mouseX * 6;
        camera.position.z = Math.cos(elapsedTime * 0.15) * 36 + mouseY * 4;
        camera.position.y = 20 - mouseY * 4;
        camera.lookAt(0, 2, 0);
        pinGroup.visible = true;
      } else if (path === '/report') {
        // Focus on scanning pin
        camera.position.x = Math.sin(elapsedTime * 0.1) * 22 + mouseX * 4;
        camera.position.z = 22 + mouseY * 4;
        camera.position.y = 12;
        camera.lookAt(0, 3, 0);
        pinGroup.visible = true;
      } else if (path.startsWith('/admin')) {
        // Elevated security dashboard view
        camera.position.x = mouseX * 8;
        camera.position.z = 32 + mouseY * 6;
        camera.position.y = 26;
        camera.lookAt(0, 0, 0);
        pinGroup.visible = false;
      } else {
        // Default clean perspective
        camera.position.x = Math.sin(elapsedTime * 0.08) * 30 + mouseX * 5;
        camera.position.z = 30 + mouseY * 5;
        camera.position.y = 18;
        camera.lookAt(0, 0, 0);
        pinGroup.visible = true;
      }

      // Pin Animations
      pinMesh.position.y = 2.5 + Math.sin(elapsedTime * 2.5) * 0.4;
      pinMesh.rotation.y = elapsedTime * 1.5;
      ring1.rotation.z = elapsedTime * 1.2;
      ring2.rotation.z = -elapsedTime * 0.8;
      ring1.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.1);

      // Particle Motion
      const positions = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsedTime + i) * 0.02;
        if (positions[i * 3 + 1] > 32) positions[i * 3 + 1] = 1;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // City light pulse
      cyanLight.intensity = 3.5 + Math.sin(elapsedTime * 3) * 1.2;
      violetLight.intensity = 2.5 + Math.cos(elapsedTime * 2) * 1.0;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      buildingGeo.dispose();
      buildingMat.dispose();
      edgeMat.dispose();
      coneGeo.dispose();
      coneMat.dispose();
      ring1Geo.dispose();
      ringMat1.dispose();
      ring2Geo.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      lineGroup.children.forEach(l => {
        if (l.geometry) l.geometry.dispose();
        if (l.material) l.material.dispose();
      });
    };
  }, [location.pathname]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.85,
        background: 'radial-gradient(circle at 50% 30%, #0c1833 0%, #050814 85%)'
      }}
    />
  );
}
