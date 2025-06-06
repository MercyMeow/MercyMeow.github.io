// API Key Configuration Component
import { ApiKeyManager } from '../utils.js';

export class ApiKeyConfig {
    constructor(container) {
        this.container = container;
        this.onKeyConfigured = null; // Callback when key is set
        this.render();
        this.setupEventListeners();
    }

    render() {
        const hasKey = ApiKeyManager.getStoredKey();
        
        this.container.innerHTML = `
            <div class="api-key-config">
                <div class="api-key-header">
                    <h3>🔑 Riot API Key Configuration</h3>
                    <p>To use this application, you need a Riot Games API key.</p>
                </div>
                
                <div class="api-key-status ${hasKey ? 'has-key' : 'no-key'}">
                    <div class="status-indicator">
                        <span class="status-icon">${hasKey ? '✅' : '❌'}</span>
                        <span class="status-text">
                            ${hasKey ? 'API Key Configured' : 'No API Key Found'}
                        </span>
                    </div>
                    ${hasKey ? `
                        <div class="key-preview">
                            Key: ${this.maskApiKey(hasKey)}
                        </div>
                    ` : ''}
                </div>

                <div class="api-key-form">
                    <div class="form-group">
                        <label for="api-key-input">Enter your Riot API Key:</label>
                        <input 
                            type="password" 
                            id="api-key-input" 
                            class="api-key-input"
                            placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            value="${hasKey || ''}"
                        >
                        <button type="button" id="toggle-visibility" class="toggle-visibility">
                            👁️ Show
                        </button>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="save-key" class="btn btn-primary">
                            ${hasKey ? 'Update Key' : 'Save Key'}
                        </button>
                        ${hasKey ? `
                            <button type="button" id="remove-key" class="btn btn-secondary">
                                Remove Key
                            </button>
                        ` : ''}
                        <button type="button" id="test-key" class="btn btn-secondary" ${!hasKey ? 'disabled' : ''}>
                            Test Key
                        </button>
                    </div>
                </div>

                <div class="api-key-help">
                    <details>
                        <summary>How to get a Riot API Key</summary>
                        <div class="help-content">
                            <ol>
                                <li>Go to <a href="https://developer.riotgames.com/" target="_blank">developer.riotgames.com</a></li>
                                <li>Sign in with your Riot Games account</li>
                                <li>Create a new app or use an existing one</li>
                                <li>Copy your API key (starts with "RGAPI-")</li>
                                <li>Paste it in the field above</li>
                            </ol>
                            <div class="help-note">
                                <strong>Note:</strong> Development keys expire every 24 hours and have rate limits.
                                For production use, you'll need to apply for a production key.
                            </div>
                        </div>
                    </details>
                </div>

                <div id="api-key-message" class="api-key-message hidden"></div>
            </div>
        `;
    }

    setupEventListeners() {
        const saveButton = this.container.querySelector('#save-key');
        const removeButton = this.container.querySelector('#remove-key');
        const testButton = this.container.querySelector('#test-key');
        const toggleButton = this.container.querySelector('#toggle-visibility');
        const input = this.container.querySelector('#api-key-input');

        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveApiKey());
        }

        if (removeButton) {
            removeButton.addEventListener('click', () => this.removeApiKey());
        }

        if (testButton) {
            testButton.addEventListener('click', () => this.testApiKey());
        }

        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleVisibility());
        }

        if (input) {
            input.addEventListener('input', () => this.validateInput());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveApiKey();
                }
            });
        }
    }

    saveApiKey() {
        const input = this.container.querySelector('#api-key-input');
        const apiKey = input.value.trim();

        if (!apiKey) {
            this.showMessage('Please enter an API key', 'error');
            return;
        }

        if (!ApiKeyManager.isValidKeyFormat(apiKey)) {
            this.showMessage('Invalid API key format. Key should start with "RGAPI-"', 'error');
            return;
        }

        ApiKeyManager.setKey(apiKey);
        this.showMessage('API key saved successfully!', 'success');
        this.render(); // Re-render to update status

        // Notify parent component
        if (this.onKeyConfigured) {
            this.onKeyConfigured(apiKey);
        }
    }

    removeApiKey() {
        if (confirm('Are you sure you want to remove the stored API key?')) {
            ApiKeyManager.removeKey();
            this.showMessage('API key removed', 'info');
            this.render(); // Re-render to update status
        }
    }

    async testApiKey() {
        const apiKey = ApiKeyManager.getStoredKey();
        if (!apiKey) {
            this.showMessage('No API key to test', 'error');
            return;
        }

        this.showMessage('Testing API key...', 'info');
        
        try {
            // Test with a simple API call (get platform data)
            const testUrl = 'https://na1.api.riotgames.com/lol/platform/v3/champion-rotations';
            const response = await fetch(`https://cors-anywhere.herokuapp.com/${testUrl}`, {
                headers: {
                    'X-Riot-Token': apiKey
                }
            });

            if (response.ok) {
                this.showMessage('✅ API key is valid and working!', 'success');
            } else if (response.status === 401 || response.status === 403) {
                this.showMessage('❌ API key is invalid or expired', 'error');
            } else {
                this.showMessage(`⚠️ API returned status ${response.status}. Key might be valid but rate limited.`, 'warning');
            }
        } catch (error) {
            this.showMessage('❌ Failed to test API key. Check your internet connection.', 'error');
        }
    }

    toggleVisibility() {
        const input = this.container.querySelector('#api-key-input');
        const button = this.container.querySelector('#toggle-visibility');
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈 Hide';
        } else {
            input.type = 'password';
            button.textContent = '👁️ Show';
        }
    }

    validateInput() {
        const input = this.container.querySelector('#api-key-input');
        const saveButton = this.container.querySelector('#save-key');
        const testButton = this.container.querySelector('#test-key');
        
        const isValid = ApiKeyManager.isValidKeyFormat(input.value.trim());
        
        input.classList.toggle('invalid', input.value && !isValid);
        saveButton.disabled = !isValid;
        testButton.disabled = !isValid;
    }

    showMessage(text, type = 'info') {
        const messageEl = this.container.querySelector('#api-key-message');
        messageEl.textContent = text;
        messageEl.className = `api-key-message ${type}`;
        messageEl.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }

    maskApiKey(key) {
        if (!key || key.length < 10) return key;
        return key.substring(0, 10) + '•'.repeat(key.length - 15) + key.substring(key.length - 5);
    }

    // Set callback for when key is configured
    onApiKeyConfigured(callback) {
        this.onKeyConfigured = callback;
    }

    // Check if API key is configured
    hasApiKey() {
        return !!ApiKeyManager.getStoredKey();
    }

    // Get the configured API key
    getApiKey() {
        return ApiKeyManager.getStoredKey();
    }
}
