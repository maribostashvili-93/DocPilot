import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import * as THREE from 'three';
import './marketing.css';

/**
 * DocPilot marketing landing page.
 * Hero uses a subtle three.js scene (rotating wireframe icosahedron + dim particle field).
 * Section content animates in via anime.js v4 + IntersectionObserver.
 */
export default function MarketingLanding() {
  const heroCanvasRef = useRef<HTMLDivElement | null>(null);
  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const sectionsRef = useRef<HTMLDivElement | null>(null);

  // ---------------- Three.js hero scene ----------------
  useEffect(() => {
    const mount = heroCanvasRef.current;
    if (!mount) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Wireframe icosahedron with red accent
    const geometry = new THREE.IcosahedronGeometry(1.7, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff1b23,
      wireframe: true,
      emissive: 0x880b10,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Floating doc-rectangle particle field (suggests "documents in space")
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x63cdff,
      size: 0.06,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const light = new THREE.PointLight(0xffffff, 1.2, 100);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404a5a, 0.6));

    let rafId = 0;
    const tick = () => {
      mesh.rotation.x += 0.0018;
      mesh.rotation.y += 0.0024;
      particles.rotation.y += 0.0006;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };

    if (reducedMotion) {
      renderer.render(scene, camera); // single frame, no loop
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  // ---------------- Anime.js hero entrance ----------------
  useEffect(() => {
    const root = heroContentRef.current;
    if (!root) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      root.querySelectorAll<HTMLElement>('[data-hero-anim]').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
    animate(root.querySelectorAll('[data-hero-anim]'), {
      opacity: [0, 1],
      translateY: [22, 0],
      delay: stagger(120, { start: 180 }),
      duration: 720,
      ease: 'outCubic',
    });
  }, []);

  // ---------------- Anime.js IntersectionObserver for sections ----------------
  useEffect(() => {
    const root = sectionsRef.current;
    if (!root) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>('[data-reveal]'),
    );

    if (reducedMotion) {
      targets.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const groups = new Map<string, HTMLElement[]>();
    targets.forEach((el) => {
      const group = el.dataset.revealGroup ?? el.dataset.reveal ?? 'default';
      const arr = groups.get(group) ?? [];
      arr.push(el);
      groups.set(group, arr);
    });

    const seen = new WeakSet<HTMLElement>();

    const io = new IntersectionObserver(
      (entries) => {
        const fired = new Set<string>();
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (seen.has(el)) return;
          const group = el.dataset.revealGroup ?? el.dataset.reveal ?? 'default';
          fired.add(group);
        });
        fired.forEach((group) => {
          const els = (groups.get(group) ?? []).filter((el) => !seen.has(el));
          if (els.length === 0) return;
          els.forEach((el) => seen.add(el));
          animate(els, {
            opacity: [0, 1],
            translateY: [20, 0],
            delay: stagger(90),
            duration: 620,
            ease: 'outCubic',
          });
          els.forEach((el) => io.unobserve(el));
        });
      },
      { threshold: 0.18 },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="marketing-root">
      {/* ============ HERO ============ */}
      <section className="marketing-hero">
        <div ref={heroCanvasRef} className="marketing-hero-canvas" aria-hidden="true" />

        <nav className="marketing-hero-nav">
          <Link to="/" className="docpilot-logo" aria-label="DocPilot home">
            <span className="docpilot-word">
              Doc<span className="docpilot-word-accent">Pilot</span>
              <span className="docpilot-dot">.</span>
            </span>
          </Link>
          <div className="marketing-hero-nav-links">
            <a href="#why">Why DocPilot</a>
            <a href="#how">How it works</a>
            <a href="https://github.com/EarendilM83/DocPilot" target="_blank" rel="noopener noreferrer">GitHub</a>
            <Link to="/login">Sign in</Link>
          </div>
        </nav>

        <div ref={heroContentRef} className="marketing-hero-content">
          <span className="marketing-eyebrow" data-hero-anim>
            Open-source · Multi-tenant · Self-hostable
          </span>
          <h1 className="marketing-hero-title" data-hero-anim>
            The documentation CMS
            <br />
            you actually <span>own.</span>
          </h1>
          <p className="marketing-hero-sub" data-hero-anim>
            DocPilot is an open-source platform for teams that ship serious
            documentation — game manuals, API guides, partner runbooks,
            anything that needs branding, versioning, translation and an audit
            trail. Stand up a tenant in minutes. Keep your data in your
            database.
          </p>
          <div className="marketing-hero-ctas" data-hero-anim>
            <a
              href="https://github.com/EarendilM83/DocPilot"
              target="_blank"
              rel="noopener noreferrer"
              className="marketing-btn marketing-btn-primary"
            >
              ★ Star on GitHub
            </a>
            <Link to="/login" className="marketing-btn marketing-btn-ghost">
              Try the demo
            </Link>
          </div>
          <div className="marketing-hero-meta" data-hero-anim>
            <span>MIT licensed</span>
            <span>·</span>
            <span>Self-host or use the hosted instance</span>
            <span>·</span>
            <span>SQLite + Node + React</span>
          </div>
        </div>
      </section>

      <div ref={sectionsRef}>
        {/* ============ WHY DOCPILOT ============ */}
        <section id="why" className="marketing-section">
          <div className="marketing-section-head">
            <span className="marketing-kicker">Why DocPilot</span>
            <h2 className="marketing-section-title">Docs that grow with your product — without the SaaS lock-in.</h2>
            <p className="marketing-section-sub">
              Most docs tools force you between a static-site generator (zero
              workflow) and a closed SaaS (good workflow, your data lives
              somewhere else). DocPilot is open source, runs on your own
              database, and ships with the workflow built in.
            </p>
          </div>

          <div className="marketing-features">
            <div className="marketing-feature" data-reveal="features" data-reveal-group="features">
              <div className="marketing-feature-icon" aria-hidden="true">{'⌥'}</div>
              <h3>You own the data</h3>
              <p>
                SQLite by default, swap in any database via a single config.
                No external service touches your content. Self-host in 30
                seconds with <code>docker compose up</code> — or run the
                hosted instance for a managed copy.
              </p>
            </div>
            <div className="marketing-feature" data-reveal="features" data-reveal-group="features">
              <div className="marketing-feature-icon" aria-hidden="true">{'■'}</div>
              <h3>Multi-tenant by design</h3>
              <p>
                One DocPilot instance hosts every team you publish docs for.
                Each tenant gets its own brand, users, account managers, audit
                log, and a viewer URL their customers can bookmark. Boundaries
                are enforced at the data layer, not in middleware.
              </p>
            </div>
            <div className="marketing-feature" data-reveal="features" data-reveal-group="features">
              <div className="marketing-feature-icon" aria-hidden="true">{'◎'}</div>
              <h3>Annotated figures &amp; markers</h3>
              <p>
                Drop a screenshot, draw numbered hotspots, write the prose next
                to it. Markers stay synced with the figure they describe — no
                more &ldquo;see figure 2&rdquo; rot when a UI changes.
              </p>
            </div>
            <div className="marketing-feature" data-reveal="features" data-reveal-group="features">
              <div className="marketing-feature-icon" aria-hidden="true">{'⧉'}</div>
              <h3>Version snapshots</h3>
              <p>
                Tag a release, freeze the docs. Customers link to a snapshot
                URL forever; you keep iterating on the next version in
                parallel. Every change is in the audit trail.
              </p>
            </div>
            <div className="marketing-feature" data-reveal="features" data-reveal-group="features">
              <div className="marketing-feature-icon" aria-hidden="true">{'◐'}</div>
              <h3>Reader, not a wiki</h3>
              <p>
                Stripe / Linear-style reader with sticky ToC, search, dark
                mode, and per-tenant accent colours. Built so customers
                actually read the docs, not skim past them.
              </p>
            </div>
            <div className="marketing-feature" data-reveal="features" data-reveal-group="features">
              <div className="marketing-feature-icon" aria-hidden="true">{'⟁'}</div>
              <h3>Translation workflow</h3>
              <p>
                37+ locales, draft/review/publish per language, completeness
                tracking. Translators work alongside authors, not weeks after.
              </p>
            </div>
          </div>
        </section>

        {/* ============ WHO IT IS FOR ============ */}
        <div className="marketing-audience-band">
          <section className="marketing-section">
            <div className="marketing-section-head">
              <span className="marketing-kicker">Who builds with DocPilot</span>
              <h2 className="marketing-section-title">Teams that ship docs as part of the product.</h2>
            </div>

            <div className="marketing-audience">
              <div className="marketing-audience-card" data-reveal="audience" data-reveal-group="audience">
                <span className="marketing-audience-tag">Authors</span>
                <h3>Write once. Hand out branded links.</h3>
                <p>
                  Game studios, fintech APIs, hardware vendors — anyone whose
                  docs are versioned, multi-language, and live alongside the
                  product. Author in the CMS, hit publish, customers see the
                  right snapshot.
                </p>
              </div>
              <div className="marketing-audience-card is-blue" data-reveal="audience" data-reveal-group="audience">
                <span className="marketing-audience-tag">Self-hosters</span>
                <h3>Run the whole platform on a $5 VPS.</h3>
                <p>
                  Single Node process, SQLite file, single Vite-built bundle.
                  No Redis, no Postgres extension, no Kubernetes. Open the
                  repo, clone, run. Replace any piece you don&rsquo;t want.
                </p>
              </div>
              <div className="marketing-audience-card is-graphite" data-reveal="audience" data-reveal-group="audience">
                <span className="marketing-audience-tag">Contributors</span>
                <h3>Hack on the codebase, not config.</h3>
                <p>
                  ~12k lines of focused TypeScript + React. The reader, the
                  CMS, the multi-tenant auth, the audit log — all in one
                  repo, all readable. PRs welcome.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how" className="marketing-section">
          <div className="marketing-section-head">
            <span className="marketing-kicker">How it works</span>
            <h2 className="marketing-section-title">From clone to branded reader in five commands.</h2>
          </div>

          <div className="marketing-steps">
            <div className="marketing-step" data-reveal="steps" data-reveal-group="steps">
              <span className="marketing-step-num">01</span>
              <h4>Clone &amp; run</h4>
              <p><code>git clone</code>, <code>npm install</code>, <code>npm run dev</code>. SQLite seeds itself. You&rsquo;re running locally before your coffee is ready.</p>
            </div>
            <div className="marketing-step" data-reveal="steps" data-reveal-group="steps">
              <span className="marketing-step-num">02</span>
              <h4>Add a tenant</h4>
              <p>From the superadmin shell, create a company, set its brand colours, drop a logo. Each tenant gets its own URL at <code>/c/&lt;slug&gt;</code>.</p>
            </div>
            <div className="marketing-step" data-reveal="steps" data-reveal-group="steps">
              <span className="marketing-step-num">03</span>
              <h4>Invite users</h4>
              <p>Company admins, account managers, viewers — each with the right role. Per-user toggles for things like staging links.</p>
            </div>
            <div className="marketing-step" data-reveal="steps" data-reveal-group="steps">
              <span className="marketing-step-num">04</span>
              <h4>Author</h4>
              <p>Markdown-rich sections, annotated figures, status pills, translation workflow, release snapshots. The whole workflow is the product.</p>
            </div>
            <div className="marketing-step" data-reveal="steps" data-reveal-group="steps">
              <span className="marketing-step-num">05</span>
              <h4>Ship</h4>
              <p>Customers visit your branded reader. They see exactly the snapshot you tagged. You keep iterating.</p>
            </div>
          </div>
        </section>

        {/* ============ CTA FOOTER ============ */}
        <div className="marketing-cta-band">
          <div className="marketing-cta">
            <h2>Open source. Self-hostable. Ready when you are.</h2>
            <p>
              Star the repo, clone it, run it. If you&rsquo;d rather not
              self-host, the hosted demo accepts logins right now.
            </p>
            <div className="marketing-cta-row">
              <a
                href="https://github.com/EarendilM83/DocPilot"
                target="_blank"
                rel="noopener noreferrer"
                className="marketing-btn marketing-btn-primary"
              >
                ★ Star on GitHub
              </a>
              <Link to="/login" className="marketing-btn marketing-btn-ghost">
                Try the hosted demo
              </Link>
            </div>
          </div>

          <footer className="marketing-footer">
            <span>&copy; DocPilot 2026 &middot; MIT licensed &middot; Open source on GitHub</span>
            <Link to="/login">Sign in</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
