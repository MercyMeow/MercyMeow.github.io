// Configuration file for League of Legends Match Analysis Application
// This file contains default settings and can be safely committed to the repository

/**
 * API Configuration
 *
 * SECURITY NOTICE:
 * This configuration file is committed to the repository and is publicly visible.
 * The API key stored here will be exposed to all users of the application.
 *
 * For production use:
 * 1. Use a dedicated API key for public demo purposes
 * 2. Monitor rate limits and usage
 * 3. Users can override with their own API keys via the UI
 * 4. Consider implementing server-side proxy for production applications
 */

export const CONFIG = {
	// Default Riot API Key for demo purposes
	// Users can override this with their own key through the application UI
	// Get your own key at: https://developer.riotgames.com/
	DEFAULT_API_KEY: 'RGAPI-DEMO-KEY-REPLACE-WITH-ACTUAL-KEY',

	// API Configuration
	API: {
		// Rate limiting settings (requests per time period)
		RATE_LIMIT: {
			REQUESTS_PER_PERIOD: 100,
			PERIOD_SECONDS: 120, // 2 minutes
			DELAY_BETWEEN_REQUESTS: 1200, // 1.2 seconds
		},

		// Cache settings
		CACHE: {
			MATCH_DATA_TTL: 30 * 60 * 1000, // 30 minutes
			STATIC_DATA_TTL: 24 * 60 * 60 * 1000, // 24 hours
			ENABLED: true,
		},

		// Retry settings
		RETRY: {
			MAX_RETRIES: 3,
			BACKOFF_MULTIPLIER: 2,
			BASE_DELAY: 1000, // 1 second
		},
	},

	// Application Settings
	APP: {
		// Default region for match searches
		DEFAULT_REGION: 'EUW1',

		// Demo match for testing (region + match ID)
		DEMO_MATCH: {
			REGION: 'EUW1',
			MATCH_ID: '7417459564',
			FULL_ID: 'EUW1_7417459564',
		},

		// UI Settings
		UI: {
			// Loading timeout in milliseconds
			LOADING_TIMEOUT: 30000, // 30 seconds

			// Animation settings
			ANIMATIONS_ENABLED: true,

			// Default tab for match view
			DEFAULT_TAB: 0, // Overview tab
		},
	},

	// CORS Proxy settings for development
	CORS_PROXIES: ['https://cors-anywhere.herokuapp.com/', 'https://api.allorigins.win/raw?url=', 'https://corsproxy.io/?'],

	// Data Dragon version for static assets
	DATA_DRAGON_VERSION: '15.5.1',

	// Valid regions for validation
	VALID_REGIONS: ['EUW1', 'NA1', 'KR', 'EUN1', 'BR1', 'LA1', 'LA2', 'OC1', 'RU', 'TR1', 'JP1'],

	// Regional endpoint mapping
	REGIONAL_ENDPOINTS: {
		EUW1: 'europe',
		NA1: 'americas',
		KR: 'asia',
		EUN1: 'europe',
		BR1: 'americas',
		LA1: 'americas',
		LA2: 'americas',
		OC1: 'asia',
		RU: 'europe',
		TR1: 'europe',
		JP1: 'asia',
	},

	// Platform endpoints
	PLATFORM_ENDPOINTS: {
		EUW1: 'euw1.api.riotgames.com',
		NA1: 'na1.api.riotgames.com',
		KR: 'kr.api.riotgames.com',
		EUN1: 'eun1.api.riotgames.com',
		BR1: 'br1.api.riotgames.com',
		LA1: 'la1.api.riotgames.com',
		LA2: 'la2.api.riotgames.com',
		OC1: 'oc1.api.riotgames.com',
		RU: 'ru.api.riotgames.com',
		TR1: 'tr1.api.riotgames.com',
		JP1: 'jp1.api.riotgames.com',
	},
};

/**
 * Environment Detection
 */
export const ENVIRONMENT = {
	isDevelopment: () => {
		return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
	},

	isGitHubPages: () => {
		return window.location.hostname.includes('github.io');
	},

	shouldUseCorsProxy: () => {
		return ENVIRONMENT.isDevelopment() || ENVIRONMENT.isGitHubPages();
	},
};

/**
 * API Key Management
 * Provides a hierarchy for API key resolution:
 * 1. User-configured key (localStorage)
 * 2. Default configuration key
 * 3. Prompt user for key
 */
export class ConfigManager {
	static getApiKey() {
		// First, try to get user's personal API key from localStorage
		const userKey = localStorage.getItem('riot_api_key');
		if (userKey && this.isValidKeyFormat(userKey)) {
			return userKey;
		}

		// Second, use default configuration key
		if (CONFIG.DEFAULT_API_KEY && CONFIG.DEFAULT_API_KEY !== 'RGAPI-DEMO-KEY-REPLACE-WITH-ACTUAL-KEY' && this.isValidKeyFormat(CONFIG.DEFAULT_API_KEY)) {
			return CONFIG.DEFAULT_API_KEY;
		}

		// Third, return placeholder (will trigger user prompt in API service)
		return null;
	}

	static setUserApiKey(apiKey) {
		if (this.isValidKeyFormat(apiKey)) {
			localStorage.setItem('riot_api_key', apiKey);
			return true;
		}
		return false;
	}

	static removeUserApiKey() {
		localStorage.removeItem('riot_api_key');
	}

	static isValidKeyFormat(apiKey) {
		return /^RGAPI-[a-zA-Z0-9_-]+$/.test(apiKey);
	}

	static hasValidApiKey() {
		const key = this.getApiKey();
		return key && this.isValidKeyFormat(key);
	}

	static getKeySource() {
		const userKey = localStorage.getItem('riot_api_key');
		if (userKey && this.isValidKeyFormat(userKey)) {
			return 'user';
		}

		if (CONFIG.DEFAULT_API_KEY && CONFIG.DEFAULT_API_KEY !== 'RGAPI-DEMO-KEY-REPLACE-WITH-ACTUAL-KEY' && this.isValidKeyFormat(CONFIG.DEFAULT_API_KEY)) {
			return 'config';
		}

		return 'none';
	}
}

// Export default configuration
export default CONFIG;
