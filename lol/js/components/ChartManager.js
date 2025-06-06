// Chart Manager - Utility for creating and managing Chart.js visualizations
import { DataFormatter, ColorUtils } from '../utils.js';

export class ChartManager {
	constructor() {
		this.charts = new Map();
		this.defaultOptions = this.getDefaultOptions();
	}

	getDefaultOptions() {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					labels: {
						color: 'rgba(255, 255, 255, 0.9)',
						font: {
							family: 'Philosopher, serif',
							size: 12,
						},
					},
				},
				tooltip: {
					backgroundColor: 'rgba(26, 28, 75, 0.95)',
					titleColor: '#c7a45d',
					bodyColor: 'rgba(255, 255, 255, 0.9)',
					borderColor: '#c7a45d',
					borderWidth: 1,
					cornerRadius: 8,
					titleFont: {
						family: 'Philosopher, serif',
						size: 14,
						weight: 'bold',
					},
					bodyFont: {
						family: 'Philosopher, serif',
						size: 12,
					},
				},
			},
			scales: {
				x: {
					ticks: {
						color: 'rgba(255, 255, 255, 0.7)',
						font: {
							family: 'Philosopher, serif',
							size: 11,
						},
					},
					grid: {
						color: 'rgba(199, 164, 93, 0.2)',
					},
				},
				y: {
					ticks: {
						color: 'rgba(255, 255, 255, 0.7)',
						font: {
							family: 'Philosopher, serif',
							size: 11,
						},
					},
					grid: {
						color: 'rgba(199, 164, 93, 0.2)',
					},
				},
			},
		};
	}

	createGoldProgressionChart(container, timelineData) {
		const canvas = this.createCanvas(container, 'gold-progression-chart');
		const ctx = canvas.getContext('2d');

		const data = this.processGoldProgressionData(timelineData);

		const config = {
			type: 'line',
			data: {
				labels: data.labels,
				datasets: [
					{
						label: 'Blue Team',
						data: data.team100,
						borderColor: ColorUtils.getTeamColor(100),
						backgroundColor: ColorUtils.getTeamColor(100) + '20',
						borderWidth: 3,
						fill: false,
						tension: 0.1,
					},
					{
						label: 'Red Team',
						data: data.team200,
						borderColor: ColorUtils.getTeamColor(200),
						backgroundColor: ColorUtils.getTeamColor(200) + '20',
						borderWidth: 3,
						fill: false,
						tension: 0.1,
					},
				],
			},
			options: {
				...this.defaultOptions,
				plugins: {
					...this.defaultOptions.plugins,
					title: {
						display: true,
						text: 'Gold Progression Over Time',
						color: '#c7a45d',
						font: {
							family: 'Philosopher, serif',
							size: 16,
							weight: 'bold',
						},
					},
				},
				scales: {
					...this.defaultOptions.scales,
					y: {
						...this.defaultOptions.scales.y,
						title: {
							display: true,
							text: 'Total Gold',
							color: '#c7a45d',
						},
						ticks: {
							...this.defaultOptions.scales.y.ticks,
							callback: function (value) {
								return DataFormatter.formatGold(value);
							},
						},
					},
					x: {
						...this.defaultOptions.scales.x,
						title: {
							display: true,
							text: 'Game Time',
							color: '#c7a45d',
						},
					},
				},
			},
		};

		// Check if Chart.js is available
		if (typeof Chart !== 'undefined') {
			const chart = new Chart(ctx, config);
			this.charts.set('gold-progression', chart);
			return chart;
		} else {
			// Fallback if Chart.js is not loaded
			container.innerHTML = '<p>Chart.js not loaded. Charts are not available.</p>';
			return null;
		}
	}

	createDamageDistributionChart(container, matchData) {
		const canvas = this.createCanvas(container, 'damage-distribution-chart');
		const ctx = canvas.getContext('2d');

		const data = this.processDamageDistributionData(matchData);

		const config = {
			type: 'doughnut',
			data: {
				labels: data.labels,
				datasets: [
					{
						data: data.values,
						backgroundColor: data.colors,
						borderColor: data.colors.map((color) => color.replace('0.8', '1')),
						borderWidth: 2,
					},
				],
			},
			options: {
				...this.defaultOptions,
				plugins: {
					...this.defaultOptions.plugins,
					title: {
						display: true,
						text: 'Damage Distribution by Player',
						color: '#c7a45d',
						font: {
							family: 'Philosopher, serif',
							size: 16,
							weight: 'bold',
						},
					},
					tooltip: {
						...this.defaultOptions.plugins.tooltip,
						callbacks: {
							label: function (context) {
								const label = context.label || '';
								const value = DataFormatter.formatNumber(context.raw);
								const percentage = ((context.raw / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
								return `${label}: ${value} (${percentage}%)`;
							},
						},
					},
				},
			},
		};

		if (typeof Chart !== 'undefined') {
			const chart = new Chart(ctx, config);
			this.charts.set('damage-distribution', chart);
			return chart;
		} else {
			container.innerHTML = '<p>Chart.js not loaded. Charts are not available.</p>';
			return null;
		}
	}

	createCanvas(container, id) {
		// Clear existing content
		container.innerHTML = '';

		// Create canvas element
		const canvas = document.createElement('canvas');
		canvas.id = id;
		canvas.style.maxHeight = '400px';

		container.appendChild(canvas);
		return canvas;
	}

	processGoldProgressionData(timelineData) {
		if (!timelineData?.info?.frames) {
			return { labels: [], team100: [], team200: [] };
		}

		const frames = timelineData.info.frames;
		const labels = [];
		const team100Gold = [];
		const team200Gold = [];

		frames.forEach((frame, index) => {
			const minutes = Math.floor(index);
			labels.push(`${minutes}:00`);

			let team100Total = 0;
			let team200Total = 0;

			Object.values(frame.participantFrames || {}).forEach((participant) => {
				if (participant.participantId <= 5) {
					team100Total += participant.totalGold || 0;
				} else {
					team200Total += participant.totalGold || 0;
				}
			});

			team100Gold.push(team100Total);
			team200Gold.push(team200Total);
		});

		return { labels, team100: team100Gold, team200: team200Gold };
	}

	processDamageDistributionData(matchData) {
		const participants = matchData.info.participants;
		const labels = [];
		const values = [];
		const colors = [];

		participants.forEach((participant) => {
			labels.push(participant.summonerName);
			values.push(participant.totalDamageDealtToChampions || 0);

			const teamColor = ColorUtils.getTeamColor(participant.teamId);
			colors.push(teamColor + 'CC'); // Add transparency
		});

		return { labels, values, colors };
	}

	destroyChart(chartId) {
		const chart = this.charts.get(chartId);
		if (chart) {
			chart.destroy();
			this.charts.delete(chartId);
		}
	}

	// Destroy all charts
	destroyAll() {
		this.charts.forEach((chart) => chart.destroy());
		this.charts.clear();
	}
}
