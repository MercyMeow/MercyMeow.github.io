// Advanced Tab Component - Displays advanced statistics and analysis
import { DataFormatter } from '../../utils.js';

export class AdvancedTab {
    constructor(container, matchData, timelineData = null) {
        this.container = container;
        this.matchData = matchData;
        this.timelineData = timelineData;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="advanced-tab">
                <div class="advanced-header">
                    <h3>Advanced Statistics</h3>
                    <p>Detailed performance metrics and analysis</p>
                </div>

                <div class="advanced-content">
                    <div class="damage-analysis">
                        <h4>Damage Analysis</h4>
                        ${this.renderDamageAnalysis()}
                    </div>

                    <div class="vision-analysis">
                        <h4>Vision Control</h4>
                        ${this.renderVisionAnalysis()}
                    </div>

                    <div class="performance-metrics">
                        <h4>Performance Metrics</h4>
                        ${this.renderPerformanceMetrics()}
                    </div>
                </div>
            </div>
        `;
    }

    renderDamageAnalysis() {
        const participants = this.matchData.info.participants;
        const totalDamage = participants.reduce((sum, p) => sum + (p.totalDamageDealtToChampions || 0), 0);

        return `
            <div class="damage-breakdown">
                ${participants.map(participant => {
                    const damagePercent = totalDamage > 0 ? ((participant.totalDamageDealtToChampions || 0) / totalDamage * 100).toFixed(1) : 0;
                    return `
                        <div class="damage-player">
                            <div class="player-info">
                                <img 
                                    src="${this.getChampionImageUrl(participant.championId)}" 
                                    alt="${participant.championName}"
                                    class="champion-icon-small"
                                    onerror="this.src='${this.getPlaceholderImage()}'"
                                >
                                <span class="champion-name">${participant.championName || 'Unknown'}</span>
                            </div>
                            <div class="damage-stats">
                                <div class="damage-bar">
                                    <div class="damage-fill" style="width: ${damagePercent}%"></div>
                                </div>
                                <div class="damage-numbers">
                                    <span class="damage-amount">${DataFormatter.formatNumber(participant.totalDamageDealtToChampions || 0)}</span>
                                    <span class="damage-percent">(${damagePercent}%)</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderVisionAnalysis() {
        const teams = this.getTeamData();
        
        return `
            <div class="vision-comparison">
                ${teams.map(team => `
                    <div class="team-vision">
                        <h5>${team.teamId === 100 ? 'Blue Team' : 'Red Team'}</h5>
                        <div class="vision-stats">
                            <div class="vision-stat">
                                <span class="stat-label">Total Vision Score:</span>
                                <span class="stat-value">${team.totals.visionScore}</span>
                            </div>
                            <div class="vision-stat">
                                <span class="stat-label">Wards Placed:</span>
                                <span class="stat-value">${team.totals.wardsPlaced}</span>
                            </div>
                            <div class="vision-stat">
                                <span class="stat-label">Wards Killed:</span>
                                <span class="stat-value">${team.totals.wardsKilled}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPerformanceMetrics() {
        const participants = this.matchData.info.participants;
        
        return `
            <div class="performance-table">
                <div class="performance-headers">
                    <div class="player-col">Player</div>
                    <div class="metric-col">KP%</div>
                    <div class="metric-col">DMG/Gold</div>
                    <div class="metric-col">CS/Min</div>
                    <div class="metric-col">Vision</div>
                </div>
                ${participants.map(participant => {
                    const teamKills = this.getTeamKills(participant.teamId);
                    const killParticipation = teamKills > 0 ? (((participant.kills + participant.assists) / teamKills) * 100).toFixed(1) : 0;
                    const damagePerGold = participant.goldEarned > 0 ? ((participant.totalDamageDealtToChampions || 0) / participant.goldEarned).toFixed(2) : 0;
                    const csPerMin = ((participant.totalMinionsKilled + participant.neutralMinionsKilled) / (this.matchData.info.gameDuration / 60)).toFixed(1);
                    
                    return `
                        <div class="performance-row">
                            <div class="player-col">
                                <img 
                                    src="${this.getChampionImageUrl(participant.championId)}" 
                                    alt="${participant.championName}"
                                    class="champion-icon-small"
                                    onerror="this.src='${this.getPlaceholderImage()}'"
                                >
                                <span class="champion-name">${participant.championName || 'Unknown'}</span>
                            </div>
                            <div class="metric-col">${killParticipation}%</div>
                            <div class="metric-col">${damagePerGold}</div>
                            <div class="metric-col">${csPerMin}</div>
                            <div class="metric-col">${participant.visionScore || 0}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    getTeamData() {
        const teams = this.matchData.info.teams;
        const participants = this.matchData.info.participants;
        
        return teams.map(team => {
            const teamParticipants = participants.filter(p => p.teamId === team.teamId);
            
            const totals = teamParticipants.reduce((acc, p) => ({
                visionScore: acc.visionScore + (p.visionScore || 0),
                wardsPlaced: acc.wardsPlaced + (p.wardsPlaced || 0),
                wardsKilled: acc.wardsKilled + (p.wardsKilled || 0)
            }), { visionScore: 0, wardsPlaced: 0, wardsKilled: 0 });

            return {
                ...team,
                participants: teamParticipants,
                totals
            };
        });
    }

    getTeamKills(teamId) {
        const teamParticipants = this.matchData.info.participants.filter(p => p.teamId === teamId);
        return teamParticipants.reduce((sum, p) => sum + p.kills, 0);
    }

    getChampionImageUrl(championId) {
        return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Champion${championId}.png`;
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
