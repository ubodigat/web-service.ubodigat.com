"use strict";

/* =========================================================
   DOM Helper (sicher gegen fehlende Elemente)
========================================================= */
const $ = (q, el = document) => el ? el.querySelector(q) : null;
const $$ = (q, el = document) => el ? Array.from(el.querySelectorAll(q)) : [];

/* =========================================================
   Theme Handling (Dark / Light)
========================================================= */
const THEME_KEY = "ubodigat_theme";
const root = document.documentElement;
const themeToggle = $("#themeToggle");

function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
        applyTheme(saved);
    } else {
        const prefersLight =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: light)").matches;
        applyTheme(prefersLight ? "light" : "dark");
    }
}

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const current = root.getAttribute("data-theme") || "dark";
        applyTheme(current === "dark" ? "light" : "dark");
    });
}

/* =========================================================
   Navigation (nur wenn vorhanden)
========================================================= */
const navToggle = $("#navToggle");
const navList = $("#navList");

if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
        navList.classList.toggle("is-open");
    });

    $$("a[href^='#']", navList).forEach(link => {
        link.addEventListener("click", () => {
            navList.classList.remove("is-open");
        });
    });
}

/* =========================================================
   Footer Jahr
========================================================= */
const yearEl = $("#year");
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

/* =========================================================
   Copy-to-Clipboard + Toast Feedback
========================================================= */
function showCopyToast() {
    let toast = document.querySelector(".copy-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "copy-toast";
        toast.textContent = "✓ Erfolgreich kopiert";
        document.body.appendChild(toast);
    }

    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1400);
}

$$(".cmd").forEach(cmd => {
    cmd.addEventListener("click", async () => {
        const text = cmd.dataset.copy;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            showCopyToast();
        } catch (err) {
            console.error("Clipboard-Fehler:", err);
        }
    });
});

/* =========================================================
   Installations-Tabs (nur auf Install-Seite aktiv)
========================================================= */
$$(".install-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        $$(".install-tab").forEach(t => t.classList.remove("active"));
        $$(".install-section").forEach(s => s.classList.remove("active"));

        tab.classList.add("active");

        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.add("active");
    });
});

/* =========================================================
   Animierter Hintergrund (Canvas)
========================================================= */
(function backgroundAnimation() {
    const canvas = $("#bg-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
        alpha: true
    });
    if (!ctx) return;

    let width, height, dpr;
    const POINT_COUNT = 70;
    const MAX_DISTANCE = 130;
    let points = [];

    function resize() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        width = canvas.width = Math.floor(window.innerWidth * dpr);
        height = canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
    }

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createPoints() {
        points = Array.from({
            length: POINT_COUNT
        }, () => ({
            x: rand(0, width),
            y: rand(0, height),
            vx: rand(-0.35, 0.35) * dpr,
            vy: rand(-0.35, 0.35) * dpr,
            r: rand(1.2, 2.2) * dpr
        }));
    }

    let mouse = {
        x: null,
        y: null
    };

    window.addEventListener("mousemove", e => {
        mouse.x = e.clientX * dpr;
        mouse.y = e.clientY * dpr;
    });

    window.addEventListener("mouseleave", () => {
        mouse.x = mouse.y = null;
    });

    function dotAlpha() {
        return root.getAttribute("data-theme") === "light" ? 0.35 : 0.55;
    }

    function lineAlpha() {
        return root.getAttribute("data-theme") === "light" ? 0.10 : 0.18;
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        for (const p of points) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            if (mouse.x !== null) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 180 * dpr) {
                    p.x += dx * 0.002;
                    p.y += dy * 0.002;
                }
            }
        }

        ctx.lineWidth = 1 * dpr;
        const la = lineAlpha();

        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const a = points[i];
                const b = points[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);

                if (dist < MAX_DISTANCE * dpr) {
                    const alpha = (1 - dist / (MAX_DISTANCE * dpr)) * la;
                    ctx.strokeStyle = `rgba(45,226,230,${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        const da = dotAlpha();
        for (const p of points) {
            ctx.fillStyle = `rgba(234,240,255,${da})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    resize();
    createPoints();
    draw();

    window.addEventListener("resize", () => {
        resize();
        createPoints();
    });
})();

/* =========================================================
   Init
========================================================= */
initTheme();