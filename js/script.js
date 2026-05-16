// Main Script for Aluminum Company Website
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize UI Components
    await renderHeroSlides(); // This will fetch slides and then init swiper
    initMobileMenu();
    initScrollEffects();
    
    // Fetch and Render Products
    await renderProducts();
    
    // Add Reveal Animations on Scroll
    initRevealAnimations();
});

// تم نقل التصنيفات إلى config.js لتكون مشتركة بين المستخدم والإدارة

/**
 * Initialize Hero Swiper
 */
function initHeroSwiper() {
    new Swiper(".hero-cards-swiper", {
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: "auto",
        loop: true,
        coverflowEffect: {
            rotate: 20,
            stretch: 0,
            depth: 200,
            modifier: 1,
            slideShadows: false,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        slideToClickedSlide: true,
    });
}

/**
 * Render Hero Slides dynamically
 */
async function renderHeroSlides() {
    const wrapper = document.getElementById('hero-slides-wrapper');
    if (!wrapper) return;

    const slides = await fetchSlides();
    if (slides.length === 0) {
        wrapper.innerHTML = `
            <div class="swiper-slide">
                <div class="slide-card">
                    <div class="slide-image" style="background-image: url('https://images.unsplash.com/photo-1556911220-e1502402c019?auto=format&fit=crop&q=80&w=1920');"></div>
                    <div class="slide-overlay"><h2>نخبة الألمنيوم</h2></div>
                </div>
            </div>
        `;
    } else {
        wrapper.innerHTML = slides.map(s => `
            <div class="swiper-slide">
                <div class="slide-card">
                    ${s.media_type === 'video' 
                        ? `<video src="${s.media_url}" autoplay muted loop playsinline class="slide-video-bg"></video>` 
                        : `<div class="slide-image" style="background-image: url('${s.media_url}');"></div>`}
                    <div class="slide-overlay">
                        <h2>${s.title}</h2>
                        ${s.category_link ? `
                            <a href="#${s.category_link}" class="slide-btn">
                                عرض ${config.CATEGORIES[s.category_link] || 'القسم'} <i class="fas fa-chevron-left"></i>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Initialize swiper AFTER slides are added to DOM
    initHeroSwiper();
}

/**
 * Mobile Menu Logic
 */
function initMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
}

/**
 * Navigation Scroll Effects
 */
function initScrollEffects() {
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

/**
 * Update Nav Links dynamically
 */
function updateNavigation(activeCategories) {
    const navUl = document.querySelector('.nav-links');
    if (!navUl) return;

    // Preserve first link (الرئيسية) and last link (الإدارة)
    const homeLink = `<li><a href="#" class="active">الرئيسية</a></li>`;
    const adminLink = `<li><a href="admin.html" class="admin-link"><i class="fas fa-lock"></i> الإدارة</a></li>`;
    
    const dynamicLinks = activeCategories.map(cat => {
        return `<li><a href="#${cat}">${config.CATEGORIES[cat] || cat}</a></li>`;
    }).join('');

    navUl.innerHTML = homeLink + dynamicLinks + adminLink;

    // Re-initialize mobile menu click listeners for new links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            const menuToggle = document.getElementById('mobile-menu');
            const navLinks = document.querySelector('.nav-links');
            if (menuToggle) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });
}

/**
 * Render Products from Database
 */
async function renderProducts() {
    const container = document.getElementById('product-container');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-container" style="text-align:center; padding: 100px 0;">
            <div class="spinner" style="width: 50px; height: 50px; border: 5px solid var(--glass); border-top: 5px solid var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p style="color: var(--accent); font-weight: 700;">جاري تحميل الإبداع...</p>
        </div>
    `;

    try {
        const products = await fetchProducts();
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 100px 0;">لا يوجد منتجات حالياً.</div>';
            return;
        }

        // Get unique categories from products that are in our titles list
        const activeCategories = [...new Set(products.map(p => p.category))].filter(cat => config.CATEGORIES[cat]);
        
        // Sort categories to maintain a consistent order if desired
        const order = ['kitchen', 'interface', 'window', 'door', 'library', 'work'];
        activeCategories.sort((a, b) => order.indexOf(a) - order.indexOf(b));

        // Update Nav Links
        updateNavigation(activeCategories);

        activeCategories.forEach(cat => {
            const catProducts = products.filter(p => p.category === cat);
            if (catProducts.length > 0) {
                const section = document.createElement('section');
                section.id = cat;
                section.className = 'category-container reveal';
                section.innerHTML = `
                    <h2 class="section-title">${config.CATEGORIES[cat]}</h2>
                    <div class="product-grid">
                        ${catProducts.map(p => `
                            <div class="product-card reveal-item">
                                <div class="media-wrapper">
                                    ${p.media_type === 'video' 
                                        ? `<video src="${p.media_url}" controls class="product-media"></video>` 
                                        : `<img src="${p.media_url}" alt="${p.title}" class="product-media" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">`}
                                </div>
                                <div class="product-info">
                                    <h3 class="product-title">${p.title}</h3>
                                    <p class="product-desc">${p.description || 'جودة واتقان في العمل وتصاميم عصرية تناسب احتياجاتكم'}</p>
                                    <div class="price-container">
                                        ${(p.new_price !== undefined && p.new_price !== null && p.new_price !== '') 
                                            ? `<span class="price-old">${p.old_price}</span><span class="price-new">${p.new_price}</span>` 
                                            : `<span class="price-new">${p.old_price}</span>`}
                                    </div>
                                    <a href="javascript:void(0)" onclick="openOrderModal('${p.media_url}', '${p.title}', '${p.new_price || p.old_price}')" class="btn-order">اطلب الآن</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                container.appendChild(section);
                
                // Add click listener for mobile to show order button
                const grid = section.querySelector('.product-grid');
                if (grid) {
                    grid.addEventListener('click', (e) => {
                        const card = e.target.closest('.product-card');
                        if (card && window.innerWidth <= 768) {
                            document.querySelectorAll('.product-card').forEach(c => c.classList.remove('active'));
                            card.classList.add('active');
                        }
                    });
                }
            }
        });
        
        // Re-init reveal animations for newly added elements
        initRevealAnimations();

    } catch (error) {
        // console.error("Render Error:", error);
        container.innerHTML = '<div style="text-align:center; padding: 100px 0;">حدث خطأ أثناء تحميل البيانات.</div>';
    }
}

let currentOrder = {};

function openOrderModal(image, title, price) {
    currentOrder = { image, title, price };
    document.getElementById('orderModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function sendOrder(platform) {
    const phoneNumber = "+967777729569";
    const message = `مرحباً، أرغب في طلب المنتج التالي:\n\nالمنتج: ${currentOrder.title}\nالسعر: ${currentOrder.price}\nالرابط: ${currentOrder.image}`;

    let url = '';
    if (platform === 'whatsapp') {
        url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    } else if (platform === 'telegram') {
        url = `https://t.me/Dherar_774?text=${encodeURIComponent(message)}`;
    }

    window.open(url, '_blank');
    closeModal();
}

/**
 * Simple Reveal Animations on Scroll
 */
function initRevealAnimations() {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Global Spin Animation for loader
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
    .reveal.revealed { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(style);

