// Player Card Component - Displays individual player statistics
import { DataFormatter, ColorUtils } from '../utils.js';

export class PlayerCard {
    constructor(container, participant, matchDuration) {
        this.container = container;
        this.participant = participant;
        this.matchDuration = matchDuration;
        this.render();
    }

    render() {
        const participant = this.participant;
        const kdaColor = ColorUtils.getKDAColor(participant.kda || 0);
        const csColor = ColorUtils.getCSColor(participant.csPerMinute || 0);
        const teamColor = ColorUtils.getTeamColor(participant.teamId);

        this.container.innerHTML = `
            <div class="player-card team-${participant.teamId}">
                <div class="player-header">
                    <div class="champion-section">
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
                            <div class="summoner-spells">
                                <img 
                                    src="${participant.spell1Image || this.getSummonerSpellImageUrl(participant.summoner1Id)}" 
                                    alt="${participant.spell1Name}"
                                    class="spell-image"
                                    onerror="this.src='${this.getPlaceholderImage()}'"
                                >
                                <img 
                                    src="${participant.spell2Image || this.getSummonerSpellImageUrl(participant.summoner2Id)}" 
                                    alt="${participant.spell2Name}"
                                    class="spell-image"
                                    onerror="this.src='${this.getPlaceholderImage()}'"
                                >
                            </div>
                        </div>
                    </div>
                    
                    <div class="player-info">
                        <div class="summoner-name" style="color: ${teamColor}">
                            ${participant.summonerName || 'Unknown Player'}
                        </div>
                        <div class="player-result ${participant.win ? 'victory' : 'defeat'}">
                            ${participant.win ? 'VICTORY' : 'DEFEAT'}
                        </div>
                    </div>
                </div>

                <div class="player-stats">
                    <div class="primary-stats">
                        <div class="kda-section">
                            <div class="kda-display" style="color: ${kdaColor}">
                                <span class="kda-numbers">${participant.kills} / ${participant.deaths} / ${participant.assists}</span>
                                <span class="kda-ratio">${(participant.kda || 0).toFixed(2)} KDA</span>
                            </div>
                            <div class="kill-participation">
                                ${this.calculateKillParticipation()}% KP
                            </div>
                        </div>

                        <div class="cs-section">
                            <div class="cs-display" style="color: ${csColor}">
                                <span class="cs-number">${(participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0)}</span>
                                <span class="cs-per-min">(${(participant.csPerMinute || 0).toFixed(1)}/min)</span>
                            </div>
                        </div>

                        <div class="gold-section">
                            <div class="gold-display">
                                <span class="gold-amount">${DataFormatter.formatGold(participant.goldEarned || 0)}</span>
                                <span class="gold-label">Gold</span>
                            </div>
                        </div>
                    </div>

                    <div class="secondary-stats">
                        <div class="stat-grid">
                            <div class="stat-item">
                                <span class="stat-value">${DataFormatter.formatNumber(participant.totalDamageDealtToChampions || 0)}</span>
                                <span class="stat-label">Damage</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${DataFormatter.formatNumber(participant.totalDamageTaken || 0)}</span>
                                <span class="stat-label">Damage Taken</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${participant.visionScore || 0}</span>
                                <span class="stat-label">Vision Score</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${participant.wardsPlaced || 0}</span>
                                <span class="stat-label">Wards Placed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="player-items">
                    <div class="items-header">
                        <span>Items</span>
                        <span class="total-gold">${DataFormatter.formatGold(this.calculateItemsGold())} spent</span>
                    </div>
                    <div class="items-grid">
                        ${this.renderItems()}
                    </div>
                </div>

                <div class="player-performance">
                    <div class="performance-bars">
                        ${this.renderPerformanceBars()}
                    </div>
                </div>
            </div>
        `;
    }

    calculateKillParticipation() {
        // This would need team data to calculate properly
        // For now, return a placeholder calculation
        const teamKills = 20; // This should come from team data
        const playerKillsAndAssists = (this.participant.kills || 0) + (this.participant.assists || 0);
        return teamKills > 0 ? Math.round((playerKillsAndAssists / teamKills) * 100) : 0;
    }

    calculateItemsGold() {
        if (!this.participant.items) return 0;
        return this.participant.items.reduce((total, item) => total + (item?.gold || 0), 0);
    }

    renderItems() {
        const itemSlots = ['item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6'];
        
        return itemSlots.map(slot => {
            const itemId = this.participant[slot];
            if (!itemId || itemId === 0) {
                return '<div class="item-slot empty"></div>';
            }
            
            const item = this.participant.items?.find(i => i.id === itemId);
            
            return `
                <div class="item-slot" title="${item?.name || 'Item ' + itemId}">
                    <img 
                        src="${item?.image || this.getItemImageUrl(itemId)}" 
                        alt="${item?.name || 'Item'}"
                        class="item-image"
                        onerror="this.src='${this.getPlaceholderImage()}'"
                    >
                </div>
            `;
        }).join('');
    }

    renderPerformanceBars() {
        const stats = [
            {
                label: 'Damage Share',
                value: this.participant.totalDamageDealtToChampions || 0,
                max: 50000, // This should be calculated from team data
                color: '#e74c3c'
            },
            {
                label: 'Gold Share',
                value: this.participant.goldEarned || 0,
                max: 20000, // This should be calculated from team data
                color: '#f39c12'
            },
            {
                label: 'Vision Score',
                value: this.participant.visionScore || 0,
                max: 100,
                color: '#9b59b6'
            }
        ];

        return stats.map(stat => {
            const percentage = Math.min((stat.value / stat.max) * 100, 100);
            
            return `
                <div class="performance-bar">
                    <div class="bar-label">
                        <span>${stat.label}</span>
                        <span>${DataFormatter.formatNumber(stat.value)}</span>
                    </div>
                    <div class="bar-container">
                        <div 
                            class="bar-fill" 
                            style="width: ${percentage}%; background-color: ${stat.color}"
                        ></div>
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

    getSummonerSpellImageUrl(spellId) {
        return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/Summoner${spellId}.png`;
    }

    getPlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMCAxMEwzMCAzME0zMCAxMEwxMCAzMCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
    }

    // Update participant data and re-render
    updateParticipant(newParticipant) {
        this.participant = newParticipant;
        this.render();
    }

    // Get participant data for external use
    getParticipantData() {
        return this.participant;
    }

    // Highlight specific stats
    highlightStats(statTypes = []) {
        statTypes.forEach(statType => {
            const element = this.container.querySelector(`.${statType}-section`);
            if (element) {
                element.classList.add('highlighted');
                setTimeout(() => element.classList.remove('highlighted'), 2000);
            }
        });
    }
}
