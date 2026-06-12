

(function () {
    'use strict';

    // ========== تنظیمات مرکزی ==========
    const CONFIG = {
        themeKey: 'gamva-theme',
        favoritesKey: 'gamva-favorites',
        compareKey: 'gamva-compare',
        searchHistoryKey: 'gamva-search-history',
        scrollPositionKey: 'gamva-scroll-positions',
        visitedKey: 'gamva-visited',
        notificationsKey: 'gamva-notifications',
        debounceDelay: 300,
        notificationDuration: 3000,
        carouselInterval: 5000,
        touchThreshold: 50
    };

    // ابزار کمکی برای تشخیص موبایل
    const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 768;

    // ========== 1. سیستم نوتیفیکیشن (Toast) ==========
    function showToast(message, type = 'info', duration = CONFIG.notificationDuration) {
        const existingToast = document.querySelector('.gamva-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `gamva-toast toast-${type}`;
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        document.body.appendChild(toast);

        if (isMobile()) {
            toast.style.bottom = '80px';
            toast.style.left = '16px';
            toast.style.right = '16px';
            toast.style.transform = 'translateX(0)';
        }

        void toast.offsetWidth;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ========== 2. سیستم تم (Light/Dark Mode) ==========
    function initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const savedTheme = localStorage.getItem(CONFIG.themeKey) || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        const themeIcon = themeToggle.querySelector('i');
        if (themeIcon) {
            themeIcon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem(CONFIG.themeKey, newTheme);

            if (themeIcon) {
                themeIcon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
            }

            themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
            setTimeout(() => {
                if (themeToggle) themeToggle.style.transform = '';
            }, 300);

            showToast(`حالت ${newTheme === 'dark' ? 'شب' : 'روز'} فعال شد`, 'info', 1500);
        });
    }

    // ========== 3. دکمه Back to Top ==========
    function initBackToTop() {
        if (document.querySelector('.back-to-top')) return;

        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        btn.setAttribute('aria-label', 'بازگشت به بالا');
        document.body.appendChild(btn);

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollThreshold = isMobile() ? 300 : 500;
                    btn.classList.toggle('visible', window.scrollY > scrollThreshold);
                    ticking = false;
                });
                ticking = true;
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ========== 4. ذخیره موقعیت اسکرول ==========
    function initScrollMemory() {
        const currentPage = window.location.pathname;
        const savedPositions = JSON.parse(localStorage.getItem(CONFIG.scrollPositionKey) || '{}');

        if (savedPositions[currentPage] && !sessionStorage.getItem('scrolled-' + currentPage)) {
            setTimeout(() => {
                window.scrollTo({ top: savedPositions[currentPage], behavior: 'instant' });
                sessionStorage.setItem('scrolled-' + currentPage, 'true');
            }, 100);
        }

        window.addEventListener('beforeunload', () => {
            savedPositions[currentPage] = window.scrollY;
            localStorage.setItem(CONFIG.scrollPositionKey, JSON.stringify(savedPositions));
        });
    }

    // ========== 5. سیستم علاقه‌مندی‌ها ==========
    let favorites = JSON.parse(localStorage.getItem(CONFIG.favoritesKey) || '[]');

    function updateFavoritesBadge() {
        const heartContainer = document.querySelector('.action-icon .fa-heart')?.closest('.action-icon');
        const badge = heartContainer?.querySelector('.badge');
        if (badge) {
            badge.textContent = favorites.length;
            badge.style.display = favorites.length > 0 ? 'flex' : 'none';
        }
    }

    function toggleFavorite(id, name) {
        const index = favorites.indexOf(id);
        if (index === -1) {
            favorites.push(id);
            showToast(`${name} به علاقه‌مندی‌ها اضافه شد`, 'success');
        } else {
            favorites.splice(index, 1);
            showToast(`${name} از علاقه‌مندی‌ها حذف شد`, 'info');
        }
        localStorage.setItem(CONFIG.favoritesKey, JSON.stringify(favorites));
        updateFavoritesBadge();
        return index === -1;
    }

    function isFavorite(id) {
        return favorites.includes(id);
    }

    // ========== 6. سیستم مقایسه ==========
    let compareList = JSON.parse(localStorage.getItem(CONFIG.compareKey) || '[]');

    function updateCompareUI() {
        localStorage.setItem(CONFIG.compareKey, JSON.stringify(compareList));
    }

    function addToCompare(productId, productName) {
        if (compareList.includes(productId)) {
            showToast(`${productName} قبلاً به لیست مقایسه اضافه شده`, 'warning');
            return false;
        }
        if (compareList.length >= (isMobile() ? 2 : 4)) {
            showToast(`حداکثر ${isMobile() ? 2 : 4} محصول قابل مقایسه است`, 'error');
            return false;
        }
        compareList.push(productId);
        updateCompareUI();
        showToast(`${productName} به لیست مقایسه اضافه شد`, 'success');
        return true;
    }

    function removeFromCompare(productId, productName) {
        const index = compareList.indexOf(productId);
        if (index !== -1) {
            compareList.splice(index, 1);
            updateCompareUI();
            showToast(`${productName} از لیست مقایسه حذف شد`, 'info');
            return true;
        }
        return false;
    }

    // ========== 7. اشتراک‌گذاری ==========
    function initShareButton() {
        if (document.querySelector('.share-page-btn')) return;

        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-page-btn';
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
        shareBtn.setAttribute('aria-label', 'اشتراک‌گذاری صفحه');
        document.body.appendChild(shareBtn);

        shareBtn.addEventListener('click', async () => {
            try {
                if (navigator.share && isMobile()) {
                    await navigator.share({
                        title: 'GAMva',
                        text: 'اکوسیستم هوشمند سلامت با هوش مصنوعی',
                        url: window.location.href
                    });
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('لینک با موفقیت کپی شد!', 'success');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    showToast('خطا در اشتراک‌گذاری', 'error');
                }
            }
        });
    }

    // ========== 8. حالت مطالعه (Focus Mode) ==========
    function initFocusMode() {
        if (document.querySelector('.focus-mode-btn')) return;

        const focusBtn = document.createElement('button');
        focusBtn.className = 'focus-mode-btn';
        focusBtn.innerHTML = '<i class="fas fa-expand"></i>';
        focusBtn.setAttribute('aria-label', 'حالت مطالعه');
        document.body.appendChild(focusBtn);

        let isFocusMode = false;

        focusBtn.addEventListener('click', () => {
            isFocusMode = !isFocusMode;
            document.body.classList.toggle('focus-mode', isFocusMode);
            focusBtn.innerHTML = isFocusMode ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
            showToast(isFocusMode ? 'حالت مطالعه فعال شد' : 'حالت عادی', 'info', 1500);
        });
    }

    // ========== 9. تاریخچه جستجو ==========
    function saveSearchHistory(query) {
        if (!query?.trim()) return;

        let history = JSON.parse(localStorage.getItem(CONFIG.searchHistoryKey) || '[]');
        history = [query, ...history.filter(h => h !== query)].slice(0, isMobile() ? 5 : 10);
        localStorage.setItem(CONFIG.searchHistoryKey, JSON.stringify(history));
    }

    function getSearchHistory() {
        return JSON.parse(localStorage.getItem(CONFIG.searchHistoryKey) || '[]');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showSearchSuggestions(inputElement) {
        const history = getSearchHistory();
        if (history.length === 0) return;

        const existing = document.querySelector('.search-suggestions-dropdown');
        if (existing) existing.remove();

        const dropdown = document.createElement('div');
        dropdown.className = 'search-suggestions-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.innerHTML = `
            <div class="suggestions-header">
                <span><i class="fas fa-history"></i> جستجوهای اخیر</span>
                <button class="clear-history-btn" aria-label="پاک کردن تاریخچه"><i class="fas fa-trash-alt"></i> پاک کردن</button>
            </div>
            ${history.map(s => `<div class="suggestion-item" role="option"><i class="fas fa-search"></i> ${escapeHtml(s)}</div>`).join('')}
        `;

        const rect = inputElement.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${Math.min(rect.width, window.innerWidth - 40)}px`;
        document.body.appendChild(dropdown);

        dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                inputElement.value = item.textContent.trim();
                dropdown.remove();
                if (typeof window.performSearch === 'function') {
                    window.performSearch();
                }
            });
        });

        dropdown.querySelector('.clear-history-btn')?.addEventListener('click', () => {
            localStorage.removeItem(CONFIG.searchHistoryKey);
            dropdown.remove();
            showToast('تاریخچه جستجو پاک شد', 'success');
        });

        const closeHandler = (e) => {
            if (!dropdown.contains(e.target) && e.target !== inputElement) {
                dropdown.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 100);
    }

    // ========== 10. جستجوی پیشرفته ==========
    let searchTimeout;

    function setupSearch() {
        const searchInput = document.getElementById('searchInputCosmic');
        const searchBtn = document.getElementById('searchBtnCosmic');
        const resultsTable = document.getElementById('resultsTable');
        const tableRows = document.getElementById('tableRows');

        if (!searchInput) return;

        window.performSearch = function () {
            const query = searchInput.value.toLowerCase().trim();
            if (query) saveSearchHistory(query);

            if (resultsTable) {
                if (!query) {
                    resultsTable.classList.remove('active');
                    return;
                }

                resultsTable.classList.add('active');

                if (tableRows) {
                    tableRows.innerHTML = `
                        <div class="table-row">
                            <div class="row-number">#001</div>
                            <div class="row-info"><span class="row-name">نتیجه جستجو: ${escapeHtml(query)}</span></div>
                            <div><span class="row-category">${escapeHtml(query)}</span></div>
                            <div class="row-price">-</div>
                            <div class="row-rating"><i class="fas fa-star"></i> ★</div>
                            <div><button class="row-action" onclick="showToast('در حال توسعه...', 'info')">مشاهده</button></div>
                        </div>`;
                }
                showToast(`جستجو برای: ${query}`, 'info', 1500);
            }
        };

        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (typeof window.performSearch === 'function') {
                    window.performSearch();
                }
            }, CONFIG.debounceDelay);
        });

        searchInput.addEventListener('focus', () => showSearchSuggestions(searchInput));

        if (searchBtn) {
            searchBtn.addEventListener('click', window.performSearch);
        }

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && typeof window.performSearch === 'function') {
                window.performSearch();
            }
        });

        // جستجوی هدر (اضافه شده برای رفع مشکل)
        const headerSearchInput = document.querySelector('.header-search input');
        const headerSearchBtn = document.getElementById('searchBtn');
        if (headerSearchBtn && headerSearchInput) {
            const performHeaderSearch = () => {
                const query = headerSearchInput.value.trim();
                if (query) {
                    if (searchInput) searchInput.value = query;
                    if (typeof window.performSearch === 'function') window.performSearch();
                } else {
                    showToast('لطفاً عبارت جستجو را وارد کنید', 'warning');
                }
            };
            headerSearchBtn.addEventListener('click', performHeaderSearch);
            headerSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performHeaderSearch();
            });
        }
    }

    // ========== 11. جستجوی صوتی (رفع تداخل id) ==========
    function setupMicrophone() {
        const micBtns = document.querySelectorAll('.mic-btn');
        if (micBtns.length === 0) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            micBtns.forEach(btn => {
                btn.style.opacity = '0.5';
                btn.disabled = true;
                btn.title = 'مرورگر شما از تشخیص صدا پشتیبانی نمی‌کند';
            });
            return;
        }

        let activeRecognition = null;
        let activeBtn = null;

        micBtns.forEach(micBtn => {
            micBtn.addEventListener('click', async () => {
                if (activeRecognition && activeBtn === micBtn) {
                    activeRecognition.stop();
                    return;
                }

                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });

                    const recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.interimResults = false;
                    recognition.lang = 'fa-IR';

                    recognition.onstart = () => {
                        if (activeBtn) {
                            activeBtn.classList.remove('listening');
                        }
                        activeRecognition = recognition;
                        activeBtn = micBtn;
                        micBtn.classList.add('listening');
                        micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                        showToast('در حال گوش دادن...', 'info', 2000);
                    };

                    recognition.onresult = (event) => {
                        const transcript = event.results[0][0].transcript;
                        const searchInput = document.getElementById('searchInputCosmic');
                        if (searchInput) {
                            searchInput.value = transcript;
                            if (typeof window.performSearch === 'function') {
                                window.performSearch();
                            }
                        }
                        showToast(`شناسایی شد: ${transcript}`, 'success');
                    };

                    recognition.onerror = (event) => {
                        console.error('Speech recognition error:', event.error);
                        showToast('خطا در تشخیص صدا، دوباره تلاش کنید', 'error');
                    };

                    recognition.onend = () => {
                        if (activeBtn && activeRecognition === recognition) {
                            activeBtn.classList.remove('listening');
                            activeBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                            activeRecognition = null;
                            activeBtn = null;
                        }
                    };

                    recognition.start();

                    setTimeout(() => {
                        if (activeRecognition === recognition) {
                            recognition.stop();
                        }
                    }, 8000);

                } catch (err) {
                    console.error('Microphone error:', err);
                    showToast('دسترسی به میکروفون مجاز نیست', 'error');
                }
            });
        });
    }

    // ========== 12. کاروسل تصاویر Hero ==========
    function setupHeroCarousel() {
        const track = document.getElementById('heroImageTrack');
        const dotsContainer = document.getElementById('heroImageDots');
        if (!track || !dotsContainer) return;

        const slides = track.querySelectorAll('.hero-image-slide');
        if (slides.length === 0) return;

        track.style.width = `${slides.length * 100}%`;
        slides.forEach(slide => {
            slide.style.width = `${100 / slides.length}%`;
        });

        let currentIndex = 0;
        let autoplayInterval;
        let touchStartX = 0;

        dotsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('hero-image-dot');
            dot.setAttribute('aria-label', `اسلاید ${index + 1}`);
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
        const dots = dotsContainer.querySelectorAll('.hero-image-dot');

        function updateSlide() {
            const percent = (currentIndex * 100) / slides.length;
            track.style.transform = `translateX(-${percent}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }

        function goToSlide(index) {
            currentIndex = (index + slides.length) % slides.length;
            updateSlide();
            resetAutoplay();
        }

        function nextSlide() {
            goToSlide(currentIndex + 1);
        }

        function prevSlide() {
            goToSlide(currentIndex - 1);
        }

        function resetAutoplay() {
            if (autoplayInterval) clearInterval(autoplayInterval);
            autoplayInterval = setInterval(nextSlide, CONFIG.carouselInterval);
        }

        updateSlide();
        resetAutoplay();

        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            clearInterval(autoplayInterval);
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(diff) > CONFIG.touchThreshold) {
                diff > 0 ? prevSlide() : nextSlide();
            }
            resetAutoplay();
        }, { passive: true });

        const heroImage = document.querySelector('.hero-image');
        if (heroImage) {
            heroImage.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
            heroImage.addEventListener('mouseleave', resetAutoplay);
        }
    }

    // ========== 13. کاروسل مربیان ==========
    function setupCoachCarousel() {
        const track = document.getElementById('coachTrack');
        const prev = document.getElementById('coachPrev');
        const next = document.getElementById('coachNext');
        if (!track || !prev || !next) return;

        const container = track.parentElement;
        if (!container) return;

        container.style.overflowX = 'auto';
        container.style.scrollBehavior = 'smooth';

        const scrollAmount = isMobile() ? 280 : 340;
        let touchStart = 0;

        next.addEventListener('click', () => {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        prev.addEventListener('click', () => {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        container.addEventListener('touchstart', (e) => {
            touchStart = e.changedTouches[0].screenX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].screenX - touchStart;
            if (Math.abs(diff) > CONFIG.touchThreshold) {
                container.scrollBy({
                    left: diff > 0 ? -scrollAmount : scrollAmount,
                    behavior: 'smooth'
                });
            }
        }, { passive: true });
    }

    // ========== 14. پاپ‌آپ اکشن‌های هدر ==========
    let activePopup = null;

    function closePopup() {
        if (activePopup) {
            const popupToRemove = activePopup;
            activePopup = null;
            popupToRemove.classList.remove('active');
            setTimeout(() => {
                if (popupToRemove && popupToRemove.parentNode) {
                    popupToRemove.remove();
                }
            }, 300);
        }
    }

    function setupActionPopups() {
        const actionIcons = document.querySelectorAll('.action-icon');

        actionIcons.forEach(container => {
            const icon = container.querySelector('i');
            if (!icon) return;

            container.addEventListener('click', (e) => {
                e.stopPropagation();
                closePopup();

                let type = '';
                if (icon.classList.contains('fa-heart')) type = 'heart';
                else if (icon.classList.contains('fa-bell')) type = 'bell';
                else if (icon.classList.contains('fa-user')) type = 'user';
                else return;

                const popup = document.createElement('div');
                popup.className = 'action-popup';
                popup.setAttribute('role', 'dialog');

                if (type === 'heart') {
                    popup.innerHTML = `
                        <div class="popup-header">
                            <i class="fas fa-heart"></i>
                            <span>علاقه‌مندی‌ها (${favorites.length})</span>
                            <button class="mark-read" aria-label="پاک کردن همه">پاک کردن</button>
                        </div>
                        <div class="popup-content">
                            ${favorites.length === 0 ?
                            '<div class="empty-state"><i class="far fa-heart"></i><p>موردی وجود ندارد</p></div>' :
                            favorites.map(id => `
                                <div class="popup-item">
                                    <i class="fas fa-user-circle"></i>
                                    <span>مورد شماره ${escapeHtml(id)}</span>
                                    <button class="popup-remove remove-fav" data-id="${id}" aria-label="حذف"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            `).join('')}
                        </div>
                        <div class="popup-footer">
                            <a href="favorites.html">مشاهده همه <i class="fas fa-arrow-left"></i></a>
                        </div>
                    `;
                } else if (type === 'bell') {
                    const notifications = JSON.parse(localStorage.getItem(CONFIG.notificationsKey) || '[]');
                    const unreadCount = notifications.filter(n => !n.read).length;

                    popup.innerHTML = `
                        <div class="popup-header">
                            <i class="fas fa-bell"></i>
                            <span>اعلان‌ها (${unreadCount})</span>
                            <button class="mark-read" aria-label="علامت‌گذاری همه به عنوان خوانده شده">خوانده شد</button>
                        </div>
                        <div class="popup-content">
                            ${notifications.length === 0 ?
                            '<div class="empty-state"><i class="far fa-bell"></i><p>اعلانی وجود ندارد</p></div>' :
                            notifications.map(n => `
                                <div class="popup-item ${!n.read ? 'unread' : ''}">
                                    <div class="notification-icon ${n.type || 'success'}"><i class="fas ${n.icon || 'fa-check-circle'}"></i></div>
                                    <div class="popup-info">
                                        <div class="popup-title">${escapeHtml(n.title)}</div>
                                        <div class="popup-meta">${escapeHtml(n.message)}</div>
                                        <div class="popup-time">${n.time || 'جدید'}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="popup-footer">
                            <a href="notifications.html">مشاهده همه <i class="fas fa-arrow-left"></i></a>
                        </div>
                    `;
                } else {
                    popup.innerHTML = `
                        <div class="popup-header">
                            <i class="fas fa-user"></i>
                            <span>حساب کاربری</span>
                        </div>
                        <div class="popup-content">
                            <a href="dashboard-user.html" class="menu-link"><i class="fas fa-tachometer-alt"></i> داشبورد</a>
                            <a href="dashboard-coach.html" class="menu-link"><i class="fas fa-user-circle"></i> پروفایل من</a>
                            <a href="cart.html" class="menu-link"><i class="fas fa-shopping-cart"></i> سبد خرید</a>
                            <a href="order-tracking.html" class="menu-link"><i class="fas fa-truck"></i> پیگیری سفارش</a>
                        </div>
                    `;
                }

                document.body.appendChild(popup);

                const rect = container.getBoundingClientRect();
                popup.style.top = `${rect.bottom + 10}px`;
                popup.style.left = `${Math.max(10, rect.left - (isMobile() ? 0 : 0))}px`;

                if (isMobile()) {
                    popup.style.width = 'calc(100vw - 32px)';
                    popup.style.left = '16px';
                }

                void popup.offsetWidth;
                popup.classList.add('active');
                activePopup = popup;

                popup.querySelectorAll('.remove-fav').forEach(btn => {
                    btn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const id = btn.dataset.id;
                        favorites = favorites.filter(f => f != id);
                        localStorage.setItem(CONFIG.favoritesKey, JSON.stringify(favorites));
                        updateFavoritesBadge();
                        closePopup();
                        showToast('مورد حذف شد', 'info');
                    });
                });

                popup.querySelector('.mark-read')?.addEventListener('click', () => {
                    const badge = container.querySelector('.badge');
                    if (badge) {
                        badge.textContent = '0';
                        badge.style.display = 'none';
                    }
                    const allNotifs = JSON.parse(localStorage.getItem(CONFIG.notificationsKey) || '[]');
                    allNotifs.forEach(n => n.read = true);
                    localStorage.setItem(CONFIG.notificationsKey, JSON.stringify(allNotifs));
                    showToast('همه اعلان‌ها خوانده شد', 'success');
                    closePopup();
                });
            });
        });

        document.addEventListener('click', (e) => {
            if (activePopup && !activePopup.contains(e.target) && !e.target.closest('.action-icon')) {
                closePopup();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
        });
    }

    // ========== 15. تب‌های اصلی ==========
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = {
            coaches: document.getElementById('coaches-tab'),
            blog: document.getElementById('blog-tab'),
            shop: document.getElementById('shop-tab'),
            marketplace: document.getElementById('marketplace-tab')
        };

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;

                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                Object.values(tabPanes).forEach(pane => {
                    if (pane) pane.classList.remove('active');
                });

                if (tabPanes[tab]) tabPanes[tab].classList.add('active');
            });
        });
    }

    // ========== 16. تب محتوا ==========
    function setupContentTabs() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        const panels = {
            'all': document.getElementById('all-content'),
            'podcast': document.getElementById('podcast-content'),
            'video': document.getElementById('video-content'),
            'article': document.getElementById('article-content')
        };

        function showPanel(panelId) {
            Object.keys(panels).forEach(key => {
                const panel = panels[key];
                if (panel) {
                    if (key === panelId) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                }
            });
        }

        categoryTabs.forEach(tab => {
            tab.addEventListener('click', function () {
                const category = this.dataset.category;
                categoryTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                showPanel(category);
            });
        });

        showPanel('all');
    }

    // ========== 17. شمارنده معکوس ==========
    function setupCountdown() {
        const hours = document.getElementById('hours');
        const minutes = document.getElementById('minutes');
        const seconds = document.getElementById('seconds');
        if (!hours || !minutes || !seconds) return;

        let h = 2, m = 45, s = 30;
        let timerId = null;

        function updateCountdown() {
            s--;
            if (s < 0) {
                s = 59;
                m--;
                if (m < 0) {
                    m = 59;
                    h--;
                    if (h < 0) {
                        h = 23;
                    }
                }
            }
            hours.textContent = String(h).padStart(2, '0');
            minutes.textContent = String(m).padStart(2, '0');
            seconds.textContent = String(s).padStart(2, '0');
        }

        timerId = setInterval(updateCountdown, 1000);
        window.countdownTimerId = timerId;
    }

    // ========== 18. انیمیشن شمارنده‌ها ==========
    function setupCounters() {
        const counters = document.querySelectorAll('.counter');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    if (counter.dataset.animated === 'true') return;

                    counter.dataset.animated = 'true';
                    const target = parseFloat(counter.dataset.target);
                    if (isNaN(target)) return;

                    let current = 0;
                    const duration = isMobile() ? 1200 : 1500;
                    const stepTime = 20;
                    const steps = duration / stepTime;
                    const increment = target / steps;
                    const isFloat = target % 1 !== 0;

                    let step = 0;
                    const timer = setInterval(() => {
                        step++;
                        current += increment;
                        if (step >= steps) {
                            counter.innerText = isFloat ? target.toFixed(1) : Math.floor(target).toLocaleString('fa-IR');
                            clearInterval(timer);
                        } else {
                            counter.innerText = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString('fa-IR');
                        }
                    }, stepTime);

                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.3, rootMargin: '50px' });

        counters.forEach(c => observer.observe(c));
    }

    // ========== 19. منوی موبایل (رفع مشکل بیرون زدگی) ==========
    function setupMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMenu = document.getElementById('closeMenu');

        if (!hamburger || !mobileMenu || !closeMenu) return;

        function toggleMenu(show) {
            if (show) {
                mobileMenu.classList.add('active');
                document.body.style.overflow = 'hidden';
                // اطمینان از z-index بالا
                mobileMenu.style.zIndex = '2000';
            } else {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu(true);
        });
        closeMenu.addEventListener('click', () => toggleMenu(false));

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => toggleMenu(false));
        });

        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('active') &&
                !mobileMenu.contains(e.target) &&
                !hamburger.contains(e.target)) {
                toggleMenu(false);
            }
        });

        // جلوگیری از اسکرول هنگام باز بودن منو
        mobileMenu.addEventListener('touchmove', (e) => {
            if (mobileMenu.classList.contains('active')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // ========== 20. پیام خوش‌آمدگویی ==========
    function showWelcomeMessage() {
        const hasVisited = localStorage.getItem(CONFIG.visitedKey);
        if (!hasVisited) {
            setTimeout(() => {
                showToast('به GAMva خوش آمدید! 🎉 به اکوسیستم هوشمند سلامت خوش آمدید', 'success', 4000);
            }, 1500);
            localStorage.setItem(CONFIG.visitedKey, 'true');
        }
    }

    // ========== 21. انیمیشن Fade-up ==========
    function setupFadeAnimation() {
        const fadeElements = document.querySelectorAll('.fade-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) e.target.classList.add('visible');
            });
        }, { threshold: isMobile() ? 0.05 : 0.1, rootMargin: '50px' });

        fadeElements.forEach(el => observer.observe(el));
    }

    // ========== 22. مدیریت هوشمند موبایل (جایگزین optimizeForMobile) ==========
    function setupMobileFixes() {
        if (!isMobile()) return;

        // مخفی کردن کارت‌های شناور در موبایل (تداخل با محتوا)
        const floatingCards = document.querySelectorAll('.floating-card');
        floatingCards.forEach(card => {
            card.style.display = 'none';
        });

        // تنظیم viewport برای موبایل (بدون غیرفعال کردن زوم)
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover');
        }

        // بهبود دکمه‌های شناور در موبایل (جلوگیری از تداخل)
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .back-to-top { bottom: 80px; right: 16px; }
                .share-page-btn { bottom: 140px; left: 16px; }
                .focus-mode-btn { bottom: 200px; left: 16px; }
                .hero-image-dots { bottom: -20px; }
                .hero-image-dot { width: 44px; height: 44px; background: transparent; border: none; }
                .hero-image-dot.active { width: 44px; background: transparent; }
                .hero-image-dot::before { content: '•'; font-size: 24px; color: var(--primary); }
                .hero-image-dot.active::before { content: '●'; }
                .action-popup { max-height: 70vh; overflow-y: auto; }
            }
        `;
        document.head.appendChild(style);
    }

    // ========== 23. Fallback برای مرورگرهای قدیمی ==========
    function checkBrowserSupport() {
        const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)') ||
            CSS.supports('-webkit-backdrop-filter', 'blur(10px)');

        if (!supportsBackdropFilter) {
            const style = document.createElement('style');
            style.textContent = `
                .glass-header, .bg-glass, .mega-dropdown, .action-popup {
                    background: var(--bg-primary) !important;
                    backdrop-filter: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ========== 24. مقداردهی اولیه اعلان‌های نمونه ==========
    function initSampleNotifications() {
        const existing = localStorage.getItem(CONFIG.notificationsKey);
        if (!existing) {
            const sampleNotifs = [
                { id: 1, title: 'به GAMva خوش آمدید!', message: 'ثبت‌نام شما با موفقیت انجام شد.', type: 'success', icon: 'fa-check-circle', read: false, time: 'همین الان' },
                { id: 2, title: 'تخفیف ویژه', message: '۳۰٪ تخفیف برای اولین جلسه مربیگری', type: 'warning', icon: 'fa-tag', read: false, time: '۱ ساعت پیش' }
            ];
            localStorage.setItem(CONFIG.notificationsKey, JSON.stringify(sampleNotifs));
        }
    }

    // ========== اجرای اصلی ==========
    function init() {
        console.log('GAMva v6.0 loading... | Mobile:', isMobile());

        checkBrowserSupport();

        initTheme();
        initBackToTop();
        initScrollMemory();
        initShareButton();
        initFocusMode();
        initSampleNotifications();

        setupHeroCarousel();
        setupCoachCarousel();
        setupSearch();
        setupMicrophone();
        setupActionPopups();
        setupTabs();
        setupContentTabs();
        setupCountdown();
        setupCounters();
        setupMobileMenu();
        setupFadeAnimation();
        setupMobileFixes(); // جایگزین optimizeForMobile

        showWelcomeMessage();

        updateFavoritesBadge();

        // در دسترس قرار دادن توابع برای استفاده در HTML
        window.GAMva = {
            toggleFavorite,
            isFavorite,
            addToCompare,
            removeFromCompare,
            showToast,
            isMobile: isMobile(),
            performSearch: window.performSearch || null
        };

        window.toggleFavorite = toggleFavorite;
        window.addToCompare = addToCompare;
        window.removeFromCompare = removeFromCompare;
        window.showToast = showToast;
        window.isMobile = isMobile;

        console.log('GAMva v6.0 loaded successfully ✓');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
