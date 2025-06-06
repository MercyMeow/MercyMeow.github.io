// Team Overview Component - Displays team compositions and basic stats
import { DataFormatter, ColorUtils } from '../utils.js';

export class TeamOverview {
    constructor(container, matchData) {
        this.container = container;
        this.matchData = matchData;
        this.render();
    }

    render() {
        const teams = this.getTeamData();
        
        this.container.innerHTML = `
            <div class="team-overview">
                <div class="teams-container">
                    ${teams.map(team => this.renderTeam(team)).join('')}
                </div>
                
                <div class="team-comparison">
                    <h3>Team Statistics Comparison</h3>
                    <div class="comparison-grid">
                        ${this.renderTeamComparison(teams)}
                    </div>
                </div>
            </div>
        `;
    }

    getTeamData() {
        const teams = this.matchData.info.teams;
        const participants = this.matchData.info.participants;
        
        return teams.map(team => {
            const teamParticipants = participants.filter(p => p.teamId === team.teamId);
            
            // Calculate team totals
            const totals = teamParticipants.reduce((acc, p) => ({
                kills: acc.kills + p.kills,
                deaths: acc.deaths + p.deaths,
                assists: acc.assists + p.assists,
                gold: acc.gold + p.goldEarned,
                damage: acc.damage + (p.totalDamageDealtToChampions || 0),
                cs: acc.cs + (p.totalMinionsKilled + p.neutralMinionsKilled),
                visionScore: acc.visionScore + (p.visionScore || 0)
            }), { kills: 0, deaths: 0, assists: 0, gold: 0, damage: 0, cs: 0, visionScore: 0 });

            return {
                ...team,
                participants: teamParticipants,
                totals,
                averages: {
                    kda: totals.deaths === 0 ? totals.kills + totals.assists : (totals.kills + totals.assists) / totals.deaths,
                    goldPerPlayer: totals.gold / teamParticipants.length,
                    damagePerPlayer: totals.damage / teamParticipants.length,
                    csPerPlayer: totals.cs / teamParticipants.length,
                    visionPerPlayer: totals.visionScore / teamParticipants.length
                }
            };
        });
    }

    renderTeam(team) {
        const teamColor = ColorUtils.getTeamColor(team.teamId);
        const resultClass = team.win ? 'victory' : 'defeat';
        const resultText = team.win ? 'VICTORY' : 'DEFEAT';

        return `
            <div class="team-card team-${team.teamId} ${resultClass}">
                <div class="team-header">
                    <div class="team-result">
                        <h3 class="team-name" style="color: ${teamColor}">
                            ${team.teamId === 100 ? 'Blue Team' : 'Red Team'}
                        </h3>
                        <div class="result-badge ${resultClass}">${resultText}</div>
                    </div>
                    <div class="team-kda">
                        <span class="kda-text">
                            ${team.totals.kills} / ${team.totals.deaths} / ${team.totals.assists}
                        </span>
                        <span class="kda-ratio">
                            ${team.averages.kda.toFixed(2)} KDA
                        </span>
                    </div>
                </div>

                <div class="team-composition">
                    <h4>Team Composition</h4>
                    <div class="champions-grid">
                        ${team.participants.map(participant => this.renderChampionCard(participant)).join('')}
                    </div>
                </div>

                <div class="team-stats">
                    <h4>Team Statistics</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">${DataFormatter.formatGold(team.totals.gold)}</span>
                            <span class="stat-label">Total Gold</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${DataFormatter.formatNumber(team.totals.damage)}</span>
                            <span class="stat-label">Team Damage</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${team.totals.cs}</span>
                            <span class="stat-label">Total CS</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${Math.round(team.totals.visionScore)}</span>
                            <span class="stat-label">Vision Score</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderChampionCard(participant) {
        const kdaColor = ColorUtils.getKDAColor(participant.kda || 0);
        
        return `
            <div class="champion-card">
                <div class="champion-image-container">
                    <img 
                        src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                        alt="${participant.championName}"
                        class="champion-image"
                        onerror="this.src='${this.getPlaceholderImage()}'"
                    >
                    <div class="champion-level">${participant.champLevel}</div>
                </div>
                
                <div class="champion-info">
                    <div class="champion-name">${participant.championName || 'Unknown'}</div>
                    <div class="summoner-name">${participant.summonerName || 'Unknown'}</div>
                </div>
                
                <div class="champion-kda" style="color: ${kdaColor}">
                    ${participant.kills}/${participant.deaths}/${participant.assists}
                </div>
                
                <div class="champion-items">
                    ${this.renderItems(participant)}
                </div>
            </div>
        `;
    }

    renderItems(participant) {
        const itemSlots = ['item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6'];
        
        return itemSlots.map(slot => {
            const itemId = participant[slot];
            if (!itemId || itemId === 0) {
                return '<div class="item-slot empty"></div>';
            }
            
            return `
                <div class="item-slot">
                    <img 
                        src="${this.getItemImageUrl(itemId)}" 
                        alt="Item ${itemId}"
                        class="item-image"
                        onerror="this.src='${this.getPlaceholderImage()}'"
                    >
                </div>
            `;
        }).join('');
    }

    renderTeamComparison(teams) {
        const [team1, team2] = teams;
        const comparisons = [
            { 
                label: 'Total Kills', 
                team1: team1.totals.kills, 
                team2: team2.totals.kills,
                format: (val) => val.toString()
            },
            { 
                label: 'Total Gold', 
                team1: team1.totals.gold, 
                team2: team2.totals.gold,
                format: (val) => DataFormatter.formatGold(val)
            },
            { 
                label: 'Total Damage', 
                team1: team1.totals.damage, 
                team2: team2.totals.damage,
                format: (val) => DataFormatter.formatNumber(val)
            },
            { 
                label: 'Total CS', 
                team1: team1.totals.cs, 
                team2: team2.totals.cs,
                format: (val) => val.toString()
            },
            { 
                label: 'Vision Score', 
                team1: team1.totals.visionScore, 
                team2: team2.totals.visionScore,
                format: (val) => Math.round(val).toString()
            }
        ];

        return comparisons.map(comp => {
            const total = comp.team1 + comp.team2;
            const team1Percentage = total > 0 ? (comp.team1 / total) * 100 : 50;
            const team2Percentage = total > 0 ? (comp.team2 / total) * 100 : 50;

            return `
                <div class="comparison-item">
                    <div class="comparison-label">${comp.label}</div>
                    <div class="comparison-bar">
                        <div class="team-value team-${team1.teamId}">
                            ${comp.format(comp.team1)}
                        </div>
                        <div class="progress-bar">
                            <div 
                                class="progress-fill team-${team1.teamId}" 
                                style="width: ${team1Percentage}%; background-color: ${ColorUtils.getTeamColor(team1.teamId)}"
                            ></div>
                            <div 
                                class="progress-fill team-${team2.teamId}" 
                                style="width: ${team2Percentage}%; background-color: ${ColorUtils.getTeamColor(team2.teamId)}"
                            ></div>
                        </div>
                        <div class="team-value team-${team2.teamId}">
                            ${comp.format(comp.team2)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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

    // Update match data and re-render
    updateMatchData(newMatchData) {
        this.matchData = newMatchData;
        this.render();
    }

    // Get team statistics for external use
    getTeamStats() {
        return this.getTeamData();
    }
}
