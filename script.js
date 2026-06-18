"use strict";

const $ = (q, s = document) => s.querySelector(q);
const $$ = (q, s = document) => Array.from(s.querySelectorAll(q));
const root = document.documentElement;
const toast = $("#toast");
const themeKey = "web-service-theme-v2";

/* ── Toast ───────────────────────────────────────────── */
function notify(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1800);
}

/* ── Theme ───────────────────────────────────────────── */
function setTheme(theme) {
    root.dataset.theme = theme;
    root.classList.toggle("is-light", theme === "light");
    $$("[id='themeToggle'], [data-theme-toggle]").forEach(btn => {
        btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
        btn.setAttribute("aria-label", theme === "light" ? "Dark Mode aktivieren" : "Light Mode aktivieren");
    });
    try {
        localStorage.setItem(themeKey, theme);
    } catch {
        /* blocked */
    }
}

function initTheme() {
    let saved = "dark";
    try {
        saved = localStorage.getItem(themeKey) || "dark";
    } catch {
        saved = "dark";
    }
    setTheme(saved);
    $$("#themeToggle, [data-theme-toggle]").forEach(btn => {
        btn.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
    });
}

/* ── Copy ────────────────────────────────────────────── */
function initCopy() {
    $$("[data-copy]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const action = btn.dataset.copy;
            let text = btn.dataset.copyText || "";
            if (!text && action === "install") {
                text = $("#heroCmd")?.textContent.trim() || "";
            }
            /* install.html: data-copy contains the raw command string */
            if (!text && action && action !== "install") text = action;
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                notify("Befehl kopiert.");
            } catch {
                notify("Kopieren nicht möglich.");
            }
        });
    });
}

/* ── Navigation ──────────────────────────────────────── */
function initNav() {
    const menu = $("#mobileMenu");
    const nav = $("#navLinks");
    if (menu && nav) {
        menu.addEventListener("click", () => {
            const open = nav.classList.toggle("open");
            menu.setAttribute("aria-expanded", String(open));
        });
        $$("a", nav).forEach(link => link.addEventListener("click", () => {
            nav.classList.remove("open");
            menu.setAttribute("aria-expanded", "false");
        }));
    }
    $$('a[href^="#"]').forEach(link => {
        link.addEventListener("click", e => {
            const target = $(link.getAttribute("href"));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

/* ── Scroll reveal ───────────────────────────────────── */
function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add("visible");
        });
    }, {
        threshold: 0.1
    });
    items.forEach(item => observer.observe(item));
}

/* ── Particle network (mouse-reactive) ───────────────── */
function initParticles() {
    const canvas = $("#particleBg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0,
        height = 0,
        raf = 0,
        particles = [];
    let mouse = {
        x: -2000,
        y: -2000
    };

    const REPULSE_R = 140;
    const REPULSE_F = 0.55;

    const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.max(38, Math.min(88, Math.floor(width * height / 18000)));
        particles = Array.from({
            length: count
        }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            r: Math.random() * 1.6 + 0.8,
            glow: Math.random() * 0.42 + 0.28
        }));
    };

    const isLight = () => root.classList.contains("is-light");

    const draw = () => {
        ctx.clearRect(0, 0, width, height);
        const maxDist = width < 760 ? 100 : 138;
        const light = isLight();

        particles.forEach(p => {
            if (!reduced) {
                /* mouse repulsion */
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < REPULSE_R && dist > 0.5) {
                    const force = ((REPULSE_R - dist) / REPULSE_R) * REPULSE_F;
                    p.x += (dx / dist) * force * 2.8;
                    p.y += (dy / dist) * force * 2.8;
                }
                /* natural drift */
                p.x += p.vx;
                p.y += p.vy;
            }
            if (p.x < -20) p.x = width + 20;
            if (p.x > width + 20) p.x = -20;
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;
        });

        /* connections */
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i],
                    b = particles[j];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < maxDist) {
                    const alpha = (1 - dist / maxDist) * (light ? 0.16 : 0.22);
                    ctx.strokeStyle = light ?
                        `rgba(47,111,232,${alpha})` :
                        `rgba(94,234,212,${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        /* dots */
        particles.forEach(p => {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
            if (light) {
                grad.addColorStop(0, `rgba(47,111,232,${p.glow})`);
                grad.addColorStop(1, "rgba(47,111,232,0)");
            } else {
                grad.addColorStop(0, `rgba(125,211,252,${p.glow})`);
                grad.addColorStop(1, "rgba(125,211,252,0)");
            }
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = light ? "rgba(47,111,232,.78)" : "rgba(255,255,255,.82)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });

        raf = requestAnimationFrame(draw);
    };

    /* mouse tracking — use the window so any motion reacts */
    window.addEventListener("mousemove", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener("mouseleave", () => {
        mouse.x = -2000;
        mouse.y = -2000;
    });

    window.addEventListener("resize", () => {
        cancelAnimationFrame(raf);
        resize();
        draw();
    });

    resize();
    draw();
}

/* ── Terminal demo ───────────────────────────────────── */
function initTerminal() {
    const btn = $("#startTerminal");
    const out = $("#terminalOutput");
    const bar = $("#terminalProgress");
    if (!btn || !out || !bar || btn.dataset.terminalBound === "true") return;
    btn.dataset.terminalBound = "true";

    const lines = [
        "root@server:~# wget -O install.sh https://web-service.ubodigat.com/install/install.sh",
        "--2026-06-14 15:53:36--  https://web-service.ubodigat.com/install/install.sh",
        "Resolving web-service.ubodigat.com... 2606:50c0:8002::153, 2606:50c0:8001::153",
        "Connecting to web-service.ubodigat.com|2606:50c0:8002::153|:443... connected.",
        "HTTP request sent, awaiting response... 200 OK",
        "Length: 7718 (7.5K) [application/x-sh]",
        "Saving to: 'install.sh'",
        "install.sh  100%[=============================================>]   7.54K  --.-KB/s    in 0.001s",
        "2026-06-14 15:53:36 (9.98 MB/s) - 'install.sh' saved [7718/7718]",
        "root@server:~# chmod +x install.sh",
        "root@server:~# ./install.sh",
        "Starte automatische Installation (Stabilitätsmodus)...",
        "Aktualisiere Paketlisten...",
        "Hit:1 http://deb.debian.org/debian bookworm InRelease",
        "Hit:2 http://security.debian.org bookworm-security InRelease",
        "Hit:3 http://deb.debian.org/debian bookworm-updates InRelease",
        "Reading package lists... Done",
        "Building dependency tree... Done",
        "Reading state information... Done",
        "All packages are up to date.",
        "Konfiguriere phpMyAdmin (non-interactive)...",
        "Installiere Systempakete...",
        "apache2 is already the newest version (2.4.67-1~deb12u3).",
        "mariadb-server is already the newest version (1:10.11.14-0+deb12u2).",
        "php is already the newest version (2:8.2+93).",
        "php-mysql is already the newest version (2:8.2+93).",
        "php-curl is already the newest version (2:8.2+93).",
        "php-zip is already the newest version (2:8.2+93).",
        "php-mbstring is already the newest version (2:8.2+93).",
        "php-xml is already the newest version (2:8.2+93).",
        "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.",
        "Starte Dienste...",
        "Synchronizing state of apache2.service with SysV...",
        "Executing: /lib/systemd/systemd-sysv-install enable apache2",
        "Synchronizing state of mariadb.service with SysV...",
        "Executing: /lib/systemd/systemd-sysv-install enable mariadb",
        "Erstelle Datenbank & Benutzer...",
        "Konfiguriere Apache...",
        "Module rewrite already enabled",
        "Conf phpmyadmin already enabled",
        "Setze PHP Upload-Limits auf 2 GB...",
        "Lade Projektdateien...",
        "Erstelle .db.env...",
        "Setze Dateirechte...",
        "",
        "==========================================================",
        "      BASISINSTALLATION ERFOLGREICH ABGESCHLOSSEN         ",
        "==========================================================",
        "",
        "WEB-ZUGANG:",
        "  -> Projekt-Landingpage:     http://SERVER-IP/",
        "  -> Setup starten (Wichtig): http://SERVER-IP/install/setup.php",
        "",
        "DATEI-VERWALTUNG:",
        "  -> Dateimanager:            http://SERVER-IP/filemanager",
        "",
        "DATENBANK:",
        "  -> phpMyAdmin:              http://SERVER-IP/phpmyadmin",
        "",
        "WICHTIGER HINWEIS:",
        "Das Setup im Browser muss einmalig ausgefuehrt werden.",
        "----------------------------------------------------------",
        "",
        "root@server:~#"
    ];

    btn.addEventListener("click", () => {
        btn.disabled = true;
        out.innerHTML = "";
        bar.style.width = "0%";
        let idx = 0;

        const tick = () => {
            const line = document.createElement("p");
            line.textContent = lines[idx];
            if (lines[idx].startsWith("root@")) line.className = "term-command";
            if (lines[idx].includes("ERFOLGREICH")) line.className = "term-ok";
            if (lines[idx].startsWith("====") || lines[idx].startsWith("---")) line.className = "term-rule";
            if (lines[idx].includes("http://")) line.className = "term-url";
            out.appendChild(line);
            bar.style.width = `${Math.round(((idx + 1) / lines.length) * 100)}%`;
            out.scrollTop = out.scrollHeight;
            idx += 1;
            if (idx < lines.length) {
                window.setTimeout(tick, idx < 12 ? 110 : 50);
            } else {
                btn.disabled = false;
                notify("Terminal-Demo abgeschlossen.");
            }
        };
        tick();
    });
}

/* ── File Manager demo ───────────────────────────────── */
function initFilemanager() {
    const tbody = $("#fmTableBody");
    const breadcrumb = $("#fmBreadcrumb");
    const pathInput = $("#fmPath");
    const searchInput = $("#fmSearch");
    const upload = $("#simulateUpload");
    const bar = $("#uploadBar");
    const state = $("#uploadState");
    const newFileIn = $("#fmNewFile");
    const newFolderIn = $("#fmNewFolder");
    const createFile = $("#fmCreateFile");
    const createFolder = $("#fmCreateFolder");
    const refresh = $("#fmRefresh");

    if (!tbody) return;

    const TYPE_ICON = {
        folder: "#i-folder",
        php: "#i-code",
        image: "#i-image",
        video: "#i-video",
        web: "#i-code",
        document: "#i-file",
        archive: "#i-zip",
    };
    const TYPE_EMOJI = {
        folder: "📁",
        php: "🐘",
        image: "🖼️",
        video: "🎬",
        web: "🎨",
        document: "📄",
        archive: "🗜️",
    };

    const FS = {
        "/var/www/html": [{
                name: "config",
                type: "folder",
                size: "994 B",
                date: "13.06.2026 00:30",
                status: "locked",
                canOpen: true
            },
            {
                name: "filemanager",
                type: "folder",
                size: "4.16 MB",
                date: "13.06.2026 22:20",
                status: "locked",
                canOpen: false
            },
            {
                name: "install",
                type: "folder",
                size: "27.44 KB",
                date: "13.06.2026 00:30",
                status: "locked",
                canOpen: false
            },
            {
                name: "projekt",
                type: "folder",
                size: "1.48 GB",
                date: "13.06.2026 15:24",
                status: "public",
                canOpen: true
            },
            {
                name: "index.php",
                type: "php",
                size: "4.00 KB",
                date: "13.06.2026 15:28",
                status: "public",
                editable: true
            },
            {
                name: "preview.webp",
                type: "image",
                size: "312.00 KB",
                date: "13.06.2026 14:10",
                status: "public"
            },
        ],
        "/var/www/html/config": [{
                name: "db.env",
                type: "document",
                size: "128 B",
                date: "13.06.2026 00:30",
                status: "locked"
            },
            {
                name: ".htaccess",
                type: "web",
                size: "384 B",
                date: "13.06.2026 00:30",
                status: "locked"
            },
        ],
        "/var/www/html/projekt": [{
                name: "bilder",
                type: "folder",
                size: "892.00 MB",
                date: "12.06.2026 11:20",
                status: "public",
                canOpen: true
            },
            {
                name: "css",
                type: "folder",
                size: "124.00 KB",
                date: "11.06.2026 09:14",
                status: "public",
                canOpen: true
            },
            {
                name: "js",
                type: "folder",
                size: "88.00 KB",
                date: "11.06.2026 09:14",
                status: "public",
                canOpen: true
            },
            {
                name: "index.php",
                type: "php",
                size: "8.22 KB",
                date: "12.06.2026 17:34",
                status: "public",
                editable: true
            },
            {
                name: "README.md",
                type: "document",
                size: "2.10 KB",
                date: "10.06.2026 08:00",
                status: "public",
                editable: true
            },
            {
                name: "backup.zip",
                type: "archive",
                size: "156.40 MB",
                date: "13.06.2026 01:00",
                status: "locked"
            },
        ],
        "/var/www/html/projekt/bilder": [{
                name: "hero.webp",
                type: "image",
                size: "642.00 KB",
                date: "12.06.2026 10:12",
                status: "public"
            },
            {
                name: "logo.png",
                type: "image",
                size: "48.00 KB",
                date: "10.06.2026 08:00",
                status: "public"
            },
            {
                name: "demo.mp4",
                type: "video",
                size: "124.80 MB",
                date: "13.06.2026 12:44",
                status: "public"
            },
        ],
        "/var/www/html/projekt/css": [{
            name: "style.css",
            type: "web",
            size: "28.44 KB",
            date: "11.06.2026 09:14",
            status: "public",
            editable: true
        }, ],
        "/var/www/html/projekt/js": [{
            name: "main.js",
            type: "web",
            size: "18.22 KB",
            date: "11.06.2026 09:14",
            status: "public",
            editable: true
        }, ],
    };

    let currentPath = "/var/www/html";
    let activeFilter = "all";

    function makeIcon(href) {
        return `<svg class="icon" style="width:16px;height:16px"><use href="${href}"></use></svg>`;
    }

    function renderBreadcrumb() {
        if (!breadcrumb) return;
        const parts = currentPath.split("/").filter(Boolean);
        let built = "";
        const segments = parts.map((part, i) => {
            built += "/" + part;
            const path = built;
            return {
                label: part,
                path
            };
        });
        breadcrumb.textContent = "";
        segments.forEach((seg, i) => {
            if (i < segments.length - 1) {
                const btn = document.createElement("button");
                btn.className = "fm-bc-btn";
                btn.dataset.path = seg.path;
                btn.textContent = seg.label;
                btn.addEventListener("click", () => navigateTo(btn.dataset.path));
                breadcrumb.appendChild(btn);

                const sep = document.createElement("span");
                sep.className = "fm-bc-sep";
                const iconWrap = document.createElement("span");
                iconWrap.innerHTML = makeIcon("#i-chevron-right");
                if (iconWrap.firstElementChild) {
                    sep.appendChild(iconWrap.firstElementChild);
                } else {
                    sep.textContent = "›";
                }
                breadcrumb.appendChild(sep);
                return;
            }

            const cur = document.createElement("span");
            cur.className = "fm-bc-cur";
            cur.textContent = seg.label;
            breadcrumb.appendChild(cur);
        });
    }

    function filterItem(item) {
        if (activeFilter === "all") return true;
        if (activeFilter === "folder") return item.type === "folder";
        return item.type === activeFilter;
    }

    function searchItem(item, q) {
        return item.name.toLowerCase().includes(q);
    }

    function renderTable() {
        const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const items = (FS[currentPath] || []).filter(item => filterItem(item) && searchItem(item, q));

        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">Keine Dateien gefunden.</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(item => {
            const icon = TYPE_ICON[item.type] || "#i-file";
            const emoji = TYPE_EMOJI[item.type] || "📄";
            const canNav = item.type === "folder" && item.canOpen && FS[currentPath + "/" + item.name];
            const canEdit = item.editable;
            const locked = item.status === "locked";

            const nameCel = canNav ?
                `<td><button class="fm-nav-btn" data-name="${item.name}">${makeIcon(icon)} ${item.name}</button></td>` :
                `<td>${makeIcon(icon)} ${item.name}</td>`;

            const statusBadge = locked ?
                `<span class="fm-badge locked">${makeIcon("#i-lock")} Gesperrt</span>` :
                `<span class="fm-badge public">${makeIcon("#i-eye")} Öffentlich</span>`;

            const actions = [];
            if (canEdit) actions.push(`<button class="fm-action-btn" title="Bearbeiten" onclick="window._fmEdit('${item.name}')">${makeIcon("#i-code")}</button>`);
            if (item.type === "image" || item.type === "video") actions.push(`<button class="fm-action-btn" title="Vorschau" onclick="window._fmPreview('${item.name}')">${makeIcon("#i-eye")}</button>`);
            if (!locked) actions.push(`<button class="fm-action-btn danger" title="Löschen" onclick="window._fmDelete('${item.name}')">${makeIcon("#i-trash")}</button>`);

            const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

            return `<tr>
        ${nameCel}
        <td>${statusBadge}</td>
        <td><span class="type-chip">${typeLabel}</span></td>
        <td>${item.size}</td>
        <td>${item.date}</td>
        <td class="actions-cell">${actions.length ? actions.join(" ") : '<span style="color:var(--muted);font-size:12px">—</span>'}</td>
      </tr>`;
        }).join("");

        /* attach folder nav */
        tbody.querySelectorAll(".fm-nav-btn").forEach(btn => {
            btn.addEventListener("click", () => navigateTo(currentPath + "/" + btn.dataset.name));
        });
    }

    function navigateTo(path) {
        if (!FS[path]) {
            notify("Ordner nicht geöffnet (Demo-Einschränkung).");
            return;
        }
        currentPath = path;
        if (pathInput) pathInput.value = path;
        if (searchInput) searchInput.value = "";
        renderBreadcrumb();
        renderTable();
    }

    /* filter chips */
    $$(".filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            $$(".filter-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilter = chip.dataset.filter || "all";
            renderTable();
        });
    });

    /* search */
    if (searchInput) searchInput.addEventListener("input", renderTable);

    /* refresh */
    if (refresh) refresh.addEventListener("click", () => {
        renderTable();
        notify("Dateiliste aktualisiert.");
    });

    /* create file */
    if (createFile && newFileIn) {
        createFile.addEventListener("click", () => {
            const fname = newFileIn.value.trim();
            if (!fname) {
                notify("Bitte Dateinamen eingeben.");
                return;
            }
            const ext = fname.split(".").pop().toLowerCase();
            const typeMap = {
                php: "php",
                html: "web",
                css: "web",
                js: "web",
                md: "document",
                txt: "document",
                webp: "image",
                png: "image",
                jpg: "image",
                mp4: "video",
                zip: "archive"
            };
            const ftype = typeMap[ext] || "document";
            FS[currentPath].push({
                name: fname,
                type: ftype,
                size: "0 B",
                date: new Date().toLocaleString("de-DE").replace(",", ""),
                status: "public",
                editable: true
            });
            newFileIn.value = "";
            renderTable();
            notify(`Datei "${fname}" erstellt (Demo).`);
        });
    }

    /* create folder */
    if (createFolder && newFolderIn) {
        createFolder.addEventListener("click", () => {
            const fname = newFolderIn.value.trim();
            if (!fname) {
                notify("Bitte Ordnernamen eingeben.");
                return;
            }
            FS[currentPath].push({
                name: fname,
                type: "folder",
                size: "0 B",
                date: new Date().toLocaleString("de-DE").replace(",", ""),
                status: "public",
                canOpen: true
            });
            FS[currentPath + "/" + fname] = [];
            newFolderIn.value = "";
            renderTable();
            notify(`Ordner "${fname}" erstellt (Demo).`);
        });
    }

    /* ── Monaco editor overlay ── */
    const FILE_CONTENT = {
        "index.php": `<?php\ndeclare(strict_types=1);\n\nrequire __DIR__ . '/filemanager/security.php';\n\n$page_title = 'Willkommen';\n$version    = '1.7.4';\n\necho '<h1>Willkommen bei web-service</h1>';\necho '<p>Version: ' . htmlspecialchars($version) . '</p>';\n?>`,
        "README.md": `# Projektdokumentation\n\n## Übersicht\nDieses Projekt wurde mit web-service eingerichtet.\n\n## Struktur\n- /bilder  – Bilddateien\n- /css     – Stylesheets\n- /js      – Skripte\n\n## Lizenz\nApache License 2.0`,
        "style.css": `:root {\n  --primary: #4f8ef7;\n  --bg:      #0b1117;\n  --text:    #edf6f9;\n}\n\nbody {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n  background: var(--bg);\n  color: var(--text);\n}\n\n.container {\n  max-width: 1180px;\n  margin: 0 auto;\n  padding: 0 24px;\n}`,
        "main.js": `"use strict";\n\nconst $ = q => document.querySelector(q);\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  const nav = $('.nav');\n  const btn = $('.menu-btn');\n\n  btn?.addEventListener('click', () => {\n    nav?.classList.toggle('open');\n  });\n\n  console.log('web-service ready.');\n});`,
        "db.env": `DB_HOST=localhost\nDB_NAME=webservice_db\nDB_USER=ws_user\nDB_PASS=*****\nDB_PORT=3306`,
        ".htaccess": `RewriteEngine On\nRewriteBase /\n\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^ index.php [L]\n\nOptions -Indexes\nHeader always set X-Content-Type-Options "nosniff"`,
    };
    const LANG_MAP = {
        php: "PHP",
        css: "CSS",
        js: "JavaScript",
        md: "Markdown",
        env: "ENV",
        htaccess: "Apache Config"
    };

    function syntaxHL(code, ext) {
        const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const raw = esc(code);
        if (ext === "php") {
            return raw
                .replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="tok-cmt">$1</span>')
                .replace(/\b(declare|require|echo|if|else|return|function|class|new|use|namespace|foreach|while|for|true|false|null)\b/g, '<span class="tok-kw">$1</span>')
                .replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="tok-fn">$1</span>(')
                .replace(/('[^']*'|"[^"]*")/g, '<span class="tok-str">$1</span>')
                .replace(/\$\w+/g, '<span class="tok-var">$&</span>');
        }
        if (ext === "css") {
            return raw
                .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-cmt">$1</span>')
                .replace(/([a-zA-Z-]+)\s*:/g, '<span class="tok-var">$1</span>:')
                .replace(/(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|\d+(?:px|em|rem|%|vh|vw))/g, '<span class="tok-num">$1</span>');
        }
        if (ext === "js") {
            return raw
                .replace(/(\/\/[^\n]*)/g, '<span class="tok-cmt">$1</span>')
                .replace(/\b(const|let|var|function|return|if|else|new|class|import|export|from|document|window|addEventListener|querySelector)\b/g, '<span class="tok-kw">$1</span>')
                .replace(/('[^']*'|"[^"]*"|`[^`]*`)/g, '<span class="tok-str">$1</span>');
        }
        return raw;
    }

    function openEditor(name, content) {
        const overlay = $("#fmEditorOverlay");
        const codeEl = $("#fmEditorCode");
        const gutterEl = $("#fmEditorGutter");
        const fname = $("#fmEditorFilename");
        const langEl = $("#fmEditorLang");
        const linesEl = $("#fmEditorLines");
        if (!overlay || !codeEl) return;

        const ext = name.split(".").pop().toLowerCase();
        const lang = LANG_MAP[ext] || "Klartext";
        const lines = content.split("\n");

        fname.textContent = name;
        langEl.textContent = lang;
        linesEl.textContent = `${lines.length} Zeile${lines.length !== 1 ? "n" : ""}`;
        codeEl.innerHTML = syntaxHL(content, ext);
        gutterEl.innerHTML = lines.map((_, i) => `${i + 1}`).join("<br>");

        overlay.classList.add("open");
        overlay.dataset.file = name;
        codeEl.focus();
    }

    /* editor close/save */
    const editorOverlay = $("#fmEditorOverlay");
    if (editorOverlay) {
        const closeEditor = () => editorOverlay.classList.remove("open");
        $("#fmEditorClose")?.addEventListener("click", closeEditor);
        $("#fmEditorCancel")?.addEventListener("click", closeEditor);
        $("#fmEditorSave")?.addEventListener("click", () => {
            const name = editorOverlay.dataset.file || "Datei";
            closeEditor();
            notify(`"${name}" gespeichert (Demo).`);
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && editorOverlay.classList.contains("open")) closeEditor();
            if ((e.ctrlKey || e.metaKey) && e.key === "s" && editorOverlay.classList.contains("open")) {
                e.preventDefault();
                const name = editorOverlay.dataset.file || "Datei";
                closeEditor();
                notify(`"${name}" gespeichert (Demo).`);
            }
        });
    }

    /* action helpers */
    window._fmEdit = name => {
        const content = FILE_CONTENT[name] || `// ${name}\n// Dateiinhalt nicht verfügbar (Demo)`;
        openEditor(name, content);
    };
    window._fmPreview = name => notify(`"${name}" im Media-Viewer geöffnet (Demo).`);
    window._fmDelete = name => {
        const idx = FS[currentPath].findIndex(i => i.name === name);
        if (idx !== -1) {
            FS[currentPath].splice(idx, 1);
            renderTable();
        }
        notify(`"${name}" gelöscht (Demo).`);
    };

    /* upload simulation */
    if (upload && bar && state) {
        upload.addEventListener("click", () => {
            let value = 0;
            upload.disabled = true;
            bar.style.width = "0%";
            state.textContent = "Upload: demo-image.webp";
            const timer = window.setInterval(() => {
                value += Math.floor(Math.random() * 17) + 8;
                if (value >= 100) value = 100;
                bar.style.width = `${value}%`;
                state.textContent = `Upload: demo-image.webp (${value}%)`;
                if (value === 100) {
                    window.clearInterval(timer);
                    upload.disabled = false;
                    state.textContent = "Upload abgeschlossen: demo-image.webp";
                    notify("Upload-Simulation abgeschlossen.");
                }
            }, 210);
        });
    }

    /* settings popup */
    const settingsBtn = $("#fmSettingsBtn");
    const settingsPopup = $("#fmSettingsPopup");
    const settingsClose = $("#fmSettingsClose");
    if (settingsBtn && settingsPopup) {
        settingsBtn.addEventListener("click", e => {
            e.stopPropagation();
            const isOpen = settingsPopup.classList.toggle("open");
            settingsBtn.setAttribute("aria-expanded", String(isOpen));
        });
        if (settingsClose) settingsClose.addEventListener("click", () => {
            settingsPopup.classList.remove("open");
            settingsBtn.setAttribute("aria-expanded", "false");
        });
        document.addEventListener("click", e => {
            if (settingsPopup.classList.contains("open") && !settingsPopup.contains(e.target) && e.target !== settingsBtn) {
                settingsPopup.classList.remove("open");
                settingsBtn.setAttribute("aria-expanded", "false");
            }
        });
        /* close helpers */
        const closeSettings = () => {
            settingsPopup.classList.remove("open");
            settingsBtn.setAttribute("aria-expanded", "false");
        };
        /* save settings demo */
        const saveSettings = $("#fmSettingsSave");
        if (saveSettings) saveSettings.addEventListener("click", () => {
            closeSettings();
            notify("Einstellungen gespeichert (Demo).");
        });
        const cancelSettings = $("#fmSettingsCancel");
        if (cancelSettings) cancelSettings.addEventListener("click", closeSettings);
        /* switches inside popup */
        settingsPopup.querySelectorAll(".switch").forEach(sw => {
            sw.addEventListener("click", e => {
                e.stopPropagation();
                sw.classList.toggle("on");
            });
        });
    }

    /* initial render */
    renderBreadcrumb();
    renderTable();
}

/* ── Admin demo ──────────────────────────────────────── */
function initAdmin() {
    const btn = $("#checkUpdate");
    const doUpdate = $("#doUpdate");
    const status = $("#updateStatus");
    const msg = $("#updateMsg");
    const badge = $("#updateBadge");
    if (!btn || !status) return;

    btn.addEventListener("click", () => {
        btn.disabled = true;
        if (badge) badge.classList.add("hidden");
        if (doUpdate) doUpdate.disabled = true;
        if (msg) msg.textContent = "Verbindung zu GitHub-API wird simuliert …";
        status.textContent = "Prüfe Version …";

        window.setTimeout(() => {
            status.textContent = "Neue Version verfügbar!";
            if (msg) msg.textContent = "Aktuelle Version: 1.7.4  →  Neue Version: 1.7.4";
            if (badge) badge.classList.remove("hidden");
            if (doUpdate) doUpdate.disabled = false;
            btn.disabled = false;
            notify("Update verfügbar: v1.7.4");
        }, 1400);
    });

    if (doUpdate) {
        doUpdate.addEventListener("click", () => {
            doUpdate.disabled = true;
            if (btn) btn.disabled = true;
            if (msg) msg.textContent = "Update wird eingespielt …";
            window.setTimeout(() => {
                if (badge) badge.classList.add("hidden");
                if (msg) msg.textContent = "Update auf v1.7.4 erfolgreich (Demo).";
                const ver = $("#currentVersion");
                if (ver) ver.textContent = "1.7.4";
                status.textContent = "Version: 1.7.4 aktuell";
                btn.disabled = false;
                notify("Update auf v1.7.4 eingespielt (Demo).");
            }, 1600);
        });
    }
}

/* ── Permissions demo ────────────────────────────────── */
function initPermissions() {
    const saveGlobal = $(".admin-btn.blue.compact-btn");
    const saveRule = $(".admin-btn.green.compact-btn");
    const rulesBox = $(".saved-rule");
    const folderSelect = $("#folderRuleSelect");
    const folderInput = $("#folderRulePath");

    /* sync select → input */
    if (folderSelect && folderInput) {
        folderSelect.addEventListener("change", () => {
            if (folderSelect.value) folderInput.value = folderSelect.value;
        });
        folderInput.removeAttribute("readonly");
    }

    if (saveGlobal) {
        saveGlobal.addEventListener("click", () => {
            const checked = $$(".perm-grid input:checked").map(el => el.closest("label")?.querySelector("span")?.textContent || "").filter(Boolean);
            saveGlobal.textContent = "✓ Gespeichert";
            saveGlobal.style.background = "rgba(16,185,129,.18)";
            saveGlobal.style.color = "var(--green)";
            saveGlobal.style.borderColor = "rgba(16,185,129,.4)";
            window.setTimeout(() => {
                saveGlobal.innerHTML = `<svg class="icon" style="width:14px;height:14px"><use href="#i-check"></use></svg>Globale Rechte speichern`;
                saveGlobal.style = "";
            }, 2000);
            notify(`Globale Rechte gespeichert: ${checked.join(", ") || "keine"}`);
        });
    }

    if (saveRule && rulesBox) {
        const toggles = $$(".toggle-grid label");
        saveRule.addEventListener("click", () => {
            const folder = (folderInput?.value.trim() || folderSelect?.options[folderSelect?.selectedIndex]?.value || "demo-ordner");
            const active = toggles.filter(l => l.querySelector(".switch")?.classList.contains("on")).map(l => l.textContent.trim());
            const inactive = toggles.filter(l => !l.querySelector(".switch")?.classList.contains("on")).map(l => l.textContent.trim());

            const newRule = document.createElement("div");
            newRule.className = "saved-rule";
            const svgEdit = `<svg class="icon" style="width:13px;height:13px"><use href="#i-edit"></use></svg>`;
            const svgTrash = `<svg class="icon" style="width:13px;height:13px"><use href="#i-trash"></use></svg>`;
            const left = document.createElement("div");
            const folderEl = document.createElement("b");
            folderEl.textContent = folder;
            left.appendChild(folderEl);
            inactive.forEach(n => {
                const span = document.createElement("span");
                span.textContent = n;
                left.appendChild(span);
            });
            active.forEach(n => {
                const span = document.createElement("span");
                span.className = "on";
                span.textContent = n;
                left.appendChild(span);
            });

            const right = document.createElement("div");
            const editBtn = document.createElement("button");
            editBtn.className = "mini yellow";
            editBtn.type = "button";
            editBtn.innerHTML = svgEdit;
            const trashBtn = document.createElement("button");
            trashBtn.className = "mini red";
            trashBtn.type = "button";
            trashBtn.innerHTML = svgTrash;
            right.appendChild(editBtn);
            right.appendChild(trashBtn);

            newRule.appendChild(left);
            newRule.appendChild(right);
            rulesBox.parentNode.insertBefore(newRule, rulesBox.nextSibling);
            if (window._attachRuleButtons) window._attachRuleButtons(newRule);
            notify(`Regel für "${folder}" gespeichert.`);
        });
    }

    /* toggle switches interactive */
    $$(".toggle-grid .switch").forEach(sw => {
        sw.addEventListener("click", () => sw.classList.toggle("on"));
    });

    function attachRuleButtons(ruleEl) {
        ruleEl.querySelector(".mini.red")?.addEventListener("click", () => {
            ruleEl.remove();
            notify("Regel gelöscht.");
        });
        ruleEl.querySelector(".mini.yellow")?.addEventListener("click", () => {
            const folder = ruleEl.querySelector("b")?.textContent || "";
            const activeNames = Array.from(ruleEl.querySelectorAll(".on")).map(s => s.textContent.trim());
            if (folderInput) folderInput.value = folder;
            if (folderSelect) {
                const opt = Array.from(folderSelect.options).find(o => o.value === folder);
                folderSelect.value = opt ? folder : "";
            }
            toggles.forEach(label => {
                const name = label.textContent.trim();
                const sw = label.querySelector(".switch");
                if (!sw) return;
                if (activeNames.includes(name)) sw.classList.add("on");
                else sw.classList.remove("on");
            });
            ruleEl.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
            notify(`Regel "${folder}" zum Bearbeiten geladen.`);
        });
    }

    /* attach to initial saved rules */
    $$(".saved-rule").forEach(attachRuleButtons);

    /* expose so new rules also get attached */
    window._attachRuleButtons = attachRuleButtons;
}

/* ── Lightbox ────────────────────────────────────────── */
function initLightbox() {
    const box = $("#lightbox");
    const content = $("#lightboxContent");
    const desc = $("#lightboxDesc");
    const title = $("#lightboxTitle");
    const closeBtn = $("#closeLightbox");
    if (!box || !content) return;

    const close = () => {
        box.classList.remove("open");
        box.setAttribute("aria-hidden", "true");
    };

    $$(".preview").forEach(card => {
        card.addEventListener("click", () => {
            const mock = card.querySelector(".mock");
            if (mock) content.innerHTML = mock.outerHTML;
            if (title) title.textContent = card.dataset.title || "Preview";
            if (desc) desc.textContent = card.dataset.desc || "";
            box.classList.add("open");
            box.setAttribute("aria-hidden", "false");
        });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    box.addEventListener("click", e => {
        if (e.target === box) close();
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") close();
    });
}

/* ── install.html tab switching ──────────────────────── */
function initInstallTabs() {
    const tabs = $$(".install-tab");
    if (!tabs.length) return;
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            const target = tab.dataset.target;
            $$(".install-section").forEach(s => {
                s.classList.toggle("active", s.id === target);
            });
        });
    });
}

/* ── Year in footer ──────────────────────────────────── */
function initYear() {
    $$("[id='year']").forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}

/* ── Boot ────────────────────────────────────────────── */
initTheme();
initCopy();
initNav();
initReveal();
initParticles();
initTerminal();
initFilemanager();
initAdmin();
initPermissions();
initLightbox();
initInstallTabs();
initYear();