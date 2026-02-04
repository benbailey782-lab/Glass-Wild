import { gameState } from '../core/GameState.js'
import { uiManager } from './UIManager.js'
import { PauseMenu } from './PauseMenu.js'
import { SettingsModal } from './SettingsModal.js'
import { CreaturesPanel } from './CreaturesPanel.js'
import { ActionsPanel } from './ActionsPanel.js'
import { ViewPanel } from './ViewPanel.js'

/**
 * Game HUD - In-game heads-up display
 * Redesigned with category buttons and slide-out panels
 */
export class GameHUD {
  constructor() {
    this.element = null
    this.pauseMenu = null
    this.fpsCounter = null

    // Reference to creature manager
    this.creatureManager = null

    // Panel instances
    this.creaturesPanel = null
    this.actionsPanel = null
    this.viewPanel = null
    this.activePanel = null
    this.activePanelType = null

    // References to dynamic elements
    this.dayDisplay = null
    this.tempDisplay = null
    this.humidityDisplay = null
    this.populationDisplay = null
    this.timeButtons = []

    this.create()
    this.bindEvents()
  }

  setCreatureManager(creatureManager) {
    this.creatureManager = creatureManager

    if (this.creatureManager) {
      this.creatureManager.on('creatureAdded', () => this.updatePopulationDisplay())
      this.creatureManager.on('creatureRemoved', () => this.updatePopulationDisplay())
      this.creatureManager.on('creatureDeath', (data) => {
        uiManager.notify(`A ${data.creature.speciesData.identity.common_name} died (${data.cause})`, 'warning', 3000)
      })
    }
  }

  create() {
    this.element = document.createElement('div')
    this.element.className = 'game-hud'

    const tank = gameState.currentTank || {}

    this.element.innerHTML = `
      <!-- Top Bar -->
      <div class="hud-top-bar">
        <div class="hud-top-left">
          <button class="btn-icon menu-btn" title="Menu (ESC)">&#x2630;</button>
          <span class="hud-title">The Glass Wild</span>
          <div class="hud-stats">
            <div class="hud-stat">
              <span class="hud-stat-icon">&#x1F4C5;</span>
              <span class="hud-stat-value day-display">Day ${tank.gameDay || 1}</span>
            </div>
            <div class="hud-stat">
              <span class="hud-stat-icon">&#x1F321;</span>
              <span class="hud-stat-value temp-display">${tank.environment?.temperature || 75}&deg;F</span>
            </div>
            <div class="hud-stat">
              <span class="hud-stat-icon">&#x1F4A7;</span>
              <span class="hud-stat-value humidity-display">${tank.environment?.humidity || 80}%</span>
            </div>
          </div>
        </div>
        <div class="hud-top-right">
          <button class="btn-icon settings-btn" title="Settings">&#x2699;</button>
        </div>
      </div>

      <!-- Bottom Bar - Redesigned -->
      <div class="hud-bottom-bar">
        <div class="hud-bottom-left">
          <div class="time-controls">
            <button class="time-btn" data-speed="0" title="Pause">&#x23F8;</button>
            <button class="time-btn active" data-speed="1" title="Normal Speed">&#x25B6;</button>
            <button class="time-btn" data-speed="2" title="Fast">&#x25B6;&#x25B6;</button>
            <button class="time-btn" data-speed="5" title="Faster">&#x25B6;&#x25B6;&#x25B6;</button>
          </div>
        </div>

        <div class="hud-bottom-center">
          <div class="category-buttons">
            <button class="category-btn" data-panel="creatures" title="Creatures">
              <span class="category-btn-icon">&#x1F98E;</span>
            </button>
            <button class="category-btn" data-panel="actions" title="Actions">
              <span class="category-btn-icon">&#x26A1;</span>
            </button>
            <button class="category-btn disabled" data-panel="build" title="Build (Coming Soon)" disabled>
              <span class="category-btn-icon">&#x1F528;</span>
            </button>
            <button class="category-btn" data-panel="view" title="View Options">
              <span class="category-btn-icon">&#x1F441;</span>
            </button>
          </div>
        </div>

        <div class="hud-bottom-right">
          <div class="population-display">
            <span class="population-icon">&#x1F43E;</span>
            <span class="population-count">0</span>
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

    // Create FPS counter
    this.createFpsCounter()
  }

  createFpsCounter() {
    this.fpsCounter = document.createElement('div')
    this.fpsCounter.className = 'fps-counter'
    this.fpsCounter.style.display = 'none'
    this.fpsCounter.textContent = 'FPS: --'
    document.body.appendChild(this.fpsCounter)
    this.updateFpsVisibility()
  }

  bindEvents() {
    // Menu button
    this.element.querySelector('.menu-btn').addEventListener('click', () => this.showPauseMenu())

    // Settings button
    this.element.querySelector('.settings-btn').addEventListener('click', () => {
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

    // Category buttons
    this.element.querySelectorAll('.category-btn[data-panel]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const panelType = btn.dataset.panel
        if (!btn.disabled) {
          this.togglePanel(panelType, btn)
        }
      })
    })

    // ESC key handler
    this.escHandler = (e) => {
      if (e.key === 'Escape' && gameState.currentScreen === 'game') {
        if (this.activePanel) {
          this.closeActivePanel()
        } else if (uiManager.hasOpenModals()) {
          uiManager.closeAllModals()
        } else if (this.pauseMenu?.isVisible) {
          this.pauseMenu.hide()
        } else {
          this.showPauseMenu()
        }
      }
    }
    document.addEventListener('keydown', this.escHandler)

    // Game state listeners
    gameState.on('timeScaleChanged', (scale) => this.updateTimeButtons(scale))
    gameState.on('settingChanged', ({ category, key }) => {
      if (category === 'graphics' && key === 'showFps') {
        this.updateFpsVisibility()
      }
    })
    gameState.on('tankUpdated', () => this.updateDisplays())
  }

  togglePanel(panelType, btn) {
    // If clicking the same panel that's open, close it
    if (this.activePanel && this.activePanelType === panelType) {
      this.closeActivePanel()
      return
    }

    // Close any open panel first
    if (this.activePanel) {
      this.closeActivePanel()
    }

    // Open the requested panel
    let panel
    switch (panelType) {
      case 'creatures':
        if (!this.creaturesPanel) {
          this.creaturesPanel = new CreaturesPanel(this.creatureManager)
        }
        panel = this.creaturesPanel
        break
      case 'actions':
        if (!this.actionsPanel) {
          this.actionsPanel = new ActionsPanel()
        }
        panel = this.actionsPanel
        break
      case 'view':
        if (!this.viewPanel) {
          this.viewPanel = new ViewPanel()
        }
        panel = this.viewPanel
        break
    }

    if (panel) {
      panel.open()
      panel.onClose = () => {
        this.activePanel = null
        this.activePanelType = null
        this.updateCategoryButtons()
      }
      this.activePanel = panel
      this.activePanelType = panelType
      this.updateCategoryButtons()
    }
  }

  closeActivePanel() {
    if (this.activePanel) {
      this.activePanel.close()
      this.activePanel = null
      this.activePanelType = null
      this.updateCategoryButtons()
    }
  }

  updateCategoryButtons() {
    this.element.querySelectorAll('.category-btn').forEach(btn => {
      const isActive = btn.dataset.panel === this.activePanelType
      btn.classList.toggle('active', isActive)
    })
  }

  setTimeScale(scale) {
    gameState.setTimeScale(scale)
    this.updateTimeButtons(scale)
  }

  updateTimeButtons(activeScale) {
    this.timeButtons.forEach(btn => {
      const speed = parseInt(btn.dataset.speed)
      btn.classList.toggle('active', speed === activeScale)
    })
  }

  updatePopulationDisplay() {
    if (this.creatureManager) {
      this.populationDisplay.textContent = this.creatureManager.getPopulation()
    }
  }

  showPauseMenu() {
    if (!this.pauseMenu) {
      this.pauseMenu = new PauseMenu()
    }
    this.pauseMenu.show()
    gameState.pause()
  }

  updateDisplays() {
    const tank = gameState.currentTank
    if (!tank) return

    this.dayDisplay.textContent = `Day ${tank.gameDay}`
    this.tempDisplay.textContent = `${tank.environment.temperature}\u00B0F`
    this.humidityDisplay.textContent = `${tank.environment.humidity}%`

    if (this.creatureManager) {
      this.populationDisplay.textContent = this.creatureManager.getPopulation()
    } else {
      this.populationDisplay.textContent = tank.creatures?.length || 0
    }
  }

  updateFpsVisibility() {
    const show = gameState.getSetting('graphics', 'showFps')
    this.fpsCounter.style.display = show ? 'block' : 'none'
  }

  updateFps(fps) {
    if (this.fpsCounter && gameState.getSetting('graphics', 'showFps')) {
      this.fpsCounter.textContent = `FPS: ${Math.round(fps)}`
    }
  }

  show() {
    const uiRoot = document.getElementById('ui-root')
    if (uiRoot && !this.element.parentNode) {
      uiRoot.appendChild(this.element)
    }
    this.element.classList.add('visible')
    this.updateDisplays()
  }

  hide() {
    this.closeActivePanel()
    this.element.classList.remove('visible')
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }

  destroy() {
    this.closeActivePanel()
    document.removeEventListener('keydown', this.escHandler)
    if (this.fpsCounter?.parentNode) {
      this.fpsCounter.parentNode.removeChild(this.fpsCounter)
    }
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
    this.element = null
  }
}
