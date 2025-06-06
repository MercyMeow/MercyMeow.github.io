// Tab Container Component - Manages tabbed interface for different data views
export class TabContainer {
    constructor(container, tabs = [], options = {}) {
        this.container = container;
        this.tabs = tabs;
        this.options = {
            defaultTab: 0,
            animated: true,
            responsive: true,
            ...options
        };
        this.activeTabIndex = this.options.defaultTab;
        this.tabComponents = new Map();
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="tab-container">
                <nav class="tab-nav" role="tablist">
                    ${this.renderTabButtons()}
                </nav>
                <div class="tab-content-container">
                    ${this.renderTabPanes()}
                </div>
            </div>
        `;
        
        // Show the default tab
        this.showTab(this.activeTabIndex);
    }

    renderTabButtons() {
        return this.tabs.map((tab, index) => `
            <button 
                class="tab-button ${index === this.activeTabIndex ? 'active' : ''}"
                data-tab-index="${index}"
                role="tab"
                aria-selected="${index === this.activeTabIndex}"
                aria-controls="tab-pane-${index}"
                id="tab-button-${index}"
            >
                ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
                <span class="tab-label">${tab.label}</span>
                ${tab.badge ? `<span class="tab-badge">${tab.badge}</span>` : ''}
            </button>
        `).join('');
    }

    renderTabPanes() {
        return this.tabs.map((tab, index) => `
            <div 
                class="tab-pane ${index === this.activeTabIndex ? 'active' : ''}"
                id="tab-pane-${index}"
                role="tabpanel"
                aria-labelledby="tab-button-${index}"
                data-tab-index="${index}"
            >
                <div class="tab-pane-content">
                    ${tab.loading ? this.renderLoadingState() : ''}
                </div>
            </div>
        `).join('');
    }

    renderLoadingState() {
        return `
            <div class="tab-loading">
                <div class="tab-loading-spinner"></div>
                <p>Loading content...</p>
            </div>
        `;
    }

    setupEventListeners() {
        const tabButtons = this.container.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabIndex = parseInt(e.currentTarget.getAttribute('data-tab-index'));
                this.showTab(tabIndex);
            });

            // Keyboard navigation
            button.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const currentIndex = parseInt(e.currentTarget.getAttribute('data-tab-index'));
                    let newIndex;
                    
                    if (e.key === 'ArrowLeft') {
                        newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
                    } else {
                        newIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
                    }
                    
                    this.showTab(newIndex);
                    this.container.querySelector(`[data-tab-index="${newIndex}"]`).focus();
                }
            });
        });

        // Touch/swipe support for mobile
        if (this.options.responsive) {
            this.setupTouchNavigation();
        }
    }

    setupTouchNavigation() {
        const contentContainer = this.container.querySelector('.tab-content-container');
        let startX = 0;
        let startY = 0;
        let isScrolling = false;

        contentContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isScrolling = false;
        });

        contentContainer.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const diffX = Math.abs(e.touches[0].clientX - startX);
            const diffY = Math.abs(e.touches[0].clientY - startY);

            if (diffY > diffX) {
                isScrolling = true;
            }
        });

        contentContainer.addEventListener('touchend', (e) => {
            if (!startX || isScrolling) return;

            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 50) { // Minimum swipe distance
                if (diffX > 0 && this.activeTabIndex < this.tabs.length - 1) {
                    // Swipe left - next tab
                    this.showTab(this.activeTabIndex + 1);
                } else if (diffX < 0 && this.activeTabIndex > 0) {
                    // Swipe right - previous tab
                    this.showTab(this.activeTabIndex - 1);
                }
            }

            startX = 0;
            startY = 0;
        });
    }

    showTab(index) {
        if (index < 0 || index >= this.tabs.length || index === this.activeTabIndex) {
            return;
        }

        const previousIndex = this.activeTabIndex;
        this.activeTabIndex = index;

        // Update button states
        const buttons = this.container.querySelectorAll('.tab-button');
        buttons.forEach((button, i) => {
            button.classList.toggle('active', i === index);
            button.setAttribute('aria-selected', i === index);
        });

        // Update pane states
        const panes = this.container.querySelectorAll('.tab-pane');
        panes.forEach((pane, i) => {
            if (this.options.animated) {
                if (i === index) {
                    pane.classList.add('active');
                } else if (i === previousIndex) {
                    // Add fade out animation
                    pane.classList.add('fade-out');
                    setTimeout(() => {
                        pane.classList.remove('active', 'fade-out');
                    }, 300);
                } else {
                    pane.classList.remove('active');
                }
            } else {
                pane.classList.toggle('active', i === index);
            }
        });

        // Load tab content if needed
        this.loadTabContent(index);

        // Trigger custom event
        this.container.dispatchEvent(new CustomEvent('tabchange', {
            detail: { 
                activeIndex: index, 
                previousIndex: previousIndex,
                tab: this.tabs[index] 
            }
        }));
    }

    async loadTabContent(index) {
        const tab = this.tabs[index];
        const pane = this.container.querySelector(`#tab-pane-${index}`);
        const content = pane.querySelector('.tab-pane-content');

        if (tab.loaded || !tab.loadContent) {
            return;
        }

        // Show loading state
        content.innerHTML = this.renderLoadingState();

        try {
            // Load content
            const tabContent = await tab.loadContent();
            
            // Update content
            content.innerHTML = '';
            if (typeof tabContent === 'string') {
                content.innerHTML = tabContent;
            } else if (tabContent instanceof HTMLElement) {
                content.appendChild(tabContent);
            } else if (tab.component) {
                // Initialize component
                const componentInstance = new tab.component(content, tabContent);
                this.tabComponents.set(index, componentInstance);
            }

            tab.loaded = true;
        } catch (error) {
            console.error(`Error loading tab content for ${tab.label}:`, error);
            content.innerHTML = `
                <div class="tab-error">
                    <p>Failed to load ${tab.label.toLowerCase()} data</p>
                    <button class="retry-button" onclick="this.parentElement.parentElement.parentElement.dispatchEvent(new CustomEvent('retry-tab', {detail: {index: ${index}}}))">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Public methods
    addTab(tab, index = null) {
        if (index === null) {
            this.tabs.push(tab);
        } else {
            this.tabs.splice(index, 0, tab);
        }
        this.render();
    }

    removeTab(index) {
        if (index >= 0 && index < this.tabs.length) {
            this.tabs.splice(index, 1);
            if (this.activeTabIndex >= index && this.activeTabIndex > 0) {
                this.activeTabIndex--;
            }
            this.render();
        }
    }

    updateTab(index, updates) {
        if (index >= 0 && index < this.tabs.length) {
            Object.assign(this.tabs[index], updates);
            this.render();
        }
    }

    getActiveTab() {
        return this.tabs[this.activeTabIndex];
    }

    getActiveTabIndex() {
        return this.activeTabIndex;
    }

    getTabComponent(index) {
        return this.tabComponents.get(index);
    }

    // Refresh current tab content
    refreshActiveTab() {
        const activeTab = this.tabs[this.activeTabIndex];
        if (activeTab) {
            activeTab.loaded = false;
            this.loadTabContent(this.activeTabIndex);
        }
    }

    // Update tab badge
    updateTabBadge(index, badge) {
        if (index >= 0 && index < this.tabs.length) {
            this.tabs[index].badge = badge;
            const button = this.container.querySelector(`[data-tab-index="${index}"]`);
            if (button) {
                const existingBadge = button.querySelector('.tab-badge');
                if (existingBadge) {
                    existingBadge.textContent = badge;
                } else if (badge) {
                    button.insertAdjacentHTML('beforeend', `<span class="tab-badge">${badge}</span>`);
                }
            }
        }
    }

    // Destroy the tab container
    destroy() {
        this.tabComponents.forEach(component => {
            if (component.destroy) {
                component.destroy();
            }
        });
        this.tabComponents.clear();
    }
}
