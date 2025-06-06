// Overview Tab Component - Displays match overview with scoreboard and key statistics
import { DataFormatter, ColorUtils } from '../../utils.js';

export class OverviewTab {
	constructor(container, matchData, timelineData = null) {
		this.container = container;
		this.matchData = matchData;
		this.timelineData = timelineData;
		this.render();
	}

	render() {
		this.container.innerHTML = `
            <div class="overview-tab">
                <div class="match-summary">
                    <h3>Match Summary</h3>
                    <div class="summary-grid">
                        ${this.renderMatchSummary()}
                    </div>
                </div>

                <div class="scoreboard">
                    <h3>Scoreboard</h3>
                    <div class="scoreboard-container">
                        ${this.renderScoreboard()}
                    </div>
                </div>

                <div class="key-statistics">
                    <h3>Key Statistics</h3>
                    <div class="stats-comparison">
                        ${this.renderKeyStats()}
                    </div>
                </div>

                <div class="match-timeline-summary">
                    <h3>Match Progression</h3>
                    <div class="timeline-summary">
                        ${this.renderTimelineSummary()}
                    </div>
                </div>
            </div>
        `;
	}

	renderMatchSummary() {
		const match = this.matchData.info;
		const winningTeam = match.teams.find((team) => team.win);
		const losingTeam = match.teams.find((team) => !team.win);

		return `
            <div class="summary-item">
                <div class="summary-label">Duration</div>
                <div class="summary-value">${DataFormatter.formatDuration(match.gameDuration)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Game Mode</div>
                <div class="summary-value">${this.formatGameMode(match.gameMode)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Patch</div>
                <div class="summary-value">${match.gameVersion?.split('.').slice(0, 2).join('.') || 'Unknown'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">First Blood</div>
                <div class="summary-value">${this.getFirstBloodInfo()}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">First Tower</div>
                <div class="summary-value">${winningTeam?.objectives?.tower?.first ? 'Winning Team' : 'Losing Team'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">First Dragon</div>
                <div class="summary-value">${winningTeam?.objectives?.dragon?.first ? 'Winning Team' : 'Losing Team'}</div>
            </div>
        `;
	}

	renderScoreboard() {
		const teams = this.getTeamData();

		return `
            <div class="scoreboard-teams">
                ${teams.map((team) => this.renderTeamScoreboard(team)).join('')}
            </div>
        `;
	}

	renderTeamScoreboard(team) {
		const teamColor = ColorUtils.getTeamColor(team.teamId);
		const resultClass = team.win ? 'victory' : 'defeat';

		return `
            <div class="team-scoreboard ${resultClass}">
                <div class="team-header">
                    <div class="team-info">
                        <h4 style="color: ${teamColor}">
                            ${team.teamId === 100 ? 'Blue Team' : 'Red Team'}
                        </h4>
                        <div class="team-result ${resultClass}">
                            ${team.win ? 'VICTORY' : 'DEFEAT'}
                        </div>
                    </div>
                    <div class="team-totals">
                        <div class="total-kills">${team.totals.kills}</div>
                        <div class="total-label">Kills</div>
                    </div>
                </div>
                
                <div class="players-scoreboard">
                    <div class="scoreboard-headers">
                        <div class="player-col">Player</div>
                        <div class="kda-col">KDA</div>
                        <div class="cs-col">CS</div>
                        <div class="gold-col">Gold</div>
                        <div class="damage-col">Damage</div>
                        <div class="items-col">Items</div>
                    </div>
                    ${team.participants.map((participant) => this.renderPlayerRow(participant)).join('')}
                </div>
            </div>
        `;
	}

	renderPlayerRow(participant) {
		const kdaColor = ColorUtils.getKDAColor(participant.kda || 0);
		const csColor = ColorUtils.getCSColor(participant.csPerMinute || 0);

		return `
            <div class="player-row">
                <div class="player-col">
                    <div class="player-info">
                        <img 
                            src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                            alt="${participant.championName}"
                            class="champion-icon"
                            onerror="this.src='${this.getPlaceholderImage()}'"
                        >
                        <div class="player-details">
                            <div class="champion-name">${participant.championName || 'Unknown'}</div>
                            <div class="summoner-name">${participant.summonerName || 'Unknown'}</div>
                        </div>
                    </div>
                </div>
                <div class="kda-col" style="color: ${kdaColor}">
                    <div class="kda-numbers">${participant.kills}/${participant.deaths}/${participant.assists}</div>
                    <div class="kda-ratio">${(participant.kda || 0).toFixed(2)}</div>
                </div>
                <div class="cs-col" style="color: ${csColor}">
                    <div class="cs-number">${(participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0)}</div>
                    <div class="cs-per-min">${(participant.csPerMinute || 0).toFixed(1)}/min</div>
                </div>
                <div class="gold-col">
                    <div class="gold-amount">${DataFormatter.formatGold(participant.goldEarned || 0)}</div>
                </div>
                <div class="damage-col">
                    <div class="damage-amount">${DataFormatter.formatNumber(participant.totalDamageDealtToChampions || 0)}</div>
                </div>
                <div class="items-col">
                    <div class="items-row">
                        ${this.renderPlayerItems(participant)}
                    </div>
                </div>
            </div>
        `;
	}

	renderPlayerItems(participant) {
		const itemSlots = ['item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6'];

		return itemSlots
			.map((slot) => {
				const itemId = participant[slot];
				if (!itemId || itemId === 0) {
					return '<div class="item-icon empty"></div>';
				}

				return `
                <div class="item-icon">
                    <img 
                        src="${this.getItemImageUrl(itemId)}" 
                        alt="Item ${itemId}"
                        onerror="this.src='${this.getPlaceholderImage()}'"
                    >
                </div>
            `;
			})
			.join('');
	}

	renderKeyStats() {
		const teams = this.getTeamData();
		const [team1, team2] = teams;

		const comparisons = [
			{
				label: 'Total Gold',
				team1: team1.totals.gold,
				team2: team2.totals.gold,
				format: (val) => DataFormatter.formatGold(val),
				icon: '💰',
			},
			{
				label: 'Total Damage',
				team1: team1.totals.damage,
				team2: team2.totals.damage,
				format: (val) => DataFormatter.formatNumber(val),
				icon: '⚔️',
			},
			{
				label: 'Vision Score',
				team1: team1.totals.visionScore,
				team2: team2.totals.visionScore,
				format: (val) => Math.round(val).toString(),
				icon: '👁️',
			},
			{
				label: 'Objectives',
				team1: this.getTotalObjectives(team1),
				team2: this.getTotalObjectives(team2),
				format: (val) => val.toString(),
				icon: '🏰',
			},
		];

		return comparisons
			.map((comp) => {
				const total = comp.team1 + comp.team2;
				const team1Percentage = total > 0 ? (comp.team1 / total) * 100 : 50;

				return `
                <div class="stat-comparison">
                    <div class="stat-header">
                        <span class="stat-icon">${comp.icon}</span>
                        <span class="stat-label">${comp.label}</span>
                    </div>
                    <div class="stat-bar">
                        <div class="stat-value left">${comp.format(comp.team1)}</div>
                        <div class="progress-bar">
                            <div 
                                class="progress-fill team-${team1.teamId}" 
                                style="width: ${team1Percentage}%; background-color: ${ColorUtils.getTeamColor(team1.teamId)}"
                            ></div>
                        </div>
                        <div class="stat-value right">${comp.format(comp.team2)}</div>
                    </div>
                </div>
            `;
			})
			.join('');
	}

	renderTimelineSummary() {
		if (!this.timelineData) {
			return '<p class="no-timeline">Timeline data not available</p>';
		}

		// This would be enhanced with actual timeline analysis
		return `
            <div class="timeline-milestones">
                <div class="milestone">
                    <div class="milestone-time">2:30</div>
                    <div class="milestone-event">First Blood</div>
                </div>
                <div class="milestone">
                    <div class="milestone-time">5:45</div>
                    <div class="milestone-event">First Dragon</div>
                </div>
                <div class="milestone">
                    <div class="milestone-time">8:12</div>
                    <div class="milestone-event">First Tower</div>
                </div>
                <div class="milestone">
                    <div class="milestone-time">14:30</div>
                    <div class="milestone-event">First Baron</div>
                </div>
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
					kills: acc.kills + p.kills,
					deaths: acc.deaths + p.deaths,
					assists: acc.assists + p.assists,
					gold: acc.gold + p.goldEarned,
					damage: acc.damage + (p.totalDamageDealtToChampions || 0),
					cs: acc.cs + (p.totalMinionsKilled + p.neutralMinionsKilled),
					visionScore: acc.visionScore + (p.visionScore || 0),
				}),
				{ kills: 0, deaths: 0, assists: 0, gold: 0, damage: 0, cs: 0, visionScore: 0 }
			);

			return {
				...team,
				participants: teamParticipants,
				totals,
			};
		});
	}

	getTotalObjectives(team) {
		const objectives = team.objectives || {};
		return (objectives.baron?.kills || 0) + (objectives.dragon?.kills || 0) + (objectives.tower?.kills || 0) + (objectives.inhibitor?.kills || 0);
	}

	formatGameMode(gameMode) {
		const modes = {
			CLASSIC: 'Ranked/Normal',
			ARAM: 'ARAM',
			URF: 'URF',
			ONEFORALL: 'One for All',
			NEXUSBLITZ: 'Nexus Blitz',
		};
		return modes[gameMode] || gameMode;
	}

	getFirstBloodInfo() {
		// This would need timeline data to determine actual first blood
		return 'Blue Team'; // Placeholder
	}

	getChampionImageUrl(championId) {
		return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Champion${championId}.png`;
	}

	getItemImageUrl(itemId) {
		return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/item/${itemId}.png`;
	}

	getPlaceholderImage() {
		return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMCAxMEwzMCAzME0zMCAxMEwxMCAzMCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
	}

	// Update data and re-render
	updateData(matchData, timelineData = null) {
		this.matchData = matchData;
		this.timelineData = timelineData;
		this.render();
	}
}
