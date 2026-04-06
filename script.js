import * as THREE from 'three';

const firebaseConfig = {
    apiKey: "AIzaSyBeqBg3LaVkuKztXmfRNAWT_g6BSqL2TcU",
    authDomain: "webpage1-0-1.firebaseapp.com",
    databaseURL: "https://webpage1-0-1-default-rtdb.firebaseio.com",
    projectId: "webpage1-0-1",
    storageBucket: "webpage1-0-1.firebasestorage.app",
    messagingSenderId: "1026846957424",
    appId: "1:1026846957424:web:fda1eb78fe0e3777cbb9b5"
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const isSmallViewport = window.matchMedia("(max-width: 860px)").matches;
const hardwareConcurrency = navigator.hardwareConcurrency || 4;
const deviceMemory = navigator.deviceMemory || 4;
const performanceLite = coarsePointer || isSmallViewport || hardwareConcurrency <= 4 || deviceMemory <= 4;

const state = {
    activeNotification: null,
    cleanupNotification: null,
    firebaseClient: null,
    performanceLite
};

async function getFirebaseClient() {
    if (state.firebaseClient) {
        return state.firebaseClient;
    }

    state.firebaseClient = Promise.all([
        import("https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js")
    ]).then(([firebaseAppModule, firebaseDatabaseModule]) => {
        const app = firebaseAppModule.initializeApp(firebaseConfig);
        const database = firebaseDatabaseModule.getDatabase(app);

        return {
            database,
            push: firebaseDatabaseModule.push,
            ref: firebaseDatabaseModule.ref
        };
    }).catch((error) => {
        state.firebaseClient = null;
        throw error;
    });

    return state.firebaseClient;
}

function forceRevealAll(targets = document.querySelectorAll("[data-reveal]")) {
    targets.forEach((element) => {
        element.style.setProperty("--reveal-progress", "1");
        element.style.setProperty("--reveal-opacity", "1");
        element.style.setProperty("--reveal-blur", "0px");
        element.style.setProperty("--reveal-translate-x", "0px");
        element.style.setProperty("--reveal-translate-y", "0px");
        element.style.setProperty("--reveal-scale", "1");
    });
}

function initMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu");
    const navMenu = document.getElementById("nav-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    if (!mobileMenu || !navMenu) {
        return;
    }

    const closeMenu = () => {
        mobileMenu.classList.remove("active");
        mobileMenu.setAttribute("aria-expanded", "false");
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
    };

    mobileMenu.addEventListener("click", () => {
        const isOpen = mobileMenu.classList.toggle("active");
        navMenu.classList.toggle("active", isOpen);
        mobileMenu.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("menu-open", isOpen);
    });

    navLinks.forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) {
            closeMenu();
        }
    });
}

function initSmoothScroll() {
    const headerOffset = 104;

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const targetId = anchor.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({
                top,
                behavior: prefersReducedMotion ? "auto" : "smooth"
            });
        });
    });
}

function initScrollUI() {
    const navbar = document.getElementById("navbar");
    const sections = Array.from(document.querySelectorAll("section[id]"));
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    const navMenu = document.getElementById("nav-menu");
    const headerOffset = 104;
    const sectionsById = new Map(sections.map((section) => [`#${section.id}`, section]));
    let lastActiveId = "";
    let navItems = [];
    let frameId = null;

    const rebuildNavItems = () => {
        navItems = navLinks
            .map((link) => {
                const href = link.getAttribute("href");
                const section = href ? sectionsById.get(href) : null;

                if (!section) {
                    return null;
                }

                return {
                    link,
                    section,
                    start: Math.max(section.offsetTop - headerOffset, 0)
                };
            })
            .filter(Boolean);
    };

    const syncIndicator = (scrollTop) => {
        if (!navMenu || !navLinks.length) {
            navMenu?.style.setProperty("--nav-indicator-opacity", "0");
            return;
        }

        if (!navItems.length) {
            navMenu.style.setProperty("--nav-indicator-opacity", "0");
            return;
        }

        const lastIndex = navItems.length - 1;
        let fromIndex = lastIndex;
        let toIndex = lastIndex;
        let mix = 0;

        if (scrollTop <= navItems[0].start) {
            fromIndex = 0;
            toIndex = 0;
        } else {
            for (let index = 0; index < lastIndex; index += 1) {
                const current = navItems[index];
                const next = navItems[index + 1];

                if (scrollTop >= current.start && scrollTop < next.start) {
                    fromIndex = index;
                    toIndex = index + 1;
                    mix = (scrollTop - current.start) / Math.max(next.start - current.start, 1);
                    break;
                }
            }
        }

        const fromRect = navItems[fromIndex].link.getBoundingClientRect();
        const toRect = navItems[toIndex].link.getBoundingClientRect();
        const menuRect = navMenu.getBoundingClientRect();
        const left = (fromRect.left - menuRect.left + navMenu.scrollLeft) + ((toRect.left - fromRect.left) * mix);
        const width = fromRect.width + ((toRect.width - fromRect.width) * mix);

        navMenu.style.setProperty("--nav-indicator-opacity", "1");
        navMenu.style.setProperty("--nav-indicator-width", `${width}px`);
        navMenu.style.setProperty("--nav-indicator-x", `${left}px`);
    };

    const centerActiveLink = (activeLink) => {
        if (!navMenu || !activeLink || window.innerWidth > 860) {
            return;
        }

        const menuRect = navMenu.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        const linkLeft = linkRect.left - menuRect.left + navMenu.scrollLeft;
        const targetLeft = linkLeft - ((navMenu.clientWidth - linkRect.width) / 2);
        const maxScroll = Math.max(navMenu.scrollWidth - navMenu.clientWidth, 0);
        const nextScroll = Math.min(Math.max(targetLeft, 0), maxScroll);

        navMenu.scrollTo({
            left: nextScroll,
            behavior: prefersReducedMotion ? "auto" : "smooth"
        });
    };

    const update = () => {
        const scrollTop = window.scrollY;

        if (!state.performanceLite) {
            document.documentElement.style.setProperty("--scroll-shift", `${scrollTop}px`);
        }

        if (navbar) {
            navbar.classList.toggle("is-scrolled", scrollTop > 24);
        }

        const activeMarker = scrollTop + headerOffset + 120;
        let activeId = sections[0]?.id ?? "";

        sections.forEach((section) => {
            if (section.offsetTop <= activeMarker) {
                activeId = section.id;
            }
        });

        navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${activeId}`;
            link.classList.toggle("active", isActive);
        });

        if (activeId !== lastActiveId) {
            const activeLink = navLinks.find((link) => link.getAttribute("href") === `#${activeId}`);
            centerActiveLink(activeLink);
            lastActiveId = activeId;
        }

        syncIndicator(scrollTop);
    };

    const queueUpdate = () => {
        if (frameId) {
            return;
        }

        frameId = requestAnimationFrame(() => {
            frameId = null;
            update();
        });
    };

    rebuildNavItems();
    update();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", () => {
        rebuildNavItems();
        queueUpdate();
    });
}

function initRevealAnimations() {
    const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));

    if (!revealTargets.length) {
        return;
    }

    if (state.performanceLite) {
        forceRevealAll(revealTargets);
        return;
    }

    document.documentElement.classList.add("scroll-reveal-enabled");

    revealTargets.forEach((element) => {
        element.style.setProperty("--reveal-progress", "0");
    });

    if (prefersReducedMotion) {
        forceRevealAll(revealTargets);
        return;
    }

    const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
    let frameId = null;

    const render = () => {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        revealTargets.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const revealType = element.getAttribute("data-reveal") || "up";
            const delay = Number(element.getAttribute("data-reveal-delay") || "0");
            const anchorY = rect.top + rect.height * 0.2 - delay * viewportHeight * 0.22;
            const start = viewportHeight * 0.92;
            const end = viewportHeight * 0.38;
            const progress = clamp((start - anchorY) / (start - end));
            const eased = 1 - Math.pow(1 - progress, 3);

            let translateX = 0;
            let translateY = 42 * (1 - eased);
            let scale = 0.985 + 0.015 * eased;

            if (revealType === "left") {
                translateX = 52 * (1 - eased);
                translateY = 0;
            } else if (revealType === "scale") {
                translateY = 30 * (1 - eased);
                scale = 0.94 + 0.06 * eased;
            } else if (revealType === "up-soft") {
                translateY = 22 * (1 - eased);
                scale = 0.99 + 0.01 * eased;
            }

            element.style.setProperty("--reveal-progress", `${eased}`);
            element.style.setProperty("--reveal-opacity", `${eased}`);
            element.style.setProperty("--reveal-blur", `${(1 - eased) * 14}px`);
            element.style.setProperty("--reveal-translate-x", `${translateX}px`);
            element.style.setProperty("--reveal-translate-y", `${translateY}px`);
            element.style.setProperty("--reveal-scale", `${scale}`);
        });

        frameId = null;
    };

    const queueRender = () => {
        if (!frameId) {
            frameId = requestAnimationFrame(render);
        }
    };

    queueRender();
    window.addEventListener("scroll", queueRender, { passive: true });
    window.addEventListener("resize", queueRender);
    window.addEventListener("load", queueRender, { once: true });
}

function animateCounter(element) {
    const targetValue = Number(element.dataset.count || "0");
    if (!targetValue) {
        element.textContent = "0+";
        return;
    }

    if (prefersReducedMotion) {
        element.textContent = `${targetValue}+`;
        return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const frame = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.round(targetValue * eased)}+`;

        if (progress < 1) {
            requestAnimationFrame(frame);
        }
    };

    requestAnimationFrame(frame);
}

function initCounters() {
    const counters = document.querySelectorAll(".stat-number[data-count]");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            animateCounter(entry.target);
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.5
    });

    counters.forEach((counter) => observer.observe(counter));
}

function initSkillMeters() {
    const skillBars = document.querySelectorAll(".skill-progress");
    const skillPanel = document.querySelector(".skill-panel");

    if (!skillPanel || !skillBars.length) {
        return;
    }

    const fillBars = () => {
        skillBars.forEach((bar) => {
            const percentage = bar.getAttribute("data-skill");
            bar.style.width = `${percentage}%`;
        });
    };

    if (prefersReducedMotion) {
        fillBars();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            fillBars();
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.4
    });

    observer.observe(skillPanel);
}

function initHeroRoleRotator() {
    const roleElement = document.getElementById("hero-role");

    if (!roleElement) {
        return;
    }

    const roles = [
        "frontend systems and motion",
        "backend logic and APIs",
        "AI, NLP, and search experiments"
    ];

    let roleIndex = 0;
    let characterIndex = 0;
    let isDeleting = false;

    const tick = () => {
        const currentRole = roles[roleIndex];

        if (prefersReducedMotion) {
            roleElement.textContent = currentRole;
            return;
        }

        if (!isDeleting) {
            characterIndex += 1;
            roleElement.textContent = currentRole.slice(0, characterIndex);

            if (characterIndex === currentRole.length) {
                isDeleting = true;
                window.setTimeout(tick, 1500);
                return;
            }
        } else {
            characterIndex -= 1;
            roleElement.textContent = currentRole.slice(0, characterIndex);

            if (characterIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
            }
        }

        const delay = isDeleting ? 35 : 60;
        window.setTimeout(tick, delay);
    };

    tick();
}

function initAmbientBackground() {
    if (prefersReducedMotion) {
        return;
    }
}

function initBackgroundCanvas() {
    const canvas = document.getElementById("bg-canvas");

    if (!canvas) {
        return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
        return;
    }

    const stateField = {
        width: 0,
        height: 0,
        dpr: 1,
        ribbons: Array.from({ length: state.performanceLite ? 5 : 7 }, (_, index) => ({
            baseY: 0.16 + index * 0.1,
            amplitude: 18 + index * 5,
            speed: 0.00022 + index * 0.00003,
            phase: index * 1.2,
            thickness: 1.2 + (index % 3) * 0.45,
            alpha: 0.09 + index * 0.008
        })),
        rings: Array.from({ length: state.performanceLite ? 3 : 4 }, (_, index) => ({
            radius: 120 + index * 68,
            speed: 0.0001 + index * 0.00004,
            arcSpan: 0.8 + index * 0.16,
            width: 1 + index * 0.22,
            alpha: 0.08 + index * 0.015
        })),
        pulses: Array.from({ length: state.performanceLite ? 8 : 12 }, (_, index) => ({
            lane: index % (state.performanceLite ? 5 : 7),
            progress: (index * 0.17) % 1,
            speed: 0.00009 + (index % 5) * 0.000025,
            size: 1.8 + (index % 3) * 0.8
        }))
    };
    let frameId = null;
    let isVisible = !document.hidden;

    const resize = () => {
        stateField.dpr = Math.min(window.devicePixelRatio || 1, state.performanceLite ? 1 : 1.5);
        stateField.width = window.innerWidth;
        stateField.height = window.innerHeight;
        canvas.width = Math.round(stateField.width * stateField.dpr);
        canvas.height = Math.round(stateField.height * stateField.dpr);
        canvas.style.width = `${stateField.width}px`;
        canvas.style.height = `${stateField.height}px`;
        context.setTransform(stateField.dpr, 0, 0, stateField.dpr, 0, 0);
    };

    const getRibbonPoint = (ribbon, progress, time) => {
        const x = stateField.width * (progress * 1.25 - 0.12);
        const sway = Math.sin((progress * 9) + (time * ribbon.speed * 3.2) + ribbon.phase) * ribbon.amplitude;
        const drift = Math.cos((progress * 4.5) - (time * ribbon.speed * 1.4) + ribbon.phase) * ribbon.amplitude * 0.45;
        const y = (stateField.height * ribbon.baseY) + sway + drift;

        return {
            x,
            y
        };
    };

    const drawRibbon = (ribbon, time, hueShift) => {
        context.beginPath();

        for (let step = 0; step <= 44; step += 1) {
            const progress = step / 44;
            const point = getRibbonPoint(ribbon, progress, time);

            if (step === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        }

        context.strokeStyle = `hsla(${204 + hueShift}, 92%, 72%, ${ribbon.alpha})`;
        context.lineWidth = ribbon.thickness;
        context.shadowBlur = 18;
        context.shadowColor = `hsla(${196 + hueShift}, 100%, 70%, 0.18)`;
        context.stroke();
    };

    const drawPulse = (pulse, time) => {
        const ribbon = stateField.ribbons[pulse.lane];
        const point = getRibbonPoint(ribbon, pulse.progress, time);
        const glow = 8 + pulse.size * 4;

        context.beginPath();
        context.fillStyle = "rgba(143, 245, 236, 0.9)";
        context.shadowBlur = glow;
        context.shadowColor = "rgba(143, 245, 236, 0.55)";
        context.arc(point.x, point.y, pulse.size, 0, Math.PI * 2);
        context.fill();
    };

    const drawRings = (time) => {
        const centerX = stateField.width * 0.72;
        const centerY = stateField.height * 0.3;

        stateField.rings.forEach((ring, index) => {
            const start = (time * ring.speed) + index * 0.8;
            const end = start + ring.arcSpan;

            context.beginPath();
            context.strokeStyle = `hsla(${195 + index * 7}, 90%, 75%, ${ring.alpha})`;
            context.lineWidth = ring.width;
            context.shadowBlur = 20;
            context.shadowColor = "rgba(126, 221, 255, 0.16)";
            context.arc(centerX, centerY, ring.radius, start, end);
            context.stroke();

            const nodeX = centerX + Math.cos(end) * ring.radius;
            const nodeY = centerY + Math.sin(end) * ring.radius;

            context.beginPath();
            context.fillStyle = index % 2 === 0 ? "rgba(255, 194, 135, 0.85)" : "rgba(143, 245, 236, 0.82)";
            context.shadowBlur = 14;
            context.shadowColor = index % 2 === 0 ? "rgba(255, 194, 135, 0.32)" : "rgba(143, 245, 236, 0.28)";
            context.arc(nodeX, nodeY, 2 + index * 0.35, 0, Math.PI * 2);
            context.fill();
        });
    };

    const drawSweep = (time) => {
        const sweepX = ((time * 0.08) % (stateField.width * 1.6)) - (stateField.width * 0.3);
        const gradient = context.createLinearGradient(sweepX, 0, sweepX + 220, 0);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.5, "rgba(124, 186, 255, 0.05)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        context.fillStyle = gradient;
        context.fillRect(0, 0, stateField.width, stateField.height);
    };

    const renderStatic = () => {
        context.clearRect(0, 0, stateField.width, stateField.height);
        drawRings(1600);
        stateField.ribbons.forEach((ribbon, index) => drawRibbon(ribbon, 1600, index * 3));
        stateField.pulses.forEach((pulse) => drawPulse(pulse, 1600));
    };

    const render = (time) => {
        frameId = window.requestAnimationFrame(render);

        if (!isVisible) {
            return;
        }

        context.clearRect(0, 0, stateField.width, stateField.height);
        context.globalCompositeOperation = "source-over";

        const wash = context.createRadialGradient(
            stateField.width * 0.72,
            stateField.height * 0.28,
            0,
            stateField.width * 0.72,
            stateField.height * 0.28,
            stateField.width * 0.58
        );
        wash.addColorStop(0, "rgba(82, 144, 255, 0.08)");
        wash.addColorStop(0.45, "rgba(83, 242, 255, 0.04)");
        wash.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = wash;
        context.fillRect(0, 0, stateField.width, stateField.height);

        drawSweep(time);
        drawRings(time);
        stateField.ribbons.forEach((ribbon, index) => drawRibbon(ribbon, time, index * 3));

        stateField.pulses.forEach((pulse) => {
            pulse.progress = (pulse.progress + pulse.speed * 16) % 1;
            drawPulse(pulse, time);
        });
    };

    const handleVisibilityChange = () => {
        isVisible = !document.hidden;

        if (isVisible && !frameId && !prefersReducedMotion) {
            frameId = window.requestAnimationFrame(render);
        }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (prefersReducedMotion) {
        renderStatic();
        return;
    }

    frameId = window.requestAnimationFrame(render);
}

function initHeroParallax() {
    const heroVisual = document.getElementById("hero-visual");
    const layers = heroVisual?.querySelectorAll(".layer");

    if (!heroVisual || !layers?.length || prefersReducedMotion || state.performanceLite) {
        return;
    }

    let frameId = null;
    let pointerX = 0;
    let pointerY = 0;

    layers.forEach((layer) => {
        layer.dataset.baseTransform = getComputedStyle(layer).transform === "none"
            ? ""
            : getComputedStyle(layer).transform;
    });

    const update = () => {
        layers.forEach((layer) => {
            const depth = Number(layer.getAttribute("data-depth") || "0");
            const baseTransform = layer.dataset.baseTransform || "";
            const translateX = pointerX * (depth / 220);
            const translateY = pointerY * (depth / 220);
            layer.style.transform = `${baseTransform} translate3d(${translateX}px, ${translateY}px, 0)`;
        });

        frameId = null;
    };

    heroVisual.addEventListener("pointermove", (event) => {
        const bounds = heroVisual.getBoundingClientRect();
        pointerX = event.clientX - (bounds.left + bounds.width / 2);
        pointerY = event.clientY - (bounds.top + bounds.height / 2);

        if (!frameId) {
            frameId = requestAnimationFrame(update);
        }
    });

    heroVisual.addEventListener("pointerleave", () => {
        pointerX = 0;
        pointerY = 0;

        if (!frameId) {
            frameId = requestAnimationFrame(update);
        }
    });
}

function initJarvisSphere() {
    const container = document.getElementById("hero-visual");

    if (!container || prefersReducedMotion) {
        return;
    }

    container.classList.add("has-webgl");

    // Three.js Setup
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 10;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: false, 
        powerPreference: "high-performance",
        premultipliedAlpha: false // Fixes transparency issues in many compositions
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setClearColor(0x000000, 0); // Transparent base
    renderer.setClearAlpha(0);
    renderer.domElement.style.background = 'none';
    container.insertBefore(renderer.domElement, container.firstChild);

    // SHADERS
    const vertexShader = `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // Simplex 3D Noise 
        // by Ian McEwan, Ashima Arts
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

        float snoise(vec3 v){ 
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

            // First corner
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 = v - i + dot(i, C.xxx) ;

            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );

            //  x0 = x0 - 0.0 + 0.0 * C 
            vec3 x1 = x0 - i1 + 1.0 * C.xxx;
            vec3 x2 = x0 - i2 + 2.0 * C.xxx;
            vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

            // Permutations
            i = mod(i, 289.0 ); 
            vec4 p = permute( permute( permute( 
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

            // Gradients
            // ( N*N points uniformly over a square, mapped onto an octahedron.)
            float n_ = 1.0/7.0; // N=7
            vec3  ns = n_ * D.wyz - D.xzx;

            vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);

            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );

            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));

            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);

            //Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;

            // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
            vUv = uv;
            vNormal = normal;
            
            // Calculate organic distortion (Increased for "alive" feel)
            float distortion = snoise(position * 1.2 + uTime * 0.6) * 0.22;
            vec3 newPosition = position + normal * distortion;
            vPosition = newPosition;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uAlpha;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            // Edge highlighting (Fresnel-like)
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            float fresnelTerm = dot(viewDirection, vNormal);
            fresnelTerm = clamp(1.0 - fresnelTerm, 0.0, 1.0);
            fresnelTerm = pow(fresnelTerm, 3.0);

            // Base color enhanced by fresnel, avoiding pure white
            vec3 finalColor = uColor * (0.6 + fresnelTerm * 1.2);
            
            // Additive wireframe like glow
            float alpha = max(fresnelTerm * 0.6, 0.1) * uAlpha;

            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    // 1. Core Sphere (Icosahedron - Lowered detail for "airy" look)
    const geometry = new THREE.IcosahedronGeometry(2.5, 2);
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0x00eaff) }, // Electric Cyan
            uAlpha: { value: 0.87 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        wireframe: true, // Holographic lines
        depthWrite: false
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Inner Core for depth
    const coreGeometry = new THREE.IcosahedronGeometry(2.35, 5);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x001122, // Deep blue core
        transparent: true,
        opacity: 0.08, // Ghostly faint core
        wireframe: false,
        depthWrite: false,
        blending: THREE.NormalBlending
    });
    const innerCore = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(innerCore);

    // 1.2 Thin Outer Layer (Shimmer Shell - Lowered detail)
    const shellGeometry = new THREE.IcosahedronGeometry(2.65, 2);
    const shellMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0x00eaff) },
            uAlpha: { value: 0.51 }
        },
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        wireframe: true,
        depthWrite: false
    });
    const shellSphere = new THREE.Mesh(shellGeometry, shellMaterial);
    scene.add(shellSphere);    // 2. Layered Particle System
    const colors = [0x00eaff, 0x00d4ff, 0x00f0ff]; // Chroma Diversity Palette

    function createParticleLayer(count, baseRadius, opacity, customColor = null) {
        const posArray = new Float32Array(count * 3);
        const particleScales = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = baseRadius + (Math.random() - 0.5) * 0.4;

            posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i * 3 + 2] = r * Math.cos(phi);

            particleScales[i] = 0.5 + Math.random() * 0.5;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geo.setAttribute('aScale', new THREE.BufferAttribute(particleScales, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(customColor || colors[Math.floor(Math.random() * colors.length)]) },
                uOpacity: { value: opacity }
            },
            vertexShader: `
                uniform float uTime;
                attribute float aScale;
                void main() {
                    vec3 pos = position;
                    pos.y += sin(uTime + pos.x) * 0.05;
                    pos.x += cos(uTime + pos.y) * 0.05;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = (0.5 + aScale * 0.5) * ( 10.0 / -mvPosition.z ); 
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - (dist * 2.0);
                    alpha = pow(alpha, 2.0); 
                    
                    gl_FragColor = vec4(uColor, alpha * uOpacity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        return new THREE.Points(geo, mat);
    }

    const outerParticles = createParticleLayer(420, 3.15, 0.45);
    const innerParticles = createParticleLayer(180, 2.8, 0.12);
    const backLightParticles = createParticleLayer(260, 1.3, 0.15); 
    const outerShimmer = createParticleLayer(320, 3.5, 0.2, 0x00f0ff); // Cinematic Outer Layer
    
    scene.add(outerParticles);
    scene.add(innerParticles);
    scene.add(backLightParticles);
    scene.add(outerShimmer);

    // 3. Dynamic Orbital Rings (Randomized)
    const ringsGroup = new THREE.Group();
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x5290ff, // Power Blue
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    for(let i = 0; i < 7; i++) {
        const radius = 3.2 + Math.random() * 1.0;
        const tube = 0.016 + Math.random() * 0.024;
        const ringGeo = new THREE.TorusGeometry(radius, tube, 12, 48);
        const ring = new THREE.Mesh(ringGeo, ringMaterial);
        
        // Randomize initial orientation
        ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        
        // Store unique rotation speeds
        ring.userData = {
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.4,
            speedZ: (Math.random() - 0.5) * 0.4
        };
        
        ringsGroup.add(ring);
    }
    scene.add(ringsGroup);

    // 3.1 Ultra-Thin Technical Rings (New Addition)
    const thinRingsGroup = new THREE.Group();
    const thinRingMat = new THREE.MeshBasicMaterial({
        color: 0x00eaff,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    for(let i = 0; i < 12; i++) {
        const radius = 3.3 + Math.random() * 1.2;
        const tube = 0.006 + Math.random() * 0.004;
        const ringGeo = new THREE.TorusGeometry(radius, tube, 8, 36);
        const ring = new THREE.Mesh(ringGeo, thinRingMat);
        ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        ring.userData = {
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            speedZ: (Math.random() - 0.5) * 0.3
        };
        thinRingsGroup.add(ring);
    }
    scene.getObjectsByProperty('name', 'JarvisSphere')[0]?.add(thinRingsGroup) || scene.add(thinRingsGroup);

    // 4. Random Arc Segments
    const arcGroup = new THREE.Group();
    const arcMaterial = new THREE.MeshBasicMaterial({
        color: 0x00eaff, // Electric Cyan
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    for(let i = 0; i < 4; i++) {
        const arcGeo = new THREE.RingGeometry(3.3 + Math.random() * 0.2, 3.32 + Math.random() * 0.2, 40, 1, 0, Math.PI * (0.1 + Math.random() * 0.4));
        const arc = new THREE.Mesh(arcGeo, arcMaterial);
        arc.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        arcGroup.add(arc);
    }
    scene.add(arcGroup);

    // 5. Organic Connection Lines & Glowing Nodes (Maximized density)
    const linePoints = [];
    for (let i = 0; i < 120; i++) {
        // Random Line Breaks: 35% chance to skip a segment
        if (Math.random() > 0.65) continue;

        linePoints.push(new THREE.Vector3(
            (Math.random() - 0.5) * 4.8, // Slightly tighter bounds
            (Math.random() - 0.5) * 4.8,
            (Math.random() - 0.5) * 4.8
        ));
    }
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    
    // Line Opacity Variation
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x5290ff,
        transparent: true,
        opacity: 0.12 + Math.random() * 0.09,
        blending: THREE.AdditiveBlending 
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);


    const nodeMaterial = new THREE.PointsMaterial({
        color: 0x00eaff,
        size: 0.075,
        transparent: true,
        opacity: 0.63,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const nodes = new THREE.Points(lineGeometry, nodeMaterial);
    scene.add(nodes);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    // Add event listener to hero component
    const heroSection = document.getElementById('home');
    heroSection?.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        targetX = x * 0.5;
        targetY = y * 0.5;
    });
    heroSection?.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
    });


    const clock = new THREE.Clock();
    let isVisible = true;
    let isDocumentVisible = !document.hidden;

    // Intersection observer to pause in background
    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(container);
    document.addEventListener("visibilitychange", () => {
        isDocumentVisible = !document.hidden;
    });

    // Animation Loop
    const tick = () => {
        requestAnimationFrame(tick);

        if (!isVisible || !isDocumentVisible) return;

        const elapsedTime = clock.getElapsedTime();

        // Ease mouse interaction
        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        // Update Materials
        material.uniforms.uTime.value = elapsedTime;
        shellMaterial.uniforms.uTime.value = elapsedTime;
        outerParticles.material.uniforms.uTime.value = elapsedTime;
        innerParticles.material.uniforms.uTime.value = elapsedTime;
        backLightParticles.material.uniforms.uTime.value = elapsedTime;
        outerShimmer.material.uniforms.uTime.value = elapsedTime;

        // ENERGY FLOW (Subtle Flicker)
        const flicker = 0.5 + Math.sin(elapsedTime * 4.0) * 0.15;
        lineMaterial.opacity = 0.15 + Math.sin(elapsedTime * 2.5) * 0.0375;
        nodeMaterial.opacity = 0.54 * flicker;

        // Organic Axis Rotation (Slower "depth" motion for cinema)
        sphere.rotation.y = elapsedTime * 0.06;
        sphere.rotation.x = elapsedTime * 0.04;
        sphere.rotation.z = Math.sin(elapsedTime * 0.08) * 0.025;

        innerCore.rotation.y = elapsedTime * 0.03;
        innerCore.rotation.x = elapsedTime * 0.025;
        innerCore.rotation.z = Math.sin(elapsedTime * 0.1) * 0.05;

        // Breathing Scale Effect (0.02–0.04 range)
        const breathingScale = 1.0 + Math.sin(elapsedTime * 0.8) * 0.025;
        sphere.scale.setScalar(breathingScale);
        shellSphere.scale.setScalar(breathingScale * 1.01);
        innerCore.scale.setScalar(breathingScale * 0.98);
        outerParticles.scale.setScalar(breathingScale * 1.02);
        innerParticles.scale.setScalar(breathingScale * 0.96);
        backLightParticles.scale.setScalar(breathingScale * 0.92);
        outerShimmer.scale.setScalar(breathingScale * 1.06);

        // Subtly rotate the shell differently
        shellSphere.rotation.y = elapsedTime * -0.04;
        shellSphere.rotation.x = elapsedTime * -0.025;

        // Rotate particle system layers slowly
        outerParticles.rotation.y = elapsedTime * -0.03;
        outerParticles.rotation.x = elapsedTime * 0.04;
        
        innerParticles.rotation.y = elapsedTime * 0.03;
        innerParticles.rotation.z = elapsedTime * 0.05;

        backLightParticles.rotation.y = elapsedTime * 0.05;
        backLightParticles.rotation.x = elapsedTime * -0.06;

        outerShimmer.rotation.y = elapsedTime * 0.02;
        outerShimmer.rotation.z = elapsedTime * -0.03;


        // Orbital Rings Animation
        ringsGroup.children.forEach(ring => {
            ring.rotation.x += ring.userData.speedX * 0.05;
            ring.rotation.y += ring.userData.speedY * 0.05;
            ring.rotation.z += ring.userData.speedZ * 0.05;
        });

        thinRingsGroup.children.forEach(ring => {
            ring.rotation.x += ring.userData.speedX * 0.04;
            ring.rotation.y += ring.userData.speedY * 0.04;
            ring.rotation.z += ring.userData.speedZ * 0.04;
        });

        // Random Arc Animation
        arcGroup.rotation.y = elapsedTime * 0.15;
        arcGroup.rotation.z = Math.sin(elapsedTime * 0.2) * 0.1;

        // Line subtle movement
        line.rotation.y = elapsedTime * 0.05;

        // Apply Parallax / Floating
        scene.position.x = mouseX * 0.8;
        scene.position.y = mouseY * 0.8 + Math.sin(elapsedTime * 0.6) * 0.15;

        renderer.render(scene, camera);
    };

    tick();

    const onWindowResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    };

    window.addEventListener('resize', onWindowResize);
}

function initScrollParallax() {
    const parallaxTargets = Array.from(document.querySelectorAll("[data-parallax]"));

    if (!parallaxTargets.length || prefersReducedMotion || state.performanceLite) {
        return;
    }

    let frameId = null;

    const render = () => {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        parallaxTargets.forEach((element) => {
            const speed = Number(element.getAttribute("data-parallax") || "0");
            const rect = element.getBoundingClientRect();
            const distanceFromCenter = rect.top + rect.height / 2 - viewportHeight / 2;
            const translateY = distanceFromCenter * speed * -0.2;
            const existingTransform = element.dataset.baseTransform || "";

            element.style.transform = `${existingTransform} translate3d(0, ${translateY.toFixed(2)}px, 0)`;
        });

        frameId = null;
    };

    parallaxTargets.forEach((element) => {
        element.dataset.baseTransform = getComputedStyle(element).transform === "none"
            ? ""
            : getComputedStyle(element).transform;
    });

    const queueRender = () => {
        if (!frameId) {
            frameId = requestAnimationFrame(render);
        }
    };

    queueRender();
    window.addEventListener("scroll", queueRender, { passive: true });
    window.addEventListener("resize", queueRender);
}

function initTiltCards() {
    const cards = document.querySelectorAll(".tilt-card");

    if (!cards.length || prefersReducedMotion || state.performanceLite) {
        return;
    }

    cards.forEach((card) => {
        let frameId = null;
        let rotateX = 0;
        let rotateY = 0;

        const surface = card.querySelector(".project-surface");

        const render = () => {
            if (surface) {
                surface.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
            frameId = null;
        };

        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;

            rotateY = (x - 0.5) * 6;
            rotateX = (0.5 - y) * 6;
            card.style.setProperty("--mx", `${x * 100}%`);
            card.style.setProperty("--my", `${y * 100}%`);

            if (!frameId) {
                frameId = requestAnimationFrame(render);
            }
        });

        card.addEventListener("pointerleave", () => {
            rotateX = 0;
            rotateY = 0;

            if (!frameId) {
                frameId = requestAnimationFrame(render);
            }
        });
    });
}

function showNotification(message, type = "success") {
    if (state.activeNotification) {
        state.activeNotification.remove();
        if (state.cleanupNotification) {
            window.clearTimeout(state.cleanupNotification);
        }
    }

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}"></i>
            <span>${message}</span>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        </div>
    `;

    document.body.appendChild(notification);
    requestAnimationFrame(() => notification.classList.add("show"));

    const close = () => {
        notification.classList.remove("show");
        window.setTimeout(() => notification.remove(), 220);
    };

    notification.querySelector(".notification-close")?.addEventListener("click", close);

    state.activeNotification = notification;
    state.cleanupNotification = window.setTimeout(close, 4200);
}

function initProjectLinks() {
    document.querySelectorAll("[data-toast]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const message = link.getAttribute("data-toast") || "Link coming soon.";
            showNotification(message, "success");
        });
    });
}

function initContactForm() {
    const contactForm = document.getElementById("contact-form");

    if (!contactForm) {
        return;
    }

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const payload = {
            name: String(formData.get("name") || "").trim(),
            email: String(formData.get("email") || "").trim(),
            subject: String(formData.get("subject") || "").trim(),
            message: String(formData.get("message") || "").trim()
        };

        if (Object.values(payload).some((value) => !value)) {
            showNotification("Please complete all fields before submitting.", "error");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(payload.email)) {
            showNotification("Please enter a valid email address.", "error");
            return;
        }

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalMarkup = submitButton?.innerHTML || "";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const firebaseClient = await getFirebaseClient();

            await firebaseClient.push(firebaseClient.ref(firebaseClient.database, "job messages"), {
                ...payload,
                timestamp: new Date().toISOString()
            });

            contactForm.reset();
            showNotification("Message sent successfully. I will get back to you soon.", "success");
        } catch (error) {
            console.error("Error sending message:", error);
            showNotification("Could not send the message right now. Please try again later or email me directly.", "error");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalMarkup;
            }
        }
    });
}

function runFeature(initializer, fallback) {
    try {
        initializer();
    } catch (error) {
        console.error("Initialization error:", error);
        fallback?.();
    }
}

function init() {
    runFeature(initBackgroundCanvas);
    runFeature(initRevealAnimations, forceRevealAll);
    runFeature(initMobileMenu);
    runFeature(initSmoothScroll);
    runFeature(initScrollUI);
    runFeature(initAmbientBackground);
    runFeature(initCounters);
    runFeature(initSkillMeters);
    runFeature(initHeroRoleRotator);
    runFeature(initHeroParallax);
    runFeature(initJarvisSphere);
    runFeature(initScrollParallax);
    runFeature(initTiltCards);
    runFeature(initProjectLinks);
    runFeature(initContactForm);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
