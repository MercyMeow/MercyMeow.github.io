// Advanced Tab Component - Displays advanced statistics and detailed analysis
import { DataFormatter, ColorUtils } from '../../utils.js';
import { ChartManager } from '../ChartManager.js';

export class AdvancedTab {
	constructor(container, matchData, timelineData) {
		this.container = container;
		this.matchData = matchData;
		this.timelineData = timelineData;
		this.selectedMetric = 'damage';
		this.chartManager = new ChartManager();
		this.render();
		this.setupEventListeners();
	}

	render() {
		this.container.innerHTML = `
            <div class="advanced-tab">
                <div class="advanced-header">
                    <h3>Advanced Statistics</h3>
                    <div class="metric-selector">
                        <label for="metric-select">View:</label>
                        <select id="metric-select">
                            <option value="damage">Damage Analysis</option>
                            <option value="vision">Vision Control</option>
                            <option value="economy">Economy & Efficiency</option>
                            <option value="positioning">Positioning & Map Control</option>
                            <option value="teamfight">Teamfight Analysis</option>
                        </select>
                    </div>
                </div>

                <div class="advanced-content">
                    ${this.renderSelectedMetric()}
                </div>
            </div>
        `;

		// Initialize charts after DOM is rendered
		setTimeout(() => this.initializeCharts(), 100);
	}

	initializeCharts() {
		// Destroy existing charts
		this.chartManager.destroyAllCharts();

		// Create charts based on selected metric
		if (this.selectedMetric === 'damage') {
			this.initializeDamageCharts();
		} else if (this.selectedMetric === 'vision') {
			this.initializeVisionCharts();
		}
	}

	initializeDamageCharts() {
		const damageContainer = this.container.querySelector('#damage-distribution-chart');
		const performanceContainer = this.container.querySelector('#performance-comparison-chart');

		if (damageContainer && this.matchData) {
			this.chartManager.createDamageDistributionChart(damageContainer, this.matchData);
		}

		if (performanceContainer && this.matchData) {
			this.chartManager.createPerformanceComparisonChart(performanceContainer, this.matchData);
		}
	}

	initializeVisionCharts() {
		const wardContainer = this.container.querySelector('#ward-heatmap-chart');

		if (wardContainer && this.timelineData) {
			this.chartManager.createWardPlacementHeatmap(wardContainer, this.timelineData);
		}
	}

	renderSelectedMetric() {
		switch (this.selectedMetric) {
			case 'damage':
				return this.renderDamageAnalysis();
			case 'vision':
				return this.renderVisionAnalysis();
			case 'economy':
				return this.renderEconomyAnalysis();
			case 'positioning':
				return this.renderPositioningAnalysis();
			case 'teamfight':
				return this.renderTeamfightAnalysis();
			default:
				return this.renderDamageAnalysis();
		}
	}

	renderDamageAnalysis() {
		const participants = this.matchData.info.participants;
		const totalDamage = participants.reduce((sum, p) => sum + (p.totalDamageDealtToChampions || 0), 0);

		return `
            <div class="damage-analysis">
                <div class="damage-overview">
                    <h4>Damage Distribution</h4>
                    <div class="damage-chart" id="damage-distribution-chart"></div>
                </div>

                <div class="performance-comparison">
                    <h4>Team Performance Comparison</h4>
                    <div class="performance-chart" id="performance-comparison-chart"></div>
                </div>

                <div class="damage-breakdown">
                    <h4>Detailed Damage Breakdown</h4>
                    <div class="damage-table">
                        ${this.renderDamageTable(participants)}
                    </div>
                </div>

                <div class="damage-efficiency">
                    <h4>Damage Efficiency Metrics</h4>
                    <div class="efficiency-grid">
                        ${this.renderDamageEfficiency(participants)}
                    </div>
                </div>
            </div>
        `;
	}

	renderVisionAnalysis() {
		const participants = this.matchData.info.participants;
		const teams = this.getTeamData();

		return `
            <div class="vision-analysis">
                <div class="vision-overview">
                    <h4>Vision Control Comparison</h4>
                    <div class="vision-comparison">
                        ${this.renderVisionComparison(teams)}
                    </div>
                </div>

                <div class="vision-breakdown">
                    <h4>Individual Vision Contributions</h4>
                    <div class="vision-table">
                        ${this.renderVisionTable(participants)}
                    </div>
                </div>

                <div class="vision-heatmap">
                    <h4>Ward Placement Analysis</h4>
                    <div class="ward-heatmap-chart" id="ward-heatmap-chart"></div>
                </div>
            </div>
        `;
	}

	renderEconomyAnalysis() {
		const participants = this.matchData.info.participants;
		const teams = this.getTeamData();

		return `
            <div class="economy-analysis">
                <div class="gold-efficiency">
                    <h4>Gold Efficiency Analysis</h4>
                    <div class="efficiency-comparison">
                        ${this.renderGoldEfficiency(teams)}
                    </div>
                </div>

                <div class="income-sources">
                    <h4>Income Source Breakdown</h4>
                    <div class="income-table">
                        ${this.renderIncomeTable(participants)}
                    </div>
                </div>

                <div class="spending-analysis">
                    <h4>Gold Spending Patterns</h4>
                    <div class="spending-chart">
                        ${this.renderSpendingAnalysis(participants)}
                    </div>
                </div>
            </div>
        `;
	}

	renderPositioningAnalysis() {
		return `
            <div class="positioning-analysis">
                <div class="map-control">
                    <h4>Map Control & Positioning</h4>
                    <div class="map-placeholder">
                        <p>Positioning heatmap and map control analysis would be displayed here</p>
                        <p>Requires timeline position data for detailed analysis</p>
                    </div>
                </div>

                <div class="safety-metrics">
                    <h4>Safety & Risk Metrics</h4>
                    <div class="safety-table">
                        ${this.renderSafetyMetrics()}
                    </div>
                </div>
            </div>
        `;
	}

	renderTeamfightAnalysis() {
		return `
            <div class="teamfight-analysis">
                <div class="teamfight-overview">
                    <h4>Teamfight Performance</h4>
                    <div class="teamfight-stats">
                        ${this.renderTeamfightStats()}
                    </div>
                </div>

                <div class="teamfight-timeline">
                    <h4>Major Teamfights</h4>
                    <div class="teamfight-events">
                        <p>Teamfight analysis requires detailed timeline event processing</p>
                        <p>Would show major teamfights, outcomes, and key moments</p>
                    </div>
                </div>
            </div>
        `;
	}

	renderDamageChart(participants, totalDamage) {
		return participants
			.map((participant) => {
				const damage = participant.totalDamageDealtToChampions || 0;
				const percentage = totalDamage > 0 ? (damage / totalDamage) * 100 : 0;
				const teamColor = ColorUtils.getTeamColor(participant.teamId);

				return `
                <div class="damage-bar">
                    <div class="player-info">
                        <img 
                            src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                            alt="${participant.championName}"
                            class="champion-mini"
                        >
                        <span class="player-name">${participant.summonerName}</span>
                    </div>
                    <div class="damage-progress">
                        <div 
                            class="damage-fill" 
                            style="width: ${percentage}%; background-color: ${teamColor}"
                        ></div>
                        <span class="damage-value">${DataFormatter.formatNumber(damage)}</span>
                    </div>
                    <div class="damage-percentage">${percentage.toFixed(1)}%</div>
                </div>
            `;
			})
			.join('');
	}

	renderDamageTable(participants) {
		return `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Total Damage</th>
                        <th>Physical</th>
                        <th>Magic</th>
                        <th>True</th>
                        <th>DPM</th>
                        <th>Damage Share</th>
                    </tr>
                </thead>
                <tbody>
                    ${participants
											.map((participant) => {
												const totalDamage = participant.totalDamageDealtToChampions || 0;
												const dpm = this.calculateDPM(totalDamage);
												const damageShare = this.calculateDamageShare(participant);

												return `
                            <tr class="team-${participant.teamId}">
                                <td>
                                    <div class="player-cell">
                                        <img 
                                            src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                                            alt="${participant.championName}"
                                            class="champion-mini"
                                        >
                                        ${participant.summonerName}
                                    </div>
                                </td>
                                <td>${DataFormatter.formatNumber(totalDamage)}</td>
                                <td>${DataFormatter.formatNumber(participant.physicalDamageDealtToChampions || 0)}</td>
                                <td>${DataFormatter.formatNumber(participant.magicDamageDealtToChampions || 0)}</td>
                                <td>${DataFormatter.formatNumber(participant.trueDamageDealtToChampions || 0)}</td>
                                <td>${dpm}</td>
                                <td>${damageShare}%</td>
                            </tr>
                        `;
											})
											.join('')}
                </tbody>
            </table>
        `;
	}

	renderDamageEfficiency(participants) {
		return participants
			.map((participant) => {
				const efficiency = this.calculateDamageEfficiency(participant);
				const color = this.getEfficiencyColor(efficiency);

				return `
                <div class="efficiency-item">
                    <div class="player-info">
                        <img 
                            src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                            alt="${participant.championName}"
                            class="champion-mini"
                        >
                        <span>${participant.summonerName}</span>
                    </div>
                    <div class="efficiency-score" style="color: ${color}">
                        ${efficiency}%
                    </div>
                    <div class="efficiency-bar">
                        <div 
                            class="efficiency-fill" 
                            style="width: ${efficiency}%; background-color: ${color}"
                        ></div>
                    </div>
                </div>
            `;
			})
			.join('');
	}

	renderVisionComparison(teams) {
		return teams
			.map((team) => {
				const visionScore = team.totals.visionScore;
				const wardsPlaced = team.totals.wardsPlaced;
				const wardsKilled = team.totals.wardsKilled;

				return `
                <div class="team-vision team-${team.teamId}">
                    <h5>${team.teamId === 100 ? 'Blue Team' : 'Red Team'}</h5>
                    <div class="vision-stats">
                        <div class="vision-stat">
                            <span class="stat-value">${Math.round(visionScore)}</span>
                            <span class="stat-label">Vision Score</span>
                        </div>
                        <div class="vision-stat">
                            <span class="stat-value">${wardsPlaced}</span>
                            <span class="stat-label">Wards Placed</span>
                        </div>
                        <div class="vision-stat">
                            <span class="stat-value">${wardsKilled}</span>
                            <span class="stat-label">Wards Killed</span>
                        </div>
                    </div>
                </div>
            `;
			})
			.join('');
	}

	renderVisionTable(participants) {
		return `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Vision Score</th>
                        <th>Wards Placed</th>
                        <th>Wards Killed</th>
                        <th>Control Wards</th>
                        <th>Vision/Min</th>
                    </tr>
                </thead>
                <tbody>
                    ${participants
											.map(
												(participant) => `
                        <tr class="team-${participant.teamId}">
                            <td>
                                <div class="player-cell">
                                    <img 
                                        src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                                        alt="${participant.championName}"
                                        class="champion-mini"
                                    >
                                    ${participant.summonerName}
                                </div>
                            </td>
                            <td>${participant.visionScore || 0}</td>
                            <td>${participant.wardsPlaced || 0}</td>
                            <td>${participant.wardsKilled || 0}</td>
                            <td>${participant.visionWardsBoughtInGame || 0}</td>
                            <td>${this.calculateVisionPerMinute(participant)}</td>
                        </tr>
                    `
											)
											.join('')}
                </tbody>
            </table>
        `;
	}

	renderGoldEfficiency(teams) {
		return teams
			.map((team) => {
				const efficiency = this.calculateTeamGoldEfficiency(team);
				const color = this.getEfficiencyColor(efficiency);

				return `
                <div class="team-efficiency team-${team.teamId}">
                    <h5>${team.teamId === 100 ? 'Blue Team' : 'Red Team'}</h5>
                    <div class="efficiency-display">
                        <div class="efficiency-score" style="color: ${color}">
                            ${efficiency}%
                        </div>
                        <div class="efficiency-description">
                            Gold to Damage Efficiency
                        </div>
                    </div>
                </div>
            `;
			})
			.join('');
	}

	renderIncomeTable(participants) {
		return `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Total Gold</th>
                        <th>Minions</th>
                        <th>Jungle</th>
                        <th>Kills/Assists</th>
                        <th>GPM</th>
                    </tr>
                </thead>
                <tbody>
                    ${participants
											.map(
												(participant) => `
                        <tr class="team-${participant.teamId}">
                            <td>
                                <div class="player-cell">
                                    <img 
                                        src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                                        alt="${participant.championName}"
                                        class="champion-mini"
                                    >
                                    ${participant.summonerName}
                                </div>
                            </td>
                            <td>${DataFormatter.formatGold(participant.goldEarned || 0)}</td>
                            <td>${DataFormatter.formatGold(this.calculateMinionGold(participant))}</td>
                            <td>${DataFormatter.formatGold(this.calculateJungleGold(participant))}</td>
                            <td>${DataFormatter.formatGold(this.calculateKillGold(participant))}</td>
                            <td>${this.calculateGPM(participant)}</td>
                        </tr>
                    `
											)
											.join('')}
                </tbody>
            </table>
        `;
	}

	renderSpendingAnalysis(participants) {
		return `
            <div class="spending-overview">
                <p>Gold spending efficiency analysis would be displayed here</p>
                <p>Requires detailed item purchase timeline data</p>
            </div>
        `;
	}

	renderSafetyMetrics() {
		const participants = this.matchData.info.participants;

		return `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Deaths</th>
                        <th>Damage Taken</th>
                        <th>Safety Score</th>
                        <th>Risk Level</th>
                    </tr>
                </thead>
                <tbody>
                    ${participants
											.map((participant) => {
												const safetyScore = this.calculateSafetyScore(participant);
												const riskLevel = this.getRiskLevel(safetyScore);

												return `
                            <tr class="team-${participant.teamId}">
                                <td>
                                    <div class="player-cell">
                                        <img 
                                            src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                                            alt="${participant.championName}"
                                            class="champion-mini"
                                        >
                                        ${participant.summonerName}
                                    </div>
                                </td>
                                <td>${participant.deaths}</td>
                                <td>${DataFormatter.formatNumber(participant.totalDamageTaken || 0)}</td>
                                <td>${safetyScore}</td>
                                <td class="risk-${riskLevel.toLowerCase()}">${riskLevel}</td>
                            </tr>
                        `;
											})
											.join('')}
                </tbody>
            </table>
        `;
	}

	renderTeamfightStats() {
		return `
            <div class="teamfight-overview">
                <p>Teamfight analysis requires advanced timeline processing</p>
                <p>Would show teamfight participation, damage in teamfights, and positioning</p>
            </div>
        `;
	}

	// Helper methods
	getTeamData() {
		const teams = this.matchData.info.teams;
		const participants = this.matchData.info.participants;

		return teams.map((team) => {
			const teamParticipants = participants.filter((p) => p.teamId === team.teamId);

			const totals = teamParticipants.reduce(
				(acc, p) => ({
					visionScore: acc.visionScore + (p.visionScore || 0),
					wardsPlaced: acc.wardsPlaced + (p.wardsPlaced || 0),
					wardsKilled: acc.wardsKilled + (p.wardsKilled || 0),
					gold: acc.gold + (p.goldEarned || 0),
					damage: acc.damage + (p.totalDamageDealtToChampions || 0),
				}),
				{ visionScore: 0, wardsPlaced: 0, wardsKilled: 0, gold: 0, damage: 0 }
			);

			return { ...team, participants: teamParticipants, totals };
		});
	}

	calculateDPM(totalDamage) {
		const gameDuration = this.matchData.info.gameDuration / 60; // Convert to minutes
		return Math.round(totalDamage / gameDuration);
	}

	calculateDamageShare(participant) {
		const teamParticipants = this.matchData.info.participants.filter((p) => p.teamId === participant.teamId);
		const teamDamage = teamParticipants.reduce((sum, p) => sum + (p.totalDamageDealtToChampions || 0), 0);
		const playerDamage = participant.totalDamageDealtToChampions || 0;
		return teamDamage > 0 ? ((playerDamage / teamDamage) * 100).toFixed(1) : '0.0';
	}

	calculateDamageEfficiency(participant) {
		const damage = participant.totalDamageDealtToChampions || 0;
		const gold = participant.goldEarned || 1;
		return Math.round((damage / gold) * 100);
	}

	calculateVisionPerMinute(participant) {
		const visionScore = participant.visionScore || 0;
		const gameDuration = this.matchData.info.gameDuration / 60;
		return (visionScore / gameDuration).toFixed(1);
	}

	calculateTeamGoldEfficiency(team) {
		const totalDamage = team.totals.damage;
		const totalGold = team.totals.gold;
		return totalGold > 0 ? Math.round((totalDamage / totalGold) * 100) : 0;
	}

	calculateMinionGold(participant) {
		return (participant.totalMinionsKilled || 0) * 20; // Approximate
	}

	calculateJungleGold(participant) {
		return (participant.neutralMinionsKilled || 0) * 30; // Approximate
	}

	calculateKillGold(participant) {
		return (participant.kills || 0) * 300 + (participant.assists || 0) * 150; // Approximate
	}

	calculateGPM(participant) {
		const gold = participant.goldEarned || 0;
		const gameDuration = this.matchData.info.gameDuration / 60;
		return Math.round(gold / gameDuration);
	}

	calculateSafetyScore(participant) {
		const deaths = participant.deaths || 0;
		const damageTaken = participant.totalDamageTaken || 0;
		// Simple safety score calculation
		return Math.max(0, 100 - deaths * 10 - damageTaken / 1000);
	}

	getRiskLevel(safetyScore) {
		if (safetyScore >= 80) return 'Low';
		if (safetyScore >= 60) return 'Medium';
		if (safetyScore >= 40) return 'High';
		return 'Very High';
	}

	getEfficiencyColor(efficiency) {
		if (efficiency >= 80) return '#2ecc71';
		if (efficiency >= 60) return '#f39c12';
		if (efficiency >= 40) return '#e67e22';
		return '#e74c3c';
	}

	getChampionImageUrl(championId) {
		return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Champion${championId}.png`;
	}

	setupEventListeners() {
		const metricSelect = this.container.querySelector('#metric-select');

		if (metricSelect) {
			metricSelect.addEventListener('change', (e) => {
				this.selectedMetric = e.target.value;
				const content = this.container.querySelector('.advanced-content');
				content.innerHTML = this.renderSelectedMetric();

				// Reinitialize charts for the new metric
				setTimeout(() => this.initializeCharts(), 100);
			});
		}
	}

	// Update data and re-render
	updateData(matchData, timelineData) {
		this.matchData = matchData;
		this.timelineData = timelineData;
		this.render();
		this.setupEventListeners();
	}
}
