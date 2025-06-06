// API Service Layer for Riot Games API Integration
import { PersistentCacheManager } from './cache.js';
import { ApiKeyManager, CorsProxyManager } from './utils.js';

export class APIService {
	constructor() {
		// API Configuration
		this.apiKey = this.getApiKey();
		this.corsProxyManager = CorsProxyManager;
		this.cache = new PersistentCacheManager();

		// Rate limiting
		this.rateLimitDelay = 1200; // 1.2 seconds between requests
		this.lastRequestTime = 0;
		this.requestQueue = [];
		this.isProcessingQueue = false;

		// Static data cache
		this.staticDataCache = new Map();
		this.datadragonVersion = '13.24.1'; // Latest patch version

		// Regional endpoints mapping
		this.regionalEndpoints = {
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
		};

		// Platform endpoints
		this.platformEndpoints = {
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
		};
	}

	// Get API key from storage or prompt user
	getApiKey() {
		let apiKey = ApiKeyManager.getStoredKey();

		if (!apiKey || !ApiKeyManager.isValidKeyFormat(apiKey)) {
			// Try to prompt user for API key
			apiKey = ApiKeyManager.promptForKey();

			if (!apiKey) {
				console.warn('No valid API key provided. Some features may not work.');
				return 'RGAPI-PLACEHOLDER-KEY';
			}
		}

		return apiKey;
	}

	// Set API key (for user configuration)
	setApiKey(apiKey) {
		if (ApiKeyManager.isValidKeyFormat(apiKey)) {
			this.apiKey = apiKey;
			ApiKeyManager.setKey(apiKey);
			return true;
		}
		return false;
	}

	// Check if API key is configured
	hasValidApiKey() {
		return this.apiKey && this.apiKey !== 'RGAPI-PLACEHOLDER-KEY' && ApiKeyManager.isValidKeyFormat(this.apiKey);
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
			return cached;
		}

		try {
			// Get match data from API
			const matchData = await this.fetchMatchData(region, matchId);

			// Transform and enrich the data
			const enrichedData = await this.enrichMatchData(matchData);

			// Cache the result
			this.cache.set(cacheKey, enrichedData, 30 * 60 * 1000); // 30 minutes

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
			return cached;
		}

		try {
			const timelineData = await this.fetchTimelineData(region, matchId);

			// Cache the result
			this.cache.set(cacheKey, timelineData, 30 * 60 * 1000); // 30 minutes

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
		// Use CORS proxy in development or when needed
		return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || window.location.hostname.includes('github.io');
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
}
