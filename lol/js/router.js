// Client-side Router for handling navigation in /lol/ subdirectory
export class Router {
	constructor(basePath = '/lol') {
		this.routes = new Map();
		this.currentRoute = null;
		this.basePath = basePath;
	}

	init() {
		// Handle initial page load
		this.handleRoute();

		// Listen for browser navigation
		window.addEventListener('popstate', (event) => {
			this.handleRoute();
		});

		// Intercept link clicks for client-side navigation
		document.addEventListener('click', (event) => {
			if (event.target.matches('a[href^="/lol/"]') || event.target.matches('a[href^="/match/"]')) {
				event.preventDefault();
				const href = event.target.getAttribute('href');
				this.navigate(href);
			}
		});
	}

	// Register a route with a handler function
	addRoute(path, handler) {
		this.routes.set(path, handler);
	}

	// Navigate to a new route
	navigate(path, pushState = true) {
		if (pushState) {
			window.history.pushState({}, '', path);
		}
		this.handleRoute();
	}

	// Handle the current route
	handleRoute() {
		const path = window.location.pathname;
		this.currentRoute = path;

		// Dispatch custom event for route changes
		window.dispatchEvent(
			new CustomEvent('routechange', {
				detail: { path },
			})
		);
	}

	// Get current route information
	getCurrentRoute() {
		return {
			path: this.currentRoute,
			params: this.extractParams(this.currentRoute),
		};
	}

	// Extract parameters from route path
	extractParams(path) {
		// Handle /lol/ base path
		if (path === '/lol' || path === '/lol/') {
			return { type: 'home' };
		}

		// Handle new /match/[matchid] route format
		if (path.startsWith('/match/')) {
			const matchPath = path.replace('/match/', '');
			return this.parseMatchIdFromPath(matchPath);
		}

		// Handle legacy /lol/REGIONMATCHID format (backward compatibility)
		if (path.startsWith('/lol/')) {
			const matchPath = path.replace('/lol/', '');
			const matchPattern = /^([A-Z0-9]+)(\d+)$/;
			const matchResult = matchPath.match(matchPattern);

			if (matchResult) {
				return {
					type: 'match',
					region: matchResult[1],
					matchId: matchResult[2],
					fullMatchId: `${matchResult[1]}_${matchResult[2]}`,
				};
			}
		}

		// Invalid route
		return { type: 'invalid', path };
	}

	// Parse match ID from path - supports multiple formats
	parseMatchIdFromPath(matchPath) {
		// Support formats: REGION_MATCHID, REGION-MATCHID, REGIONMATCHID
		const patterns = [
			/^([A-Z0-9]+)[_-](\d+)$/, // EUW1_4358345 or EUW1-4358345
			/^([A-Z0-9]+)(\d+)$/, // EUW14358345
		];

		for (const pattern of patterns) {
			const match = matchPath.match(pattern);
			if (match) {
				return {
					type: 'match',
					region: match[1],
					matchId: match[2],
					fullMatchId: `${match[1]}_${match[2]}`,
				};
			}
		}

		return { type: 'invalid', path: `/match/${matchPath}` };
	}

	// Validate route parameters
	validateRoute(params) {
		if (params.type === 'home') {
			return { valid: true };
		}

		if (params.type === 'match') {
			// Validate region
			const validRegions = ['EUW1', 'NA1', 'KR', 'EUN1', 'BR1', 'LA1', 'LA2', 'OC1', 'RU', 'TR1', 'JP1'];

			if (!validRegions.includes(params.region)) {
				return {
					valid: false,
					error: `Invalid region: ${params.region}. Valid regions: ${validRegions.join(', ')}`,
				};
			}

			// Validate match ID (should be numeric and reasonable length)
			if (!/^\d{7,15}$/.test(params.matchId)) {
				return {
					valid: false,
					error: `Invalid match ID: ${params.matchId}. Should be 7-15 digits.`,
				};
			}

			return { valid: true };
		}

		return {
			valid: false,
			error: `Invalid route: ${params.path}`,
		};
	}

	// Generate URL for match (legacy format)
	generateMatchUrl(region, matchId) {
		return `/lol/${region}${matchId}`;
	}

	// Generate URL for match (new format)
	generateNewMatchUrl(region, matchId) {
		return `/match/${region}_${matchId}`;
	}

	// Generate URL for match (preferred format based on input)
	generatePreferredMatchUrl(region, matchId) {
		// Use new format by default
		return this.generateNewMatchUrl(region, matchId);
	}

	// Parse match URL or ID input
	parseMatchInput(input) {
		if (!input || typeof input !== 'string') {
			return null;
		}

		input = input.trim();

		// Handle full URLs
		if (input.includes('://')) {
			try {
				const url = new URL(input);
				return this.extractParams(url.pathname);
			} catch (error) {
				return null;
			}
		}

		// Handle path-like input
		if (input.startsWith('/')) {
			return this.extractParams(input);
		}

		// Handle match ID formats: REGION_MATCHID or REGIONMATCHID
		const patterns = [
			/^([A-Z0-9]+)[_-](\d+)$/, // EUW1_4358345 or EUW1-4358345
			/^([A-Z0-9]+)(\d+)$/, // EUW14358345
		];

		for (const pattern of patterns) {
			const match = input.match(pattern);
			if (match) {
				return {
					type: 'match',
					region: match[1],
					matchId: match[2],
					fullMatchId: `${match[1]}_${match[2]}`,
				};
			}
		}

		return null;
	}

	// Get back button URL
	getBackUrl() {
		const params = this.extractParams(this.currentRoute);

		if (params.type === 'match') {
			return '/lol/';
		}

		return '/lol/';
	}

	// Check if current route is home
	isHome() {
		const params = this.extractParams(this.currentRoute);
		return params.type === 'home';
	}

	// Check if current route is a match
	isMatch() {
		const params = this.extractParams(this.currentRoute);
		return params.type === 'match';
	}

	// Get current match info if on match route
	getCurrentMatch() {
		const params = this.extractParams(this.currentRoute);

		if (params.type === 'match') {
			return {
				region: params.region,
				matchId: params.matchId,
				fullMatchId: params.fullMatchId,
			};
		}

		return null;
	}

	// Update page title based on current route
	updateTitle(customTitle = null) {
		const params = this.extractParams(this.currentRoute);

		if (customTitle) {
			document.title = customTitle;
			return;
		}

		switch (params.type) {
			case 'home':
				document.title = 'League of Legends Match Analysis';
				break;
			case 'match':
				document.title = `Match ${params.fullMatchId} - LoL Analysis`;
				break;
			default:
				document.title = 'League of Legends Match Analysis';
		}
	}
}
