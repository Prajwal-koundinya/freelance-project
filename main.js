/* ============================================================
   MEGHA JEWELLERS — CINEMATIC EXPERIENCE ENGINE v2
   Three.js 3D Gold Ornament · Canvas Particles · GSAP · Lenis
   ============================================================ */
'use strict';

// ──────────────────────────────────────────────────────────────
// 0. CDN LOADER
// ──────────────────────────────────────────────────────────────
function loadScript(src, cb) {
  const s = document.createElement('script');
  s.src = src; s.onload = cb;
  s.onerror = () => { console.warn('Failed to load:', src); if (cb) cb(); };
  document.head.appendChild(s);
}

function bootstrap() {
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', () => {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', () => {
      loadScript('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js', () => {
        startAll();
      });
    });
  });
}

// ──────────────────────────────────────────────────────────────
// 1. ORCHESTRATOR
// ──────────────────────────────────────────────────────────────
function startAll() {
  initSmoothScroll();
  initParticles();         // Global golden dust (3 layers)
  runPreloader();          // Materialise logo
  initCursor();
  initNav();
  initMobileNav();
  initScrollReveals();
  initStoryBridge();
  init3DCards();           // CSS 3D tilt on jewel cards
  initProductOverlay();
  initCounters();
  initGSAPAnimations();
  // 3D ornament loads after hero reveal (non-blocking)
}

// ──────────────────────────────────────────────────────────────
// 2. SMOOTH SCROLL — Lenis
// ──────────────────────────────────────────────────────────────
let lenis;
function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    duration: 1.5,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
  });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const el = document.querySelector(a.getAttribute('href'));
      if (el) lenis ? lenis.scrollTo(el, { offset: -40, duration: 1.8 }) : el.scrollIntoView({ behavior: 'smooth' });
      closeNav();
      closeMobileNav();
    });
  });
}

// ──────────────────────────────────────────────────────────────
// 3. PARTICLE SYSTEM — Three canvas layers
// ──────────────────────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Particle {
    constructor(layerType) {
      this.layer = layerType; // 'dust' | 'sparkle' | 'streak'
      this.reset(true);
    }
    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 20;
      if (this.layer === 'dust') {
        this.size      = Math.random() * 1.6 + 0.3;
        this.speedY    = -(Math.random() * 0.35 + 0.08);
        this.speedX    = (Math.random() - .5) * 0.25;
        this.maxOp     = Math.random() * 0.45 + 0.08;
        this.twinkleF  = Math.random() * 0.018 + 0.005;
      } else if (this.layer === 'sparkle') {
        this.size      = Math.random() * 2.5 + 0.8;
        this.speedY    = -(Math.random() * 0.6 + 0.2);
        this.speedX    = (Math.random() - .5) * 0.5;
        this.maxOp     = Math.random() * 0.7 + 0.2;
        this.twinkleF  = Math.random() * 0.04 + 0.015;
        this.isStar    = Math.random() > 0.5;
      } else { // streak
        this.x = Math.random() * W;
        this.y = Math.random() * H * 0.7;
        this.size      = Math.random() * 0.8 + 0.3;
        this.speedY    = -(Math.random() * 1.2 + 0.5);
        this.speedX    = (Math.random() - .5) * 0.3;
        this.maxOp     = Math.random() * 0.35 + 0.05;
        this.len       = Math.random() * 25 + 8;
        this.twinkleF  = Math.random() * 0.02;
      }
      this.phase = Math.random() * Math.PI * 2;
      this.opacity = 0;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.phase) * 0.15;
      this.phase += this.twinkleF;
      this.opacity = Math.min(this.maxOp, this.opacity + 0.003);
      const twinkle = 0.6 + 0.4 * Math.sin(this.phase * 3);
      this.currentOp = this.opacity * twinkle;
      if (this.y < -30) this.reset();
    }
    draw(ctx) {
      if (this.layer === 'streak') {
        ctx.save();
        const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.speedX * 6, this.y + this.len);
        grad.addColorStop(0, `rgba(246,211,101,${this.currentOp})`);
        grad.addColorStop(1, 'rgba(212,175,55,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.size;
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.speedX * 6, this.y + this.len);
        ctx.stroke(); ctx.restore();
        return;
      }
      if (this.isStar && this.layer === 'sparkle') {
        // 4-point star sparkle
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = `rgba(246,211,101,${this.currentOp})`;
        const s = this.size;
        ctx.beginPath();
        ctx.moveTo(0, -s * 2.5); ctx.lineTo(s * 0.4, -s * 0.4);
        ctx.lineTo(s * 2.5, 0);  ctx.lineTo(s * 0.4, s * 0.4);
        ctx.lineTo(0, s * 2.5);  ctx.lineTo(-s * 0.4, s * 0.4);
        ctx.lineTo(-s * 2.5, 0); ctx.lineTo(-s * 0.4, -s * 0.4);
        ctx.closePath(); ctx.fill(); ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const c = this.layer === 'sparkle' ? '246,211,101' : '212,175,55';
        ctx.fillStyle = `rgba(${c},${this.currentOp})`;
        ctx.fill();
      }
    }
  }

  // Create particle pool: increased for more animation
  for (let i = 0; i < 150; i++) particles.push(new Particle('dust'));
  for (let i = 0; i < 80;  i++) particles.push(new Particle('sparkle'));
  for (let i = 0; i < 40;  i++) particles.push(new Particle('streak'));

  let scrollY = 0;
  let lastScrollY = 0;
  let scrollSpeed = 0;
  window.addEventListener('scroll', () => {
    scrollSpeed = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;
    scrollY = window.scrollY;
  }, { passive: true });

  function animate() {
    ctx.clearRect(0, 0, W, H);
    // Scroll-speed boost on particles
    scrollSpeed *= 0.9; // decay
    const scrollBoost = Math.min(scrollSpeed * 0.02 + scrollY * 0.0005, 2.5);
    particles.forEach(p => {
      p.speedY -= scrollBoost * 0.002;
      p.speedX += (Math.random() - 0.5) * scrollBoost * 0.001;
      p.update();
      p.draw(ctx);
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// ──────────────────────────────────────────────────────────────
// 4. PRELOADER
// ──────────────────────────────────────────────────────────────
function runPreloader() {
  const el  = document.getElementById('preloader');
  const mono = document.getElementById('plMono');
  const logo = document.getElementById('plLogo');
  const tag  = document.getElementById('plTag');
  const bar  = document.getElementById('plBar');
  const fill = document.getElementById('plFill');
  if (!el) return;

  // Preloader inner particles
  const pc = document.getElementById('preloader-canvas');
  if (pc) { pc.width = window.innerWidth; pc.height = window.innerHeight; startPLParticles(pc); }

  setTimeout(() => { mono && mono.classList.add('show'); bar && bar.classList.add('show'); }, 300);
  setTimeout(() => { logo && logo.classList.add('show'); fill && fill.classList.add('done'); }, 600);
  setTimeout(() => { tag  && tag.classList.add('show'); }, 1100);

  setTimeout(() => {
    el.classList.add('fade-out');
    revealHero();
  }, 3000);

  setTimeout(() => { el.style.display = 'none'; }, 4500);
}

function startPLParticles(canvas) {
  const ctx = canvas.getContext('2d');
  const pts = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.3 + 0.2,
    op: 0, maxOp: Math.random() * 0.6 + 0.1,
    vy: -(Math.random() * 0.35 + 0.08),
    vx: (Math.random() - .5) * 0.2,
    phase: Math.random() * Math.PI * 2,
  }));
  function tick() {
    if (!document.getElementById('preloader')) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      p.y += p.vy; p.x += p.vx + Math.sin(p.phase) * 0.18; p.phase += 0.01;
      p.op = Math.min(p.maxOp, p.op + 0.005);
      if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; p.op = 0; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${p.op * (0.6 + 0.4 * Math.sin(p.phase * 2))})`; ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
}

// ──────────────────────────────────────────────────────────────
// 5. HERO REVEAL
// ──────────────────────────────────────────────────────────────
function revealHero() {
  const reveal = (id, delay, fromY = 20) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transition = `opacity 1.3s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 1.3s cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
    el.style.transform = `translateY(0px)`;
    el.style.opacity = '1';
  };
  setTimeout(() => { reveal('heroEyebrow', 0); }, 200);
  setTimeout(() => { reveal('heroTitle',   0); }, 400);
  setTimeout(() => { reveal('heroTagline', 0); }, 650);
  setTimeout(() => { reveal('heroCtas',    0); }, 900);
  setTimeout(() => {
    const c = document.getElementById('heroScrollCue');
    if (c) { c.style.transition = 'opacity 1.2s ease'; c.style.opacity = '0.65'; }
  }, 1600);

  // 3D ornament removed

}

// ──────────────────────────────────────────────────────────────
// 6. THREE.JS — GOLD 3D ORNAMENT
// ──────────────────────────────────────────────────────────────
function init3DOrnament() {
  if (typeof THREE === 'undefined') {
    fallbackOrnament(); return;
  }

  const container = document.getElementById('ornament-3d');
  if (!container) return;

  const W = container.clientWidth  || 500;
  const H = container.clientHeight || 600;

  // Scene
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(48, W / H, 0.1, 500);
  camera.position.set(0, 0.2, 5.5);

  // Renderer with alpha for seamless background blend
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.shadowMap.enabled  = false;
  container.appendChild(renderer.domElement);

  // ── GOLD MATERIAL ─────────────────────────────────────────
  // Use multiple hand-crafted point lights to fake a rich env map
  const goldMat = new THREE.MeshStandardMaterial({
    color:            new THREE.Color(0xD4AF37),
    emissive:         new THREE.Color(0x2a1800),
    emissiveIntensity: 0.12,
    metalness:        1.0,
    roughness:        0.10,
  });

  const goldBrightMat = new THREE.MeshStandardMaterial({
    color:            new THREE.Color(0xF6D365),
    emissive:         new THREE.Color(0x3a2500),
    emissiveIntensity: 0.15,
    metalness:        1.0,
    roughness:        0.08,
  });

  const gemMat = new THREE.MeshStandardMaterial({
    color:            new THREE.Color(0xFFE49A),
    emissive:         new THREE.Color(0x7a5000),
    emissiveIntensity: 0.4,
    metalness:        0.6,
    roughness:        0.02,
    transparent:      true,
    opacity:          0.9,
  });

  // ── GEOMETRY ──────────────────────────────────────────────

  // 1. Main centrepiece: Torus Knot (intricate rope/chain pattern)
  const knotGeo = new THREE.TorusKnotGeometry(1.05, 0.24, 300, 32, 2, 3);
  const knot    = new THREE.Mesh(knotGeo, goldMat);
  scene.add(knot);

  // 2. Outer orbiting ring — a thin elegant bangle
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.040, 20, 150),
    goldBrightMat
  );
  ring1.rotation.x = 0.42;
  scene.add(ring1);

  // 3. Second ring at different angle
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.028, 16, 150),
    goldMat
  );
  ring2.rotation.x = -0.55;
  ring2.rotation.y =  0.3;
  scene.add(ring2);

  // 4. Small gem spheres orbiting the knot
  const gemGroup = new THREE.Group();
  const N_GEMS   = 10;
  const GEM_R    = 1.9; // orbit radius

  for (let i = 0; i < N_GEMS; i++) {
    const angle = (i / N_GEMS) * Math.PI * 2;
    const gem   = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), gemMat);
    gem.position.set(
      Math.cos(angle) * GEM_R,
      Math.sin(angle) * GEM_R * 0.28,
      Math.sin(angle * 2) * 0.25
    );
    gem.userData = { baseAngle: angle };
    gemGroup.add(gem);
  }
  scene.add(gemGroup);

  // 5. Tiny accent particles around the whole thing
  const dustGeo = new THREE.BufferGeometry();
  const dustN   = 60;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN * 3; i++) {
    dustPos[i] = (Math.random() - .5) * 5;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color:       0xF6D365,
    size:        0.035,
    transparent: true,
    opacity:     0.6,
    depthWrite:  false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // ── LIGHTING RIG ──────────────────────────────────────────
  // Ambient (warm dark)
  scene.add(new THREE.AmbientLight(0x1B130C, 2.8));

  // Key light — warm golden from upper-right
  const key = new THREE.DirectionalLight(0xF6D365, 7.0);
  key.position.set(4, 7, 4); scene.add(key);

  // Fill light — gold from left-low
  const fill = new THREE.PointLight(0xD4AF37, 4.5, 25);
  fill.position.set(-5, 1, 3); scene.add(fill);

  // Rim light — bright behind for metallic edge
  const rim = new THREE.PointLight(0xFFE49A, 3.2, 20);
  rim.position.set(-1.5, -3.5, -4.5); scene.add(rim);

  // Under-bounce — dark gold from below
  const bounce = new THREE.PointLight(0x9a7a1a, 2.0, 18);
  bounce.position.set(0, -5, 2); scene.add(bounce);

  // Front accent
  const front = new THREE.PointLight(0xF6D365, 1.2, 12);
  front.position.set(1.5, 0.5, 7); scene.add(front);

  // Moving key (animated)
  const mKey = new THREE.PointLight(0xFFCC44, 2.5, 20);
  mKey.position.set(-3, 3, 3); scene.add(mKey);

  // ── RESPONSIVE RESIZE ─────────────────────────────────────
  window.addEventListener('resize', () => {
    const nW = container.clientWidth;
    const nH = container.clientHeight;
    if (!nW || !nH) return;
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  }, { passive: true });

  // ── MOUSE INTERACTION ──────────────────────────────────────
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - .5) * 2;
    mouseY = (e.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });

  // ── FADE IN ────────────────────────────────────────────────
  renderer.domElement.style.opacity = '0';
  renderer.domElement.style.transition = 'opacity 1.5s ease';
  setTimeout(() => { renderer.domElement.style.opacity = '1'; }, 100);

  // ── ANIMATE ────────────────────────────────────────────────
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;

    // Torus knot — slow rotation with breathing scale
    knot.rotation.y  =  t * 0.45;
    knot.rotation.x  =  Math.sin(t * 0.28) * 0.14;
    knot.rotation.z  =  Math.cos(t * 0.15) * 0.06;
    knot.position.y  =  Math.sin(t * 0.55) * 0.08;
    const breathe    =  1 + Math.sin(t * 0.7) * 0.02;
    knot.scale.setScalar(breathe);

    // Camera subtle drift following mouse
    camera.position.x += (mouseX * 0.9 - camera.position.x) * 0.025;
    camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    // Outer rings counter-rotate
    ring1.rotation.z  += 0.0018;
    ring1.rotation.y  += 0.0012;
    ring2.rotation.z  -= 0.0015;
    ring2.rotation.x  += 0.0008;

    // Gem orbit
    gemGroup.rotation.y += 0.004;
    gemGroup.rotation.z  = Math.sin(t * 0.4) * 0.08;
    gemGroup.children.forEach((gem, i) => {
      gem.rotation.x += 0.025;
      gem.rotation.y += 0.018;
    });

    // Dust cloud slow rotation
    dust.rotation.y += 0.003;
    dust.rotation.x  = Math.sin(t * 0.3) * 0.05;

    // Moving key light orbit
    mKey.position.x = Math.cos(t * 0.6) * 4;
    mKey.position.z = Math.sin(t * 0.6) * 4;
    mKey.intensity  = 2.5 + Math.sin(t * 1.2) * 0.5;

    renderer.render(scene, camera);
  }
  animate();

  // Ornament sparkle canvas (floating CSS sparkles around 3D canvas)
  initOrnamentSparkles();
}

// Fallback if Three.js fails: CSS animated ornament
function fallbackOrnament() {
  const container = document.getElementById('ornament-3d');
  if (!container) return;
  container.innerHTML = `
    <div style="
      width:100%;height:100%;
      display:flex;align-items:center;justify-content:center;
      position:relative;
    ">
      <div style="
        width:240px;height:240px;border-radius:50%;
        border:18px solid transparent;
        background:linear-gradient(var(--bg-primary),var(--bg-primary)) padding-box,
                  linear-gradient(135deg,#D4AF37,#F6D365,#D4AF37,#9a7a1a,#F6D365) border-box;
        animation:fallbackSpin 6s linear infinite;
        box-shadow:0 0 40px rgba(212,175,55,0.4),inset 0 0 20px rgba(212,175,55,0.1);
      "></div>
    </div>
    <style>
      @keyframes fallbackSpin {
        0%{transform:rotateY(0deg) rotateX(10deg);}
        100%{transform:rotateY(360deg) rotateX(10deg);}
      }
    </style>
  `;
}

// Floating sparkles around the 3D ornament canvas
function initOrnamentSparkles() {
  const canvas = document.getElementById('ornament-sparkle-canvas');
  const wrap   = document.querySelector('.hero-ornament-wrap');
  if (!canvas || !wrap) return;

  function resize() {
    canvas.width  = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const ctx   = canvas.getContext('2d');
  const sparks = Array.from({ length: 30 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.3,
    vx: (Math.random() - .5) * 0.5,
    vy: -(Math.random() * 0.6 + 0.1),
    op: 0, maxOp: Math.random() * 0.8 + 0.2,
    phase: Math.random() * Math.PI * 2,
    isStar: Math.random() > 0.6,
  }));

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparks.forEach(s => {
      s.x += s.vx + Math.sin(s.phase) * 0.3;
      s.y += s.vy;
      s.phase += 0.02;
      s.op = Math.min(s.maxOp, s.op + 0.008);
      const tw = 0.5 + 0.5 * Math.sin(s.phase * 4);
      const alpha = s.op * tw;
      if (s.y < -10) {
        s.y = canvas.height + 10;
        s.x = Math.random() * canvas.width;
        s.op = 0;
      }
      if (s.isStar) {
        ctx.save(); ctx.translate(s.x, s.y);
        ctx.fillStyle = `rgba(246,211,101,${alpha})`;
        const r = s.r * 2;
        ctx.beginPath();
        ctx.moveTo(0,-r*2.2);ctx.lineTo(r*.4,-r*.4);ctx.lineTo(r*2.2,0);ctx.lineTo(r*.4,r*.4);
        ctx.lineTo(0,r*2.2);ctx.lineTo(-r*.4,r*.4);ctx.lineTo(-r*2.2,0);ctx.lineTo(-r*.4,-r*.4);
        ctx.closePath(); ctx.fill(); ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${alpha})`; ctx.fill();
      }
    });
    requestAnimationFrame(tick);
  }
  tick();
}

// ──────────────────────────────────────────────────────────────
// 7. CUSTOM CURSOR
// ──────────────────────────────────────────────────────────────
function initCursor() {
  const orb  = document.getElementById('cursorOrb');
  const ring = document.getElementById('cursorRing');
  if (!orb || window.matchMedia('(hover:none)').matches) return;

  let mx = -200, my = -200, rx = -200, ry = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    orb.style.left = mx + 'px'; orb.style.top = my + 'px';
  }, { passive: true });

  function lagRing() {
    rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
    if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
    requestAnimationFrame(lagRing);
  }
  lagRing();

  const targets = 'a,button,.jewel-card,.usp-chip,.ccard,.hero-dot';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(targets)) { orb.classList.add('hovered'); ring.classList.add('hovered'); }
  });
  document.addEventListener('mouseout',  e => {
    if (e.target.closest(targets)) { orb.classList.remove('hovered'); ring.classList.remove('hovered'); }
  });
  document.addEventListener('mouseleave', () => { orb.style.opacity='0'; ring.style.opacity='0'; });
  document.addEventListener('mouseenter', () => { orb.style.opacity='1'; ring.style.opacity='1'; });
}

// ──────────────────────────────────────────────────────────────
// 8. SLIDE-PANEL NAV
// ──────────────────────────────────────────────────────────────
let navIsOpen = false;

function initNav() {
  const toggle  = document.getElementById('navToggle');
  const overlay = document.getElementById('navOverlay');
  const panel   = document.getElementById('navPanel');
  if (!toggle || !overlay) return;

  toggle.addEventListener('click', () => navIsOpen ? closeNav() : openNav());

  // Close on backdrop click (outside panel)
  overlay.addEventListener('click', e => {
    if (!panel.contains(e.target)) closeNav();
  });

  // Nav links close on click
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
}

function openNav() {
  navIsOpen = true;
  document.getElementById('navToggle')?.classList.add('open');
  document.getElementById('navOverlay')?.classList.add('open');
  document.getElementById('navPanel')?.classList.add('open');
  document.getElementById('navToggle')?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('nav-open');
  if (lenis) lenis.stop();
}

function closeNav() {
  navIsOpen = false;
  document.getElementById('navToggle')?.classList.remove('open');
  document.getElementById('navOverlay')?.classList.remove('open');
  document.getElementById('navPanel')?.classList.remove('open');
  document.getElementById('navToggle')?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
  if (lenis) lenis.start();
}

// ──────────────────────────────────────────────────────────────
// 9. MOBILE NAV (uses same slide panel)
// ──────────────────────────────────────────────────────────────
function initMobileNav() {
  const btn = document.getElementById('mobileNavBtn');
  if (!btn) return;
  btn.addEventListener('click', () => navIsOpen ? closeNav() : openNav());
}

function closeMobileNav() { closeNav(); }

// ──────────────────────────────────────────────────────────────
// 10. SCROLL REVEALS — IntersectionObserver
// ──────────────────────────────────────────────────────────────
function initScrollReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseInt(el.dataset.delay) || 0;
      setTimeout(() => el.classList.add('visible'), delay);
      io.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll(
    '.reveal,.reveal-left,.reveal-right,.stat-card,.jewel-card,.tcard,.craft-stat,.section-header'
  ).forEach(el => io.observe(el));

  // Philosophy word reveal
  const philIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.word').forEach((w, i) => {
        setTimeout(() => w.classList.add('lit'), i * 75);
      });
      // Also reveal adjacent elements
      document.getElementById('philLabel')?.classList.add('visible');
      document.getElementById('philBody')?.classList.add('visible');
      philIO.unobserve(entry.target);
    });
  }, { threshold: 0.25 });
  const ph = document.getElementById('philHeadline');
  if (ph) philIO.observe(ph);

  // Craft quote
  const craftIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); craftIO.unobserve(e.target); } });
  }, { threshold: 0.3 });
  const cq = document.getElementById('craftQuote');
  if (cq) craftIO.observe(cq);
}

// ──────────────────────────────────────────────────────────────
// 11. STORY BRIDGE — line-by-line reveal
// ──────────────────────────────────────────────────────────────
function initStoryBridge() {
  const lines = document.querySelectorAll('.story-line');
  if (!lines.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      lines.forEach(line => {
        const delay = parseInt(line.dataset.delay) || 0;
        setTimeout(() => line.classList.add('lit'), delay);
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.3 });
  io.observe(document.getElementById('story-intro') || lines[0]);
}

// ──────────────────────────────────────────────────────────────
// 12. 3D CARD TILT
// ──────────────────────────────────────────────────────────────
function init3DCards() {
  if (window.matchMedia('(hover:none)').matches) return;

  document.querySelectorAll('.jewel-card').forEach(card => {
    const inner = card.querySelector('.jewel-card-inner');
    if (!inner) return;

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x  = (e.clientX - rect.left) / rect.width;
      const y  = (e.clientY - rect.top)  / rect.height;
      const rx = (y - .5) * -16;
      const ry = (x - .5) *  16;

      inner.style.transform    = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
      inner.style.transition   = 'transform 0.08s linear, box-shadow 0.4s, border-color 0.4s';

      // Dynamic lighting gradient
      const px = x * 100, py = y * 100;
      const sheen = card.querySelector('.jewel-card-sheen');
      if (sheen) sheen.style.background = `linear-gradient(${px + py}deg, rgba(246,211,101,0.18) 0%, transparent 45%, rgba(246,211,101,0.06) 100%)`;

      // Emit sparkles occasionally
      if (Math.random() < 0.04) emitCardSpark(e.clientX, e.clientY);
    });

    card.addEventListener('mouseleave', () => {
      inner.style.transform  = '';
      inner.style.transition = 'transform 0.9s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.6s, border-color 0.5s';
    });

    // Keyboard
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOverlay(card); }
    });
  });
}

// ──────────────────────────────────────────────────────────────
// 13. CARD SPARKLE EMIT
// ──────────────────────────────────────────────────────────────
function emitCardSpark(cx, cy) {
  for (let i = 0; i < 4; i++) {
    const s = document.createElement('div');
    const sz = Math.random() * 5 + 2;
    s.style.cssText = `
      position:fixed;pointer-events:none;z-index:9997;border-radius:50%;
      width:${sz}px;height:${sz}px;
      background:rgba(${Math.random()>.5?'246,211,101':'212,175,55'},0.9);
      left:${cx}px;top:${cy}px;transform:translate(-50%,-50%);
    `;
    document.body.appendChild(s);
    const tx = (Math.random() - .5) * 70;
    const ty = (Math.random() - .5) * 70;
    s.animate([
      { transform:'translate(-50%,-50%) scale(0)', opacity:1 },
      { transform:`translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px)) scale(1)`, opacity:.8, offset:.4 },
      { transform:`translate(calc(-50% + ${tx*1.5}px),calc(-50% + ${ty*1.5}px)) scale(0)`, opacity:0 }
    ], { duration: 600 + Math.random()*300, delay: i*50, easing:'cubic-bezier(0.25,0.46,0.45,0.94)', fill:'forwards' })
    .onfinish = () => s.remove();
  }
}

// ──────────────────────────────────────────────────────────────
// 14. PRODUCT OVERLAY
// ──────────────────────────────────────────────────────────────
function initProductOverlay() {
  const overlay = document.getElementById('product-overlay');
  if (!overlay) return;

  document.querySelectorAll('.jewel-card').forEach(card => {
    card.addEventListener('click', () => openOverlay(card));
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeOverlay();
  });
}

function openOverlay(card) {
  const overlay = document.getElementById('product-overlay');
  if (!overlay) return;

  const d = card.dataset;
  document.getElementById('pdCategory').textContent = d.category || 'Collection';
  document.getElementById('pdName').textContent     = d.name     || 'Jewellery';
  document.getElementById('pdPurity').textContent   = '22 Karat · 916';
  document.getElementById('pdOccasion').textContent = d.occasion || '—';
  document.getElementById('pdDesc').textContent     = d.description || '';

  const img = document.getElementById('pdImg');
  if (img && d.img) { img.src = d.img; img.alt = d.name; }

  const wa = document.getElementById('pdWA');
  if (wa) wa.href = `https://wa.me/919945616530?text=Hello%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(d.name || 'jewellery')}%20at%20Megha%20Jewellers%2C%20Mysuru.`;

  overlay.style.display = 'block';
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('overlay-open');
  document.body.style.overflow = 'hidden';
  if (lenis) lenis.stop();

  requestAnimationFrame(() => overlay.classList.add('open'));

  // Emit celebratory sparkle burst
  const r = card.getBoundingClientRect();
  for (let i = 0; i < 12; i++) {
    setTimeout(() => emitCardSpark(r.left + r.width/2, r.top + r.height/2), i * 40);
  }

  setTimeout(() => document.getElementById('pdBackBtn')?.focus(), 300);
}

function closeOverlay() {
  const overlay = document.getElementById('product-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('overlay-open');
  document.body.style.overflow = '';
  if (lenis) lenis.start();
  setTimeout(() => { overlay.style.display = 'none'; overlay.scrollTop = 0; }, 750);
}
window.closeOverlay = closeOverlay;

// ──────────────────────────────────────────────────────────────
// 15. ANIMATED COUNTERS
// ──────────────────────────────────────────────────────────────
function initCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const numEl  = el.querySelector('.craft-num');
      const delay  = parseInt(el.dataset.delay) || 0;
      el.classList.add('visible');
      if (numEl) setTimeout(() => animCount(numEl), delay);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.craft-stat').forEach(s => io.observe(s));
}

function animCount(el) {
  const target = parseInt(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || '';
  const dur    = 1800;
  const start  = Date.now();
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function tick() {
    const p = Math.min((Date.now() - start) / dur, 1);
    el.textContent = Math.floor(ease(p) * target) + (p >= 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(tick);
  }
  tick();
}

// ──────────────────────────────────────────────────────────────
// 16. GSAP SCROLL ANIMATIONS
// ──────────────────────────────────────────────────────────────
function initGSAPAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // ── Hero parallax: text drifts up on scroll
  gsap.to('.hero-text', {
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
    y: -60, opacity: 0.3, ease: 'none'
  });

  // ── Story bridge: background scale
  gsap.fromTo('.story-bridge-bg',
    { scale: 1.05 },
    {
      scale: 1,
      scrollTrigger: { trigger: '.story-bridge', start: 'top bottom', end: 'bottom top', scrub: 1 },
      ease: 'none'
    }
  );

  // ── Collections: horizontal scroll hint on desktop
  if (window.innerWidth > 1100) {
    gsap.fromTo('.cards-grid',
      { x: 30 },
      {
        x: 0,
        scrollTrigger: { trigger: '#collections', start: 'top 85%', duration: 0.8 },
        ease: 'power3.out'
      }
    );
  }

  // ── Bridal: text builds on scroll
  gsap.fromTo('.bridal-title',
    { x: -40, opacity: 0 },
    {
      x: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '#bridal', start: 'top 75%' }
    }
  );

  // ── Bridal 3D frame: subtle rotation reveal
  gsap.fromTo('.bridal-img-stage',
    { rotateY: -25, opacity: 0 },
    {
      rotateY: -8, opacity: 1, duration: 1.5, ease: 'power3.out',
      scrollTrigger: { trigger: '.bridal-3d-frame', start: 'top 80%' }
    }
  );

  // ── Craftsmanship: counter section glow
  ScrollTrigger.create({
    trigger: '#craftsmanship',
    start: 'top center',
    onEnter: () => {
      gsap.to('#craftsmanship', { '--glow-spread': '60px', duration: 1.2, ease: 'power2.out' });
    }
  });

  // ── Contact: fade from darkness
  gsap.fromTo('.contact-title',
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: '#contact', start: 'top 75%' }
    }
  );

  // ── Testimonial cards alternate entrance
  gsap.utils.toArray('.tcard').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card, start: 'top 90%', once: true,
      onEnter: () => {
        setTimeout(() => card.classList.add('visible'), parseInt(card.dataset.delay) || 0);
      }
    });
  });

  // ── Parallax on hero ornament
  gsap.to('.hero-ornament-wrap', {
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
    y: -40, ease: 'none'
  });

  // ── Section headers stagger on scroll
  gsap.utils.toArray('.section-eyebrow').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.fromTo(el, { opacity:0, y:15 }, { opacity:1, y:0, duration:.8, ease:'power3.out' })
    });
  });
}

// ──────────────────────────────────────────────────────────────
// 17. HERO MOUSE PARALLAX (subtle)
// ──────────────────────────────────────────────────────────────
function initHeroParallax() {
  if (window.matchMedia('(hover:none)').matches) return;
  const wrap  = document.querySelector('.hero-ornament-wrap');
  const text  = document.querySelector('.hero-text');
  if (!wrap) return;
  let tx=0,ty=0,cx=0,cy=0;
  document.addEventListener('mousemove', e => {
    const ox = e.clientX / window.innerWidth  - .5;
    const oy = e.clientY / window.innerHeight - .5;
    tx = ox * 18; ty = oy * 10;
  }, { passive:true });
  function drift() {
    cx += (tx-cx)*.04; cy += (ty-cy)*.04;
    if (wrap) wrap.style.transform = `translate(${cx}px,${cy*0.6}px)`;
    if (text) text.style.transform = `translate(${-cx*0.4}px,${-cy*0.3}px)`;
    requestAnimationFrame(drift);
  }
  drift();
}

// ──────────────────────────────────────────────────────────────
// 18. ENTRY POINT
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bootstrap();
  setTimeout(initHeroParallax, 4000);
});
