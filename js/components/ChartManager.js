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

		const chart = new Chart(ctx, config);
		this.charts.set('gold-progression', chart);
		return chart;
	}

	createXPProgressionChart(container, timelineData) {
		const canvas = this.createCanvas(container, 'xp-progression-chart');
		const ctx = canvas.getContext('2d');

		const data = this.processXPProgressionData(timelineData);

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
						text: 'Experience Progression Over Time',
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
							text: 'Total Experience',
							color: '#c7a45d',
						},
						ticks: {
							...this.defaultOptions.scales.y.ticks,
							callback: function (value) {
								return DataFormatter.formatNumber(value);
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

		const chart = new Chart(ctx, config);
		this.charts.set('xp-progression', chart);
		return chart;
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

		const chart = new Chart(ctx, config);
		this.charts.set('damage-distribution', chart);
		return chart;
	}

	createPerformanceComparisonChart(container, matchData) {
		const canvas = this.createCanvas(container, 'performance-comparison-chart');
		const ctx = canvas.getContext('2d');

		const data = this.processPerformanceComparisonData(matchData);

		const config = {
			type: 'radar',
			data: {
				labels: ['Damage', 'Gold', 'Vision', 'KDA', 'CS', 'Objectives'],
				datasets: data.datasets,
			},
			options: {
				...this.defaultOptions,
				plugins: {
					...this.defaultOptions.plugins,
					title: {
						display: true,
						text: 'Team Performance Comparison',
						color: '#c7a45d',
						font: {
							family: 'Philosopher, serif',
							size: 16,
							weight: 'bold',
						},
					},
				},
				scales: {
					r: {
						angleLines: {
							color: 'rgba(199, 164, 93, 0.2)',
						},
						grid: {
							color: 'rgba(199, 164, 93, 0.2)',
						},
						pointLabels: {
							color: 'rgba(255, 255, 255, 0.9)',
							font: {
								family: 'Philosopher, serif',
								size: 12,
							},
						},
						ticks: {
							color: 'rgba(255, 255, 255, 0.7)',
							backdropColor: 'transparent',
						},
					},
				},
			},
		};

		const chart = new Chart(ctx, config);
		this.charts.set('performance-comparison', chart);
		return chart;
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

	processXPProgressionData(timelineData) {
		if (!timelineData?.info?.frames) {
			return { labels: [], team100: [], team200: [] };
		}

		const frames = timelineData.info.frames;
		const labels = [];
		const team100XP = [];
		const team200XP = [];

		frames.forEach((frame, index) => {
			const minutes = Math.floor(index);
			labels.push(`${minutes}:00`);

			let team100Total = 0;
			let team200Total = 0;

			Object.values(frame.participantFrames || {}).forEach((participant) => {
				if (participant.participantId <= 5) {
					team100Total += participant.xp || 0;
				} else {
					team200Total += participant.xp || 0;
				}
			});

			team100XP.push(team100Total);
			team200XP.push(team200Total);
		});

		return { labels, team100: team100XP, team200: team200XP };
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

	processPerformanceComparisonData(matchData) {
		const teams = [100, 200];
		const datasets = [];

		teams.forEach((teamId) => {
			const teamParticipants = matchData.info.participants.filter((p) => p.teamId === teamId);

			// Calculate team totals and averages
			const totals = teamParticipants.reduce(
				(acc, p) => ({
					damage: acc.damage + (p.totalDamageDealtToChampions || 0),
					gold: acc.gold + (p.goldEarned || 0),
					vision: acc.vision + (p.visionScore || 0),
					kills: acc.kills + (p.kills || 0),
					deaths: acc.deaths + (p.deaths || 0),
					assists: acc.assists + (p.assists || 0),
					cs: acc.cs + ((p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0)),
				}),
				{ damage: 0, gold: 0, vision: 0, kills: 0, deaths: 0, assists: 0, cs: 0 }
			);

			// Normalize values to 0-100 scale for radar chart
			const maxValues = {
				damage: 150000,
				gold: 100000,
				vision: 150,
				kda: 5,
				cs: 300,
				objectives: 10,
			};

			const kda = totals.deaths > 0 ? (totals.kills + totals.assists) / totals.deaths : totals.kills + totals.assists;

			const normalizedData = [Math.min(100, (totals.damage / maxValues.damage) * 100), Math.min(100, (totals.gold / maxValues.gold) * 100), Math.min(100, (totals.vision / maxValues.vision) * 100), Math.min(100, (kda / maxValues.kda) * 100), Math.min(100, (totals.cs / maxValues.cs) * 100), Math.min(100, (this.getTeamObjectives(matchData, teamId) / maxValues.objectives) * 100)];

			datasets.push({
				label: teamId === 100 ? 'Blue Team' : 'Red Team',
				data: normalizedData,
				borderColor: ColorUtils.getTeamColor(teamId),
				backgroundColor: ColorUtils.getTeamColor(teamId) + '40',
				borderWidth: 2,
				pointBackgroundColor: ColorUtils.getTeamColor(teamId),
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: ColorUtils.getTeamColor(teamId),
			});
		});

		return { datasets };
	}

	getTeamObjectives(matchData, teamId) {
		const team = matchData.info.teams.find((t) => t.teamId === teamId);
		if (!team) return 0;

		return (team.objectives?.baron?.kills || 0) + (team.objectives?.dragon?.kills || 0) + (team.objectives?.tower?.kills || 0) + (team.objectives?.inhibitor?.kills || 0);
	}

	destroyChart(chartId) {
		const chart = this.charts.get(chartId);
		if (chart) {
			chart.destroy();
			this.charts.delete(chartId);
		}
	}

	createTimelineEventsChart(container, timelineData) {
		const canvas = this.createCanvas(container, 'timeline-events-chart');
		const ctx = canvas.getContext('2d');

		const data = this.processTimelineEventsData(timelineData);

		const config = {
			type: 'scatter',
			data: {
				datasets: data.datasets,
			},
			options: {
				...this.defaultOptions,
				plugins: {
					...this.defaultOptions.plugins,
					title: {
						display: true,
						text: 'Timeline Events',
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
							title: function (context) {
								const point = context[0];
								const minutes = Math.floor(point.parsed.x);
								const seconds = Math.round((point.parsed.x - minutes) * 60);
								return `${minutes}:${seconds.toString().padStart(2, '0')}`;
							},
							label: function (context) {
								return context.dataset.label + ': ' + context.dataset.eventDescriptions[context.dataIndex];
							},
						},
					},
				},
				scales: {
					...this.defaultOptions.scales,
					x: {
						...this.defaultOptions.scales.x,
						type: 'linear',
						title: {
							display: true,
							text: 'Game Time (minutes)',
							color: '#c7a45d',
						},
						ticks: {
							...this.defaultOptions.scales.x.ticks,
							callback: function (value) {
								const minutes = Math.floor(value);
								const seconds = Math.round((value - minutes) * 60);
								return `${minutes}:${seconds.toString().padStart(2, '0')}`;
							},
						},
					},
					y: {
						...this.defaultOptions.scales.y,
						title: {
							display: true,
							text: 'Event Type',
							color: '#c7a45d',
						},
						ticks: {
							...this.defaultOptions.scales.y.ticks,
							callback: function (value) {
								const eventTypes = ['Kills', 'Towers', 'Dragons', 'Items', 'Levels'];
								return eventTypes[value] || '';
							},
						},
						min: 0,
						max: 4,
					},
				},
			},
		};

		const chart = new Chart(ctx, config);
		this.charts.set('timeline-events', chart);
		return chart;
	}

	createWardPlacementHeatmap(container, timelineData) {
		// For now, create a simple scatter plot of ward placements
		// In a full implementation, this would be a proper heatmap overlay on a map
		const canvas = this.createCanvas(container, 'ward-heatmap-chart');
		const ctx = canvas.getContext('2d');

		const data = this.processWardPlacementData(timelineData);

		const config = {
			type: 'scatter',
			data: {
				datasets: data.datasets,
			},
			options: {
				...this.defaultOptions,
				plugins: {
					...this.defaultOptions.plugins,
					title: {
						display: true,
						text: 'Ward Placement Heatmap',
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
							title: function (context) {
								const point = context[0];
								const minutes = Math.floor(point.parsed.x / 60000);
								const seconds = Math.floor((point.parsed.x % 60000) / 1000);
								return `${minutes}:${seconds.toString().padStart(2, '0')}`;
							},
							label: function (context) {
								return `${context.dataset.label} ward placed`;
							},
						},
					},
				},
				scales: {
					...this.defaultOptions.scales,
					x: {
						...this.defaultOptions.scales.x,
						title: {
							display: true,
							text: 'Map X Position',
							color: '#c7a45d',
						},
					},
					y: {
						...this.defaultOptions.scales.y,
						title: {
							display: true,
							text: 'Map Y Position',
							color: '#c7a45d',
						},
					},
				},
			},
		};

		const chart = new Chart(ctx, config);
		this.charts.set('ward-heatmap', chart);
		return chart;
	}

	processTimelineEventsData(timelineData) {
		if (!timelineData?.info?.frames) {
			return { datasets: [] };
		}

		const eventTypes = {
			CHAMPION_KILL: { y: 0, color: '#e74c3c', label: 'Champion Kills' },
			BUILDING_KILL: { y: 1, color: '#f39c12', label: 'Building Kills' },
			ELITE_MONSTER_KILL: { y: 2, color: '#9b59b6', label: 'Elite Monsters' },
			ITEM_PURCHASED: { y: 3, color: '#3498db', label: 'Item Purchases' },
			LEVEL_UP: { y: 4, color: '#2ecc71', label: 'Level Ups' },
		};

		const datasets = [];
		const eventDescriptions = {};

		Object.keys(eventTypes).forEach((eventType) => {
			const events = [];
			const descriptions = [];

			timelineData.info.frames.forEach((frame) => {
				if (frame.events) {
					frame.events.forEach((event) => {
						if (event.type === eventType) {
							const timeInMinutes = event.timestamp / 60000;
							events.push({
								x: timeInMinutes,
								y: eventTypes[eventType].y + (Math.random() - 0.5) * 0.3, // Add some jitter
							});
							descriptions.push(this.getEventDescription(event));
						}
					});
				}
			});

			if (events.length > 0) {
				datasets.push({
					label: eventTypes[eventType].label,
					data: events,
					backgroundColor: eventTypes[eventType].color,
					borderColor: eventTypes[eventType].color,
					pointRadius: 4,
					pointHoverRadius: 6,
					eventDescriptions: descriptions,
				});
			}
		});

		return { datasets };
	}

	processWardPlacementData(timelineData) {
		if (!timelineData?.info?.frames) {
			return { datasets: [] };
		}

		const blueWards = [];
		const redWards = [];

		timelineData.info.frames.forEach((frame) => {
			if (frame.events) {
				frame.events.forEach((event) => {
					if (event.type === 'WARD_PLACED' && event.position) {
						const wardData = {
							x: event.position.x,
							y: event.position.y,
						};

						if (event.participantId <= 5) {
							blueWards.push(wardData);
						} else {
							redWards.push(wardData);
						}
					}
				});
			}
		});

		const datasets = [];

		if (blueWards.length > 0) {
			datasets.push({
				label: 'Blue Team',
				data: blueWards,
				backgroundColor: ColorUtils.getTeamColor(100) + '80',
				borderColor: ColorUtils.getTeamColor(100),
				pointRadius: 3,
				pointHoverRadius: 5,
			});
		}

		if (redWards.length > 0) {
			datasets.push({
				label: 'Red Team',
				data: redWards,
				backgroundColor: ColorUtils.getTeamColor(200) + '80',
				borderColor: ColorUtils.getTeamColor(200),
				pointRadius: 3,
				pointHoverRadius: 5,
			});
		}

		return { datasets };
	}

	getEventDescription(event) {
		switch (event.type) {
			case 'CHAMPION_KILL':
				return `Player ${event.killerId} killed Player ${event.victimId}`;
			case 'BUILDING_KILL':
				return `${event.buildingType} destroyed`;
			case 'ELITE_MONSTER_KILL':
				return `${event.monsterType} killed`;
			case 'ITEM_PURCHASED':
				return `Item ${event.itemId} purchased`;
			case 'LEVEL_UP':
				return `Player ${event.participantId} reached level ${event.level}`;
			default:
				return `${event.type} event`;
		}
	}

	destroyAllCharts() {
		this.charts.forEach((chart) => chart.destroy());
		this.charts.clear();
	}
}
