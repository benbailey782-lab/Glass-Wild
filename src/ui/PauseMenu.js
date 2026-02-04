import { gameState } from '../core/GameState.js'
import { uiManager } from './UIManager.js'
import { SettingsModal } from './SettingsModal.js'

/**
 * Pause Menu - Displayed when game is paused
 */
export class PauseMenu {
  constructor() {
    this.element = null
    this.isVisible = false
    this.create()
    this.bindEvents()
  }

  /**
   * Create the pause menu DOM
   */
  create() {
    this.element = document.createElement('div')
    this.element.className = 'pause-menu'

    this.element.innerHTML = `
      <div class="pause-content">
        <h1 class="pause-title">Paused</h1>
        <div class="pause-buttons">
          <button class="btn resume-btn">Resume</button>
          <button class="btn btn-secondary settings-btn">Settings</button>
          <button class="btn btn-secondary save-btn">Save Game</button>
          <button class="btn btn-secondary main-menu-btn">Main Menu</button>
        </div>
      </div>
    `
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Resume button
    const resumeBtn = this.element.querySelector('.resume-btn')
    resumeBtn.addEventListener('click', () => this.hide())

    // Settings button
    const settingsBtn = this.element.querySelector('.settings-btn')
    settingsBtn.addEventListener('click', () => {
      const modal = new SettingsModal()
      uiManager.showModal(modal)
    })

    // Save button
    const saveBtn = this.element.querySelector('.save-btn')
    saveBtn.addEventListener('click', () => {
      gameState.saveTank()
      uiManager.notify('Game saved!', 'success')
    })

    // Main menu button
    const mainMenuBtn = this.element.querySelector('.main-menu-btn')
    mainMenuBtn.addEventListener('click', () => this.handleMainMenu())
  }

  /**
   * Handle main menu button click
   */
  async handleMainMenu() {
    const confirmed = await uiManager.confirm(
      'Return to main menu? Unsaved progress will be lost.',
      { confirmText: 'Save & Exit', cancelText: 'Cancel' }
    )

    if (confirmed) {
      // Save before exiting
      gameState.saveTank()
      this.hide()
      gameState.setScreen('landing')
    }
  }

  /**
   * Show the pause menu
   */
  show() {
    const uiRoot = document.getElementById('ui-root')
    if (uiRoot && !this.element.parentNode) {
      uiRoot.appendChild(this.element)
    }

    // Trigger animation
    requestAnimationFrame(() => {
      this.element.classList.add('visible')
    })

    this.isVisible = true
    gameState.pause()
  }

  /**
   * Hide the pause menu
   */
  hide() {
    this.element.classList.remove('visible')
    this.isVisible = false
    gameState.resume()

    // Remove from DOM after animation
    setTimeout(() => {
      if (this.element.parentNode && !this.isVisible) {
        this.element.parentNode.removeChild(this.element)
      }
    }, 300)
  }

  /**
   * Toggle visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Destroy the pause menu
   */
  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
    this.element = null
  }
}
