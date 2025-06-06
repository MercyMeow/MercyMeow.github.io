// Main Application Entry Point for League of Legends Match Analysis
import { Router } from './router.js';
import { APIService } from './api.js';
import { ApiKeyConfig } from './components/ApiKeyConfig.js';
import { SearchInterface } from './components/SearchInterface.js';
import { ApiKeyManager } from './utils.js';
import { CONFIG, ConfigManager } from './config.js';

class App {
	constructor() {
		this.router = new Router('/lol'); // Set base path for subdirectory
		this.apiService = new APIService();
		this.currentView = null;
		this.apiKeyConfig = null;
		this.searchInterface = null;

		this.initializeApp();
	}

	async initializeApp() {
		// Initialize router
		this.router.init();

		// Set up event listeners
		this.setupEventListeners();

		// Handle initial route
		this.handleRoute();

		// Listen for route changes
		window.addEventListener('popstate', () => this.handleRoute());
	}

	setupEventListeners() {
		// Retry button
		const retryButton = document.getElementById('retry-button');
		if (retryButton) {
			retryButton.addEventListener('click', () => this.handleRetry());
		}
	}

	handleSearch(searchData) {
		if (!searchData || !searchData.region || !searchData.matchId) {
			this.showError('Invalid search data');
			return;
		}

		// Navigate to match page using new format
		const matchUrl = this.router.generatePreferredMatchUrl(searchData.region, searchData.matchId);
		this.router.navigate(matchUrl);
	}

	async handleRoute() {
		const path = window.location.pathname;

		// Use router to extract parameters
		const routeParams = this.router.extractParams(path);

		if (routeParams.type === 'home') {
			this.showHome();
		} else if (routeParams.type === 'match') {
			// Validate the route
			const validation = this.router.validateRoute(routeParams);
			if (validation.valid) {
				await this.loadMatch(routeParams.region, routeParams.matchId);
			} else {
				this.showError(validation.error || 'Invalid match URL format');
			}
		} else if (routeParams.type === 'invalid') {
			// Handle invalid routes
			if (path.startsWith('/lol/')) {
				this.showError('Invalid URL format. Expected formats: /lol/REGIONMATCHID or /lol/match/REGION_MATCHID');
			} else {
				// Not a recognized route, redirect to /lol/
				window.location.href = '/lol/';
			}
		} else {
			// Fallback redirect
			window.location.href = '/lol/';
		}
	}

	async loadMatch(region, matchId) {
		try {
			// Check for demo mode (specific match ID for testing)
			if (matchId === 'DEMO123' || matchId === '7417459564') {
				this.showLoading();
				// Simulate loading delay
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await this.showMatch({
					matchData: this.getDemoMatchData(),
					timelineData: this.getDemoTimelineData(),
					region,
					matchId,
				});
				return;
			}

			// Check if API key is configured first
			if (!this.apiService.hasValidApiKey()) {
				this.showError('No API key configured. Please configure your Riot API key to view match data.', 'api');
				return;
			}

			this.showLoading();

			// Validate region
			if (!this.isValidRegion(region)) {
				throw new Error(`Invalid region: ${region}`);
			}

			// Load match data
			const matchData = await this.apiService.getMatchData(region, matchId);
			const timelineData = await this.apiService.getTimelineData(region, matchId);

			// Show match view
			this.showMatch({ matchData, timelineData, region, matchId });
		} catch (error) {
			console.error('Error loading match:', error);
			this.showError(error.message || 'Failed to load match data');
		}
	}

	isValidRegion(region) {
		const validRegions = ['EUW1', 'NA1', 'KR', 'EUN1', 'BR1', 'LA1', 'LA2', 'OC1', 'RU', 'TR1', 'JP1'];
		return validRegions.includes(region);
	}

	showHome() {
		this.hideAllScreens();
		const homeScreen = document.getElementById('home-screen');
		if (homeScreen) {
			homeScreen.classList.remove('hidden');

			// Check if API key is configured using new system
			if (!ConfigManager.hasValidApiKey()) {
				this.showApiKeyConfiguration();
			} else {
				this.initializeSearchInterface();
			}
		}
		this.currentView = 'home';
	}

	initializeSearchInterface() {
		const searchContainer = document.getElementById('enhanced-search-container');
		if (searchContainer && !this.searchInterface) {
			this.searchInterface = new SearchInterface(searchContainer, {
				showHistory: true,
				showSuggestions: true,
				autoDetectRegion: true,
				validateInput: true,
			});

			// Set up search callback
			this.searchInterface.setSearchCallback((searchData) => {
				this.handleSearch(searchData);
			});
		}
	}

	showApiKeyConfiguration() {
		const homeScreen = document.getElementById('home-screen');
		const searchContainer = homeScreen.querySelector('.search-container');

		// Hide search container and show API key config
		if (searchContainer) {
			searchContainer.style.display = 'none';
		}

		// Create API key config container if it doesn't exist
		let apiKeyContainer = homeScreen.querySelector('.api-key-container');
		if (!apiKeyContainer) {
			apiKeyContainer = document.createElement('div');
			apiKeyContainer.className = 'api-key-container';
			homeScreen.appendChild(apiKeyContainer);
		}

		// Initialize API key configuration component
		this.apiKeyConfig = new ApiKeyConfig(apiKeyContainer);
		this.apiKeyConfig.onApiKeyConfigured((apiKey) => {
			// Update API service with new key
			this.apiService.setApiKey(apiKey);

			// Show search container and hide API key config
			if (searchContainer) {
				searchContainer.style.display = 'block';
			}
			apiKeyContainer.style.display = 'none';

			// Initialize search interface now that API key is configured
			this.initializeSearchInterface();
		});
	}

	showLoading(message = 'Loading match data...') {
		this.hideAllScreens();
		const loadingScreen = document.getElementById('loading-screen');
		if (loadingScreen) {
			// Use the new LoadingSpinner component
			import('./components/LoadingSpinner.js').then(({ MatchLoadingSpinner }) => {
				loadingScreen.innerHTML = '';
				this.currentLoader = new MatchLoadingSpinner(loadingScreen);
				this.currentLoader.show();
			});
			loadingScreen.classList.remove('hidden');
		}
		this.currentView = 'loading';
	}

	showError(message, errorType = 'error') {
		this.hideAllScreens();
		const errorScreen = document.getElementById('error-screen');

		if (errorScreen) {
			// Use the new ErrorMessage component
			import('./components/ErrorMessage.js').then(({ ErrorMessage }) => {
				errorScreen.innerHTML = '';

				const customActions = [];

				// Add API key configuration action for API errors
				if (errorType === 'api') {
					customActions.push({
						id: 'configure-api-key',
						label: 'Configure API Key',
						icon: '🔑',
						handler: () => {
							this.router.navigate('/lol/');
						},
					});
				}

				const errorComponent = new ErrorMessage(errorScreen, {
					type: errorType,
					title: this.getErrorTitle(errorType),
					message: message,
					showTips: true,
					customActions: customActions,
				});

				errorComponent.setRetryHandler(() => this.handleRetry());
				errorComponent.setHomeHandler(() => this.router.navigate('/lol/'));
				errorScreen.classList.remove('hidden');
			});
		}
		this.currentView = 'error';
	}

	getErrorTitle(errorType) {
		const titles = {
			api: 'API Error',
			network: 'Connection Error',
			notfound: 'Match Not Found',
			ratelimit: 'Rate Limit Exceeded',
			error: 'Error',
		};
		return titles[errorType] || 'Error';
	}

	async showMatch(data) {
		this.hideAllScreens();
		const matchScreen = document.getElementById('match-screen');

		if (matchScreen) {
			// Clear previous content
			matchScreen.innerHTML = '';

			// Show match screen first
			matchScreen.classList.remove('hidden');

			// Create match view
			await this.renderMatchView(matchScreen, data);
		} else {
			console.error('❌ Match screen element not found!');
			this.showError('Unable to display match - screen element missing');
		}
		this.currentView = 'match';
	}

	async renderMatchView(container, data) {
		try {
			// Import components dynamically
			const [{ MatchHeader }, { TabContainer }] = await Promise.all([import('./components/MatchHeader.js'), import('./components/TabContainer.js')]);

			// Clear container and create sections
			container.innerHTML = `
				<div class="match-view">
					<div class="match-header-section"></div>
					<div class="match-tabs-section"></div>
					<div class="back-navigation">
						<a href="/lol/" class="home-link">← Back to Match Analysis</a>
						<a href="/" class="main-site-link">← Back to Main Site</a>
					</div>
				</div>
			`;

			// Initialize components
			const headerSection = container.querySelector('.match-header-section');
			const tabsSection = container.querySelector('.match-tabs-section');

			// Create match header
			new MatchHeader(headerSection, data.matchData);

			// Create tabbed interface
			await this.createMatchTabs(tabsSection, data);
		} catch (error) {
			console.error('❌ Error rendering match view:', error);
			container.innerHTML = `
				<div class="error-message">
					<h3>Error Loading Match</h3>
					<p>Failed to load match components: ${error.message}</p>
					<button onclick="window.location.reload()" class="retry-button">Retry</button>
				</div>
			`;
		}
	}

	async createMatchTabs(container, data) {
		const { TabContainer } = await import('./components/TabContainer.js');

		const tabs = [
			{
				label: 'Overview',
				icon: '📊',
				loadContent: async () => {
					const { OverviewTab } = await import('./components/tabs/OverviewTab.js');
					const tabContainer = document.createElement('div');
					new OverviewTab(tabContainer, data.matchData, data.timelineData);
					return tabContainer;
				},
			},
			{
				label: 'Timeline',
				icon: '⏱️',
				loadContent: async () => {
					const { TimelineTab } = await import('./components/tabs/TimelineTab.js');
					const tabContainer = document.createElement('div');
					new TimelineTab(tabContainer, data.matchData, data.timelineData);
					return tabContainer;
				},
			},
			{
				label: 'Builds',
				icon: '🛡️',
				loadContent: async () => {
					const { BuildsTab } = await import('./components/tabs/BuildsTab.js');
					const tabContainer = document.createElement('div');
					new BuildsTab(tabContainer, data.matchData, data.timelineData);
					return tabContainer;
				},
			},
			{
				label: 'Advanced',
				icon: '🔬',
				loadContent: async () => {
					const { AdvancedTab } = await import('./components/tabs/AdvancedTab.js');
					const tabContainer = document.createElement('div');
					new AdvancedTab(tabContainer, data.matchData, data.timelineData);
					return tabContainer;
				},
			},
		];

		// Create tab container
		new TabContainer(container, tabs, {
			defaultTab: 0,
			animated: true,
			responsive: true,
		});
	}

	hideAllScreens() {
		const screens = ['home-screen', 'loading-screen', 'error-screen', 'match-screen'];
		screens.forEach((screenId) => {
			const screen = document.getElementById(screenId);
			if (screen) {
				screen.classList.add('hidden');
			}
		});
	}

	handleRetry() {
		// Retry current operation based on current view
		if (this.currentView === 'error') {
			this.handleRoute();
		}
	}

	// Demo data for testing without API key
	getDemoMatchData() {
		return {
			info: {
				gameDuration: 1847, // ~30 minutes
				gameMode: 'CLASSIC',
				gameVersion: '13.24.1',
				gameCreation: Date.now() - 3600000, // 1 hour ago
				teams: [
					{
						teamId: 100,
						win: true,
						objectives: {
							baron: { kills: 1, first: true },
							dragon: { kills: 3, first: true },
							tower: { kills: 8, first: true },
							inhibitor: { kills: 2, first: false },
						},
					},
					{
						teamId: 200,
						win: false,
						objectives: {
							baron: { kills: 0, first: false },
							dragon: { kills: 1, first: false },
							tower: { kills: 3, first: false },
							inhibitor: { kills: 0, first: false },
						},
					},
				],
				participants: [
					// Blue Team
					{
						teamId: 100,
						championId: 157,
						championName: 'Yasuo',
						summonerName: 'DemoPlayer1',
						kills: 12,
						deaths: 3,
						assists: 8,
						totalMinionsKilled: 187,
						neutralMinionsKilled: 23,
						goldEarned: 15420,
						totalDamageDealtToChampions: 28450,
						visionScore: 18,
						item0: 3031,
						item1: 3006,
						item2: 3072,
						item3: 3026,
						item4: 3156,
						item5: 3139,
						item6: 3340,
						summoner1Id: 4,
						summoner2Id: 7,
					},
					{
						teamId: 100,
						championId: 64,
						championName: 'Lee Sin',
						summonerName: 'DemoPlayer2',
						kills: 8,
						deaths: 4,
						assists: 15,
						totalMinionsKilled: 145,
						neutralMinionsKilled: 89,
						goldEarned: 13200,
						totalDamageDealtToChampions: 19800,
						visionScore: 42,
						item0: 3074,
						item1: 3047,
						item2: 3053,
						item3: 3742,
						item4: 3193,
						item5: 0,
						item6: 3340,
						summoner1Id: 11,
						summoner2Id: 4,
					},
					{
						teamId: 100,
						championId: 103,
						championName: 'Ahri',
						summonerName: 'DemoPlayer3',
						kills: 9,
						deaths: 2,
						assists: 11,
						totalMinionsKilled: 201,
						neutralMinionsKilled: 12,
						goldEarned: 16800,
						totalDamageDealtToChampions: 32100,
						visionScore: 25,
						item0: 3020,
						item1: 3089,
						item2: 3135,
						item3: 3157,
						item4: 3165,
						item5: 3916,
						item6: 3340,
						summoner1Id: 4,
						summoner2Id: 14,
					},
					{
						teamId: 100,
						championId: 22,
						championName: 'Ashe',
						summonerName: 'DemoPlayer4',
						kills: 7,
						deaths: 1,
						assists: 13,
						totalMinionsKilled: 234,
						neutralMinionsKilled: 8,
						goldEarned: 17200,
						totalDamageDealtToChampions: 29600,
						visionScore: 31,
						item0: 3031,
						item1: 3006,
						item2: 3072,
						item3: 3033,
						item4: 3139,
						item5: 3156,
						item6: 3340,
						summoner1Id: 7,
						summoner2Id: 4,
					},
					{
						teamId: 100,
						championId: 412,
						championName: 'Thresh',
						summonerName: 'DemoPlayer5',
						kills: 2,
						deaths: 2,
						assists: 24,
						totalMinionsKilled: 32,
						neutralMinionsKilled: 0,
						goldEarned: 9800,
						totalDamageDealtToChampions: 8900,
						visionScore: 67,
						item0: 3190,
						item1: 3047,
						item2: 3109,
						item3: 3107,
						item4: 2065,
						item5: 0,
						item6: 3340,
						summoner1Id: 4,
						summoner2Id: 14,
					},
					// Red Team
					{
						teamId: 200,
						championId: 86,
						championName: 'Garen',
						summonerName: 'DemoPlayer6',
						kills: 4,
						deaths: 8,
						assists: 3,
						totalMinionsKilled: 156,
						neutralMinionsKilled: 15,
						goldEarned: 11200,
						totalDamageDealtToChampions: 15600,
						visionScore: 12,
						item0: 3071,
						item1: 3047,
						item2: 3053,
						item3: 3742,
						item4: 0,
						item5: 0,
						item6: 3340,
						summoner1Id: 12,
						summoner2Id: 4,
					},
					{
						teamId: 200,
						championId: 11,
						championName: 'Master Yi',
						summonerName: 'DemoPlayer7',
						kills: 6,
						deaths: 7,
						assists: 2,
						totalMinionsKilled: 134,
						neutralMinionsKilled: 67,
						goldEarned: 12400,
						totalDamageDealtToChampions: 18200,
						visionScore: 8,
						item0: 3124,
						item1: 3006,
						item2: 3072,
						item3: 3026,
						item4: 0,
						item5: 0,
						item6: 3340,
						summoner1Id: 11,
						summoner2Id: 4,
					},
					{
						teamId: 200,
						championId: 245,
						championName: 'Ekko',
						summonerName: 'DemoPlayer8',
						kills: 3,
						deaths: 6,
						assists: 5,
						totalMinionsKilled: 167,
						neutralMinionsKilled: 18,
						goldEarned: 10900,
						totalDamageDealtToChampions: 16800,
						visionScore: 15,
						item0: 3152,
						item1: 3020,
						item2: 3089,
						item3: 3135,
						item4: 0,
						item5: 0,
						item6: 3340,
						summoner1Id: 4,
						summoner2Id: 14,
					},
					{
						teamId: 200,
						championId: 51,
						championName: 'Caitlyn',
						summonerName: 'DemoPlayer9',
						kills: 2,
						deaths: 6,
						assists: 4,
						totalMinionsKilled: 189,
						neutralMinionsKilled: 5,
						goldEarned: 11800,
						totalDamageDealtToChampions: 19400,
						visionScore: 18,
						item0: 3031,
						item1: 3006,
						item2: 1018,
						item3: 0,
						item4: 0,
						item5: 0,
						item6: 3340,
						summoner1Id: 7,
						summoner2Id: 4,
					},
					{
						teamId: 200,
						championId: 25,
						championName: 'Morgana',
						summonerName: 'DemoPlayer10',
						kills: 1,
						deaths: 5,
						assists: 8,
						totalMinionsKilled: 28,
						neutralMinionsKilled: 0,
						goldEarned: 7600,
						totalDamageDealtToChampions: 12100,
						visionScore: 34,
						item0: 3190,
						item1: 3020,
						item2: 3089,
						item3: 0,
						item4: 0,
						item5: 0,
						item6: 3340,
						summoner1Id: 4,
						summoner2Id: 14,
					},
				],
			},
		};
	}

	getDemoTimelineData() {
		return {
			info: {
				frames: [
					// Simplified timeline data
					{ timestamp: 0 },
					{ timestamp: 60000 },
					{ timestamp: 120000 },
				],
			},
		};
	}
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	new App();
});
