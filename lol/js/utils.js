// Utility functions for the League of Legends Match Analysis application
import { ConfigManager } from './config.js';

// Validation utilities for search input
export class ValidationUtils {
	static validateMatchInput(input) {
		if (!input || typeof input !== 'string') {
			return {
				isValid: false,
				message: 'Please enter a match ID or URL',
			};
		}

		const trimmed = input.trim();

		// Check if it's a URL
		if (this.isUrl(trimmed)) {
			return this.validateMatchUrl(trimmed);
		}

		// Check if it's a match ID
		return this.validateMatchId(trimmed);
	}

	static validateMatchId(matchId) {
		// Match ID format: REGION_MATCHNUMBER
		const matchIdPattern = /^([A-Z]{2,4}\d?)_(\d{8,15})$/i;
		const match = matchId.match(matchIdPattern);

		if (!match) {
			return {
				isValid: false,
				message: 'Invalid match ID format. Expected: REGION_MATCHNUMBER (e.g., EUW1_4358345)',
			};
		}

		const [, region, matchNumber] = match;
		const validRegions = ['EUW1', 'NA1', 'KR', 'EUN1', 'BR1', 'LA1', 'LA2', 'OC1', 'RU', 'TR1', 'JP1'];

		if (!validRegions.includes(region.toUpperCase())) {
			return {
				isValid: false,
				message: `Invalid region "${region}". Valid regions: ${validRegions.join(', ')}`,
			};
		}

		return {
			isValid: true,
			message: `Valid match ID for ${region.toUpperCase()}`,
			detectedRegion: region.toUpperCase(),
			matchId: matchNumber,
			region: region.toUpperCase(),
		};
	}

	static validateMatchUrl(url) {
		try {
			const urlObj = new URL(url);

			// Check if it's a League of Legends related domain
			const validDomains = ['leagueoflegends.com', 'na.leagueoflegends.com', 'euw.leagueoflegends.com', 'eune.leagueoflegends.com', 'kr.leagueoflegends.com', 'br.leagueoflegends.com', 'lan.leagueoflegends.com', 'las.leagueoflegends.com', 'oce.leagueoflegends.com', 'ru.leagueoflegends.com', 'tr.leagueoflegends.com', 'jp.leagueoflegends.com'];

			const isValidDomain = validDomains.some((domain) => urlObj.hostname.includes(domain));

			if (!isValidDomain) {
				return {
					isValid: false,
					message: 'URL must be from a League of Legends domain',
				};
			}

			// Extract match information from URL
			const matchInfo = this.extractMatchFromUrl(url);
			if (matchInfo) {
				return {
					isValid: true,
					message: `Valid match URL for ${matchInfo.region}`,
					detectedRegion: matchInfo.region,
					matchId: matchInfo.matchId,
					region: matchInfo.region,
				};
			} else {
				return {
					isValid: false,
					message: 'Could not extract match information from URL',
				};
			}
		} catch (error) {
			return {
				isValid: false,
				message: 'Invalid URL format',
			};
		}
	}

	static isUrl(input) {
		try {
			new URL(input);
			return true;
		} catch {
			return false;
		}
	}

	static extractMatchFromUrl(url) {
		// Extract match ID and region from various URL formats
		const patterns = [
			// Standard match URL pattern
			/\/match\/([A-Z]{2,4}\d?)\/(\d{8,15})/i,
			// Alternative patterns
			/matchId=([A-Z]{2,4}\d?)_(\d{8,15})/i,
			/match[=\/]([A-Z]{2,4}\d?)_(\d{8,15})/i,
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) {
				const [, region, matchId] = match;
				return {
					region: region.toUpperCase(),
					matchId: matchId,
				};
			}
		}

		// Try to extract from URL parameters
		try {
			const urlObj = new URL(url);
			const params = new URLSearchParams(urlObj.search);

			for (const [key, value] of params) {
				if (key.toLowerCase().includes('match')) {
					const matchResult = this.validateMatchId(value);
					if (matchResult.isValid) {
						return {
							region: matchResult.region,
							matchId: matchResult.matchId,
						};
					}
				}
			}
		} catch (error) {
			// Ignore URL parsing errors
		}

		return null;
	}

	static parseMatchInput(input, fallbackRegion = '') {
		const validation = this.validateMatchInput(input);

		if (!validation.isValid) {
			return null;
		}

		return {
			region: validation.detectedRegion || fallbackRegion,
			matchId: validation.matchId,
			originalInput: input,
		};
	}

	static formatMatchId(region, matchId) {
		return `${region}_${matchId}`;
	}

	static getRegionFromDomain(hostname) {
		const regionMap = {
			'na.leagueoflegends.com': 'NA1',
			'euw.leagueoflegends.com': 'EUW1',
			'eune.leagueoflegends.com': 'EUN1',
			'kr.leagueoflegends.com': 'KR',
			'br.leagueoflegends.com': 'BR1',
			'lan.leagueoflegends.com': 'LA1',
			'las.leagueoflegends.com': 'LA2',
			'oce.leagueoflegends.com': 'OC1',
			'ru.leagueoflegends.com': 'RU',
			'tr.leagueoflegends.com': 'TR1',
			'jp.leagueoflegends.com': 'JP1',
		};

		return regionMap[hostname] || 'EUW1'; // Default to EUW1
	}
}

// API Key management - Enhanced with configuration support
export class ApiKeyManager {
	static getStoredKey() {
		// Use ConfigManager for the full hierarchy
		return ConfigManager.getApiKey();
	}

	static setKey(apiKey) {
		// Set user's personal API key
		return ConfigManager.setUserApiKey(apiKey);
	}

	static removeKey() {
		ConfigManager.removeUserApiKey();
	}

	static isValidKeyFormat(apiKey) {
		return ConfigManager.isValidKeyFormat(apiKey);
	}

	static hasValidKey() {
		return ConfigManager.hasValidApiKey();
	}

	static getKeySource() {
		return ConfigManager.getKeySource();
	}

	static promptForKey() {
		const keySource = this.getKeySource();
		let message = 'Please enter your Riot API key:\n\n';

		if (keySource === 'config') {
			message += 'Note: A default API key is configured, but you can override it with your personal key.\n\n';
		}

		message += '1. Go to https://developer.riotgames.com/\n' + '2. Sign in with your Riot account\n' + '3. Create a new app or use an existing one\n' + '4. Copy your API key (starts with RGAPI-)\n\n' + 'Note: Development keys expire every 24 hours.';

		const key = prompt(message);

		if (key && this.isValidKeyFormat(key)) {
			this.setKey(key);
			return key;
		}

		return null;
	}
}

// CORS proxy management
export class CorsProxyManager {
	static proxies = ['https://cors-anywhere.herokuapp.com/', 'https://api.allorigins.win/raw?url=', 'https://corsproxy.io/?'];

	static currentProxyIndex = 0;

	static getCurrentProxy() {
		return this.proxies[this.currentProxyIndex];
	}

	static switchToNextProxy() {
		this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
		return this.getCurrentProxy();
	}

	static testProxy(proxyUrl, testUrl = 'https://httpbin.org/get') {
		return new Promise((resolve) => {
			const timeout = setTimeout(() => resolve(false), 5000);

			fetch(proxyUrl + testUrl)
				.then((response) => {
					clearTimeout(timeout);
					resolve(response.ok);
				})
				.catch(() => {
					clearTimeout(timeout);
					resolve(false);
				});
		});
	}

	static async findWorkingProxy() {
		for (let i = 0; i < this.proxies.length; i++) {
			const proxy = this.proxies[i];
			const works = await this.testProxy(proxy);
			if (works) {
				this.currentProxyIndex = i;
				return proxy;
			}
		}
		return null;
	}
}

// Data formatting utilities
export class DataFormatter {
	static formatDuration(seconds) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	static formatDate(timestamp, options = {}) {
		const date = new Date(timestamp);
		const defaultOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		};
		return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
	}

	static formatNumber(number, decimals = 0) {
		return number.toLocaleString('en-US', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		});
	}

	static formatPercentage(value, total, decimals = 1) {
		if (total === 0) return '0%';
		const percentage = (value / total) * 100;
		return `${percentage.toFixed(decimals)}%`;
	}

	static formatKDA(kills, deaths, assists) {
		if (deaths === 0) {
			return `${kills}/${deaths}/${assists} (Perfect)`;
		}
		const kda = ((kills + assists) / deaths).toFixed(2);
		return `${kills}/${deaths}/${assists} (${kda})`;
	}

	static formatGold(gold) {
		if (gold >= 1000) {
			return `${(gold / 1000).toFixed(1)}k`;
		}
		return gold.toString();
	}

	static formatCS(cs, gameDurationSeconds) {
		const csPerMinute = (cs / (gameDurationSeconds / 60)).toFixed(1);
		return `${cs} (${csPerMinute}/min)`;
	}
}

// Color utilities for team/player identification
export class ColorUtils {
	static teamColors = {
		100: '#4a90e2', // Blue team
		200: '#e74c3c', // Red team
	};

	static getTeamColor(teamId) {
		return this.teamColors[teamId] || '#666666';
	}

	static getKDAColor(kda) {
		if (kda >= 3) return '#2ecc71'; // Green for good KDA
		if (kda >= 2) return '#f39c12'; // Orange for average KDA
		if (kda >= 1) return '#e67e22'; // Dark orange for below average
		return '#e74c3c'; // Red for poor KDA
	}

	static getCSColor(csPerMinute) {
		if (csPerMinute >= 8) return '#2ecc71'; // Green for excellent CS
		if (csPerMinute >= 6) return '#f39c12'; // Orange for good CS
		if (csPerMinute >= 4) return '#e67e22'; // Dark orange for average CS
		return '#e74c3c'; // Red for poor CS
	}

	static getWinrateColor(winrate) {
		if (winrate >= 70) return '#2ecc71';
		if (winrate >= 60) return '#27ae60';
		if (winrate >= 50) return '#f39c12';
		if (winrate >= 40) return '#e67e22';
		return '#e74c3c';
	}
}

// URL and routing utilities
export class UrlUtils {
	static parseMatchUrl(url) {
		try {
			const urlObj = new URL(url);
			const pathMatch = urlObj.pathname.match(/\/([A-Z0-9]+)(\d+)/);
			if (pathMatch) {
				return {
					region: pathMatch[1],
					matchId: pathMatch[2],
				};
			}
		} catch (error) {
			// Not a valid URL, try parsing as path
			const pathMatch = url.match(/^\/([A-Z0-9]+)(\d+)$/);
			if (pathMatch) {
				return {
					region: pathMatch[1],
					matchId: pathMatch[2],
				};
			}
		}
		return null;
	}

	static buildMatchUrl(region, matchId) {
		return `/lol/${region}${matchId}`;
	}

	static isValidRegion(region) {
		const validRegions = ['EUW1', 'NA1', 'KR', 'EUN1', 'BR1', 'LA1', 'LA2', 'OC1', 'RU', 'TR1', 'JP1'];
		return validRegions.includes(region);
	}

	static isValidMatchId(matchId) {
		return /^\d{7,15}$/.test(matchId);
	}
}

// Performance monitoring utilities
export class PerformanceMonitor {
	static timers = new Map();

	static start(label) {
		this.timers.set(label, performance.now());
	}

	static end(label) {
		const startTime = this.timers.get(label);
		if (startTime) {
			const duration = performance.now() - startTime;
			this.timers.delete(label);
			console.log(`${label}: ${duration.toFixed(2)}ms`);
			return duration;
		}
		return null;
	}

	static measure(label, fn) {
		this.start(label);
		const result = fn();
		this.end(label);
		return result;
	}

	static async measureAsync(label, fn) {
		this.start(label);
		const result = await fn();
		this.end(label);
		return result;
	}
}

// Local storage utilities
export class StorageUtils {
	static set(key, value, expirationMs = null) {
		const item = {
			value: value,
			timestamp: Date.now(),
			expiration: expirationMs ? Date.now() + expirationMs : null,
		};
		localStorage.setItem(key, JSON.stringify(item));
	}

	static get(key) {
		try {
			const item = JSON.parse(localStorage.getItem(key));
			if (!item) return null;

			if (item.expiration && Date.now() > item.expiration) {
				localStorage.removeItem(key);
				return null;
			}

			return item.value;
		} catch (error) {
			return null;
		}
	}

	static remove(key) {
		localStorage.removeItem(key);
	}

	static clear() {
		localStorage.clear();
	}

	static getSize() {
		let total = 0;
		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				total += localStorage[key].length + key.length;
			}
		}
		return total;
	}
}

// Error handling utilities
export class ErrorHandler {
	static createUserFriendlyError(error) {
		if (error.message.includes('404')) {
			return 'Match not found. Please check the match ID and region.';
		}

		if (error.message.includes('429')) {
			return 'Too many requests. Please wait a moment and try again.';
		}

		if (error.message.includes('401') || error.message.includes('403')) {
			return 'Invalid API key. Please check your Riot API key.';
		}

		if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
			return 'Riot API is temporarily unavailable. Please try again later.';
		}

		if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
			return 'Network error. Please check your internet connection.';
		}

		return 'An unexpected error occurred. Please try again.';
	}

	static logError(error, context = '') {
		console.error(`Error ${context}:`, error);

		// In production, you might want to send errors to a logging service
		// this.sendToLoggingService(error, context);
	}
}
