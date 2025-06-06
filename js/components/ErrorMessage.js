// Error Message Component - Displays user-friendly error messages with actions
export class ErrorMessage {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            type: 'error', // error, warning, info, success
            title: 'Error',
            message: 'Something went wrong',
            showRetry: true,
            showHome: true,
            autoHide: false,
            autoHideDelay: 5000,
            ...options
        };
        this.onRetry = null;
        this.onHome = null;
        this.render();
    }

    render() {
        const typeClass = `error-${this.options.type}`;
        const icon = this.getIcon(this.options.type);

        this.container.innerHTML = `
            <div class="error-container ${typeClass}">
                <div class="error-content">
                    <div class="error-header">
                        <div class="error-icon">${icon}</div>
                        <h3 class="error-title">${this.options.title}</h3>
                    </div>
                    
                    <div class="error-body">
                        <p class="error-message">${this.options.message}</p>
                        ${this.options.details ? `<div class="error-details">${this.options.details}</div>` : ''}
                    </div>
                    
                    <div class="error-actions">
                        ${this.renderActions()}
                    </div>
                    
                    ${this.options.showTips ? this.renderTips() : ''}
                </div>
            </div>
        `;

        this.setupEventListeners();
        
        if (this.options.autoHide) {
            setTimeout(() => this.hide(), this.options.autoHideDelay);
        }
    }

    getIcon(type) {
        const icons = {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅',
            network: '🌐',
            api: '🔑',
            notfound: '🔍',
            ratelimit: '⏱️'
        };
        return icons[type] || icons.error;
    }

    renderActions() {
        let actions = '';
        
        if (this.options.showRetry) {
            actions += `
                <button class="error-action-btn retry-btn" id="error-retry">
                    🔄 Try Again
                </button>
            `;
        }
        
        if (this.options.showHome) {
            actions += `
                <button class="error-action-btn home-btn" id="error-home">
                    🏠 Back to Home
                </button>
            `;
        }
        
        if (this.options.customActions) {
            this.options.customActions.forEach(action => {
                actions += `
                    <button class="error-action-btn custom-btn" data-action="${action.id}">
                        ${action.icon || ''} ${action.label}
                    </button>
                `;
            });
        }
        
        return actions;
    }

    renderTips() {
        const tips = this.getTipsForErrorType(this.options.type);
        
        if (!tips.length) return '';
        
        return `
            <div class="error-tips">
                <h4>💡 Helpful Tips:</h4>
                <ul>
                    ${tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    getTipsForErrorType(type) {
        const tipMap = {
            api: [
                'Make sure your Riot API key is valid and not expired',
                'Development keys expire every 24 hours',
                'Check if you have exceeded the rate limit'
            ],
            network: [
                'Check your internet connection',
                'Try refreshing the page',
                'The Riot API servers might be temporarily unavailable'
            ],
            notfound: [
                'Double-check the match ID format (e.g., EUW1_4358345)',
                'Make sure you selected the correct region',
                'Very old matches might not be available in the API'
            ],
            ratelimit: [
                'Wait a moment before trying again',
                'Development API keys have strict rate limits',
                'Consider getting a production API key for heavy usage'
            ]
        };
        
        return tipMap[type] || [];
    }

    setupEventListeners() {
        const retryBtn = this.container.querySelector('#error-retry');
        const homeBtn = this.container.querySelector('#error-home');
        const customBtns = this.container.querySelectorAll('.custom-btn');

        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                if (this.onRetry) {
                    this.onRetry();
                }
            });
        }

        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                if (this.onHome) {
                    this.onHome();
                } else {
                    window.location.href = '/';
                }
            });
        }

        customBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const actionId = btn.getAttribute('data-action');
                const action = this.options.customActions?.find(a => a.id === actionId);
                if (action && action.handler) {
                    action.handler();
                }
            });
        });
    }

    show() {
        const errorContainer = this.container.querySelector('.error-container');
        if (errorContainer) {
            errorContainer.style.display = 'block';
            errorContainer.style.opacity = '0';
            setTimeout(() => {
                errorContainer.style.opacity = '1';
            }, 10);
        }
    }

    hide() {
        const errorContainer = this.container.querySelector('.error-container');
        if (errorContainer) {
            errorContainer.style.opacity = '0';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 300);
        }
    }

    updateMessage(message, details = null) {
        const messageEl = this.container.querySelector('.error-message');
        const detailsEl = this.container.querySelector('.error-details');
        
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        if (details && detailsEl) {
            detailsEl.textContent = details;
        } else if (details) {
            const errorBody = this.container.querySelector('.error-body');
            if (errorBody) {
                errorBody.innerHTML += `<div class="error-details">${details}</div>`;
            }
        }
    }

    setRetryHandler(handler) {
        this.onRetry = handler;
    }

    setHomeHandler(handler) {
        this.onHome = handler;
    }

    // Static methods for common error types
    static showApiError(container, error, retryHandler = null) {
        const errorMsg = new ErrorMessage(container, {
            type: 'api',
            title: 'API Error',
            message: error.message || 'Failed to fetch data from Riot API',
            showTips: true,
            customActions: [
                {
                    id: 'configure-key',
                    label: 'Configure API Key',
                    icon: '🔑',
                    handler: () => {
                        // This would open API key configuration
                        console.log('Open API key configuration');
                    }
                }
            ]
        });
        
        if (retryHandler) {
            errorMsg.setRetryHandler(retryHandler);
        }
        
        errorMsg.show();
        return errorMsg;
    }

    static showNetworkError(container, retryHandler = null) {
        const errorMsg = new ErrorMessage(container, {
            type: 'network',
            title: 'Connection Error',
            message: 'Unable to connect to the server',
            showTips: true
        });
        
        if (retryHandler) {
            errorMsg.setRetryHandler(retryHandler);
        }
        
        errorMsg.show();
        return errorMsg;
    }

    static showNotFoundError(container, matchId = null) {
        const errorMsg = new ErrorMessage(container, {
            type: 'notfound',
            title: 'Match Not Found',
            message: matchId 
                ? `Match ${matchId} could not be found`
                : 'The requested match could not be found',
            showTips: true
        });
        
        errorMsg.show();
        return errorMsg;
    }

    static showRateLimitError(container, retryHandler = null) {
        const errorMsg = new ErrorMessage(container, {
            type: 'ratelimit',
            title: 'Rate Limit Exceeded',
            message: 'Too many requests. Please wait a moment before trying again.',
            showTips: true,
            autoHide: true,
            autoHideDelay: 10000
        });
        
        if (retryHandler) {
            // Add delay before allowing retry
            errorMsg.setRetryHandler(() => {
                setTimeout(retryHandler, 2000);
            });
        }
        
        errorMsg.show();
        return errorMsg;
    }

    static showSuccess(container, message, autoHide = true) {
        const errorMsg = new ErrorMessage(container, {
            type: 'success',
            title: 'Success',
            message: message,
            showRetry: false,
            showHome: false,
            autoHide: autoHide,
            autoHideDelay: 3000
        });
        
        errorMsg.show();
        return errorMsg;
    }

    static showWarning(container, message, actions = []) {
        const errorMsg = new ErrorMessage(container, {
            type: 'warning',
            title: 'Warning',
            message: message,
            showRetry: false,
            customActions: actions
        });
        
        errorMsg.show();
        return errorMsg;
    }

    // Destroy the error message
    destroy() {
        const errorContainer = this.container.querySelector('.error-container');
        if (errorContainer) {
            errorContainer.remove();
        }
    }
}
