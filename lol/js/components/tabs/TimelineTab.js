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
        return `
            <div class="timeline-events">
                <div class="timeline-item">
                    <div class="timeline-time">0:00</div>
                    <div class="timeline-event">Match Start</div>
                    <div class="timeline-description">Game begins</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">2:30</div>
                    <div class="timeline-event">First Blood</div>
                    <div class="timeline-description">Blue team gets first kill</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">5:45</div>
                    <div class="timeline-event">First Dragon</div>
                    <div class="timeline-description">Blue team secures Ocean Dragon</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">8:12</div>
                    <div class="timeline-event">First Tower</div>
                    <div class="timeline-description">Red team destroys bot lane tower</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">14:30</div>
                    <div class="timeline-event">Baron Nashor</div>
                    <div class="timeline-description">Blue team secures Baron</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">${DataFormatter.formatDuration(this.matchData.info.gameDuration)}</div>
                    <div class="timeline-event">Victory</div>
                    <div class="timeline-description">Match ends</div>
                </div>
            </div>
        `;
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
