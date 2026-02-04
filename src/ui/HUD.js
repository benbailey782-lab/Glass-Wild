export class HUD {
  constructor() {
    this.container = null
    this.hintElement = null
    this.hintTimeout = null
    this.isHintVisible = true

    this.createContainer()
    this.createGlassToggleHint()
  }

  createContainer() {
    this.container = document.createElement('div')
    this.container.id = 'hud-container'
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    document.body.appendChild(this.container)
  }

  createGlassToggleHint() {
    this.hintElement = document.createElement('div')
    this.hintElement.id = 'glass-toggle-hint'
    this.hintElement.innerHTML = `
      <span style="
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
        margin-right: 6px;
        font-size: 12px;
      ">H</span>
      Toggle glass walls
    `
    this.hintElement.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 24px;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: rgba(255, 255, 255, 0.9);
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      opacity: 1;
      transition: opacity 0.5s ease-out;
    `
    this.container.appendChild(this.hintElement)

    // Auto-hide after 3 seconds on first load
    this.hintTimeout = setTimeout(() => {
      this.fadeOutHint()
    }, 3000)
  }

  fadeOutHint() {
    if (this.hintElement && this.isHintVisible) {
      this.hintElement.style.opacity = '0'
      this.isHintVisible = false
    }
  }

  showHintBriefly() {
    if (this.hintElement) {
      // Clear any existing timeout
      if (this.hintTimeout) {
        clearTimeout(this.hintTimeout)
      }

      // Show the hint
      this.hintElement.style.opacity = '1'
      this.isHintVisible = true

      // Hide after 1.5 seconds
      this.hintTimeout = setTimeout(() => {
        this.fadeOutHint()
      }, 1500)
    }
  }

  updateGlassHint(glassVisible) {
    if (this.hintElement) {
      const text = glassVisible ? 'Toggle glass walls' : 'Show glass walls'
      this.hintElement.innerHTML = `
        <span style="
          display: inline-block;
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          margin-right: 6px;
          font-size: 12px;
        ">H</span>
        ${text}
      `
      this.showHintBriefly()
    }
  }

  destroy() {
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout)
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }
}
