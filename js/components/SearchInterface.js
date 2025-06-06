// Enhanced Search Interface Component
import { ValidationUtils } from '../utils.js';
import { SearchHistory } from './SearchHistory.js';

export class SearchInterface {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showHistory: true,
            showSuggestions: true,
            autoDetectRegion: true,
            validateInput: true,
            ...options
        };
        
        this.onSearch = null;
        this.currentInput = '';
        this.isValidInput = false;
        this.searchHistory = null;
        
        this.render();
        this.setupEventListeners();
        this.initializeHistory();
    }

    render() {
        this.container.innerHTML = `
            <div class="search-interface">
                <div class="search-header">
                    <h2>🔍 Search for a Match</h2>
                    <p>Enter a match ID or paste a match URL to analyze</p>
                </div>

                <form class="search-form" id="enhanced-search-form" role="search">
                    <div class="search-input-container">
                        <div class="input-wrapper">
                            <label for="search-input" class="sr-only">Match ID or URL</label>
                            <input
                                type="text"
                                id="search-input"
                                class="search-input"
                                placeholder="Enter match ID (e.g., EUW1_4358345) or paste match URL"
                                autocomplete="off"
                                spellcheck="false"
                                aria-describedby="search-help search-validation"
                            >
                            <div class="input-actions">
                                <button type="button" class="clear-input" aria-label="Clear input" title="Clear">
                                    ✕
                                </button>
                                <button type="button" class="paste-button" aria-label="Paste from clipboard" title="Paste">
                                    📋
                                </button>
                            </div>
                        </div>
                        
                        <div class="search-validation" id="search-validation" aria-live="polite">
                            <!-- Validation messages will appear here -->
                        </div>
                        
                        <div class="search-help" id="search-help">
                            <details>
                                <summary>Supported formats</summary>
                                <ul>
                                    <li><strong>Match ID:</strong> EUW1_4358345, NA1_1234567890</li>
                                    <li><strong>Match URL:</strong> Full League of Legends match URLs</li>
                                    <li><strong>Short URL:</strong> Shortened match links</li>
                                </ul>
                            </details>
                        </div>
                    </div>

                    <div class="search-options">
                        <div class="region-selector">
                            <label for="region-select">Region:</label>
                            <select id="region-select" class="region-select" aria-describedby="region-help">
                                <option value="">Auto-detect</option>
                                <option value="EUW1">EUW - Europe West</option>
                                <option value="NA1">NA - North America</option>
                                <option value="KR">KR - Korea</option>
                                <option value="EUN1">EUNE - Europe Nordic & East</option>
                                <option value="BR1">BR - Brazil</option>
                                <option value="LA1">LAN - Latin America North</option>
                                <option value="LA2">LAS - Latin America South</option>
                                <option value="OC1">OCE - Oceania</option>
                                <option value="RU">RU - Russia</option>
                                <option value="TR1">TR - Turkey</option>
                                <option value="JP1">JP - Japan</option>
                            </select>
                            <div id="region-help" class="help-text">
                                Region will be auto-detected from URLs
                            </div>
                        </div>

                        <div class="search-actions">
                            <button type="submit" class="search-button" disabled aria-describedby="search-button-help">
                                <span class="button-icon">🔍</span>
                                <span class="button-text">Analyze Match</span>
                            </button>
                            <div id="search-button-help" class="sr-only">
                                Search for and analyze the entered match
                            </div>
                        </div>
                    </div>
                </form>

                ${this.options.showHistory ? '<div class="search-history-container"></div>' : ''}
                
                <div class="search-suggestions" id="search-suggestions" aria-live="polite">
                    <!-- Dynamic suggestions will appear here -->
                </div>

                <div class="search-examples">
                    <h3>Example searches:</h3>
                    <div class="examples-grid">
                        <button type="button" class="example-item" data-example="EUW1_4358345">
                            <span class="example-id">EUW1_4358345</span>
                            <span class="example-desc">Match ID format</span>
                        </button>
                        <button type="button" class="example-item" data-example="NA1_1234567890">
                            <span class="example-id">NA1_1234567890</span>
                            <span class="example-desc">North America match</span>
                        </button>
                        <button type="button" class="example-item" data-example="KR_9876543210">
                            <span class="example-id">KR_9876543210</span>
                            <span class="example-desc">Korean server match</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const form = this.container.querySelector('#enhanced-search-form');
        const input = this.container.querySelector('#search-input');
        const clearButton = this.container.querySelector('.clear-input');
        const pasteButton = this.container.querySelector('.paste-button');
        const searchButton = this.container.querySelector('.search-button');
        const regionSelect = this.container.querySelector('#region-select');
        const exampleButtons = this.container.querySelectorAll('.example-item');

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Input validation and formatting
        input.addEventListener('input', (e) => {
            this.handleInputChange(e.target.value);
        });

        input.addEventListener('paste', (e) => {
            // Handle paste event with delay to get pasted content
            setTimeout(() => {
                this.handleInputChange(e.target.value);
            }, 10);
        });

        input.addEventListener('focus', () => {
            this.showSuggestions();
        });

        input.addEventListener('blur', () => {
            // Hide suggestions with delay to allow clicking
            setTimeout(() => this.hideSuggestions(), 200);
        });

        // Clear input
        clearButton.addEventListener('click', () => {
            input.value = '';
            input.focus();
            this.handleInputChange('');
        });

        // Paste from clipboard
        pasteButton.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                input.value = text;
                input.focus();
                this.handleInputChange(text);
            } catch (error) {
                console.warn('Could not read from clipboard:', error);
                // Fallback: focus input for manual paste
                input.focus();
            }
        });

        // Region selection
        regionSelect.addEventListener('change', () => {
            this.validateCurrentInput();
        });

        // Example buttons
        exampleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const example = button.getAttribute('data-example');
                input.value = example;
                input.focus();
                this.handleInputChange(example);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                input.focus();
            }
        });
    }

    initializeHistory() {
        if (this.options.showHistory) {
            const historyContainer = this.container.querySelector('.search-history-container');
            if (historyContainer) {
                this.searchHistory = new SearchHistory(historyContainer);
                this.searchHistory.onHistorySelect = (item) => {
                    this.setSearchValue(item.input, item.region);
                };
            }
        }
    }

    handleInputChange(value) {
        this.currentInput = value.trim();
        this.validateCurrentInput();
        this.updateSuggestions();
    }

    validateCurrentInput() {
        const input = this.container.querySelector('#search-input');
        const validation = this.container.querySelector('.search-validation');
        const searchButton = this.container.querySelector('.search-button');
        const regionSelect = this.container.querySelector('#region-select');

        if (!this.currentInput) {
            this.isValidInput = false;
            validation.innerHTML = '';
            searchButton.disabled = true;
            input.classList.remove('valid', 'invalid');
            return;
        }

        const result = ValidationUtils.validateMatchInput(this.currentInput);
        this.isValidInput = result.isValid;

        // Update UI based on validation
        input.classList.toggle('valid', result.isValid);
        input.classList.toggle('invalid', !result.isValid);
        searchButton.disabled = !result.isValid;

        // Show validation message
        if (result.isValid) {
            validation.innerHTML = `
                <div class="validation-success">
                    ✅ ${result.message}
                </div>
            `;

            // Auto-detect region if enabled
            if (this.options.autoDetectRegion && result.detectedRegion) {
                regionSelect.value = result.detectedRegion;
                validation.innerHTML += `
                    <div class="validation-info">
                        🌍 Region auto-detected: ${result.detectedRegion}
                    </div>
                `;
            }
        } else {
            validation.innerHTML = `
                <div class="validation-error">
                    ❌ ${result.message}
                </div>
            `;
        }
    }

    updateSuggestions() {
        if (!this.options.showSuggestions) return;

        const suggestions = this.container.querySelector('#search-suggestions');
        
        if (!this.currentInput || this.currentInput.length < 3) {
            suggestions.innerHTML = '';
            return;
        }

        // Generate suggestions based on input
        const suggestionItems = this.generateSuggestions(this.currentInput);
        
        if (suggestionItems.length > 0) {
            suggestions.innerHTML = `
                <div class="suggestions-list">
                    <div class="suggestions-header">Suggestions:</div>
                    ${suggestionItems.map(item => `
                        <button type="button" class="suggestion-item" data-suggestion="${item.value}">
                            <span class="suggestion-text">${item.display}</span>
                            <span class="suggestion-type">${item.type}</span>
                        </button>
                    `).join('')}
                </div>
            `;

            // Add click handlers for suggestions
            suggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const suggestion = item.getAttribute('data-suggestion');
                    this.setSearchValue(suggestion);
                });
            });
        } else {
            suggestions.innerHTML = '';
        }
    }

    generateSuggestions(input) {
        const suggestions = [];
        
        // Format suggestions based on partial input
        if (input.match(/^[A-Z]{2,4}\d*$/i)) {
            // Looks like start of region code
            const regions = ['EUW1', 'NA1', 'KR', 'EUN1', 'BR1', 'LA1', 'LA2', 'OC1', 'RU', 'TR1', 'JP1'];
            const matchingRegions = regions.filter(region => 
                region.toLowerCase().startsWith(input.toLowerCase())
            );
            
            matchingRegions.forEach(region => {
                suggestions.push({
                    value: `${region}_`,
                    display: `${region}_[match-number]`,
                    type: 'Format'
                });
            });
        }

        // Add history-based suggestions
        if (this.searchHistory) {
            const historyItems = this.searchHistory.getRecentSearches()
                .filter(item => item.input.toLowerCase().includes(input.toLowerCase()))
                .slice(0, 3);
            
            historyItems.forEach(item => {
                suggestions.push({
                    value: item.input,
                    display: item.input,
                    type: 'Recent'
                });
            });
        }

        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    showSuggestions() {
        if (this.currentInput && this.currentInput.length >= 3) {
            this.updateSuggestions();
        }
    }

    hideSuggestions() {
        const suggestions = this.container.querySelector('#search-suggestions');
        suggestions.innerHTML = '';
    }

    setSearchValue(value, region = '') {
        const input = this.container.querySelector('#search-input');
        const regionSelect = this.container.querySelector('#region-select');
        
        input.value = value;
        if (region) {
            regionSelect.value = region;
        }
        
        this.handleInputChange(value);
        input.focus();
    }

    handleSearch() {
        if (!this.isValidInput) {
            this.showValidationError('Please enter a valid match ID or URL');
            return;
        }

        const regionSelect = this.container.querySelector('#region-select');
        const selectedRegion = regionSelect.value;
        
        const searchData = ValidationUtils.parseMatchInput(this.currentInput, selectedRegion);
        
        if (!searchData) {
            this.showValidationError('Could not parse match information');
            return;
        }

        // Add to search history
        if (this.searchHistory) {
            this.searchHistory.addSearch({
                input: this.currentInput,
                region: searchData.region,
                matchId: searchData.matchId,
                timestamp: Date.now()
            });
        }

        // Trigger search callback
        if (this.onSearch) {
            this.onSearch(searchData);
        }
    }

    showValidationError(message) {
        const validation = this.container.querySelector('.search-validation');
        validation.innerHTML = `
            <div class="validation-error">
                ❌ ${message}
            </div>
        `;
    }

    // Public methods
    setSearchCallback(callback) {
        this.onSearch = callback;
    }

    clearSearch() {
        const input = this.container.querySelector('#search-input');
        input.value = '';
        this.handleInputChange('');
    }

    focusSearch() {
        const input = this.container.querySelector('#search-input');
        input.focus();
    }

    setLoading(isLoading) {
        const searchButton = this.container.querySelector('.search-button');
        const buttonText = searchButton.querySelector('.button-text');
        const buttonIcon = searchButton.querySelector('.button-icon');
        
        if (isLoading) {
            searchButton.disabled = true;
            buttonText.textContent = 'Searching...';
            buttonIcon.textContent = '⏳';
            searchButton.classList.add('loading');
        } else {
            searchButton.disabled = !this.isValidInput;
            buttonText.textContent = 'Analyze Match';
            buttonIcon.textContent = '🔍';
            searchButton.classList.remove('loading');
        }
    }
}
