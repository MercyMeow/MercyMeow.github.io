// Timeline Tab Component - Displays match timeline and events
import { DataFormatter } from '../../utils.js';

export class TimelineTab {
	constructor(container, matchData, timelineData = null) {
		this.container = container;
		this.matchData = matchData;
		this.timelineData = timelineData;
		this.render();
	}

	render() {
		this.container.innerHTML = `
            <div class="timeline-tab">
                <div class="timeline-header">
                    <h3>Match Timeline</h3>
                    <p>Key events and progression throughout the match</p>
                </div>

                <div class="timeline-content">
                    ${this.timelineData ? this.renderTimeline() : this.renderNoTimeline()}
                </div>
            </div>
        `;
	}

	renderTimeline() {
		if (this.timelineData && this.timelineData.info && this.timelineData.info.frames) {
			return this.renderActualTimeline();
		} else {
			return this.renderDemoTimeline();
		}
	}

	renderActualTimeline() {
		const events = this.extractTimelineEvents();

		return `
            <div class="timeline-events">
                ${events
									.map(
										(event) => `
                    <div class="timeline-item ${event.type}">
                        <div class="timeline-time">${event.time}</div>
                        <div class="timeline-event">
                            <span class="event-icon">${event.icon}</span>
                            ${event.title}
                        </div>
                        <div class="timeline-description">${event.description}</div>
                        ${event.participants ? `<div class="timeline-participants">${event.participants}</div>` : ''}
                    </div>
                `
									)
									.join('')}
            </div>
        `;
	}

	renderDemoTimeline() {
		return `
            <div class="timeline-events">
                <div class="timeline-item match-start">
                    <div class="timeline-time">0:00</div>
                    <div class="timeline-event">
                        <span class="event-icon">🎮</span>
                        Match Start
                    </div>
                    <div class="timeline-description">Game begins on Summoner's Rift</div>
                </div>
                <div class="timeline-item first-blood">
                    <div class="timeline-time">2:30</div>
                    <div class="timeline-event">
                        <span class="event-icon">🩸</span>
                        First Blood
                    </div>
                    <div class="timeline-description">Blue team gets first kill</div>
                </div>
                <div class="timeline-item objective">
                    <div class="timeline-time">5:45</div>
                    <div class="timeline-event">
                        <span class="event-icon">🐉</span>
                        First Dragon
                    </div>
                    <div class="timeline-description">Blue team secures Ocean Dragon</div>
                </div>
                <div class="timeline-item structure">
                    <div class="timeline-time">8:12</div>
                    <div class="timeline-event">
                        <span class="event-icon">🏗️</span>
                        First Tower
                    </div>
                    <div class="timeline-description">Red team destroys bot lane tower</div>
                </div>
                <div class="timeline-item team-fight">
                    <div class="timeline-time">12:45</div>
                    <div class="timeline-event">
                        <span class="event-icon">⚔️</span>
                        Team Fight
                    </div>
                    <div class="timeline-description">Major team fight near Dragon pit (3 for 1)</div>
                </div>
                <div class="timeline-item objective">
                    <div class="timeline-time">14:30</div>
                    <div class="timeline-event">
                        <span class="event-icon">👹</span>
                        Baron Nashor
                    </div>
                    <div class="timeline-description">Blue team secures Baron</div>
                </div>
                <div class="timeline-item structure">
                    <div class="timeline-time">18:20</div>
                    <div class="timeline-event">
                        <span class="event-icon">🏰</span>
                        Inhibitor Down
                    </div>
                    <div class="timeline-description">Blue team destroys mid lane inhibitor</div>
                </div>
                <div class="timeline-item victory">
                    <div class="timeline-time">${DataFormatter.formatDuration(this.matchData.info.gameDuration)}</div>
                    <div class="timeline-event">
                        <span class="event-icon">👑</span>
                        Victory
                    </div>
                    <div class="timeline-description">Blue team destroys the Nexus</div>
                </div>
            </div>
        `;
	}

	extractTimelineEvents() {
		// This would parse actual timeline data
		// For now, return demo events
		return [
			{
				time: '0:00',
				type: 'match-start',
				icon: '🎮',
				title: 'Match Start',
				description: "Game begins on Summoner's Rift",
			},
		];
	}

	renderNoTimeline() {
		return `
            <div class="no-timeline">
                <div class="no-timeline-icon">⏱️</div>
                <h4>Timeline Data Not Available</h4>
                <p>Detailed timeline information is not available for this match.</p>
                <p>This feature shows key events like first blood, objectives, and team fights.</p>
            </div>
        `;
	}

	// Update data and re-render
	updateData(matchData, timelineData = null) {
		this.matchData = matchData;
		this.timelineData = timelineData;
		this.render();
	}
}
