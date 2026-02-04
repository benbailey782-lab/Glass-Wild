import { SlidePanel } from './SlidePanel.js'
import { gameState } from '../core/GameState.js'
import { uiManager } from './UIManager.js'

/**
 * ActionsPanel - Slide-out panel for maintenance actions
 */
export class ActionsPanel extends SlidePanel {
  constructor() {
    super('Actions', 320)
    this.buildContent()
  }

  buildContent() {
    const container = document.createElement('div')
    container.className = 'actions-panel-content'

    container.innerHTML = `
      <div class="actions-section">
        <h3 class="actions-section-title">Maintenance</h3>
        <div class="actions-grid">
          <button class="action-tile" data-action="mist">
            <span class="action-tile-icon">&#x1F4A7;</span>
            <span class="action-tile-label">Mist</span>
            <span class="action-tile-desc">+5% humidity</span>
          </button>
          <button class="action-tile" data-action="feed">
            <span class="action-tile-icon">&#x1F356;</span>
            <span class="action-tile-label">Feed</span>
            <span class="action-tile-desc">Drop food</span>
          </button>
        </div>
      </div>

      <div class="actions-section">
        <h3 class="actions-section-title">Coming Soon</h3>
        <div class="actions-grid">
          <button class="action-tile disabled" disabled>
            <span class="action-tile-icon">&#x1F9F9;</span>
            <span class="action-tile-label">Clean</span>
          </button>
          <button class="action-tile disabled" disabled>
            <span class="action-tile-icon">&#x1F321;</span>
            <span class="action-tile-label">Adjust Temp</span>
          </button>
        </div>
      </div>
    `

    // Bind action handlers
    container.querySelectorAll('.action-tile[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action
        this.handleAction(action)
      })
    })

    this.appendContent(container)
  }

  handleAction(action) {
    switch (action) {
      case 'mist':
        this.handleMist()
        break
      case 'feed':
        this.handleFeed()
        break
    }
  }

  handleMist() {
    if (gameState.currentTank) {
      const currentHumidity = gameState.currentTank.environment.humidity
      gameState.updateCurrentTank({
        environment: {
          ...gameState.currentTank.environment,
          humidity: Math.min(100, currentHumidity + 5)
        }
      })
      uiManager.notify('Misting... humidity +5%', 'info', 2000)
    }
  }

  handleFeed() {
    uiManager.notify('Feeding time!', 'info', 2000)
    // TODO: Implement actual feeding mechanic
  }
}

export default ActionsPanel
