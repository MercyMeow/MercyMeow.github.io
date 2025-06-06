// Match Header Component - Displays basic match information
import { DataFormatter } from '../utils.js';

export class MatchHeader {
    constructor(container, matchData) {
        this.container = container;
        this.matchData = matchData;
        this.render();
    }

    render() {
        const match = this.matchData.info;
        const teams = this.getTeamData();
        
        this.container.innerHTML = `
            <div class="match-header">
                <div class="match-basic-info">
                    <div class="match-result">
                        <div class="team-result team-${teams.winner.teamId}">
                            <span class="result-text victory">VICTORY</span>
                            <div class="team-score">${teams.winner.kills}</div>
                        </div>
                        <div class="vs-separator">VS</div>
                        <div class="team-result team-${teams.loser.teamId}">
                            <span class="result-text defeat">DEFEAT</span>
                            <div class="team-score">${teams.loser.kills}</div>
                        </div>
                    </div>
                    
                    <div class="match-metadata">
                        <div class="match-duration">
                            <span class="label">Duration:</span>
                            <span class="value">${DataFormatter.formatDuration(match.gameDuration)}</span>
                        </div>
                        <div class="match-mode">
                            <span class="label">Mode:</span>
                            <span class="value">${this.formatGameMode(match.gameMode)}</span>
                        </div>
                        <div class="match-date">
                            <span class="label">Played:</span>
                            <span class="value">${DataFormatter.formatDate(match.gameCreation)}</span>
                        </div>
                        <div class="match-patch">
                            <span class="label">Patch:</span>
                            <span class="value">${match.gameVersion?.split('.').slice(0, 2).join('.') || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                <div class="match-objectives">
                    <div class="objectives-header">
                        <h3>Objectives</h3>
                    </div>
                    <div class="objectives-grid">
                        ${this.renderObjectives(teams)}
                    </div>
                </div>

                <div class="match-bans">
                    <div class="bans-header">
                        <h3>Champion Bans</h3>
                    </div>
                    <div class="bans-container">
                        ${this.renderBans(teams)}
                    </div>
                </div>
            </div>
        `;
    }

    getTeamData() {
        const teams = this.matchData.info.teams;
        const participants = this.matchData.info.participants;
        
        const teamData = teams.map(team => {
            const teamParticipants = participants.filter(p => p.teamId === team.teamId);
            const kills = teamParticipants.reduce((sum, p) => sum + p.kills, 0);
            const deaths = teamParticipants.reduce((sum, p) => sum + p.deaths, 0);
            const assists = teamParticipants.reduce((sum, p) => sum + p.assists, 0);
            
            return {
                ...team,
                kills,
                deaths,
                assists,
                participants: teamParticipants
            };
        });

        const winner = teamData.find(team => team.win);
        const loser = teamData.find(team => !team.win);

        return { winner, loser, teams: teamData };
    }

    renderObjectives(teams) {
        const objectives = [
            { key: 'baron', name: 'Baron', icon: '🐉' },
            { key: 'dragon', name: 'Dragons', icon: '🐲' },
            { key: 'tower', name: 'Towers', icon: '🏰' },
            { key: 'inhibitor', name: 'Inhibitors', icon: '🛡️' },
            { key: 'riftHerald', name: 'Herald', icon: '👁️' }
        ];

        return objectives.map(obj => {
            const team1Count = teams.winner.objectives?.[obj.key]?.kills || 0;
            const team2Count = teams.loser.objectives?.[obj.key]?.kills || 0;
            
            return `
                <div class="objective-item">
                    <div class="objective-icon">${obj.icon}</div>
                    <div class="objective-name">${obj.name}</div>
                    <div class="objective-scores">
                        <span class="team-score team-${teams.winner.teamId}">${team1Count}</span>
                        <span class="separator">-</span>
                        <span class="team-score team-${teams.loser.teamId}">${team2Count}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderBans(teams) {
        return teams.teams.map(team => `
            <div class="team-bans team-${team.teamId}">
                <div class="team-label">${team.teamId === 100 ? 'Blue Team' : 'Red Team'}</div>
                <div class="bans-list">
                    ${team.bans?.map(ban => `
                        <div class="ban-item">
                            <img 
                                src="${this.getChampionImageUrl(ban.championId)}" 
                                alt="Banned Champion"
                                class="ban-champion-image"
                                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMCAxMEwzMCAzME0zMCAxMEwxMCAzMCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+'"
                            >
                            <div class="ban-overlay">❌</div>
                        </div>
                    `).join('') || '<div class="no-bans">No bans</div>'}
                </div>
            </div>
        `).join('');
    }

    formatGameMode(gameMode) {
        const modes = {
            'CLASSIC': 'Ranked/Normal',
            'ARAM': 'ARAM',
            'URF': 'URF',
            'ONEFORALL': 'One for All',
            'NEXUSBLITZ': 'Nexus Blitz',
            'TUTORIAL': 'Tutorial'
        };
        return modes[gameMode] || gameMode;
    }

    getChampionImageUrl(championId) {
        if (!championId || championId === -1) {
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMCAxMEwzMCAzME0zMCAxMEwxMCAzMCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
        }
        
        // This would need to be enhanced with actual champion data
        // For now, return a placeholder that will be replaced by the API service
        return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Champion${championId}.png`;
    }

    // Update match data and re-render
    updateMatchData(newMatchData) {
        this.matchData = newMatchData;
        this.render();
    }

    // Get current match info for external use
    getMatchInfo() {
        return {
            duration: this.matchData.info.gameDuration,
            mode: this.matchData.info.gameMode,
            date: this.matchData.info.gameCreation,
            patch: this.matchData.info.gameVersion
        };
    }
}
