// Main Script for Aluminum Company Website
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize UI Components
    await renderHeroSlides(); // This will fetch slides and then init swiper
    initMobileMenu();
    initScrollEffects();
    
    // Fetch and Render Products
    await renderProducts();
    
    // Fetch and Render Materials
    await renderMaterials();
    
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
                        ? `<div style="width:100%; height:100%; position:relative;">
                               <video src="${s.media_url}" autoplay muted loop playsinline class="slide-video-bg"></video>
                               <button onclick="toggleVideoMute(this, event)" style="position:absolute; bottom:20px; right:20px; z-index:30; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:40px; height:40px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.3s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'"><i class="fas fa-volume-mute"></i></button>
                           </div>` 

                        : `<div class="slide-image" style="background-image: url('${s.media_url}');" role="img" aria-label="${s.title}"></div>`}
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

    // Observe videos to play/pause automatically based on scroll
    const videos = wrapper.querySelectorAll('video');
    videos.forEach(video => {
        video.muted = true;
        videoObserver.observe(video);
    });
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
                                <div class="media-wrapper ${p.media_type === 'video' ? 'is-video' : ''}" style="background: #000; position:relative;">
                                    ${p.media_type === 'video' 
                                        ? `<video src="${p.media_url}" autoplay muted loop playsinline preload="auto" class="product-media" style="width:100%; height:100%; object-fit:cover; position: relative; z-index: 10; background: #000;"></video>
                                           <button onclick="toggleVideoMute(this, event)" style="position:absolute; bottom:15px; right:15px; z-index:30; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:35px; height:35px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.3s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'"><i class="fas fa-volume-mute"></i></button>` 
                                        : `<img src="${p.media_url}" alt="${p.title || config.CATEGORIES[p.category] || 'صورة منتج ألمنيوم'}" class="product-media" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">`}
                                </div>
                                <div class="product-info">
                                    <div class="desc-price-row" style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 0;">
                                        <p class="product-desc" style="margin: 0; flex: 1; font-size: 1.1rem; color: #fff; font-weight: 500; line-height: 1.4;">${p.description || 'جودة واتقان في العمل'}</p>
                                        <div class="price-container" style="margin: 0; gap: 10px;">
                                            ${(p.new_price !== undefined && p.new_price !== null && p.new_price !== '') 
                                                ? `<span class="price-old" style="font-size: 1rem;">${p.old_price}</span><span class="price-new" style="font-size: 1.5rem;">${p.new_price}</span>` 
                                                : `<span class="price-new" style="font-size: 1.5rem;">${p.old_price}</span>`}
                                        </div>
                                    </div>
                                    <a href="javascript:void(0)" onclick="openOrderModal('${p.media_url}', '${p.title}', '${p.new_price || p.old_price}')" class="btn-order">اطلب الآن</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                container.appendChild(section);
                
                // Add click listener to show/hide order button
                const grid = section.querySelector('.product-grid');
                if (grid) {
                    grid.addEventListener('click', (e) => {
                        const card = e.target.closest('.product-card');
                        if (card) {
                            // Prevent toggle if clicking the order button
                            if (e.target.closest('.btn-order')) return;
                            
                            if (card.classList.contains('active')) {
                                card.classList.remove('active');
                            } else {
                                document.querySelectorAll('.product-card').forEach(c => c.classList.remove('active'));
                                card.classList.add('active');
                            }
                        }
                    });
                }
            }
        });
        
        // Re-init reveal animations for newly added elements
        initRevealAnimations();

        // Observe videos to play/pause automatically based on scroll
        const videos = container.querySelectorAll('video');
        videos.forEach(video => {
            video.muted = true;
            videoObserver.observe(video);
        });

    } catch (error) {
        // console.error("Render Error:", error);
        container.innerHTML = '<div style="text-align:center; padding: 100px 0;">حدث خطأ أثناء تحميل البيانات.</div>';
    }
}

/**
 * Render Materials (الخامات) from Database
 */
async function renderMaterials() {
    const container = document.getElementById('product-container');
    if (!container) return;

    try {
        const materials = await fetchMaterials();
        
        if (materials.length === 0) {
            return; // لا نعرض القسم إذا لم تكن هناك خامات
        }

        const section = document.createElement('section');
        section.id = 'materials';
        section.className = 'category-container reveal';
        section.innerHTML = `
            <h2 class="section-title">خامات الألمنيوم</h2>
            <div class="materials-table-wrapper" style="overflow-x: auto; padding: 0 15px;">
                <table class="materials-table" style="width: 100%; border-collapse: separate; border-spacing: 0; background: var(--secondary); border-radius: 20px; overflow: hidden; border: 1px solid var(--glass-border); box-shadow: var(--shadow);">
                    <thead>
                        <tr style="background: var(--primary);">
                            <th style="padding: 20px; text-align: right; color: var(--accent); font-size: 1.2rem; border-bottom: 2px solid var(--accent); width: 80px;">الصورة</th>
                            <th style="padding: 20px; text-align: right; color: var(--accent); font-size: 1.2rem; border-bottom: 2px solid var(--accent);">اسم الخامة</th>
                            <th style="padding: 20px; text-align: right; color: var(--accent); font-size: 1.2rem; border-bottom: 2px solid var(--accent);">النوع</th>
                            <th style="padding: 20px; text-align: right; color: var(--accent); font-size: 1.2rem; border-bottom: 2px solid var(--accent);">السعر (للمتر)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${materials.map((m, index) => `
                            <tr style="background: ${index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.2)'}; transition: background 0.3s;" onmouseover="this.style.background='rgba(197, 160, 89, 0.1)'" onmouseout="this.style.background='${index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.2)'}'">
                                <td style="padding: 10px 20px; border-bottom: 1px solid var(--glass-border);">
                                    ${m.media_url ? `<img src="${m.media_url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);" alt="${m.name}">` : `<div style="width: 60px; height: 60px; background: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);"><i class="fas fa-image"></i></div>`}
                                </td>
                                <td style="padding: 15px 20px; font-weight: 700; border-bottom: 1px solid var(--glass-border);">${m.name}</td>
                                <td style="padding: 15px 20px; color: var(--text-muted); border-bottom: 1px solid var(--glass-border);">${m.type || '-'}</td>
                                <td style="padding: 15px 20px; border-bottom: 1px solid var(--glass-border);">
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        ${(m.new_price !== undefined && m.new_price !== null && m.new_price !== '') 
                                            ? `<span style="color: rgba(255,255,255,0.3); text-decoration: line-through; font-size: 1rem;">${m.old_price}</span>
                                               <span style="color: var(--accent); font-weight: 900; font-size: 1.3rem;">${m.new_price}</span>` 
                                            : `<span style="color: var(--accent); font-weight: 900; font-size: 1.3rem;">${m.old_price}</span>`}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(section);
        
        // Re-init reveal animations
        initRevealAnimations();
        
    } catch (error) {
        // Silent fail for materials if error
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
        url = `https://t.me/motasim771?text=${encodeURIComponent(message)}`;
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

// Toggle Video Mute Function
window.toggleVideoMute = function(btn, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const container = btn.parentElement;
    const video = container.querySelector('video');
    if (video) {
        video.muted = !video.muted;
        const icon = btn.querySelector('i');
        if (video.muted) {
            icon.classList.remove('fa-volume-up');
            icon.classList.add('fa-volume-mute');
        } else {
            icon.classList.remove('fa-volume-mute');
            icon.classList.add('fa-volume-up');
        }
    }
};
// Video Intersection Observer (Plays videos in viewport, pauses them when scrolled out)
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
            video.play().catch(err => console.log("Video play prevented:", err));
        } else {
            video.pause();
        }
    });
}, { threshold: 0.3 }); // Triggers when 30% of the video becomes visible/hidden
