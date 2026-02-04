import { gameState } from '../core/GameState.js'
import { uiManager } from './UIManager.js'
import { PauseMenu } from './PauseMenu.js'
import { SettingsModal } from './SettingsModal.js'

/**
 * Game HUD - In-game heads-up display
 */
export class GameHUD {
  constructor() {
    this.element = null
    this.pauseMenu = null
    this.fpsCounter = null

    // References to dynamic elements
    this.dayDisplay = null
    this.tempDisplay = null
    this.humidityDisplay = null
    this.populationDisplay = null
    this.timeButtons = []

    this.create()
    this.bindEvents()
  }

  /**
   * Create the HUD DOM
   */
  create() {
    this.element = document.createElement('div')
    this.element.className = 'game-hud'

    const tank = gameState.currentTank || {}

    this.element.innerHTML = `
      <!-- Top Bar -->
      <div class="hud-top-bar">
        <div class="hud-top-left">
          <button class="btn-icon menu-btn" title="Menu (ESC)">☰</button>
          <span class="hud-title">The Glass Wild</span>
          <div class="hud-stats">
            <div class="hud-stat">
              <span class="hud-stat-icon">📅</span>
              <span class="hud-stat-value day-display">Day ${tank.gameDay || 1}</span>
            </div>
            <div class="hud-stat">
              <span class="hud-stat-icon">🌡️</span>
              <span class="hud-stat-value temp-display">${tank.environment?.temperature || 75}°F</span>
            </div>
            <div class="hud-stat">
              <span class="hud-stat-icon">💧</span>
              <span class="hud-stat-value humidity-display">${tank.environment?.humidity || 80}%</span>
            </div>
          </div>
        </div>
        <div class="hud-top-right">
          <button class="btn-icon settings-btn" title="Settings">⚙️</button>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="hud-right-sidebar">
        <button class="sidebar-btn tasks-btn" title="Tasks (Coming Soon)" disabled>📋</button>
        <button class="sidebar-btn build-btn" title="Build Mode (Coming Soon)" disabled>🔨</button>
        <button class="sidebar-btn creatures-btn" title="Creatures (Coming Soon)" disabled>🦎</button>
      </div>

      <!-- Bottom Bar -->
      <div class="hud-bottom-bar">
        <div class="hud-bottom-left">
          <div class="time-controls">
            <button class="time-btn" data-speed="0" title="Pause">⏸</button>
            <button class="time-btn active" data-speed="1" title="Normal Speed">▶</button>
            <button class="time-btn" data-speed="2" title="Fast">▶▶</button>
            <button class="time-btn" data-speed="5" title="Faster">▶▶▶</button>
          </div>
          <div class="quick-actions">
            <button class="action-btn mist-btn">💧 Mist</button>
            <button class="action-btn feed-btn">🍖 Feed</button>
          </div>
        </div>
        <div class="hud-bottom-right">
          <div class="population-display">
            Population: <span class="population-count">0</span>
          </div>
        </div>
      </div>
    `

    // Store references
    this.dayDisplay = this.element.querySelector('.day-display')
    this.tempDisplay = this.element.querySelector('.temp-display')
    this.humidityDisplay = this.element.querySelector('.humidity-display')
    this.populationDisplay = this.element.querySelector('.population-count')
    this.timeButtons = this.element.querySelectorAll('.time-btn')

    // Create FPS counter (hidden by default)
    this.createFpsCounter()
  }

  /**
   * Create FPS counter element
   */
  createFpsCounter() {
    this.fpsCounter = document.createElement('div')
    this.fpsCounter.className = 'fps-counter'
    this.fpsCounter.style.display = 'none'
    this.fpsCounter.textContent = 'FPS: --'
    document.body.appendChild(this.fpsCounter)

    // Update visibility based on settings
    this.updateFpsVisibility()
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Menu button
    const menuBtn = this.element.querySelector('.menu-btn')
    menuBtn.addEventListener('click', () => this.showPauseMenu())

    // Settings button
    const settingsBtn = this.element.querySelector('.settings-btn')
    settingsBtn.addEventListener('click', () => {
      const modal = new SettingsModal()
      uiManager.showModal(modal)
    })

    // Time control buttons
    this.timeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseInt(btn.dataset.speed)
        this.setTimeScale(speed)
      })
    })

    // Quick action buttons
    const mistBtn = this.element.querySelector('.mist-btn')
    mistBtn.addEventListener('click', () => this.handleMist())

    const feedBtn = this.element.querySelector('.feed-btn')
    feedBtn.addEventListener('click', () => this.handleFeed())

    // ESC key to pause
    this.escHandler = (e) => {
      if (e.key === 'Escape' && gameState.currentScreen === 'game') {
        if (uiManager.hasOpenModals()) {
          uiManager.closeAllModals()
        } else if (this.pauseMenu?.isVisible) {
          this.pauseMenu.hide()
        } else {
          this.showPauseMenu()
        }
      }
    }
    document.addEventListener('keydown', this.escHandler)

    // Listen for game state changes
    gameState.on('timeScaleChanged', (scale) => this.updateTimeButtons(scale))
    gameState.on('settingChanged', ({ category, key }) => {
      if (category === 'graphics' && key === 'showFps') {
        this.updateFpsVisibility()
      }
    })
    gameState.on('tankUpdated', () => this.updateDisplays())
  }

  /**
   * Set time scale and update buttons
   * @param {number} scale
   */
  setTimeScale(scale) {
    gameState.setTimeScale(scale)
    this.updateTimeButtons(scale)
  }

  /**
   * Update time control buttons
   * @param {number} activeScale
   */
  updateTimeButtons(activeScale) {
    this.timeButtons.forEach(btn => {
      const speed = parseInt(btn.dataset.speed)
      btn.classList.toggle('active', speed === activeScale)
    })
  }

  /**
   * Handle mist action
   */
  handleMist() {
    uiManager.notify('Misting the terrarium...', 'info', 2000)
    // TODO: Implement actual misting effect
    if (gameState.currentTank) {
      const currentHumidity = gameState.currentTank.environment.humidity
      gameState.updateCurrentTank({
        environment: {
          ...gameState.currentTank.environment,
          humidity: Math.min(100, currentHumidity + 5)
        }
      })
      this.updateDisplays()
    }
  }

  /**
   * Handle feed action
   */
  handleFeed() {
    uiManager.notify('Feeding time!', 'info', 2000)
    // TODO: Implement actual feeding
  }

  /**
   * Show pause menu
   */
  showPauseMenu() {
    if (!this.pauseMenu) {
      this.pauseMenu = new PauseMenu()
    }
    this.pauseMenu.show()
    gameState.pause()
  }

  /**
   * Update HUD displays
   */
  updateDisplays() {
    const tank = gameState.currentTank
    if (!tank) return

    this.dayDisplay.textContent = `Day ${tank.gameDay}`
    this.tempDisplay.textContent = `${tank.environment.temperature}°F`
    this.humidityDisplay.textContent = `${tank.environment.humidity}%`
    this.populationDisplay.textContent = tank.creatures?.length || 0
  }

  /**
   * Update FPS counter visibility
   */
  updateFpsVisibility() {
    const show = gameState.getSetting('graphics', 'showFps')
    this.fpsCounter.style.display = show ? 'block' : 'none'
  }

  /**
   * Update FPS display
   * @param {number} fps
   */
  updateFps(fps) {
    if (this.fpsCounter && gameState.getSetting('graphics', 'showFps')) {
      this.fpsCounter.textContent = `FPS: ${Math.round(fps)}`
    }
  }

  /**
   * Show the HUD
   */
  show() {
    const uiRoot = document.getElementById('ui-root')
    if (uiRoot && !this.element.parentNode) {
      uiRoot.appendChild(this.element)
    }
    this.element.classList.add('visible')
    this.updateDisplays()
  }

  /**
   * Hide the HUD
   */
  hide() {
    this.element.classList.remove('visible')
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }

  /**
   * Destroy the HUD
   */
  destroy() {
    document.removeEventListener('keydown', this.escHandler)
    if (this.fpsCounter && this.fpsCounter.parentNode) {
      this.fpsCounter.parentNode.removeChild(this.fpsCounter)
    }
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
    this.element = null
  }
}
