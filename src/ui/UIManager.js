/**
 * UI Manager - Handles modals, notifications, and transitions
 */
export class UIManager {
  constructor() {
    this.container = null
    this.activeModals = []
    this.notifications = []
    this.notificationContainer = null

    this.init()
  }

  /**
   * Initialize UI container
   */
  init() {
    // Get or create UI root
    this.container = document.getElementById('ui-root')
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'ui-root'
      document.body.appendChild(this.container)
    }

    // Create notification container
    this.notificationContainer = document.createElement('div')
    this.notificationContainer.className = 'notification-container'
    document.body.appendChild(this.notificationContainer)
  }

  // ============================================
  // Modal System
  // ============================================

  /**
   * Show a modal
   * @param {Object} modalInstance - Modal instance with element property
   */
  showModal(modalInstance) {
    if (!modalInstance.element) return

    // Create backdrop if not exists
    let backdrop = document.querySelector('.modal-backdrop')
    if (!backdrop) {
      backdrop = document.createElement('div')
      backdrop.className = 'modal-backdrop'
      this.container.appendChild(backdrop)

      // Fade in backdrop
      requestAnimationFrame(() => {
        backdrop.classList.add('visible')
      })
    }

    // Add modal to DOM
    this.container.appendChild(modalInstance.element)
    this.activeModals.push(modalInstance)

    // Fade in modal
    requestAnimationFrame(() => {
      modalInstance.element.classList.add('visible')
    })

    // Handle backdrop click to close
    backdrop.onclick = () => {
      if (modalInstance.closeOnBackdrop !== false) {
        this.closeModal(modalInstance)
      }
    }

    // Handle ESC key
    modalInstance._escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeModal(modalInstance)
      }
    }
    document.addEventListener('keydown', modalInstance._escHandler)
  }

  /**
   * Close a specific modal
   * @param {Object} modalInstance
   */
  closeModal(modalInstance) {
    const index = this.activeModals.indexOf(modalInstance)
    if (index === -1) return

    // Remove ESC handler
    if (modalInstance._escHandler) {
      document.removeEventListener('keydown', modalInstance._escHandler)
    }

    // Fade out modal
    modalInstance.element.classList.remove('visible')

    setTimeout(() => {
      if (modalInstance.element.parentNode) {
        modalInstance.element.parentNode.removeChild(modalInstance.element)
      }
      this.activeModals.splice(index, 1)

      // Remove backdrop if no more modals
      if (this.activeModals.length === 0) {
        const backdrop = document.querySelector('.modal-backdrop')
        if (backdrop) {
          backdrop.classList.remove('visible')
          setTimeout(() => backdrop.remove(), 300)
        }
      }

      // Call onClose callback if exists
      if (modalInstance.onClose) {
        modalInstance.onClose()
      }
    }, 300)
  }

  /**
   * Close all open modals
   */
  closeAllModals() {
    [...this.activeModals].forEach(modal => this.closeModal(modal))
  }

  /**
   * Check if any modal is open
   * @returns {boolean}
   */
  hasOpenModals() {
    return this.activeModals.length > 0
  }

  // ============================================
  // Notifications (Toast Messages)
  // ============================================

  /**
   * Show a notification toast
   * @param {string} message - Notification message
   * @param {string} type - 'info' | 'success' | 'warning' | 'danger'
   * @param {number} duration - Duration in ms (0 = persistent)
   */
  notify(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`

    const icons = {
      info: 'ℹ️',
      success: '✓',
      warning: '⚠️',
      danger: '✕'
    }

    notification.innerHTML = `
      <span class="notification-icon">${icons[type] || icons.info}</span>
      <span class="notification-message">${message}</span>
    `

    this.notificationContainer.appendChild(notification)
    this.notifications.push(notification)

    // Slide in
    requestAnimationFrame(() => {
      notification.classList.add('visible')
    })

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismissNotification(notification)
      }, duration)
    }

    return notification
  }

  /**
   * Dismiss a notification
   * @param {HTMLElement} notification
   */
  dismissNotification(notification) {
    notification.classList.remove('visible')
    notification.classList.add('hiding')

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      const index = this.notifications.indexOf(notification)
      if (index !== -1) {
        this.notifications.splice(index, 1)
      }
    }, 300)
  }

  // ============================================
  // Screen Transitions
  // ============================================

  /**
   * Fade out an element
   * @param {HTMLElement} element
   * @param {number} duration - Duration in ms
   * @returns {Promise}
   */
  fadeOut(element, duration = 300) {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease`
      element.style.opacity = '0'
      setTimeout(() => {
        element.style.display = 'none'
        resolve()
      }, duration)
    })
  }

  /**
   * Fade in an element
   * @param {HTMLElement} element
   * @param {number} duration - Duration in ms
   * @returns {Promise}
   */
  fadeIn(element, duration = 300) {
    return new Promise(resolve => {
      element.style.opacity = '0'
      element.style.display = ''
      requestAnimationFrame(() => {
        element.style.transition = `opacity ${duration}ms ease`
        element.style.opacity = '1'
        setTimeout(resolve, duration)
      })
    })
  }

  // ============================================
  // Helper: Create Glass Panel
  // ============================================

  /**
   * Create a glass-morphism panel element
   * @param {Object} options
   * @returns {HTMLElement}
   */
  createPanel(options = {}) {
    const panel = document.createElement('div')
    panel.className = 'panel ' + (options.className || '')

    if (options.title) {
      const header = document.createElement('div')
      header.className = 'panel-header'
      header.innerHTML = `<h2>${options.title}</h2>`

      if (options.closable) {
        const closeBtn = document.createElement('button')
        closeBtn.className = 'panel-close'
        closeBtn.innerHTML = '×'
        closeBtn.onclick = options.onClose
        header.appendChild(closeBtn)
      }

      panel.appendChild(header)
    }

    if (options.content) {
      const body = document.createElement('div')
      body.className = 'panel-body'
      if (typeof options.content === 'string') {
        body.innerHTML = options.content
      } else {
        body.appendChild(options.content)
      }
      panel.appendChild(body)
    }

    return panel
  }

  // ============================================
  // Confirmation Dialog
  // ============================================

  /**
   * Show a confirmation dialog
   * @param {string} message
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  confirm(message, options = {}) {
    return new Promise(resolve => {
      const modal = {
        element: document.createElement('div'),
        closeOnBackdrop: false
      }

      modal.element.className = 'modal confirm-modal'
      modal.element.innerHTML = `
        <div class="panel">
          <div class="panel-body">
            <p class="confirm-message">${message}</p>
            <div class="confirm-buttons">
              <button class="btn btn-secondary cancel-btn">${options.cancelText || 'Cancel'}</button>
              <button class="btn ${options.danger ? 'btn-danger' : 'btn-primary'} confirm-btn">
                ${options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      `

      const cancelBtn = modal.element.querySelector('.cancel-btn')
      const confirmBtn = modal.element.querySelector('.confirm-btn')

      cancelBtn.onclick = () => {
        this.closeModal(modal)
        resolve(false)
      }

      confirmBtn.onclick = () => {
        this.closeModal(modal)
        resolve(true)
      }

      this.showModal(modal)
    })
  }
}

// Singleton instance
export const uiManager = new UIManager()
