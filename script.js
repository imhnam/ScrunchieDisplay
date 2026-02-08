tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#88CCAA", // Pastel Mint Green
                "primary-dark": "#558B6E", // Sage Green
                "primary-content": "#FFFFFF",
                "background-light": "#F5FBF7", // Very light green tint
                "background-dark": "#1C2621", // Dark green-grey
                "surface-light": "#FFFFFF",
                "surface-dark": "#243029",
                "accent-olive": "#A8C686", // Soft Olive
                "text-light": "#475569", // Slate 600
                "text-dark": "#E2E8F0", // Slate 200
            },
            fontFamily: {
                display: ["Dancing Script", "cursive"],
                body: ["Nunito", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.75rem",
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
};

// Collection Data (Fallback)
const STORAGE_URL = 'https://rpassssxkjzzwqhsyhlb.supabase.co/storage/v1/object/public/scrunchie-images/library/';

let collections = {
    blue: [
        STORAGE_URL + 'bl1.jpg',
        STORAGE_URL + 'bl2.jpg',
        STORAGE_URL + 'bl3.jpg',
        STORAGE_URL + 'bl4.jpg',
        STORAGE_URL + 'bl5.jpg'
    ],
    green: [
        STORAGE_URL + 'gr1.jpg',
        STORAGE_URL + 'gr2.jpg',
        STORAGE_URL + 'gr3.jpg'
    ],
    pink: [
        STORAGE_URL + 'pi1.jpg',
        STORAGE_URL + 'pi2.jpg',
        STORAGE_URL + 'pi3.jpg',
        STORAGE_URL + 'pi4.jpg',
        STORAGE_URL + 'pi5.jpg',
        STORAGE_URL + 'pi6.jpg',
        STORAGE_URL + 'pi7.jpg',
        STORAGE_URL + 'pi8.jpg'
    ],
    yellow: [
        STORAGE_URL + 'ye1.jpg',
        STORAGE_URL + 'ye2.jpg',
        STORAGE_URL + 'ye3.jpg',
        STORAGE_URL + 'ye4.jpg',
        STORAGE_URL + 'ye5.jpg',
        STORAGE_URL + 'ye6.jpg',
        STORAGE_URL + 'ye7.jpg',
        STORAGE_URL + 'ye8.jpg',
        STORAGE_URL + 'ye9.jpg'
    ]
};

// Gallery State
let swiperInstance = null;

// DOM Elements
let modal, backdrop, closeBtn;

// Open Gallery
function openGallery(collectionKey) {
    if (!collections[collectionKey] || collections[collectionKey].length === 0) return;

    if (swiperInstance) {
        swiperInstance.destroy(true, true);
        swiperInstance = null;
    }

    const swiperWrapper = document.querySelector('.swiper-wrapper');
    const images = collections[collectionKey];

    // Clear and Render Slides
    swiperWrapper.innerHTML = '';
    images.forEach(imgSrc => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide rounded-2xl overflow-hidden shadow-xl bg-slate-800 border-2 border-slate-700';
        slide.innerHTML = `<img src="${imgSrc}" class="w-full h-full object-cover pointer-events-none" /><div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"></div>`;
        swiperWrapper.appendChild(slide);
    });

    modal.classList.remove('hidden');
    void modal.offsetWidth; // Trigger reflow

    backdrop.classList.remove('opacity-0');
    backdrop.classList.add('opacity-100');

    document.body.style.overflow = 'hidden';

    // Initialize Swiper with smooth slide effect and autoplay
    swiperInstance = new Swiper(".mySwiper", {
        effect: "slide",
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        speed: 500,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        keyboard: {
            enabled: true,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            dynamicBullets: true,
        },
        navigation: {
            nextEl: ".swiper-button-next-custom",
            prevEl: ".swiper-button-prev-custom",
        },
    });
}

// Close Gallery
function closeGallery() {
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        if (swiperInstance) {
            swiperInstance.destroy(true, true);
            swiperInstance = null;
        }
    }, 300);
}

// ============================================
// Supabase Integration
// ============================================

async function fetchSiteSettings() {
    if (!typeof supabaseClient) return;

    const { data } = await supabaseClient
        .from('site_settings')
        .select('*');

    if (data) {
        const heroTitle = document.getElementById('hero-title');
        const heroDesc = document.getElementById('hero-desc');

        data.forEach(setting => {
            if (setting.key === 'hero_title' && heroTitle) heroTitle.innerHTML = setting.value; // innerHTML to allow tags
            if (setting.key === 'hero_description' && heroDesc) heroDesc.textContent = setting.value;
        });
    }
}

async function fetchCollections() {
    if (!typeof supabaseClient) return;

    const { data: dbCollections, error } = await supabaseClient
        .from('collections')
        .select(`
            *,
            collection_images (
                image_url,
                display_order
            )
        `)
        .order('display_order');

    if (error || !dbCollections || dbCollections.length === 0) {
        console.log('Using static collections');
        initButtons();
        return;
    }

    // Update Global Collections Object
    const newCollections = {};
    dbCollections.forEach(col => {
        // Sort images by display_order
        const images = (col.collection_images || [])
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map(img => img.image_url);

        newCollections[col.key] = images;
    });

    // Only overwrite if we got data
    if (Object.keys(newCollections).length > 0) {
        collections = newCollections;
        renderCollectionsGrid(dbCollections);
    } else {
        initButtons();
    }
}

function renderCollectionsGrid(dbCollections) {
    const grid = document.getElementById('collections-grid');
    if (!grid) return;

    grid.innerHTML = dbCollections.map((col, index) => `
        <div class="reveal delay-${(index + 1) * 100} relative group rounded-3xl overflow-hidden shadow-2xl h-[500px] active w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
            <img alt="${col.title}"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                src="${col.cover_image || collections[col.key]?.[0] || 'https://rpassssxkjzzwqhsyhlb.supabase.co/storage/v1/object/public/scrunchie-images/library/all1.jpg'}" />
            <div
                class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-6">
                <div class="transform transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    ${col.badge_text ? `
                    <span
                        class="bg-${col.badge_color || 'green-500'}/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block backdrop-blur-sm">
                        ${col.badge_text}
                    </span>` : ''}
                    <h4 class="text-2xl font-display text-white mb-1 drop-shadow-lg">${col.title}</h4>
                    <p class="text-${col.badge_color?.split('-')[0] || 'green'}-100 mb-4 line-clamp-2 text-sm opacity-90">
                        ${col.description || ''}
                    </p>
                    <button data-collection="${col.key}"
                        class="bg-white text-${col.badge_color?.split('-')[0] || 'green'}-600 font-bold px-4 py-2 rounded-full hover:bg-${col.badge_color?.split('-')[0] || 'green'}-400 hover:text-white transition-colors w-full flex items-center justify-center gap-2 group-hover:shadow-lg shadow-white/20 text-sm">
                        Xem ngay <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    initButtons();
}

function initButtons() {
    const buttons = document.querySelectorAll('[data-collection]');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const collectionKey = btn.getAttribute('data-collection');
            openGallery(collectionKey);
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM Elements
    modal = document.getElementById('gallery-modal');
    backdrop = document.getElementById('gallery-backdrop');
    closeBtn = document.getElementById('gallery-close');

    // Fetch Data
    if (typeof supabase !== 'undefined') {
        fetchSiteSettings();
        fetchCollections();
    } else {
        initButtons();
    }

    // Close Button
    if (closeBtn) closeBtn.addEventListener('click', closeGallery);

    // Backdrop Click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target === backdrop) {
                closeGallery();
            }
        });
    }

    // Keyboard Navigation (Escape only)
    document.addEventListener('keydown', (e) => {
        if (!modal || modal.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeGallery();
    });

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
});