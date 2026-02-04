import { EventEmitter } from './EventEmitter.js'

const STORAGE_KEY = 'glass-wild-save'
const SETTINGS_KEY = 'glass-wild-settings'

/**
 * Generate a unique ID
 */
function generateId() {
  return 'tank_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * Default settings configuration
 */
const DEFAULT_SETTINGS = {
  graphics: {
    quality: 'high', // 'low' | 'medium' | 'high'
    showFps: false
  },
  audio: {
    masterVolume: 0.8
  },
  gameplay: {
    autoSaveInterval: 5 // 0 = off, 5 = 5min, 10 = 10min
  }
}

/**
 * Create a new tank data object
 */
function createTankData(name, environmentType) {
  return {
    id: generateId(),
    name: name || 'My First Terrarium',
    environmentType: environmentType || 'tropical',
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
    playTime: 0,
    gameDay: 1,
    timeOfDay: 0.5, // 0-1, noon = 0.5
    environment: {
      temperature: environmentType === 'arid' ? 85 : environmentType === 'temperate' ? 65 : 75,
      humidity: environmentType === 'arid' ? 30 : environmentType === 'temperate' ? 60 : 80
    },
    creatures: [],
    plants: [],
    placedObjects: []
  }
}

/**
 * Central game state management
 */
export class GameState extends EventEmitter {
  constructor() {
    super()

    this.currentScreen = 'landing' // 'landing' | 'game'
    this.currentTank = null
    this.tanks = []
    this.settings = this.loadSettings()
    this.timeScale = 1 // 0 = paused, 1 = normal, 2 = fast, 5 = faster
    this.isPaused = false

    // Auto-save timer
    this.autoSaveTimer = null

    // Load saved tanks
    this.loadFromLocalStorage()

    // Start auto-save if enabled
    this.setupAutoSave()
  }

  // ============================================
  // Screen Management
  // ============================================

  /**
   * Change the current screen
   * @param {'landing' | 'game'} screen
   */
  setScreen(screen) {
    const previousScreen = this.currentScreen
    this.currentScreen = screen
    this.emit('screenChange', screen, previousScreen)

    if (screen === 'game') {
      this.isPaused = false
      this.emit('gameResumed')
    }
  }

  // ============================================
  // Tank Management
  // ============================================

  /**
   * Create a new tank
   * @param {string} name - Tank name
   * @param {string} environmentType - Environment type
   * @returns {Object} The created tank data
   */
  createTank(name, environmentType) {
    const tank = createTankData(name, environmentType)
    this.tanks.push(tank)
    this.currentTank = tank
    this.saveToLocalStorage()
    this.emit('tankCreated', tank)
    return tank
  }

  /**
   * Load a tank by ID
   * @param {string} tankId
   * @returns {Object|null} The loaded tank or null
   */
  loadTank(tankId) {
    const tank = this.tanks.find(t => t.id === tankId)
    if (tank) {
      tank.lastPlayedAt = new Date().toISOString()
      this.currentTank = tank
      this.saveToLocalStorage()
      this.emit('tankLoaded', tank)
      return tank
    }
    return null
  }

  /**
   * Get the most recently played tank
   * @returns {Object|null}
   */
  getLastPlayedTank() {
    if (this.tanks.length === 0) return null
    return this.tanks.reduce((latest, tank) => {
      if (!latest) return tank
      return new Date(tank.lastPlayedAt) > new Date(latest.lastPlayedAt) ? tank : latest
    }, null)
  }

  /**
   * Check if any saves exist
   * @returns {boolean}
   */
  hasSaves() {
    return this.tanks.length > 0
  }

  /**
   * Save the current tank
   */
  saveTank() {
    if (!this.currentTank) return

    this.currentTank.lastPlayedAt = new Date().toISOString()
    this.saveToLocalStorage()
    this.emit('tankSaved', this.currentTank)
  }

  /**
   * Delete a tank by ID
   * @param {string} tankId
   */
  deleteTank(tankId) {
    const index = this.tanks.findIndex(t => t.id === tankId)
    if (index !== -1) {
      const deleted = this.tanks.splice(index, 1)[0]
      if (this.currentTank?.id === tankId) {
        this.currentTank = null
      }
      this.saveToLocalStorage()
      this.emit('tankDeleted', deleted)
    }
  }

  /**
   * Delete all tanks
   */
  deleteAllTanks() {
    this.tanks = []
    this.currentTank = null
    this.saveToLocalStorage()
    this.emit('allTanksDeleted')
  }

  /**
   * Update current tank data
   * @param {Object} updates - Partial tank data to merge
   */
  updateCurrentTank(updates) {
    if (!this.currentTank) return
    Object.assign(this.currentTank, updates)
    this.emit('tankUpdated', this.currentTank)
  }

  /**
   * Get current environment conditions including day/night status
   * @returns {Object} Environment data with isDay flag
   */
  getEnvironment() {
    if (!this.currentTank) {
      return {
        temperature: 75,
        humidity: 65,
        isDay: true,
        timeOfDay: 0.5
      }
    }

    const { environment, timeOfDay } = this.currentTank
    // Day is between 6am (0.25) and 8pm (0.833)
    const isDay = timeOfDay >= 0.25 && timeOfDay < 0.833

    return {
      temperature: environment.temperature,
      humidity: environment.humidity,
      isDay,
      timeOfDay
    }
  }

  /**
   * Advance game time
   * @param {number} deltaTime - Time since last frame in seconds (real time)
   */
  advanceGameTime(deltaTime) {
    if (!this.currentTank || this.isPaused) return

    // Convert real time to game time based on time scale
    // At 1x speed: 1 real second = 1 game minute
    const gameMinutes = deltaTime * this.timeScale
    const dayProgress = gameMinutes / (24 * 60) // Fraction of a day

    this.currentTank.timeOfDay += dayProgress

    // Handle day rollover
    if (this.currentTank.timeOfDay >= 1) {
      this.currentTank.timeOfDay -= 1
      this.currentTank.gameDay += 1
      this.emit('newDay', this.currentTank.gameDay)
    }
  }

  // ============================================
  // Time Control
  // ============================================

  /**
   * Set the time scale
   * @param {number} scale - 0 = paused, 1 = normal, 2 = fast, 5 = faster
   */
  setTimeScale(scale) {
    this.timeScale = scale
    this.emit('timeScaleChanged', scale)
  }

  /**
   * Pause the game
   */
  pause() {
    this.isPaused = true
    this.emit('gamePaused')
  }

  /**
   * Resume the game
   */
  resume() {
    this.isPaused = false
    this.emit('gameResumed')
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.isPaused) {
      this.resume()
    } else {
      this.pause()
    }
  }

  // ============================================
  // Settings Management
  // ============================================

  /**
   * Load settings from localStorage
   * @returns {Object} Settings object
   */
  loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Deep merge with defaults to handle new settings
        return {
          graphics: { ...DEFAULT_SETTINGS.graphics, ...parsed.graphics },
          audio: { ...DEFAULT_SETTINGS.audio, ...parsed.audio },
          gameplay: { ...DEFAULT_SETTINGS.gameplay, ...parsed.gameplay }
        }
      }
    } catch (error) {
      console.warn('Failed to load settings:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
      this.emit('settingsSaved', this.settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  /**
   * Update a specific setting
   * @param {string} category - Settings category (graphics, audio, gameplay)
   * @param {string} key - Setting key
   * @param {any} value - New value
   */
  updateSetting(category, key, value) {
    if (this.settings[category]) {
      this.settings[category][key] = value
      this.saveSettings()
      this.emit('settingChanged', { category, key, value })

      // Handle auto-save interval changes
      if (category === 'gameplay' && key === 'autoSaveInterval') {
        this.setupAutoSave()
      }
    }
  }

  /**
   * Get a specific setting value
   * @param {string} category
   * @param {string} key
   * @returns {any}
   */
  getSetting(category, key) {
    return this.settings[category]?.[key]
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    this.settings = { ...DEFAULT_SETTINGS }
    this.saveSettings()
    this.setupAutoSave()
    this.emit('settingsReset')
  }

  // ============================================
  // Persistence
  // ============================================

  /**
   * Save all data to localStorage
   */
  saveToLocalStorage() {
    try {
      const data = {
        tanks: this.tanks,
        version: '0.1.0'
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  /**
   * Load all data from localStorage
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.tanks = data.tanks || []
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
      this.tanks = []
    }
  }

  /**
   * Export save data as JSON string
   * @returns {string}
   */
  exportSave() {
    return JSON.stringify({
      tanks: this.tanks,
      settings: this.settings,
      version: '0.1.0',
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Import save data from JSON string
   * @param {string} jsonString
   * @returns {boolean} Success
   */
  importSave(jsonString) {
    try {
      const data = JSON.parse(jsonString)
      if (data.tanks) {
        this.tanks = data.tanks
        this.saveToLocalStorage()
        this.emit('saveImported', data)
        return true
      }
    } catch (error) {
      console.error('Failed to import save:', error)
    }
    return false
  }

  // ============================================
  // Auto-save
  // ============================================

  /**
   * Setup auto-save timer based on settings
   */
  setupAutoSave() {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }

    const interval = this.settings.gameplay.autoSaveInterval
    if (interval > 0 && this.currentScreen === 'game') {
      this.autoSaveTimer = setInterval(() => {
        if (this.currentTank && !this.isPaused) {
          this.saveTank()
          this.emit('autoSaved', this.currentTank)
        }
      }, interval * 60 * 1000) // Convert minutes to milliseconds
    }
  }

  /**
   * Update play time (call from game loop)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updatePlayTime(deltaTime) {
    if (this.currentTank && !this.isPaused) {
      this.currentTank.playTime += deltaTime
    }
  }
}

// Singleton instance
export const gameState = new GameState()
