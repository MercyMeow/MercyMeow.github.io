// Main Application Entry Point
import { Router } from './router.js';
import { APIService } from './api.js';
import { ApiKeyConfig } from './components/ApiKeyConfig.js';
import { SearchInterface } from './components/SearchInterface.js';
import { ApiKeyManager } from './utils.js';

class App {
	constructor() {
		this.router = new Router();
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

		// Navigate to match page
		const matchUrl = `/${searchData.region}${searchData.matchId}`;
		this.router.navigate(matchUrl);
	}

	async handleRoute() {
		const path = window.location.pathname;

		if (path === '/' || path === '') {
			this.showHome();
		} else {
			// Parse match route
			const routeMatch = path.match(/^\/([A-Z0-9]+)(\d+)$/);
			if (routeMatch) {
				const region = routeMatch[1];
				const matchId = routeMatch[2];
				await this.loadMatch(region, matchId);
			} else {
				this.showError('Invalid URL format. Expected format: /REGION_MATCHID');
			}
		}
	}

	async loadMatch(region, matchId) {
		try {
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

			// Check if API key is configured
			if (!ApiKeyManager.getStoredKey()) {
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

				const errorComponent = new ErrorMessage(errorScreen, {
					type: errorType,
					title: this.getErrorTitle(errorType),
					message: message,
					showTips: true,
				});

				errorComponent.setRetryHandler(() => this.handleRetry());
				errorComponent.setHomeHandler(() => this.router.navigate('/'));
				errorComponent.show();
			});
			errorScreen.classList.remove('hidden');
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

	showMatch(data) {
		this.hideAllScreens();
		const matchScreen = document.getElementById('match-screen');

		if (matchScreen) {
			// Clear previous content
			matchScreen.innerHTML = '';

			// Create match view (will be implemented in next task)
			this.renderMatchView(matchScreen, data);

			matchScreen.classList.remove('hidden');
		}
		this.currentView = 'match';
	}

	renderMatchView(container, data) {
		// Import components dynamically
		import('./components/MatchHeader.js').then(({ MatchHeader }) => {
			import('./components/TabContainer.js').then(({ TabContainer }) => {
				// Clear container and create sections
				container.innerHTML = `
					<div class="match-view">
						<div class="match-header-section"></div>
						<div class="match-tabs-section"></div>
						<div class="back-navigation">
							<a href="/" class="home-link">← Back to Home</a>
						</div>
					</div>
				`;

				// Initialize components
				const headerSection = container.querySelector('.match-header-section');
				const tabsSection = container.querySelector('.match-tabs-section');

				// Create match header
				new MatchHeader(headerSection, data.matchData);

				// Create tabbed interface
				this.createMatchTabs(tabsSection, data);
			});
		});
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

	renderPlayerCards(container, matchData) {
		import('./components/PlayerCard.js').then(({ PlayerCard }) => {
			const participants = matchData.info.participants;
			const gameDuration = matchData.info.gameDuration;

			// Sort participants by team and performance
			const sortedParticipants = participants.sort((a, b) => {
				if (a.teamId !== b.teamId) {
					return a.teamId - b.teamId; // Team 100 first, then 200
				}
				// Within team, sort by KDA
				const aKDA = a.kda || (a.kills + a.assists) / Math.max(a.deaths, 1);
				const bKDA = b.kda || (b.kills + b.assists) / Math.max(b.deaths, 1);
				return bKDA - aKDA;
			});

			// Create player cards
			sortedParticipants.forEach((participant) => {
				const playerContainer = document.createElement('div');
				playerContainer.className = 'player-container';
				container.appendChild(playerContainer);

				new PlayerCard(playerContainer, participant, gameDuration);
			});
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	new App();
});
