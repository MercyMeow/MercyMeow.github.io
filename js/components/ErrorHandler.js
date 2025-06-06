// Comprehensive Error Handler Component
import { ErrorHandler as ErrorUtils } from '../utils.js';

export class ErrorHandler {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showRetry: true,
            showHome: true,
            showTips: true,
            autoHide: false,
            autoHideDelay: 5000,
            logErrors: true,
            ...options
        };
        
        this.onRetry = null;
        this.onHome = null;
        this.currentError = null;
        this.autoHideTimer = null;
    }

    show(error, context = '') {
        this.currentError = error;
        
        // Log error if enabled
        if (this.options.logErrors) {
            ErrorUtils.logError(error, context);
        }

        // Determine error type and details
        const errorInfo = this.analyzeError(error);
        
        // Render error UI
        this.render(errorInfo);
        
        // Set up auto-hide if enabled
        if (this.options.autoHide && !errorInfo.requiresAction) {
            this.setupAutoHide();
        }
    }

    analyzeError(error) {
        const errorMessage = error?.message || error || 'An unknown error occurred';
        
        // Determine error type based on message content
        let type = 'error';
        let title = 'Error';
        let userMessage = ErrorUtils.createUserFriendlyError(error);
        let requiresAction = true;
        let tips = [];

        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            type = 'notfound';
            title = 'Match Not Found';
            requiresAction = true;
            tips = [
                'Double-check the match ID format (e.g., EUW1_4358345)',
                'Verify the region is correct',
                'Make sure the match exists and is recent',
                'Try searching for a different match'
            ];
        } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            type = 'ratelimit';
            title = 'Rate Limit Exceeded';
            requiresAction = false;
            tips = [
                'Wait a few moments before trying again',
                'Riot API has usage limits to prevent abuse',
                'Consider using a production API key for higher limits'
            ];
        } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('api key')) {
            type = 'api';
            title = 'API Key Error';
            requiresAction = true;
            tips = [
                'Check that your API key is valid and not expired',
                'Development keys expire every 24 hours',
                'Get a new key from https://developer.riotgames.com/',
                'Make sure the key starts with "RGAPI-"'
            ];
        } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
            type = 'server';
            title = 'Server Error';
            requiresAction = false;
            tips = [
                'Riot API servers are temporarily unavailable',
                'This is usually temporary - try again in a few minutes',
                'Check Riot API status at https://developer.riotgames.com/'
            ];
        } else if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS')) {
            type = 'network';
            title = 'Connection Error';
            requiresAction = true;
            tips = [
                'Check your internet connection',
                'CORS proxy might be unavailable',
                'Try refreshing the page',
                'Some browser extensions can block requests'
            ];
        } else if (errorMessage.includes('Invalid') || errorMessage.includes('format')) {
            type = 'validation';
            title = 'Invalid Input';
            requiresAction = true;
            tips = [
                'Use the format: REGION_MATCHID (e.g., EUW1_4358345)',
                'Or paste a full League of Legends match URL',
                'Check the examples below the search box'
            ];
        }

        return {
            type,
            title,
            message: userMessage,
            originalError: errorMessage,
            requiresAction,
            tips: this.options.showTips ? tips : []
        };
    }

    render(errorInfo) {
        const { type, title, message, tips, requiresAction } = errorInfo;
        
        this.container.innerHTML = `
            <div class="error-handler ${type}">
                <div class="error-content">
                    <div class="error-icon">
                        ${this.getErrorIcon(type)}
                    </div>
                    
                    <div class="error-details">
                        <h2 class="error-title">${title}</h2>
                        <p class="error-message">${message}</p>
                        
                        ${tips.length > 0 ? `
                            <div class="error-tips">
                                <h3>💡 Helpful Tips:</h3>
                                <ul>
                                    ${tips.map(tip => `<li>${tip}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="error-actions">
                    ${this.options.showRetry && requiresAction ? `
                        <button class="error-button retry-button" data-action="retry">
                            🔄 Try Again
                        </button>
                    ` : ''}
                    
                    ${this.options.showHome ? `
                        <button class="error-button home-button" data-action="home">
                            🏠 Back to Home
                        </button>
                    ` : ''}
                    
                    <button class="error-button dismiss-button" data-action="dismiss">
                        ✕ Dismiss
                    </button>
                </div>
                
                ${!requiresAction && this.options.autoHide ? `
                    <div class="auto-hide-indicator">
                        <div class="auto-hide-progress"></div>
                        <span class="auto-hide-text">Auto-dismissing in <span class="countdown">${this.options.autoHideDelay / 1000}</span>s</span>
                    </div>
                ` : ''}
            </div>
        `;

        this.setupEventListeners();
    }

    getErrorIcon(type) {
        const icons = {
            error: '⚠️',
            notfound: '🔍',
            ratelimit: '⏱️',
            api: '🔑',
            server: '🔧',
            network: '🌐',
            validation: '📝'
        };
        return icons[type] || '⚠️';
    }

    setupEventListeners() {
        const buttons = this.container.querySelectorAll('.error-button');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                this.handleAction(action);
            });
        });
    }

    handleAction(action) {
        switch (action) {
            case 'retry':
                if (this.onRetry) {
                    this.onRetry(this.currentError);
                }
                break;
            case 'home':
                if (this.onHome) {
                    this.onHome();
                }
                break;
            case 'dismiss':
                this.hide();
                break;
        }
    }

    setupAutoHide() {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }

        const countdownElement = this.container.querySelector('.countdown');
        const progressElement = this.container.querySelector('.auto-hide-progress');
        
        if (countdownElement && progressElement) {
            let remaining = this.options.autoHideDelay / 1000;
            
            const updateCountdown = () => {
                countdownElement.textContent = remaining;
                const progress = ((this.options.autoHideDelay / 1000 - remaining) / (this.options.autoHideDelay / 1000)) * 100;
                progressElement.style.width = `${progress}%`;
                
                if (remaining > 0) {
                    remaining--;
                    setTimeout(updateCountdown, 1000);
                } else {
                    this.hide();
                }
            };
            
            updateCountdown();
        } else {
            this.autoHideTimer = setTimeout(() => {
                this.hide();
            }, this.options.autoHideDelay);
        }
    }

    hide() {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
        
        this.container.innerHTML = '';
        this.currentError = null;
    }

    // Public methods for setting callbacks
    setRetryHandler(callback) {
        this.onRetry = callback;
    }

    setHomeHandler(callback) {
        this.onHome = callback;
    }

    // Static method for quick error display
    static showError(container, error, options = {}) {
        const handler = new ErrorHandler(container, options);
        handler.show(error);
        return handler;
    }
}
