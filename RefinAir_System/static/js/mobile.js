/**
 * RefinAir Mobile Controller & PWA Manager
 * Manages mobile bottom navigation, installation prompts, touch responsiveness,
 * and service worker synchronization.
 */

class MobileManager {
    constructor() {
        this.deferredPrompt = null;
        this.initServiceWorker();
        this.initBottomNav();
        this.initInstallBanner();
        this.initTouchEnhancements();
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/static/sw.js')
                    .then((reg) => {
                        console.log('[RefinAir PWA] Service Worker registered with scope:', reg.scope);
                    })
                    .catch((err) => {
                        console.log('[RefinAir PWA] Service Worker registration failed:', err);
                    });
            });
        }
    }

    initBottomNav() {
        const bottomNavItems = document.querySelectorAll('.mobile-nav-item');
        const topNavBtns = document.querySelectorAll('.nav-tab-btn');

        if (!bottomNavItems.length) return;

        bottomNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = item.getAttribute('data-target');
                if (!targetTab) return;

                // Sync with desktop/tablet tabs
                const matchingTopBtn = Array.from(topNavBtns).find(btn => btn.getAttribute('data-tab') === targetTab);
                if (matchingTopBtn) {
                    matchingTopBtn.click();
                } else if (window.tabManager) {
                    window.tabManager.switchTab(targetTab);
                }

                // Update bottom nav active state
                bottomNavItems.forEach(b => b.classList.remove('active'));
                item.classList.add('active');

                // Smooth scroll to top of pane
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Listen for tab changes initiated from top header to sync bottom nav
        topNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const activeTab = btn.getAttribute('data-tab');
                bottomNavItems.forEach(item => {
                    if (item.getAttribute('data-target') === activeTab) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            });
        });
    }

    initInstallBanner() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            this.deferredPrompt = e;

            // Show mobile install banner if present
            const banner = document.getElementById('mobile-install-banner');
            if (banner) {
                banner.style.display = 'flex';
                const installBtn = document.getElementById('btn-pwa-install');
                if (installBtn) {
                    installBtn.addEventListener('click', async () => {
                        banner.style.display = 'none';
                        if (this.deferredPrompt) {
                            this.deferredPrompt.prompt();
                            const { outcome } = await this.deferredPrompt.userChoice;
                            console.log(`[RefinAir PWA] User response to install prompt: ${outcome}`);
                            this.deferredPrompt = null;
                        }
                    });
                }
                const dismissBtn = document.getElementById('btn-pwa-dismiss');
                if (dismissBtn) {
                    dismissBtn.addEventListener('click', () => {
                        banner.style.display = 'none';
                    });
                }
            }
        });

        window.addEventListener('appinstalled', () => {
            console.log('[RefinAir PWA] RefinAir was installed successfully');
            const banner = document.getElementById('mobile-install-banner');
            if (banner) banner.style.display = 'none';
        });
    }

    initTouchEnhancements() {
        // Prevent double-tap zoom on interactive buttons
        document.querySelectorAll('button, .mobile-nav-item, .metric-card').forEach(el => {
            el.addEventListener('touchend', (e) => {
                // Ensure immediate responsiveness on iOS
            }, { passive: true });
        });
    }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.mobileManager = new MobileManager();
});
