import { gameState } from '../core/GameState.js'
import { uiManager } from './UIManager.js'
import { NewGameModal } from './NewGameModal.js'
import { SettingsModal } from './SettingsModal.js'

/**
 * Landing Page - First screen shown to the user
 */
export class LandingPage {
  constructor() {
    this.element = null
    this.continueBtn = null
    this.create()
  }

  /**
   * Create the landing page DOM
   */
  create() {
    this.element = document.createElement('div')
    this.element.className = 'landing-page'

    this.element.innerHTML = `
      <div class="landing-content">
        <h1 class="title-main">The Glass Wild</h1>
        <p class="tagline">Nurture worlds. Watch life unfold.</p>

        <div class="landing-buttons">
          <button class="btn btn-new-game">New Game</button>
          <button class="btn btn-secondary btn-continue" ${!gameState.hasSaves() ? 'disabled' : ''}>
            Continue
          </button>
          <button class="btn btn-secondary btn-settings">Settings</button>
        </div>
      </div>

      <div class="version-info">
        v0.1.0 — Anthropic
      </div>
    `

    // Store reference to continue button for updates
    this.continueBtn = this.element.querySelector('.btn-continue')

    // Bind event handlers
    this.bindEvents()
  }

  /**
   * Bind button click handlers
   */
  bindEvents() {
    // New Game button
    const newGameBtn = this.element.querySelector('.btn-new-game')
    newGameBtn.addEventListener('click', () => this.handleNewGame())

    // Continue button
    this.continueBtn.addEventListener('click', () => this.handleContinue())

    // Settings button
    const settingsBtn = this.element.querySelector('.btn-settings')
    settingsBtn.addEventListener('click', () => this.handleSettings())

    // Listen for save changes to update continue button
    gameState.on('tankCreated', () => this.updateContinueButton())
    gameState.on('tankDeleted', () => this.updateContinueButton())
    gameState.on('allTanksDeleted', () => this.updateContinueButton())
  }

  /**
   * Update continue button state based on saves
   */
  updateContinueButton() {
    this.continueBtn.disabled = !gameState.hasSaves()
  }

  /**
   * Handle New Game button click
   */
  handleNewGame() {
    const modal = new NewGameModal({
      onConfirm: (tankData) => {
        this.startGame(tankData)
      }
    })
    uiManager.showModal(modal)
  }

  /**
   * Handle Continue button click
   */
  handleContinue() {
    const lastTank = gameState.getLastPlayedTank()
    if (lastTank) {
      gameState.loadTank(lastTank.id)
      this.startGame(lastTank)
    }
  }

  /**
   * Handle Settings button click
   */
  handleSettings() {
    const modal = new SettingsModal()
    uiManager.showModal(modal)
  }

  /**
   * Start the game with given tank data
   * @param {Object} tankData
   */
  startGame(tankData) {
    // Fade out landing page
    this.hide().then(() => {
      gameState.setScreen('game')
    })
  }

  /**
   * Show the landing page
   */
  show() {
    const uiRoot = document.getElementById('ui-root')
    if (uiRoot && !this.element.parentNode) {
      uiRoot.appendChild(this.element)
    }
    this.element.classList.remove('hidden')
    this.updateContinueButton()
  }

  /**
   * Hide the landing page with fade out
   * @returns {Promise}
   */
  hide() {
    return new Promise(resolve => {
      this.element.classList.add('hidden')
      setTimeout(() => {
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element)
        }
        resolve()
      }, 500)
    })
  }

  /**
   * Destroy the landing page
   */
  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
    this.element = null
  }
}
