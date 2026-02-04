import { SlidePanel } from './SlidePanel.js'
import { uiManager } from './UIManager.js'

/**
 * ViewPanel - Slide-out panel for view options
 */
export class ViewPanel extends SlidePanel {
  constructor() {
    super('View Options', 320)
    this.buildContent()
  }

  buildContent() {
    const container = document.createElement('div')
    container.className = 'view-panel-content'

    const isGlassVisible = window.terrarium?.glassVisible ?? true

    container.innerHTML = `
      <div class="view-section">
        <h3 class="view-section-title">Display</h3>

        <div class="view-option">
          <div class="view-option-info">
            <span class="view-option-label">Glass Walls</span>
            <span class="view-option-desc">Toggle enclosure visibility (H)</span>
          </div>
          <button class="view-toggle ${isGlassVisible ? 'active' : ''}" data-option="glass">
            ${isGlassVisible ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div class="view-section">
        <h3 class="view-section-title">Coming Soon</h3>

        <div class="view-option disabled">
          <div class="view-option-info">
            <span class="view-option-label">Follow Creature</span>
            <span class="view-option-desc">Camera tracks selected creature</span>
          </div>
          <button class="view-toggle" disabled>OFF</button>
        </div>

        <div class="view-option disabled">
          <div class="view-option-info">
            <span class="view-option-label">Photo Mode</span>
            <span class="view-option-desc">Hide UI for screenshots</span>
          </div>
          <button class="view-toggle" disabled>OFF</button>
        </div>
      </div>
    `

    // Glass toggle handler
    const glassToggle = container.querySelector('[data-option="glass"]')
    glassToggle.addEventListener('click', () => {
      this.toggleGlass(glassToggle)
    })

    this.appendContent(container)
  }

  toggleGlass(btn) {
    if (window.terrarium) {
      window.terrarium.toggleGlassVisibility()
      const isVisible = window.terrarium.glassVisible
      btn.textContent = isVisible ? 'ON' : 'OFF'
      btn.classList.toggle('active', isVisible)
      uiManager.notify(isVisible ? 'Glass visible' : 'Glass hidden', 'info', 1500)
    }
  }
}

export default ViewPanel
