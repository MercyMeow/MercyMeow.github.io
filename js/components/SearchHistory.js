// Search History Component
import { StorageUtils } from '../utils.js';

export class SearchHistory {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxItems: 10,
            storageKey: 'lol_search_history',
            showTimestamps: true,
            showRegions: true,
            ...options
        };
        
        this.onHistorySelect = null;
        this.history = this.loadHistory();
        
        this.render();
        this.setupEventListeners();
    }

    render() {
        if (this.history.length === 0) {
            this.container.innerHTML = `
                <div class="search-history empty">
                    <div class="history-header">
                        <h3>🕒 Recent Searches</h3>
                        <p class="empty-message">No recent searches yet</p>
                    </div>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="search-history">
                <div class="history-header">
                    <h3>🕒 Recent Searches</h3>
                    <button type="button" class="clear-history" aria-label="Clear search history" title="Clear all history">
                        🗑️ Clear
                    </button>
                </div>
                <div class="history-list">
                    ${this.history.map((item, index) => this.renderHistoryItem(item, index)).join('')}
                </div>
            </div>
        `;
    }

    renderHistoryItem(item, index) {
        const timeAgo = this.getTimeAgo(item.timestamp);
        const regionDisplay = item.region || 'Unknown';
        
        return `
            <div class="history-item" data-index="${index}" role="button" tabindex="0" 
                 aria-label="Use search: ${item.input} from ${regionDisplay}">
                <div class="history-content">
                    <div class="history-main">
                        <span class="history-input">${this.escapeHtml(item.input)}</span>
                        ${this.options.showRegions ? `<span class="history-region">${regionDisplay}</span>` : ''}
                    </div>
                    ${this.options.showTimestamps ? `<div class="history-meta">
                        <span class="history-time">${timeAgo}</span>
                    </div>` : ''}
                </div>
                <button type="button" class="remove-item" data-index="${index}" 
                        aria-label="Remove this search from history" title="Remove">
                    ✕
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Clear all history
        const clearButton = this.container.querySelector('.clear-history');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearHistory();
            });
        }

        // History item clicks
        this.container.addEventListener('click', (e) => {
            const historyItem = e.target.closest('.history-item');
            const removeButton = e.target.closest('.remove-item');
            
            if (removeButton) {
                e.stopPropagation();
                const index = parseInt(removeButton.getAttribute('data-index'));
                this.removeItem(index);
            } else if (historyItem) {
                const index = parseInt(historyItem.getAttribute('data-index'));
                this.selectHistoryItem(index);
            }
        });

        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            const historyItem = e.target.closest('.history-item');
            if (historyItem && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                const index = parseInt(historyItem.getAttribute('data-index'));
                this.selectHistoryItem(index);
            }
        });
    }

    loadHistory() {
        try {
            const stored = StorageUtils.get(this.options.storageKey);
            if (Array.isArray(stored)) {
                // Sort by timestamp (newest first) and limit to maxItems
                return stored
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, this.options.maxItems);
            }
        } catch (error) {
            console.warn('Failed to load search history:', error);
        }
        return [];
    }

    saveHistory() {
        try {
            StorageUtils.set(this.options.storageKey, this.history);
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    }

    addSearch(searchData) {
        const { input, region, matchId, timestamp = Date.now() } = searchData;
        
        if (!input) return;

        // Remove duplicate if exists
        this.history = this.history.filter(item => 
            !(item.input === input && item.region === region)
        );

        // Add new search to beginning
        this.history.unshift({
            input,
            region,
            matchId,
            timestamp
        });

        // Limit history size
        if (this.history.length > this.options.maxItems) {
            this.history = this.history.slice(0, this.options.maxItems);
        }

        this.saveHistory();
        this.render();
        this.setupEventListeners();
    }

    removeItem(index) {
        if (index >= 0 && index < this.history.length) {
            this.history.splice(index, 1);
            this.saveHistory();
            this.render();
            this.setupEventListeners();
        }
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.render();
        this.setupEventListeners();
    }

    selectHistoryItem(index) {
        if (index >= 0 && index < this.history.length) {
            const item = this.history[index];
            if (this.onHistorySelect) {
                this.onHistorySelect(item);
            }
        }
    }

    getRecentSearches() {
        return [...this.history]; // Return copy to prevent external modification
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return new Date(timestamp).toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public methods for external use
    setHistorySelectCallback(callback) {
        this.onHistorySelect = callback;
    }

    refresh() {
        this.history = this.loadHistory();
        this.render();
        this.setupEventListeners();
    }

    isEmpty() {
        return this.history.length === 0;
    }

    getHistoryCount() {
        return this.history.length;
    }
}
