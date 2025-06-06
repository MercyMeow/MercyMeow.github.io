// API Service Layer for Riot Games API Integration
import { PersistentCacheManager } from './cache.js';
import { ApiKeyManager, CorsProxyManager } from './utils.js';
import { CONFIG, ConfigManager, ENVIRONMENT } from './config.js';

export class APIService {
	constructor() {
		// API Configuration using new config system
		this.apiKey = this.getApiKey();
		this.corsProxyManager = CorsProxyManager;
		this.cache = new PersistentCacheManager();

		// Rate limiting from config
		this.rateLimitDelay = CONFIG.API.RATE_LIMIT.DELAY_BETWEEN_REQUESTS;
		this.lastRequestTime = 0;
		this.requestQueue = [];
		this.isProcessingQueue = false;

		// Static data cache
		this.staticDataCache = new Map();
		this.datadragonVersion = CONFIG.DATA_DRAGON_VERSION;

		// Use endpoints from config
		this.regionalEndpoints = CONFIG.REGIONAL_ENDPOINTS;
		this.platformEndpoints = CONFIG.PLATFORM_ENDPOINTS;
	}

	// Get API key using new configuration hierarchy
	getApiKey() {
		// Use the new ConfigManager which handles the hierarchy:
		// 1. User's personal key (localStorage)
		// 2. Default config key
		// 3. Returns null if none available
		const apiKey = ConfigManager.getApiKey();

		if (apiKey) {
			return apiKey;
		}

		// If no key available, return placeholder
		console.warn('No valid API key configured. Some features may not work.');
		return 'RGAPI-PLACEHOLDER-KEY';
	}

	// Set API key (for user configuration)
	setApiKey(apiKey) {
		if (ConfigManager.isValidKeyFormat(apiKey)) {
			this.apiKey = apiKey;
			ConfigManager.setUserApiKey(apiKey);
			return true;
		}
		return false;
	}

	// Check if API key is configured
	hasValidApiKey() {
		return this.apiKey && this.apiKey !== 'RGAPI-PLACEHOLDER-KEY' && ConfigManager.isValidKeyFormat(this.apiKey);
	}

	// Get API key status information
	getApiKeyStatus() {
		const keySource = ConfigManager.getKeySource();
		const hasValid = this.hasValidApiKey();

		return {
			hasValidKey: hasValid,
			keySource: keySource,
			keyPreview: hasValid ? this.maskApiKey(this.apiKey) : null,
			message: this.getApiKeyStatusMessage(hasValid, keySource),
		};
	}

	// Get status message for API key
	getApiKeyStatusMessage(hasValid, keySource) {
		if (!hasValid) {
			return 'No valid API key configured. Please set your Riot API key.';
		}

		switch (keySource) {
			case 'user':
				return 'Using your personal API key.';
			case 'config':
				return 'Using default configuration API key.';
			default:
				return 'API key configured.';
		}
	}

	// Mask API key for display
	maskApiKey(key) {
		if (!key || key.length < 10) return key;
		return key.substring(0, 10) + '•'.repeat(Math.max(0, key.length - 15)) + key.substring(key.length - 5);
	}

	// Get regional endpoint for match data
	getRegionalEndpoint(region) {
		return this.regionalEndpoints[region] || 'americas';
	}

	// Get platform endpoint for region-specific data
	getPlatformEndpoint(region) {
		return this.platformEndpoints[region] || 'na1.api.riotgames.com';
	}

	// Main method to get complete match data
	async getMatchData(region, matchId) {
		const fullMatchId = `${region}_${matchId}`;
		const cacheKey = `match_${fullMatchId}`;

		// Check cache first
		const cached = this.cache.get(cacheKey);
		if (cached) {
			console.log(`Cache hit for match ${fullMatchId}`);
			return cached;
		}

		try {
			// Validate inputs
			if (!region || !matchId) {
				throw new Error('Region and match ID are required');
			}

			// Get match data from API
			console.log(`Fetching match data for ${fullMatchId}`);
			const matchData = await this.fetchMatchData(region, matchId);

			// Transform and enrich the data
			const enrichedData = await this.enrichMatchData(matchData);

			// Cache the result using config TTL
			const cacheTTL = CONFIG.API.CACHE.MATCH_DATA_TTL;
			this.cache.set(cacheKey, enrichedData, cacheTTL);
			console.log(`Cached match data for ${fullMatchId} (TTL: ${cacheTTL}ms)`);

			return enrichedData;
		} catch (error) {
			console.error('Error fetching match data:', error);
			throw this.handleApiError(error);
		}
	}

	// Get timeline data
	async getTimelineData(region, matchId) {
		const fullMatchId = `${region}_${matchId}`;
		const cacheKey = `timeline_${fullMatchId}`;

		// Check cache first
		const cached = this.cache.get(cacheKey);
		if (cached) {
			console.log(`Cache hit for timeline ${fullMatchId}`);
			return cached;
		}

		try {
			// Validate inputs
			if (!region || !matchId) {
				throw new Error('Region and match ID are required');
			}

			console.log(`Fetching timeline data for ${fullMatchId}`);
			const timelineData = await this.fetchTimelineData(region, matchId);

			// Cache the result using config TTL
			const cacheTTL = CONFIG.API.CACHE.MATCH_DATA_TTL;
			this.cache.set(cacheKey, timelineData, cacheTTL);
			console.log(`Cached timeline data for ${fullMatchId} (TTL: ${cacheTTL}ms)`);

			return timelineData;
		} catch (error) {
			console.error('Error fetching timeline data:', error);
			throw this.handleApiError(error);
		}
	}

	// Fetch raw match data from Riot API
	async fetchMatchData(region, matchId) {
		const regionalEndpoint = this.getRegionalEndpoint(region);
		const fullMatchId = `${region}_${matchId}`;
		const url = `https://${regionalEndpoint}.api.riotgames.com/lol/match/v5/matches/${fullMatchId}`;

		return await this.makeApiRequest(url);
	}

	// Fetch timeline data from Riot API
	async fetchTimelineData(region, matchId) {
		const regionalEndpoint = this.getRegionalEndpoint(region);
		const fullMatchId = `${region}_${matchId}`;
		const url = `https://${regionalEndpoint}.api.riotgames.com/lol/match/v5/matches/${fullMatchId}/timeline`;

		return await this.makeApiRequest(url);
	}

	// Make API request with rate limiting and error handling
	async makeApiRequest(url, retries = 3) {
		// Add to queue for rate limiting
		return new Promise((resolve, reject) => {
			this.requestQueue.push({
				url,
				retries,
				resolve,
				reject,
			});

			this.processQueue();
		});
	}

	// Process request queue with rate limiting
	async processQueue() {
		if (this.isProcessingQueue || this.requestQueue.length === 0) {
			return;
		}

		this.isProcessingQueue = true;

		while (this.requestQueue.length > 0) {
			const request = this.requestQueue.shift();

			try {
				// Rate limiting
				const timeSinceLastRequest = Date.now() - this.lastRequestTime;
				if (timeSinceLastRequest < this.rateLimitDelay) {
					await this.delay(this.rateLimitDelay - timeSinceLastRequest);
				}

				const response = await this.executeRequest(request.url);
				this.lastRequestTime = Date.now();

				request.resolve(response);
			} catch (error) {
				if (request.retries > 0 && this.shouldRetry(error)) {
					// Retry with exponential backoff
					const backoffDelay = Math.pow(2, 4 - request.retries) * 1000;
					await this.delay(backoffDelay);

					request.retries--;
					this.requestQueue.unshift(request); // Add back to front of queue
				} else {
					request.reject(error);
				}
			}
		}

		this.isProcessingQueue = false;
	}

	// Execute the actual HTTP request
	async executeRequest(url) {
		// Check if we have a valid API key
		if (!this.hasValidApiKey()) {
			throw new Error('No valid API key configured. Please set your Riot API key.');
		}

		const headers = {
			'X-Riot-Token': this.apiKey,
			Accept: 'application/json',
		};

		// Use CORS proxy for development
		const requestUrl = this.shouldUseCorsProxy() ? `${this.corsProxyManager.getCurrentProxy()}${url}` : url;

		try {
			const response = await fetch(requestUrl, {
				method: 'GET',
				headers: headers,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			// If CORS proxy fails, try switching to another one
			if (this.shouldUseCorsProxy() && error.message.includes('NetworkError')) {
				const newProxy = this.corsProxyManager.switchToNextProxy();
				console.log(`Switching to CORS proxy: ${newProxy}`);

				const retryUrl = `${newProxy}${url}`;
				const retryResponse = await fetch(retryUrl, {
					method: 'GET',
					headers: headers,
				});

				if (!retryResponse.ok) {
					throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
				}

				return await retryResponse.json();
			}

			throw error;
		}
	}

	// Check if we should use CORS proxy
	shouldUseCorsProxy() {
		// Use environment detection from config
		return ENVIRONMENT.shouldUseCorsProxy();
	}

	// Determine if error should trigger a retry
	shouldRetry(error) {
		const retryableErrors = [
			'NetworkError',
			'TimeoutError',
			'HTTP 429', // Rate limit
			'HTTP 500', // Server error
			'HTTP 502', // Bad gateway
			'HTTP 503', // Service unavailable
			'HTTP 504', // Gateway timeout
		];

		return retryableErrors.some((retryableError) => error.message.includes(retryableError));
	}

	// Enrich match data with static information
	async enrichMatchData(matchData) {
		try {
			// Get static data
			const [champions, items, spells] = await Promise.all([this.getChampionData(), this.getItemData(), this.getSummonerSpellData()]);

			// Enrich participant data
			const enrichedParticipants = matchData.info.participants.map((participant) => ({
				...participant,
				championName: champions[participant.championId]?.name || 'Unknown',
				championImage: this.getChampionImageUrl(champions[participant.championId]?.image?.full),
				spell1Name: spells[participant.summoner1Id]?.name || 'Unknown',
				spell2Name: spells[participant.summoner2Id]?.name || 'Unknown',
				spell1Image: this.getSummonerSpellImageUrl(spells[participant.summoner1Id]?.image?.full),
				spell2Image: this.getSummonerSpellImageUrl(spells[participant.summoner2Id]?.image?.full),
				items: this.enrichItemData(participant, items),
				kda: this.calculateKDA(participant.kills, participant.deaths, participant.assists),
				csPerMinute: this.calculateCSPerMinute(participant.totalMinionsKilled + participant.neutralMinionsKilled, matchData.info.gameDuration),
			}));

			return {
				...matchData,
				info: {
					...matchData.info,
					participants: enrichedParticipants,
					gameDurationFormatted: this.formatGameDuration(matchData.info.gameDuration),
					gameCreationFormatted: this.formatDate(matchData.info.gameCreation),
				},
			};
		} catch (error) {
			console.warn('Failed to enrich match data:', error);
			return matchData; // Return original data if enrichment fails
		}
	}

	// Get champion data from Data Dragon
	async getChampionData() {
		const cacheKey = 'champions';
		const cached = this.staticDataCache.get(cacheKey);
		if (cached) return cached;

		try {
			const url = `https://ddragon.leagueoflegends.com/cdn/${this.datadragonVersion}/data/en_US/champion.json`;
			const response = await fetch(url);
			const data = await response.json();

			// Convert to ID-based lookup
			const championsById = {};
			Object.values(data.data).forEach((champion) => {
				championsById[champion.key] = champion;
			});

			this.staticDataCache.set(cacheKey, championsById);
			return championsById;
		} catch (error) {
			console.error('Failed to fetch champion data:', error);
			return {};
		}
	}

	// Get item data from Data Dragon
	async getItemData() {
		const cacheKey = 'items';
		const cached = this.staticDataCache.get(cacheKey);
		if (cached) return cached;

		try {
			const url = `https://ddragon.leagueoflegends.com/cdn/${this.datadragonVersion}/data/en_US/item.json`;
			const response = await fetch(url);
			const data = await response.json();

			this.staticDataCache.set(cacheKey, data.data);
			return data.data;
		} catch (error) {
			console.error('Failed to fetch item data:', error);
			return {};
		}
	}

	// Get summoner spell data from Data Dragon
	async getSummonerSpellData() {
		const cacheKey = 'spells';
		const cached = this.staticDataCache.get(cacheKey);
		if (cached) return cached;

		try {
			const url = `https://ddragon.leagueoflegends.com/cdn/${this.datadragonVersion}/data/en_US/summoner.json`;
			const response = await fetch(url);
			const data = await response.json();

			// Convert to ID-based lookup
			const spellsById = {};
			Object.values(data.data).forEach((spell) => {
				spellsById[spell.key] = spell;
			});

			this.staticDataCache.set(cacheKey, spellsById);
			return spellsById;
		} catch (error) {
			console.error('Failed to fetch summoner spell data:', error);
			return {};
		}
	}

	// Utility methods for data processing
	enrichItemData(participant, items) {
		const itemSlots = ['item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6'];
		return itemSlots
			.map((slot) => {
				const itemId = participant[slot];
				if (itemId === 0) return null;

				const item = items[itemId];
				return item
					? {
							id: itemId,
							name: item.name,
							image: this.getItemImageUrl(item.image?.full),
							gold: item.gold?.total || 0,
					  }
					: null;
			})
			.filter((item) => item !== null);
	}

	calculateKDA(kills, deaths, assists) {
		if (deaths === 0) {
			return kills + assists; // Perfect KDA
		}
		return parseFloat(((kills + assists) / deaths).toFixed(2));
	}

	calculateCSPerMinute(totalCS, gameDurationSeconds) {
		const minutes = gameDurationSeconds / 60;
		return parseFloat((totalCS / minutes).toFixed(1));
	}

	formatGameDuration(seconds) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	formatDate(timestamp) {
		return new Date(timestamp).toLocaleString();
	}

	// Image URL generators
	getChampionImageUrl(imageName) {
		if (!imageName) return null;
		return `https://ddragon.leagueoflegends.com/cdn/${this.datadragonVersion}/img/champion/${imageName}`;
	}

	getItemImageUrl(imageName) {
		if (!imageName) return null;
		return `https://ddragon.leagueoflegends.com/cdn/${this.datadragonVersion}/img/item/${imageName}`;
	}

	getSummonerSpellImageUrl(imageName) {
		if (!imageName) return null;
		return `https://ddragon.leagueoflegends.com/cdn/${this.datadragonVersion}/img/spell/${imageName}`;
	}

	// Error handling
	handleApiError(error) {
		if (error.message.includes('HTTP 404')) {
			return new Error('Match not found. Please check the match ID and region.');
		}

		if (error.message.includes('HTTP 429')) {
			return new Error('Rate limit exceeded. Please wait a moment and try again.');
		}

		if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
			return new Error('Invalid API key. Please check your Riot API key configuration.');
		}

		if (error.message.includes('HTTP 500') || error.message.includes('HTTP 502') || error.message.includes('HTTP 503') || error.message.includes('HTTP 504')) {
			return new Error('Riot API is currently unavailable. Please try again later.');
		}

		if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
			return new Error('Network error. Please check your internet connection and try again.');
		}

		return new Error(`API Error: ${error.message}`);
	}

	// Utility method for delays
	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Clear cache
	clearCache() {
		this.cache.clear();
		this.staticDataCache.clear();
	}

	// Get cache statistics
	getCacheStats() {
		return {
			matchDataEntries: this.cache.size(),
			staticDataEntries: this.staticDataCache.size,
			cacheHitRate: this.cache.getHitRate(),
		};
	}

	// Test API connectivity and key validity
	async testApiConnection(region = 'NA1') {
		if (!this.hasValidApiKey()) {
			throw new Error('No valid API key configured');
		}

		try {
			// Test with a simple API call (champion rotations)
			const platformEndpoint = this.getPlatformEndpoint(region);
			const testUrl = `https://${platformEndpoint}/lol/platform/v3/champion-rotations`;

			console.log(`Testing API connection to ${testUrl}`);
			const response = await this.makeApiRequest(testUrl);

			return {
				success: true,
				message: 'API key is valid and working',
				region: region,
				endpoint: platformEndpoint,
				data: response,
			};
		} catch (error) {
			console.error('API connection test failed:', error);
			return {
				success: false,
				message: error.message,
				region: region,
				error: error,
			};
		}
	}

	// Get comprehensive API status
	async getApiStatus() {
		const keyStatus = this.getApiKeyStatus();
		const cacheStats = this.getCacheStats();

		let connectionTest = null;
		if (keyStatus.hasValidKey) {
			try {
				connectionTest = await this.testApiConnection();
			} catch (error) {
				connectionTest = {
					success: false,
					message: error.message,
					error: error,
				};
			}
		}

		return {
			apiKey: keyStatus,
			cache: cacheStats,
			connection: connectionTest,
			environment: {
				useCorsProxy: this.shouldUseCorsProxy(),
				currentProxy: this.shouldUseCorsProxy() ? this.corsProxyManager.getCurrentProxy() : null,
			},
		};
	}
}
