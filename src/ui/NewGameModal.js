import { gameState } from '../core/GameState.js'
import { uiManager } from './UIManager.js'

/**
 * New Game Modal - Create a new terrarium
 */
export class NewGameModal {
  constructor(options = {}) {
    this.element = null
    this.options = options
    this.closeOnBackdrop = true

    this.tankName = 'My First Terrarium'
    this.environmentType = 'tropical'

    this.create()
  }

  /**
   * Create the modal DOM
   */
  create() {
    this.element = document.createElement('div')
    this.element.className = 'modal new-game-modal'

    this.element.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <h2>Create Your Terrarium</h2>
          <button class="panel-close" aria-label="Close">×</button>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Name your terrarium:</label>
            <input type="text" class="form-input tank-name-input"
                   value="${this.tankName}" placeholder="Enter a name..." maxlength="30">
          </div>

          <div class="form-group">
            <label class="form-label">Environment Type:</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="environment" value="tropical" checked>
                <span class="radio-label">Tropical Vivarium <small>(recommended)</small></span>
              </label>
              <label class="radio-option disabled">
                <input type="radio" name="environment" value="arid" disabled>
                <span class="radio-label">Arid Desert <small>(coming soon)</small></span>
              </label>
              <label class="radio-option disabled">
                <input type="radio" name="environment" value="temperate" disabled>
                <span class="radio-label">Temperate Forest <small>(coming soon)</small></span>
              </label>
            </div>
          </div>

          <div class="confirm-buttons">
            <button class="btn btn-secondary cancel-btn">Cancel</button>
            <button class="btn create-btn">Create</button>
          </div>
        </div>
      </div>
    `

    this.bindEvents()
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Close button
    const closeBtn = this.element.querySelector('.panel-close')
    closeBtn.addEventListener('click', () => this.close())

    // Cancel button
    const cancelBtn = this.element.querySelector('.cancel-btn')
    cancelBtn.addEventListener('click', () => this.close())

    // Tank name input
    const nameInput = this.element.querySelector('.tank-name-input')
    nameInput.addEventListener('input', (e) => {
      this.tankName = e.target.value.trim() || 'My First Terrarium'
    })

    // Auto-select text on focus
    nameInput.addEventListener('focus', () => {
      nameInput.select()
    })

    // Environment radio buttons
    const radioInputs = this.element.querySelectorAll('input[name="environment"]')
    radioInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.environmentType = e.target.value
      })
    })

    // Create button
    const createBtn = this.element.querySelector('.create-btn')
    createBtn.addEventListener('click', () => this.handleCreate())

    // Handle enter key on name input
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleCreate()
      }
    })
  }

  /**
   * Handle create button click
   */
  handleCreate() {
    const name = this.tankName || 'My First Terrarium'
    const tank = gameState.createTank(name, this.environmentType)

    uiManager.closeModal(this)

    if (this.options.onConfirm) {
      this.options.onConfirm(tank)
    }
  }

  /**
   * Close the modal
   */
  close() {
    uiManager.closeModal(this)
  }
}
