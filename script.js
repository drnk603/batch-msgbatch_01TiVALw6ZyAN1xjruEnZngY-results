(function() {
    'use strict';

    // Global application namespace
    window.__app = window.__app || {};

    // Utility functions
    var utils = {
        debounce: function(func, wait) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },
        throttle: function(func, limit) {
            var inThrottle;
            return function() {
                var args = arguments, context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(function() {
                        inThrottle = false;
                    }, limit);
                }
            };
        }
    };

    // Module 1: AOS initialization
    function initAOS() {
        if (__app.aosInitialized) return;
        __app.aosInitialized = true;

        if (typeof window.AOS !== 'undefined') {
            try {
                AOS.init({
                    once: false,
                    duration: 600,
                    easing: 'ease-out',
                    offset: 120,
                    mirror: false,
                    disable: function() {
                        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    }
                });

                var layoutElements = document.querySelectorAll('[data-aos][data-avoid-layout="true"]');
                for (var i = 0; i < layoutElements.length; i++) {
                    layoutElements[i].removeAttribute('data-aos');
                }
            } catch (e) {}
        }

        __app.refreshAOS = function() {
            try {
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
            } catch (e) {}
        };
    }

    // Module 2: Custom burger menu
    function initBurgerMenu() {
        if (__app.burgerInitialized) return;
        __app.burgerInitialized = true;

        var toggle = document.querySelector('.c-nav__toggle');
        var nav = document.querySelector('.c-nav#main-nav');
        var navList = document.querySelector('.c-nav__list');
        var body = document.body;

        if (!toggle || !nav) return;

        function openMenu() {
            nav.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
            body.classList.add('u-no-scroll');
            trapFocus();
        }

        function closeMenu() {
            nav.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            body.classList.remove('u-no-scroll');
            releaseFocus();
        }

        function toggleMenu() {
            if (nav.classList.contains('is-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        var focusableElements = [];
        var firstFocusable, lastFocusable;

        function trapFocus() {
            if (!navList) return;
            var selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
            focusableElements = navList.querySelectorAll(selector);
            if (focusableElements.length > 0) {
                firstFocusable = focusableElements[0];
                lastFocusable = focusableElements[focusableElements.length - 1];
                navList.addEventListener('keydown', handleFocusTrap);
            }
        }

        function releaseFocus() {
            if (navList) {
                navList.removeEventListener('keydown', handleFocusTrap);
            }
        }

        function handleFocusTrap(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        }

        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleMenu();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                closeMenu();
            }
        });

        document.addEventListener('click', function(e) {
            if (nav.classList.contains('is-open') && !nav.contains(e.target) && e.target !== toggle) {
                closeMenu();
            }
        });

        var navLinks = document.querySelectorAll('.c-nav__link');
        for (var i = 0; i < navLinks.length; i++) {
            navLinks[i].addEventListener('click', function() {
                if (window.innerWidth < 1024) {
                    closeMenu();
                }
            });
        }

        var handleResize = utils.debounce(function() {
            if (window.innerWidth >= 1024 && nav.classList.contains('is-open')) {
                closeMenu();
            }
        }, 250);

        window.addEventListener('resize', handleResize, { passive: true });
    }

    // Module 3: Anchors and smooth scroll
    function initAnchors() {
        if (__app.anchorsInitialized) return;
        __app.anchorsInitialized = true;

        var isHomePage = location.pathname === '/' || location.pathname === '/index.html' || location.pathname.endsWith('/index.html');

        if (!isHomePage) {
            var sectionLinks = document.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#!"])');
            for (var i = 0; i < sectionLinks.length; i++) {
                var link = sectionLinks[i];
                var hash = link.getAttribute('href');
                if (hash && hash.length > 1) {
                    link.setAttribute('href', '/' + hash);
                }
            }
        }

        document.addEventListener('click', function(e) {
            var target = e.target.closest('a[href^="#"]:not([href="#"]):not([href="#!"])');
            if (!target) return;

            var hash = target.getAttribute('href');
            if (!hash || hash.length <= 1) return;

            var element = document.querySelector(hash);
            if (!element) return;

            e.preventDefault();

            var header = document.querySelector('.l-header');
            var headerHeight = header ? header.offsetHeight : 80;
            var targetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            if ('scrollBehavior' in document.documentElement.style) {
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            } else {
                window.scrollTo(0, targetPosition);
            }

            if (history.pushState) {
                history.pushState(null, null, hash);
            }
        });
    }

    // Module 4: Active menu state
    function setActiveMenuState() {
        if (__app.menuStateInitialized) return;
        __app.menuStateInitialized = true;

        var navLinks = document.querySelectorAll('.c-nav__link');
        var currentPath = location.pathname;

        for (var i = 0; i < navLinks.length; i++) {
            var link = navLinks[i];
            var href = link.getAttribute('href');
            
            link.removeAttribute('aria-current');
            link.classList.remove('active');

            if (href === currentPath || 
                (href === '/' && (currentPath === '/index.html' || currentPath === '')) ||
                (href === '/index.html' && currentPath === '/')) {
                link.setAttribute('aria-current', 'page');
                link.classList.add('active');
            }
        }
    }

    // Module 5: Images handling
    function initImages() {
        if (__app.imagesInitialized) return;
        __app.imagesInitialized = true;

        var images = document.querySelectorAll('img');
        var placeholderSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="20"%3EImage%3C/text%3E%3C/svg%3E';

        for (var i = 0; i < images.length; i++) {
            var img = images[i];

            if (!img.classList.contains('img-fluid')) {
                img.classList.add('img-fluid');
            }

            var isLogo = img.classList.contains('c-logo__img');
            var isCritical = img.hasAttribute('data-critical');

            if (!img.hasAttribute('loading') && !isLogo && !isCritical) {
                img.setAttribute('loading', 'lazy');
            }

            img.addEventListener('error', function() {
                this.src = placeholderSVG;
                this.style.objectFit = 'contain';
                
                if (this.classList.contains('c-logo__img')) {
                    this.style.maxHeight = '40px';
                }
            });
        }
    }

    // Module 6: Forms
    function initForms() {
        if (__app.formsInitialized) return;
        __app.formsInitialized = true;

        var toastContainer = document.createElement('div');
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        toastContainer.style.maxWidth = '350px';
        document.body.appendChild(toastContainer);

        __app.notify = function(message, type) {
            type = type || 'info';
            var alertClass = 'alert-' + type;
            
            var alert = document.createElement('div');
            alert.className = 'alert ' + alertClass + ' alert-dismissible fade show';
            alert.setAttribute('role', 'alert');
            alert.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
            
            toastContainer.appendChild(alert);

            setTimeout(function() {
                alert.classList.remove('show');
                setTimeout(function() {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 150);
            }, 5000);
        };

        var forms = document.querySelectorAll('.needs-validation');
        
        for (var i = 0; i < forms.length; i++) {
            forms[i].addEventListener('submit', function(event) {
                event.preventDefault();
                event.stopPropagation();

                var form = this;
                
                if (!form.checkValidity()) {
                    form.classList.add('was-validated');
                    return;
                }

                form.classList.add('was-validated');

                var submitBtn = form.querySelector('[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    var originalText = submitBtn.textContent;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';
                }

                var formData = new FormData(form);
                var data = {};
                formData.forEach(function(value, key) {
                    data[key] = value;
                });

                fetch('process.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                .then(function(response) {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(function(result) {
                    __app.notify(result.message || 'Form submitted successfully!', 'success');
                    form.reset();
                    form.classList.remove('was-validated');
                })
                .catch(function(error) {
                    __app.notify('An error occurred. Please try again.', 'danger');
                })
                .finally(function() {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                });
            });
        }
    }

    // Module 7: Anime.js micro-interactions
    function initAnimeInteractions() {
        if (__app.animeInitialized || typeof window.anime === 'undefined') return;
        __app.animeInitialized = true;

        var selectors = ['.card', '.feature-card', '.animal-card', '.btn-primary', '.btn-success'];
        var elements = document.querySelectorAll(selectors.join(','));

        for (var i = 0; i < elements.length; i++) {
            (function(el) {
                var animation;

                el.addEventListener('mouseenter', function() {
                    if (animation) animation.pause();
                    animation = anime({
                        targets: el,
                        scale: 1.05,
                        translateY: -5,
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                });

                el.addEventListener('mouseleave', function() {
                    if (animation) animation.pause();
                    animation = anime({
                        targets: el,
                        scale: 1,
                        translateY: 0,
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                });
            })(elements[i]);
        }
    }

    // Module 8: Mobile flex gaps
    function handleMobileFlexGaps() {
        if (__app.flexGapsInitialized) return;
        __app.flexGapsInitialized = true;

        function updateFlexGaps() {
            var isMobile = window.innerWidth < 576;
            var flexContainers = document.querySelectorAll('.d-flex');

            for (var i = 0; i < flexContainers.length; i++) {
                var container = flexContainers[i];
                var hasGapClass = false;
                
                for (var j = 0; j <= 5; j++) {
                    if (container.classList.contains('gap-' + j) || container.classList.contains('g-' + j)) {
                        hasGapClass = true;
                        break;
                    }
                }

                if (!hasGapClass && container.children.length > 1) {
                    if (isMobile) {
                        container.classList.add('gap-3');
                        container.setAttribute('data-mobile-gap', 'true');
                    } else if (container.getAttribute('data-mobile-gap') === 'true') {
                        container.classList.remove('gap-3');
                        container.removeAttribute('data-mobile-gap');
                    }
                }
            }
        }

        updateFlexGaps();
        window.addEventListener('resize', utils.debounce(updateFlexGaps, 250), { passive: true });
    }

    // Module 9: Performance optimizations
    function initPerformanceOptimizations() {
        if (__app.perfInitialized) return;
        __app.perfInitialized = true;

        var scrollHandler = utils.throttle(function() {
            // Custom scroll logic if needed
        }, 100);

        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });
    }

    // Main initialization
    __app.init = function() {
        initAOS();
        initBurgerMenu();
        initAnchors();
        setActiveMenuState();
        initImages();
        initForms();
        initAnimeInteractions();
        handleMobileFlexGaps();
        initPerformanceOptimizations();
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', __app.init);
    } else {
        __app.init();
    }

})();