import { gameState } from '../core/GameState.js'
import { uiManager } from './UIManager.js'

/**
 * Settings Modal - Game settings configuration
 */
export class SettingsModal {
  constructor(options = {}) {
    this.element = null
    this.options = options
    this.closeOnBackdrop = true
    this.create()
  }

  /**
   * Create the modal DOM
   */
  create() {
    this.element = document.createElement('div')
    this.element.className = 'modal settings-modal'

    const settings = gameState.settings

    this.element.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <h2>Settings</h2>
          <button class="panel-close" aria-label="Close">×</button>
        </div>
        <div class="panel-body">
          <!-- Graphics Section -->
          <div class="settings-section">
            <h3>Graphics</h3>
            <div class="settings-row">
              <label>Quality</label>
              <div class="btn-group quality-group">
                <button class="btn-option ${settings.graphics.quality === 'low' ? 'active' : ''}" data-value="low">Low</button>
                <button class="btn-option ${settings.graphics.quality === 'medium' ? 'active' : ''}" data-value="medium">Med</button>
                <button class="btn-option ${settings.graphics.quality === 'high' ? 'active' : ''}" data-value="high">High</button>
              </div>
            </div>
            <div class="settings-row">
              <label class="checkbox-option">
                <input type="checkbox" class="fps-checkbox" ${settings.graphics.showFps ? 'checked' : ''}>
                <span>Show FPS</span>
              </label>
            </div>
          </div>

          <!-- Audio Section -->
          <div class="settings-section">
            <h3>Audio</h3>
            <div class="settings-row">
              <label>Master Volume</label>
              <div class="slider-container">
                <input type="range" class="slider volume-slider" min="0" max="100"
                       value="${Math.round(settings.audio.masterVolume * 100)}">
                <span class="slider-value volume-value">${Math.round(settings.audio.masterVolume * 100)}%</span>
              </div>
            </div>
          </div>

          <!-- Gameplay Section -->
          <div class="settings-section">
            <h3>Gameplay</h3>
            <div class="settings-row">
              <label>Auto-save</label>
              <div class="btn-group autosave-group">
                <button class="btn-option ${settings.gameplay.autoSaveInterval === 0 ? 'active' : ''}" data-value="0">Off</button>
                <button class="btn-option ${settings.gameplay.autoSaveInterval === 5 ? 'active' : ''}" data-value="5">5min</button>
                <button class="btn-option ${settings.gameplay.autoSaveInterval === 10 ? 'active' : ''}" data-value="10">10min</button>
              </div>
            </div>
          </div>

          <!-- Data Section -->
          <div class="settings-section">
            <h3>Data</h3>
            <div class="settings-row">
              <button class="btn btn-danger btn-small delete-saves-btn">Delete All Saves</button>
            </div>
          </div>

          <div class="settings-footer">
            <button class="btn btn-secondary close-btn">Close</button>
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

    const closeBtn2 = this.element.querySelector('.close-btn')
    closeBtn2.addEventListener('click', () => this.close())

    // Quality buttons
    const qualityBtns = this.element.querySelectorAll('.quality-group .btn-option')
    qualityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        qualityBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        gameState.updateSetting('graphics', 'quality', btn.dataset.value)
      })
    })

    // FPS checkbox
    const fpsCheckbox = this.element.querySelector('.fps-checkbox')
    fpsCheckbox.addEventListener('change', () => {
      gameState.updateSetting('graphics', 'showFps', fpsCheckbox.checked)
    })

    // Volume slider
    const volumeSlider = this.element.querySelector('.volume-slider')
    const volumeValue = this.element.querySelector('.volume-value')
    volumeSlider.addEventListener('input', () => {
      const value = parseInt(volumeSlider.value)
      volumeValue.textContent = `${value}%`
      gameState.updateSetting('audio', 'masterVolume', value / 100)
    })

    // Auto-save buttons
    const autosaveBtns = this.element.querySelectorAll('.autosave-group .btn-option')
    autosaveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        autosaveBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        gameState.updateSetting('gameplay', 'autoSaveInterval', parseInt(btn.dataset.value))
      })
    })

    // Delete saves button
    const deleteBtn = this.element.querySelector('.delete-saves-btn')
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await uiManager.confirm(
        'Are you sure you want to delete all saved games? This cannot be undone.',
        { danger: true, confirmText: 'Delete All' }
      )
      if (confirmed) {
        gameState.deleteAllTanks()
        uiManager.notify('All saves deleted', 'success')
      }
    })
  }

  /**
   * Close the modal
   */
  close() {
    uiManager.closeModal(this)
  }
}
