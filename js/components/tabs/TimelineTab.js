// Timeline Tab Component - Displays match timeline events and progression charts
import { DataFormatter, ColorUtils } from '../../utils.js';
import { ChartManager } from '../ChartManager.js';

export class TimelineTab {
	constructor(container, matchData, timelineData) {
		this.container = container;
		this.matchData = matchData;
		this.timelineData = timelineData;
		this.selectedEventTypes = new Set(['CHAMPION_KILL', 'BUILDING_KILL', 'ELITE_MONSTER_KILL']);
		this.chartManager = new ChartManager();
		this.render();
		this.setupEventListeners();
	}

	render() {
		this.container.innerHTML = `
            <div class="timeline-tab">
                <div class="timeline-controls">
                    <h3>Timeline Events</h3>
                    <div class="event-filters">
                        ${this.renderEventFilters()}
                    </div>
                </div>

                <div class="timeline-content">
                    <div class="timeline-charts">
                        <div class="chart-container">
                            <h4>Gold Progression</h4>
                            <div class="gold-chart" id="gold-chart"></div>
                        </div>
                        <div class="chart-container">
                            <h4>Experience Progression</h4>
                            <div class="xp-chart" id="xp-chart"></div>
                        </div>
                        <div class="chart-container">
                            <h4>Timeline Events</h4>
                            <div class="events-chart" id="events-chart"></div>
                        </div>
                    </div>

                    <div class="timeline-events">
                        <h4>Match Events</h4>
                        <div class="events-container">
                            ${this.renderTimelineEvents()}
                        </div>
                    </div>
                </div>
            </div>
        `;

		// Initialize charts after DOM is rendered
		setTimeout(() => this.initializeCharts(), 100);
	}

	initializeCharts() {
		// Destroy existing charts
		this.chartManager.destroyAllCharts();

		// Create new charts
		const goldContainer = this.container.querySelector('#gold-chart');
		const xpContainer = this.container.querySelector('#xp-chart');
		const eventsContainer = this.container.querySelector('#events-chart');

		if (goldContainer && this.timelineData) {
			this.chartManager.createGoldProgressionChart(goldContainer, this.timelineData);
		}

		if (xpContainer && this.timelineData) {
			this.chartManager.createXPProgressionChart(xpContainer, this.timelineData);
		}

		if (eventsContainer && this.timelineData) {
			this.chartManager.createTimelineEventsChart(eventsContainer, this.timelineData);
		}
	}

	renderEventFilters() {
		const eventTypes = [
			{ type: 'CHAMPION_KILL', label: 'Kills', icon: '⚔️', color: '#e74c3c' },
			{ type: 'BUILDING_KILL', label: 'Towers', icon: '🏰', color: '#f39c12' },
			{ type: 'ELITE_MONSTER_KILL', label: 'Objectives', icon: '🐉', color: '#9b59b6' },
			{ type: 'ITEM_PURCHASED', label: 'Items', icon: '🛡️', color: '#3498db' },
			{ type: 'LEVEL_UP', label: 'Level Ups', icon: '⬆️', color: '#2ecc71' },
			{ type: 'SKILL_LEVEL_UP', label: 'Skills', icon: '✨', color: '#e67e22' },
		];

		return eventTypes
			.map(
				(eventType) => `
            <label class="event-filter">
                <input 
                    type="checkbox" 
                    value="${eventType.type}"
                    ${this.selectedEventTypes.has(eventType.type) ? 'checked' : ''}
                >
                <span class="filter-icon" style="color: ${eventType.color}">${eventType.icon}</span>
                <span class="filter-label">${eventType.label}</span>
            </label>
        `
			)
			.join('');
	}

	renderGoldChart() {
		if (!this.timelineData || !this.timelineData.info.frames) {
			return '<p class="no-data">Timeline data not available</p>';
		}

		const frames = this.timelineData.info.frames;
		const teams = this.getTeamGoldProgression(frames);

		return `
            <div class="chart-svg-container">
                <svg class="progression-chart" viewBox="0 0 800 300">
                    ${this.renderChartGrid()}
                    ${this.renderGoldLines(teams)}
                    ${this.renderChartLabels('Gold', teams)}
                </svg>
            </div>
        `;
	}

	renderXPChart() {
		if (!this.timelineData || !this.timelineData.info.frames) {
			return '<p class="no-data">Timeline data not available</p>';
		}

		const frames = this.timelineData.info.frames;
		const teams = this.getTeamXPProgression(frames);

		return `
            <div class="chart-svg-container">
                <svg class="progression-chart" viewBox="0 0 800 300">
                    ${this.renderChartGrid()}
                    ${this.renderXPLines(teams)}
                    ${this.renderChartLabels('Experience', teams)}
                </svg>
            </div>
        `;
	}

	renderChartGrid() {
		return `
            <defs>
                <pattern id="grid" width="80" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 80 0 L 0 0 0 30" fill="none" stroke="rgba(199, 164, 93, 0.2)" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="800" height="300" fill="url(#grid)" />
        `;
	}

	renderGoldLines(teams) {
		const maxGold = Math.max(...teams.team100.concat(teams.team200));
		const scaleY = 250 / maxGold;
		const scaleX = 750 / (teams.team100.length - 1);

		return `
            <polyline
                fill="none"
                stroke="${ColorUtils.getTeamColor(100)}"
                stroke-width="3"
                points="${teams.team100.map((gold, i) => `${25 + i * scaleX},${275 - gold * scaleY}`).join(' ')}"
            />
            <polyline
                fill="none"
                stroke="${ColorUtils.getTeamColor(200)}"
                stroke-width="3"
                points="${teams.team200.map((gold, i) => `${25 + i * scaleX},${275 - gold * scaleY}`).join(' ')}"
            />
        `;
	}

	renderXPLines(teams) {
		const maxXP = Math.max(...teams.team100.concat(teams.team200));
		const scaleY = 250 / maxXP;
		const scaleX = 750 / (teams.team100.length - 1);

		return `
            <polyline
                fill="none"
                stroke="${ColorUtils.getTeamColor(100)}"
                stroke-width="3"
                points="${teams.team100.map((xp, i) => `${25 + i * scaleX},${275 - xp * scaleY}`).join(' ')}"
            />
            <polyline
                fill="none"
                stroke="${ColorUtils.getTeamColor(200)}"
                stroke-width="3"
                points="${teams.team200.map((xp, i) => `${25 + i * scaleX},${275 - xp * scaleY}`).join(' ')}"
            />
        `;
	}

	renderChartLabels(type, teams) {
		return `
            <text x="400" y="20" text-anchor="middle" fill="var(--accent-color)" font-size="16" font-weight="bold">
                ${type} Progression Over Time
            </text>
            <text x="50" y="295" fill="${ColorUtils.getTeamColor(100)}" font-size="12" font-weight="bold">
                Blue Team
            </text>
            <text x="150" y="295" fill="${ColorUtils.getTeamColor(200)}" font-size="12" font-weight="bold">
                Red Team
            </text>
        `;
	}

	renderTimelineEvents() {
		if (!this.timelineData || !this.timelineData.info.frames) {
			return '<p class="no-data">Timeline data not available</p>';
		}

		const events = this.getFilteredEvents();

		if (events.length === 0) {
			return '<p class="no-events">No events match the selected filters</p>';
		}

		return `
            <div class="events-timeline">
                ${events.map((event) => this.renderEvent(event)).join('')}
            </div>
        `;
	}

	renderEvent(event) {
		const eventIcon = this.getEventIcon(event.type);
		const eventColor = this.getEventColor(event.type);
		const timestamp = DataFormatter.formatDuration(Math.floor(event.timestamp / 1000));

		return `
            <div class="timeline-event" data-event-type="${event.type}">
                <div class="event-time">${timestamp}</div>
                <div class="event-icon" style="color: ${eventColor}">${eventIcon}</div>
                <div class="event-details">
                    <div class="event-description">${this.getEventDescription(event)}</div>
                    ${event.position ? `<div class="event-position">Position: (${Math.round(event.position.x)}, ${Math.round(event.position.y)})</div>` : ''}
                </div>
            </div>
        `;
	}

	getEventIcon(eventType) {
		const icons = {
			CHAMPION_KILL: '⚔️',
			BUILDING_KILL: '🏰',
			ELITE_MONSTER_KILL: '🐉',
			ITEM_PURCHASED: '🛡️',
			LEVEL_UP: '⬆️',
			SKILL_LEVEL_UP: '✨',
			WARD_PLACED: '👁️',
			WARD_KILL: '❌',
		};
		return icons[eventType] || '📝';
	}

	getEventColor(eventType) {
		const colors = {
			CHAMPION_KILL: '#e74c3c',
			BUILDING_KILL: '#f39c12',
			ELITE_MONSTER_KILL: '#9b59b6',
			ITEM_PURCHASED: '#3498db',
			LEVEL_UP: '#2ecc71',
			SKILL_LEVEL_UP: '#e67e22',
			WARD_PLACED: '#95a5a6',
			WARD_KILL: '#34495e',
		};
		return colors[eventType] || '#7f8c8d';
	}

	getEventDescription(event) {
		switch (event.type) {
			case 'CHAMPION_KILL':
				return `${this.getParticipantName(event.killerId)} killed ${this.getParticipantName(event.victimId)}`;
			case 'BUILDING_KILL':
				return `${event.buildingType} destroyed by ${this.getTeamName(event.teamId)}`;
			case 'ELITE_MONSTER_KILL':
				return `${event.monsterType} killed by ${this.getTeamName(event.killerTeamId)}`;
			case 'ITEM_PURCHASED':
				return `${this.getParticipantName(event.participantId)} purchased ${this.getItemName(event.itemId)}`;
			case 'LEVEL_UP':
				return `${this.getParticipantName(event.participantId)} reached level ${event.level}`;
			case 'SKILL_LEVEL_UP':
				return `${this.getParticipantName(event.participantId)} leveled up skill ${event.skillSlot}`;
			default:
				return `${event.type} event`;
		}
	}

	// Helper methods
	getTeamGoldProgression(frames) {
		const team100Gold = [];
		const team200Gold = [];

		frames.forEach((frame) => {
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

		return { team100: team100Gold, team200: team200Gold };
	}

	getTeamXPProgression(frames) {
		const team100XP = [];
		const team200XP = [];

		frames.forEach((frame) => {
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

		return { team100: team100XP, team200: team200XP };
	}

	getFilteredEvents() {
		const allEvents = [];

		this.timelineData.info.frames.forEach((frame) => {
			if (frame.events) {
				frame.events.forEach((event) => {
					if (this.selectedEventTypes.has(event.type)) {
						allEvents.push(event);
					}
				});
			}
		});

		return allEvents.sort((a, b) => a.timestamp - b.timestamp);
	}

	getParticipantName(participantId) {
		const participant = this.matchData.info.participants.find((p) => p.participantId === participantId);
		return participant ? participant.summonerName : `Player ${participantId}`;
	}

	getTeamName(teamId) {
		return teamId === 100 ? 'Blue Team' : 'Red Team';
	}

	getItemName(itemId) {
		// This would be enhanced with actual item data
		return `Item ${itemId}`;
	}

	setupEventListeners() {
		const checkboxes = this.container.querySelectorAll('.event-filter input[type="checkbox"]');

		checkboxes.forEach((checkbox) => {
			checkbox.addEventListener('change', (e) => {
				const eventType = e.target.value;
				if (e.target.checked) {
					this.selectedEventTypes.add(eventType);
				} else {
					this.selectedEventTypes.delete(eventType);
				}

				// Re-render events
				const eventsContainer = this.container.querySelector('.events-container');
				eventsContainer.innerHTML = this.renderTimelineEvents();
			});
		});
	}

	// Update data and re-render
	updateData(matchData, timelineData) {
		this.matchData = matchData;
		this.timelineData = timelineData;
		this.render();
		this.setupEventListeners();
	}
}
