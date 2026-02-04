/**
 * SlidePanel - Base class for slide-out panels
 * Slides in from the right side of the screen
 */
export class SlidePanel {
  constructor(title, width = 400) {
    this.title = title
    this.width = width
    this.element = null
    this.isOpen = false
    this.onClose = null

    this.create()
  }

  create() {
    this.element = document.createElement('div')
    this.element.className = 'slide-panel'
    this.element.style.width = `${this.width}px`

    this.element.innerHTML = `
      <div class="slide-panel-header">
        <h2 class="slide-panel-title">${this.title}</h2>
        <button class="slide-panel-close">&times;</button>
      </div>
      <div class="slide-panel-content"></div>
    `

    // Close button handler
    this.element.querySelector('.slide-panel-close').addEventListener('click', () => {
      this.close()
    })

    // Click outside to close
    this.backdropHandler = (e) => {
      if (this.isOpen && !this.element.contains(e.target)) {
        this.close()
      }
    }
  }

  setContent(html) {
    this.element.querySelector('.slide-panel-content').innerHTML = html
  }

  appendContent(element) {
    this.element.querySelector('.slide-panel-content').appendChild(element)
  }

  open() {
    if (this.isOpen) return

    const uiRoot = document.getElementById('ui-root')
    if (uiRoot && !this.element.parentNode) {
      uiRoot.appendChild(this.element)
    }

    // Trigger reflow then add open class for animation
    this.element.offsetHeight
    this.element.classList.add('open')
    this.isOpen = true

    // Add click-outside listener after a short delay
    setTimeout(() => {
      document.addEventListener('click', this.backdropHandler)
    }, 100)
  }

  close() {
    if (!this.isOpen) return

    this.element.classList.remove('open')
    this.isOpen = false

    document.removeEventListener('click', this.backdropHandler)

    // Remove from DOM after animation
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element)
      }
      if (this.onClose) this.onClose()
    }, 300)
  }

  toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  destroy() {
    document.removeEventListener('click', this.backdropHandler)
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}

export default SlidePanel
