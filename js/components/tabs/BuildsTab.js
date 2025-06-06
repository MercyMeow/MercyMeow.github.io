// Builds Tab Component - Displays item builds and skill orders for all players
import { DataFormatter, ColorUtils } from '../../utils.js';

export class BuildsTab {
    constructor(container, matchData, timelineData) {
        this.container = container;
        this.matchData = matchData;
        this.timelineData = timelineData;
        this.selectedPlayer = null;
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="builds-tab">
                <div class="builds-header">
                    <h3>Item Builds & Skill Orders</h3>
                    <div class="player-selector">
                        <label for="player-select">Select Player:</label>
                        <select id="player-select">
                            <option value="">All Players</option>
                            ${this.renderPlayerOptions()}
                        </select>
                    </div>
                </div>

                <div class="builds-content">
                    ${this.selectedPlayer ? this.renderPlayerBuild() : this.renderAllBuilds()}
                </div>
            </div>
        `;
    }

    renderPlayerOptions() {
        return this.matchData.info.participants.map((participant, index) => `
            <option value="${index}">
                ${participant.summonerName} (${participant.championName})
            </option>
        `).join('');
    }

    renderAllBuilds() {
        const teams = this.getTeamData();
        
        return `
            <div class="teams-builds">
                ${teams.map(team => this.renderTeamBuilds(team)).join('')}
            </div>
        `;
    }

    renderTeamBuilds(team) {
        const teamColor = ColorUtils.getTeamColor(team.teamId);
        
        return `
            <div class="team-builds">
                <div class="team-header">
                    <h4 style="color: ${teamColor}">
                        ${team.teamId === 100 ? 'Blue Team' : 'Red Team'}
                    </h4>
                </div>
                <div class="players-builds">
                    ${team.participants.map(participant => this.renderPlayerBuildSummary(participant)).join('')}
                </div>
            </div>
        `;
    }

    renderPlayerBuildSummary(participant) {
        return `
            <div class="player-build-summary" data-participant="${participant.participantId}">
                <div class="player-header">
                    <div class="champion-info">
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
                    <div class="build-stats">
                        <div class="total-gold">${DataFormatter.formatGold(participant.goldEarned || 0)}</div>
                        <div class="items-count">${this.getItemCount(participant)} items</div>
                    </div>
                </div>

                <div class="final-build">
                    <div class="items-section">
                        <h5>Final Items</h5>
                        <div class="items-grid">
                            ${this.renderFinalItems(participant)}
                        </div>
                    </div>
                    
                    <div class="skills-section">
                        <h5>Skill Order</h5>
                        <div class="skill-order">
                            ${this.renderSkillOrder(participant)}
                        </div>
                    </div>
                </div>

                <button class="view-details-btn" data-participant="${participant.participantId}">
                    View Detailed Build
                </button>
            </div>
        `;
    }

    renderPlayerBuild() {
        const participant = this.matchData.info.participants[this.selectedPlayer];
        if (!participant) return '<p>Player not found</p>';

        return `
            <div class="detailed-build">
                <div class="build-header">
                    <div class="player-info">
                        <img 
                            src="${participant.championImage || this.getChampionImageUrl(participant.championId)}" 
                            alt="${participant.championName}"
                            class="champion-portrait"
                            onerror="this.src='${this.getPlaceholderImage()}'"
                        >
                        <div class="player-details">
                            <h4>${participant.summonerName}</h4>
                            <p>${participant.championName} - Level ${participant.champLevel}</p>
                            <p>Total Gold: ${DataFormatter.formatGold(participant.goldEarned || 0)}</p>
                        </div>
                    </div>
                </div>

                <div class="build-progression">
                    <div class="items-progression">
                        <h5>Item Build Progression</h5>
                        ${this.renderItemProgression(participant)}
                    </div>

                    <div class="skills-progression">
                        <h5>Skill Level Progression</h5>
                        ${this.renderSkillProgression(participant)}
                    </div>
                </div>

                <div class="build-analysis">
                    <h5>Build Analysis</h5>
                    ${this.renderBuildAnalysis(participant)}
                </div>
            </div>
        `;
    }

    renderFinalItems(participant) {
        const itemSlots = ['item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6'];
        
        return itemSlots.map(slot => {
            const itemId = participant[slot];
            if (!itemId || itemId === 0) {
                return '<div class="item-slot empty"></div>';
            }
            
            return `
                <div class="item-slot" title="Item ${itemId}">
                    <img 
                        src="${this.getItemImageUrl(itemId)}" 
                        alt="Item ${itemId}"
                        onerror="this.src='${this.getPlaceholderImage()}'"
                    >
                    <div class="item-cost">${this.getItemCost(itemId)}</div>
                </div>
            `;
        }).join('');
    }

    renderSkillOrder(participant) {
        // This would need timeline data to show actual skill order
        // For now, show a placeholder based on final skill levels
        const skills = ['Q', 'W', 'E', 'R'];
        const maxLevel = participant.champLevel || 18;
        
        return `
            <div class="skill-levels">
                ${skills.map(skill => `
                    <div class="skill-info">
                        <div class="skill-key">${skill}</div>
                        <div class="skill-level">Lv ${this.getSkillLevel(participant, skill)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="skill-order-sequence">
                ${this.generateSkillSequence(maxLevel)}
            </div>
        `;
    }

    renderItemProgression(participant) {
        if (!this.timelineData) {
            return '<p class="no-data">Timeline data required for item progression</p>';
        }

        // This would analyze timeline events for item purchases
        return `
            <div class="progression-timeline">
                <div class="progression-item">
                    <div class="time">2:30</div>
                    <div class="item">Doran's Blade</div>
                    <div class="cost">450g</div>
                </div>
                <div class="progression-item">
                    <div class="time">5:45</div>
                    <div class="item">Berserker's Greaves</div>
                    <div class="cost">1100g</div>
                </div>
                <div class="progression-item">
                    <div class="time">8:12</div>
                    <div class="item">Kraken Slayer</div>
                    <div class="cost">3400g</div>
                </div>
                <!-- More items would be populated from timeline data -->
            </div>
        `;
    }

    renderSkillProgression(participant) {
        if (!this.timelineData) {
            return '<p class="no-data">Timeline data required for skill progression</p>';
        }

        // This would analyze timeline events for skill level ups
        return `
            <div class="skill-timeline">
                <div class="skill-levels-grid">
                    ${Array.from({length: participant.champLevel || 18}, (_, i) => `
                        <div class="level-point">
                            <div class="level">${i + 1}</div>
                            <div class="skill">${this.getSkillAtLevel(i + 1)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderBuildAnalysis(participant) {
        const totalItemCost = this.calculateTotalItemCost(participant);
        const goldEfficiency = this.calculateGoldEfficiency(participant);
        
        return `
            <div class="analysis-grid">
                <div class="analysis-item">
                    <div class="analysis-label">Total Item Cost</div>
                    <div class="analysis-value">${DataFormatter.formatGold(totalItemCost)}</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-label">Gold Efficiency</div>
                    <div class="analysis-value">${goldEfficiency}%</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-label">Build Completion</div>
                    <div class="analysis-value">${this.getBuildCompletion(participant)}%</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-label">Power Spike</div>
                    <div class="analysis-value">${this.getPowerSpike(participant)}</div>
                </div>
            </div>
        `;
    }

    // Helper methods
    getTeamData() {
        const teams = this.matchData.info.teams;
        const participants = this.matchData.info.participants;
        
        return teams.map(team => ({
            ...team,
            participants: participants.filter(p => p.teamId === team.teamId)
        }));
    }

    getItemCount(participant) {
        const itemSlots = ['item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6'];
        return itemSlots.filter(slot => participant[slot] && participant[slot] !== 0).length;
    }

    getSkillLevel(participant, skill) {
        // This would need actual skill data from the API
        // For now, return a placeholder
        const skillMap = { Q: 'spell1Casts', W: 'spell2Casts', E: 'spell3Casts', R: 'spell4Casts' };
        return Math.min(5, Math.floor((participant[skillMap[skill]] || 0) / 10) + 1);
    }

    generateSkillSequence(maxLevel) {
        // Generate a typical skill sequence (placeholder)
        const sequence = [];
        for (let i = 1; i <= Math.min(maxLevel, 18); i++) {
            if (i === 6 || i === 11 || i === 16) {
                sequence.push('R');
            } else if (i % 3 === 1) {
                sequence.push('Q');
            } else if (i % 3 === 2) {
                sequence.push('W');
            } else {
                sequence.push('E');
            }
        }
        
        return sequence.map((skill, index) => `
            <div class="skill-point">
                <div class="level">${index + 1}</div>
                <div class="skill">${skill}</div>
            </div>
        `).join('');
    }

    getSkillAtLevel(level) {
        // Placeholder skill progression
        if (level === 6 || level === 11 || level === 16) return 'R';
        if (level % 3 === 1) return 'Q';
        if (level % 3 === 2) return 'W';
        return 'E';
    }

    calculateTotalItemCost(participant) {
        // This would calculate based on actual item costs
        return participant.goldSpent || 0;
    }

    calculateGoldEfficiency(participant) {
        // Placeholder calculation
        return Math.round(85 + Math.random() * 30);
    }

    getBuildCompletion(participant) {
        const itemCount = this.getItemCount(participant);
        return Math.round((itemCount / 6) * 100);
    }

    getPowerSpike(participant) {
        const level = participant.champLevel || 1;
        if (level >= 16) return 'Late Game';
        if (level >= 11) return 'Mid Game';
        if (level >= 6) return 'Early-Mid';
        return 'Early Game';
    }

    getItemCost(itemId) {
        // This would return actual item cost from static data
        return Math.floor(Math.random() * 3000) + 500;
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

    setupEventListeners() {
        const playerSelect = this.container.querySelector('#player-select');
        const viewDetailsBtns = this.container.querySelectorAll('.view-details-btn');

        if (playerSelect) {
            playerSelect.addEventListener('change', (e) => {
                this.selectedPlayer = e.target.value ? parseInt(e.target.value) : null;
                const content = this.container.querySelector('.builds-content');
                content.innerHTML = this.selectedPlayer ? this.renderPlayerBuild() : this.renderAllBuilds();
                this.setupEventListeners(); // Re-setup listeners for new content
            });
        }

        viewDetailsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const participantId = parseInt(e.target.getAttribute('data-participant'));
                const participantIndex = this.matchData.info.participants.findIndex(p => p.participantId === participantId);
                if (participantIndex !== -1) {
                    playerSelect.value = participantIndex;
                    this.selectedPlayer = participantIndex;
                    const content = this.container.querySelector('.builds-content');
                    content.innerHTML = this.renderPlayerBuild();
                    this.setupEventListeners();
                }
            });
        });
    }

    // Update data and re-render
    updateData(matchData, timelineData) {
        this.matchData = matchData;
        this.timelineData = timelineData;
        this.selectedPlayer = null;
        this.render();
        this.setupEventListeners();
    }
}
