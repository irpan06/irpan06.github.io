/* ============================================================
   Portfolio — Shared Script
   Dipakai bersama oleh index.html dan seluruh halaman detail
   project (mis. project-data-analytics.html).

   Berisi:
   - Toggle tema (dark/light) — sync via localStorage + parameter URL
   - Toggle bahasa (EN/ID) — sync via localStorage + parameter URL
   - Sinkronisasi otomatis saat pindah halaman (link internal otomatis
     dibawakan parameter ?theme=..&lang=.. sesuai kondisi terkini)
   - Intro screen & efek typing subtitle — hanya sekali per sesi browser
     (khusus index.html)
   - Filter project (khusus index.html)
   - Animasi counter jumlah project saat halaman dimuat (khusus index.html)

   Semua fitur di-guard (dicek elemennya dulu), jadi file ini
   aman dipakai di halaman mana pun meskipun elemennya tidak
   lengkap (mis. halaman detail project tidak punya tab/filter).

   CATATAN SINKRONISASI:
   localStorage seharusnya cukup untuk menyamakan tema & bahasa
   antar halaman. Tapi kalau file dibuka langsung dari komputer
   (file://, bukan lewat server/hosting), sebagian browser
   mengisolasi localStorage per file sehingga tidak ke-share.
   Sebagai jaring pengaman, state juga dititipkan lewat parameter
   URL (?theme=dark&lang=id) setiap kali link internal (mis. tombol
   "Lihat Detail" / "Back to Portfolio") diklik — jadi tetap sinkron
   di kondisi apa pun.
   ============================================================ */

let currentLang = 'en';
let subtitleTyped = false;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    initTheme();
    initLanguage();
    initInternalNavSync();
    initIntroScreen();
    initProjectFiltering();
    initProjectCounter();
});

function getUrlParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

/* ================= THEME TOGGLE ================= */
function initTheme() {
    // Kalau halaman ini dibuka dengan parameter ?theme= dari halaman lain,
    // terapkan & simpan supaya kunjungan berikutnya (tanpa parameter) tetap ingat.
    const urlTheme = getUrlParam('theme');
    if (urlTheme === 'dark' || urlTheme === 'light') {
        document.documentElement.setAttribute('data-theme', urlTheme);
        localStorage.setItem('theme', urlTheme);
    }

    const themeToggleBtn = document.getElementById('themeToggle');
    if (!themeToggleBtn) return;

    function reflectTheme() {
        const theme = document.documentElement.getAttribute('data-theme');
        const iconEl = themeToggleBtn.querySelector('[data-lucide]');
        if (iconEl) {
            // Tombol versi ikon (index.html): ikon mewakili tema yang
            // sedang AKTIF sekarang — matahari saat terang, bulan saat gelap.
            iconEl.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            // Tombol versi teks (halaman detail project)
            themeToggleBtn.textContent = theme === 'dark' ? 'Dark' : 'Light';
        }
    }
    reflectTheme();

    themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        reflectTheme();
    });
}

/* ================= LANGUAGE TOGGLE ================= */

// Urutan prioritas penentuan bahasa awal:
// 1. Parameter URL ?lang= (dibawa dari halaman sebelumnya)
// 2. localStorage (preferensi tersimpan)
// 3. Default: Inggris
function detectInitialLang() {
    const urlLang = getUrlParam('lang');
    if (urlLang === 'en' || urlLang === 'id') return urlLang;

    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'id') return stored;

    return 'en';
}

function applyLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-id][data-en]').forEach(el => {
        if (el.id === 'subtitleText' && !subtitleTyped) return;
        el.textContent = el.getAttribute('data-' + lang);
    });

    const langToggleBtn = document.getElementById('langToggle');
    if (langToggleBtn) {
        langToggleBtn.textContent = lang === 'en' ? 'EN' : 'ID';
    }
}

function initLanguage() {
    currentLang = detectInitialLang();
    localStorage.setItem('lang', currentLang);
    applyLanguage(currentLang);

    const langToggleBtn = document.getElementById('langToggle');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const next = currentLang === 'en' ? 'id' : 'en';
            localStorage.setItem('lang', next);
            applyLanguage(next);
        });
    }
}

/* ================= SINKRONISASI NAVIGASI INTERNAL ================= */
// Menitipkan tema & bahasa yang sedang aktif ke setiap link internal
// (bukan link eksternal/target="_blank", bukan mailto/anchor) tepat
// sebelum diklik, supaya halaman tujuan langsung tahu kondisi terkini
// tanpa bergantung sepenuhnya pada localStorage.
function initInternalNavSync() {
    document.querySelectorAll('a[href]').forEach(link => {
        if (link.target === '_blank') return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
            return;
        }

        link.addEventListener('click', () => {
            try {
                const url = new URL(href, window.location.href);
                const theme = document.documentElement.getAttribute('data-theme');
                if (theme) url.searchParams.set('theme', theme);
                url.searchParams.set('lang', currentLang);
                link.setAttribute('href', url.pathname + url.search);
            } catch (e) {
                // Kalau gagal (mis. href tidak valid sebagai URL), biarkan href asli
            }
        });
    });
}

/* ================= INTRO SCREEN + TYPING SUBTITLE ================= */
// Splash screen hanya dijalankan sekali per sesi browser. Kalau user
// kembali dari halaman detail project (index.html dimuat ulang), animasi
// dilewati — html sudah diberi class "no-intro" oleh script di <head>
// sebelum halaman sempat ter-render.
function initIntroScreen() {
    const introScreen = document.getElementById('intro-screen');
    if (!introScreen) return;

    if (document.documentElement.classList.contains('no-intro')) {
        subtitleTyped = true;
        const subtitleEl = document.getElementById('subtitleText');
        if (subtitleEl) {
            subtitleEl.textContent = subtitleEl.getAttribute('data-' + currentLang);
        }
        return;
    }

    sessionStorage.setItem('introShown', '1');
    window.addEventListener('load', () => {
        setTimeout(() => {
            introScreen.classList.add('hidden');
            setTimeout(typeSubtitle, 500);
        }, 1600);
    });
}

function typeSubtitle() {
    if (subtitleTyped) return;
    const el = document.getElementById('subtitleText');
    if (!el) return;

    subtitleTyped = true;
    const text = el.getAttribute('data-' + currentLang);
    el.textContent = '';
    let i = 0;
    (function step() {
        if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
            setTimeout(step, 45);
        }
    })();
}

/* ================= PROJECT COUNTER (dijalankan sekali saat halaman dimuat) ================= */
// Dulu counter dianimasikan saat tab "Projects" diklik. Karena sekarang
// Projects adalah satu-satunya section, animasi dijalankan langsung saat load.
function initProjectCounter() {
    const counterEl = document.getElementById('project-counter');
    if (!counterEl) return;
    const total = document.querySelectorAll('#projects .project-card').length;
    animateValue('project-counter', 0, total, 700);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
}

/* ================= PROJECT FILTERING ================= */
function initProjectFiltering() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active-filter'));
            btn.classList.add('active-filter');

            const filterValue = btn.getAttribute('data-filter');
            let visibleCount = 0;

            projectCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.classList.remove('hidden-project');
                    visibleCount++;
                } else {
                    card.classList.add('hidden-project');
                }
            });

            const counterEl = document.getElementById('project-counter');
            if (counterEl) {
                const currentVal = parseInt(counterEl.textContent) || 0;
                animateValue('project-counter', currentVal, visibleCount, 400);
            }
        });
    });
}

