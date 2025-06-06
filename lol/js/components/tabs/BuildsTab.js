// Builds Tab Component - Displays champion builds and item analysis
import { DataFormatter } from '../../utils.js';

export class BuildsTab {
    constructor(container, matchData, timelineData = null) {
        this.container = container;
        this.matchData = matchData;
        this.timelineData = timelineData;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="builds-tab">
                <div class="builds-header">
                    <h3>Champion Builds</h3>
                    <p>Item builds and progression for each player</p>
                </div>

                <div class="builds-content">
                    ${this.renderBuilds()}
                </div>
            </div>
        `;
    }

    renderBuilds() {
        const teams = this.getTeamData();
        
        return `
            <div class="builds-teams">
                ${teams.map(team => this.renderTeamBuilds(team)).join('')}
            </div>
        `;
    }

    renderTeamBuilds(team) {
        return `
            <div class="team-builds">
                <div class="team-builds-header">
                    <h4>${team.teamId === 100 ? 'Blue Team' : 'Red Team'} Builds</h4>
                </div>
                <div class="players-builds">
                    ${team.participants.map(participant => this.renderPlayerBuild(participant)).join('')}
                </div>
            </div>
        `;
    }

    renderPlayerBuild(participant) {
        return `
            <div class="player-build">
                <div class="player-build-header">
                    <img 
                        src="${this.getChampionImageUrl(participant.championId)}" 
                        alt="${participant.championName}"
                        class="champion-icon"
                        onerror="this.src='${this.getPlaceholderImage()}'"
                    >
                    <div class="player-info">
                        <div class="champion-name">${participant.championName || 'Unknown'}</div>
                        <div class="summoner-name">${participant.summonerName || 'Unknown'}</div>
                    </div>
                </div>
                
                <div class="build-details">
                    <div class="final-items">
                        <h5>Final Build</h5>
                        <div class="items-grid">
                            ${this.renderPlayerItems(participant)}
                        </div>
                        <div class="build-cost">
                            Total Gold: ${DataFormatter.formatGold(participant.goldEarned || 0)}
                        </div>
                    </div>
                    
                    <div class="summoner-spells">
                        <h5>Summoner Spells</h5>
                        <div class="spells-row">
                            <img 
                                src="${this.getSummonerSpellImageUrl(participant.summoner1Id)}" 
                                alt="Summoner Spell 1"
                                class="spell-icon"
                                onerror="this.src='${this.getPlaceholderImage()}'"
                            >
                            <img 
                                src="${this.getSummonerSpellImageUrl(participant.summoner2Id)}" 
                                alt="Summoner Spell 2"
                                class="spell-icon"
                                onerror="this.src='${this.getPlaceholderImage()}'"
                            >
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPlayerItems(participant) {
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

    getTeamData() {
        const teams = this.matchData.info.teams;
        const participants = this.matchData.info.participants;
        
        return teams.map(team => {
            const teamParticipants = participants.filter(p => p.teamId === team.teamId);
            return {
                ...team,
                participants: teamParticipants
            };
        });
    }

    getChampionImageUrl(championId) {
        return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Champion${championId}.png`;
    }

    getItemImageUrl(itemId) {
        return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/item/${itemId}.png`;
    }

    getSummonerSpellImageUrl(spellId) {
        return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/Summoner${spellId}.png`;
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
