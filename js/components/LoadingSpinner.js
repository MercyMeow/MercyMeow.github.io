// Loading Spinner Component - Displays loading states with customizable messages
export class LoadingSpinner {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            message: 'Loading...',
            size: 'medium', // small, medium, large
            type: 'spinner', // spinner, dots, pulse, bars
            overlay: false,
            ...options
        };
        this.isVisible = false;
        this.render();
    }

    render() {
        const sizeClass = `loading-${this.options.size}`;
        const typeClass = `loading-${this.options.type}`;
        const overlayClass = this.options.overlay ? 'loading-overlay' : '';

        this.container.innerHTML = `
            <div class="loading-container ${sizeClass} ${overlayClass}" style="display: none;">
                <div class="loading-content">
                    ${this.renderLoadingAnimation()}
                    <div class="loading-message">${this.options.message}</div>
                    ${this.options.showProgress ? this.renderProgressBar() : ''}
                </div>
            </div>
        `;

        this.loadingElement = this.container.querySelector('.loading-container');
    }

    renderLoadingAnimation() {
        switch (this.options.type) {
            case 'spinner':
                return `
                    <div class="spinner-container">
                        <div class="spinner"></div>
                    </div>
                `;
            
            case 'dots':
                return `
                    <div class="dots-container">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                `;
            
            case 'pulse':
                return `
                    <div class="pulse-container">
                        <div class="pulse-circle"></div>
                    </div>
                `;
            
            case 'bars':
                return `
                    <div class="bars-container">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                `;
            
            case 'league':
                return `
                    <div class="league-loader">
                        <div class="league-spinner">
                            <div class="league-inner"></div>
                        </div>
                        <div class="league-text">⚔️</div>
                    </div>
                `;
            
            default:
                return this.renderLoadingAnimation({ ...this.options, type: 'spinner' });
        }
    }

    renderProgressBar() {
        return `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.options.progress || 0}%"></div>
                </div>
                <div class="progress-text">${this.options.progress || 0}%</div>
            </div>
        `;
    }

    show(message = null, options = {}) {
        if (message) {
            this.updateMessage(message);
        }
        
        if (options.progress !== undefined) {
            this.updateProgress(options.progress);
        }

        if (this.loadingElement) {
            this.loadingElement.style.display = 'flex';
            this.isVisible = true;
            
            // Add fade-in animation
            this.loadingElement.style.opacity = '0';
            setTimeout(() => {
                if (this.loadingElement) {
                    this.loadingElement.style.opacity = '1';
                }
            }, 10);
        }
    }

    hide() {
        if (this.loadingElement) {
            // Add fade-out animation
            this.loadingElement.style.opacity = '0';
            setTimeout(() => {
                if (this.loadingElement) {
                    this.loadingElement.style.display = 'none';
                    this.isVisible = false;
                }
            }, 300);
        }
    }

    updateMessage(message) {
        const messageElement = this.container.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    updateProgress(progress) {
        const progressFill = this.container.querySelector('.progress-fill');
        const progressText = this.container.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
    }

    setType(type) {
        this.options.type = type;
        this.render();
    }

    setSize(size) {
        this.options.size = size;
        this.render();
    }

    isShowing() {
        return this.isVisible;
    }

    // Static method to create quick loading instances
    static show(container, message = 'Loading...', options = {}) {
        const loader = new LoadingSpinner(container, { message, ...options });
        loader.show();
        return loader;
    }

    // Static method for API loading states
    static showApiLoading(container, apiType = 'match') {
        const messages = {
            match: 'Fetching match data...',
            timeline: 'Loading timeline events...',
            champions: 'Loading champion data...',
            items: 'Loading item information...',
            summoner: 'Looking up summoner...'
        };

        return LoadingSpinner.show(container, messages[apiType] || 'Loading...', {
            type: 'league',
            size: 'medium'
        });
    }

    // Static method for progress loading
    static showProgress(container, message = 'Processing...', initialProgress = 0) {
        const loader = new LoadingSpinner(container, {
            message,
            type: 'spinner',
            showProgress: true,
            progress: initialProgress
        });
        loader.show();
        return loader;
    }

    // Destroy the loading spinner
    destroy() {
        if (this.loadingElement) {
            this.loadingElement.remove();
        }
        this.isVisible = false;
    }
}

// Specialized loading components for different scenarios
export class MatchLoadingSpinner extends LoadingSpinner {
    constructor(container) {
        super(container, {
            message: 'Analyzing match data...',
            type: 'league',
            size: 'large',
            overlay: true
        });
        
        this.stages = [
            'Fetching match information...',
            'Loading timeline events...',
            'Enriching champion data...',
            'Processing statistics...',
            'Finalizing analysis...'
        ];
        this.currentStage = 0;
    }

    nextStage() {
        if (this.currentStage < this.stages.length - 1) {
            this.currentStage++;
            this.updateMessage(this.stages[this.currentStage]);
            this.updateProgress((this.currentStage / (this.stages.length - 1)) * 100);
        }
    }

    show() {
        this.currentStage = 0;
        this.updateMessage(this.stages[0]);
        this.updateProgress(0);
        super.show();
    }
}

export class SearchLoadingSpinner extends LoadingSpinner {
    constructor(container) {
        super(container, {
            message: 'Searching for match...',
            type: 'dots',
            size: 'small'
        });
    }
}

export class ComponentLoadingSpinner extends LoadingSpinner {
    constructor(container, componentName) {
        super(container, {
            message: `Loading ${componentName}...`,
            type: 'pulse',
            size: 'small'
        });
    }
}
