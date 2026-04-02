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

const state = {
    activeNotification: null,
    cleanupNotification: null,
    firebaseClient: null
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
    let lastActiveId = "";

    const syncIndicator = (scrollTop) => {
        if (!navMenu || !navLinks.length) {
            navMenu?.style.setProperty("--nav-indicator-opacity", "0");
            return;
        }

        const navItems = navLinks
            .map((link) => {
                const href = link.getAttribute("href");
                const section = href ? document.querySelector(href) : null;

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
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progressRatio = docHeight > 0 ? scrollTop / docHeight : 0;

        document.documentElement.style.setProperty("--scroll-shift", `${scrollTop}px`);

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

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
}

function initRevealAnimations() {
    const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));

    if (!revealTargets.length) {
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
        ribbons: Array.from({ length: 8 }, (_, index) => ({
            baseY: 0.16 + index * 0.1,
            amplitude: 18 + index * 5,
            speed: 0.00022 + index * 0.00003,
            phase: index * 1.2,
            thickness: 1.2 + (index % 3) * 0.45,
            alpha: 0.09 + index * 0.008
        })),
        rings: Array.from({ length: 5 }, (_, index) => ({
            radius: 120 + index * 68,
            speed: 0.0001 + index * 0.00004,
            arcSpan: 0.8 + index * 0.16,
            width: 1 + index * 0.22,
            alpha: 0.08 + index * 0.015
        })),
        pulses: Array.from({ length: 18 }, (_, index) => ({
            lane: index % 8,
            progress: (index * 0.17) % 1,
            speed: 0.00009 + (index % 5) * 0.000025,
            size: 1.8 + (index % 3) * 0.8
        }))
    };

    const resize = () => {
        stateField.dpr = Math.min(window.devicePixelRatio || 1, 2);
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

        window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);

    if (prefersReducedMotion) {
        renderStatic();
        return;
    }

    window.requestAnimationFrame(render);
}

function initHeroParallax() {
    const heroVisual = document.getElementById("hero-visual");
    const layers = heroVisual?.querySelectorAll(".layer");

    if (!heroVisual || !layers?.length || prefersReducedMotion) {
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

function initHandSystem() {
    const system = document.getElementById("hero-hand");
    const nodes = Array.from(system?.querySelectorAll(".orbit-node") || []);

    if (!system || !nodes.length) {
        return;
    }

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const randomInRange = (min, max) => min + Math.random() * (max - min);

    const items = nodes.map((node, index) => {
        const baseRadius = Number(node.getAttribute("data-radius") || "72");

        return {
            node,
            angle: Number(node.getAttribute("data-angle") || String(index)),
            baseRadius,
            scaledBaseRadius: baseRadius,
            radius: baseRadius,
            targetRadius: baseRadius,
            speed: Number(node.getAttribute("data-speed") || "0.7"),
            verticalRatio: Number(node.getAttribute("data-ellipse") || "0.72"),
            scale: 1,
            targetScale: 1,
            opacity: 1,
            targetOpacity: 1,
            bobSeed: randomInRange(0, Math.PI * 2),
            bobSpeed: randomInRange(1.4, 2.4),
            radiusOffset: randomInRange(-6, 6)
        };
    });

    const orbitDuration = 4200;
    const absorbDuration = 900;
    const releaseDuration = 1100;

    let orbitDurationCurrent = orbitDuration;
    let phase = "orbit";
    let phaseStartedAt = performance.now();
    let lastTime = phaseStartedAt;

    const applyVisualState = (item, x, y) => {
        item.node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        item.node.style.opacity = item.opacity.toFixed(3);
        item.node.style.setProperty("--tag-scale", item.scale.toFixed(3));
        item.node.style.setProperty("--tag-opacity", item.opacity.toFixed(3));
    };

    const updateMetrics = () => {
        const bounds = system.getBoundingClientRect();
        const scale = clamp(Math.min(bounds.width, bounds.height) / 220, 0.82, 1.12);

        items.forEach((item) => {
            item.scaledBaseRadius = item.baseRadius * scale;
        });
    };

    const setPhase = (nextPhase, now) => {
        phase = nextPhase;
        phaseStartedAt = now;

        system.classList.toggle("is-closing", nextPhase === "absorb");
        system.classList.toggle("is-opening", nextPhase === "release");

        if (nextPhase === "release") {
            items.forEach((item) => {
                item.angle += randomInRange(0.35, 0.95);
                item.verticalRatio = clamp(item.verticalRatio + randomInRange(-0.06, 0.06), 0.6, 0.82);
                item.radiusOffset = randomInRange(-9, 9);
                item.bobSeed = randomInRange(0, Math.PI * 2);
            });
        }

        if (nextPhase === "orbit") {
            orbitDurationCurrent = orbitDuration + randomInRange(-600, 800);
        }
    };

    const renderStaticState = () => {
        updateMetrics();

        items.forEach((item) => {
            const x = Math.cos(item.angle) * item.scaledBaseRadius;
            const y = Math.sin(item.angle) * item.scaledBaseRadius * item.verticalRatio;
            item.scale = 1;
            item.opacity = 1;
            applyVisualState(item, x, y);
        });
    };

    updateMetrics();

    if (prefersReducedMotion) {
        renderStaticState();
        return;
    }

    const render = (now) => {
        const dt = Math.min((now - lastTime) / 1000, 0.04);
        const time = now * 0.001;
        const phaseElapsed = now - phaseStartedAt;
        lastTime = now;

        if (phase === "orbit" && phaseElapsed >= orbitDurationCurrent) {
            setPhase("absorb", now);
        } else if (phase === "absorb" && phaseElapsed >= absorbDuration) {
            setPhase("release", now);
        } else if (phase === "release" && phaseElapsed >= releaseDuration) {
            setPhase("orbit", now);
        }

        items.forEach((item, index) => {
            const bob = Math.sin(time * item.bobSpeed + item.bobSeed) * 4;
            const speedMultiplier = phase === "absorb"
                ? 2.15
                : phase === "release"
                    ? 1.05
                    : 0.78;

            item.angle += dt * item.speed * speedMultiplier;

            if (phase === "orbit") {
                item.targetRadius = item.scaledBaseRadius + item.radiusOffset * 0.35 + bob;
                item.targetScale = 1;
                item.targetOpacity = 1;
            } else if (phase === "absorb") {
                const collapseProgress = Math.min(phaseElapsed / absorbDuration, 1);
                item.targetRadius = 8 + Math.cos(time * 5 + index) * 1.5;
                item.targetScale = 1 - collapseProgress * 0.78;
                item.targetOpacity = 1 - collapseProgress;
            } else {
                const releaseProgress = Math.min(phaseElapsed / releaseDuration, 1);
                item.targetRadius = item.scaledBaseRadius + item.radiusOffset * 0.65 + bob;
                item.targetScale = 0.22 + releaseProgress * 0.78;
                item.targetOpacity = Math.min(1, releaseProgress * 1.4);
            }

            item.radius += (item.targetRadius - item.radius) * (phase === "absorb" ? 0.18 : 0.11);
            item.scale += (item.targetScale - item.scale) * (phase === "absorb" ? 0.18 : 0.14);
            item.opacity += (item.targetOpacity - item.opacity) * 0.16;

            const x = Math.cos(item.angle) * item.radius;
            const y = Math.sin(item.angle) * item.radius * item.verticalRatio + bob * 0.35;
            applyVisualState(item, x, y);
        });

        window.requestAnimationFrame(render);
    };

    window.addEventListener("resize", updateMetrics);
    window.requestAnimationFrame(render);
}

function initScrollParallax() {
    const parallaxTargets = Array.from(document.querySelectorAll("[data-parallax]"));

    if (!parallaxTargets.length || prefersReducedMotion) {
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

    if (!cards.length || prefersReducedMotion) {
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
    runFeature(initHandSystem);
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
