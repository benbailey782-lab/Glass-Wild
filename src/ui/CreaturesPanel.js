import { SlidePanel } from './SlidePanel.js'
import { gameState } from '../core/GameState.js'
import { uiManager } from './UIManager.js'

// Species catalog data - this would eventually come from loaded JSON files
const SPECIES_CATALOG = {
  cleanup_crew: {
    name: 'Cleanup Crew',
    species: [
      { id: 'springtails', name: 'Springtails', scientific: 'Folsomia candida', tier: 1, difficulty: 'easy', unlockLevel: 1 },
      { id: 'powder_blue_isopod', name: 'Powder Blue Isopod', scientific: 'Porcellionides pruinosus', tier: 1, difficulty: 'easy', unlockLevel: 1 },
      { id: 'dwarf_white_isopod', name: 'Dwarf White Isopod', scientific: 'Trichorhina tomentosa', tier: 1, difficulty: 'easy', unlockLevel: 2 },
      { id: 'dairy_cow_isopod', name: 'Dairy Cow Isopod', scientific: 'Porcellio laevis', tier: 2, difficulty: 'easy', unlockLevel: 5 }
    ]
  },
  amphibians: {
    name: 'Amphibians',
    species: [
      { id: 'dendrobates_auratus', name: 'Green & Black Dart Frog', scientific: 'Dendrobates auratus', tier: 2, difficulty: 'easy', unlockLevel: 1 },
      { id: 'dendrobates_leucomelas', name: 'Bumblebee Dart Frog', scientific: 'Dendrobates leucomelas', tier: 2, difficulty: 'easy', unlockLevel: 7 },
      { id: 'ranitomeya_imitator', name: 'Mimic Poison Frog', scientific: 'Ranitomeya imitator', tier: 2, difficulty: 'medium', unlockLevel: 10 }
    ]
  },
  reptiles: {
    name: 'Reptiles',
    species: [
      { id: 'mourning_gecko', name: 'Mourning Gecko', scientific: 'Lepidodactylus lugubris', tier: 1, difficulty: 'easy', unlockLevel: 3 },
      { id: 'crested_gecko', name: 'Crested Gecko', scientific: 'Correlophus ciliatus', tier: 3, difficulty: 'easy', unlockLevel: 15 }
    ]
  }
}

// Currently implemented species (can actually be added)
const IMPLEMENTED_SPECIES = ['springtails', 'powder_blue_isopod', 'dendrobates_auratus']

/**
 * CreaturesPanel - Slide-out panel for creature catalog
 */
export class CreaturesPanel extends SlidePanel {
  constructor(creatureManager) {
    super('Creatures', 380)
    this.creatureManager = creatureManager
    this.expandedCategories = new Set(['cleanup_crew']) // Default expanded

    this.buildContent()
  }

  buildContent() {
    const container = document.createElement('div')
    container.className = 'creatures-panel-content'

    // Search bar
    const searchBar = document.createElement('div')
    searchBar.className = 'creatures-search'
    searchBar.innerHTML = `
      <input type="text" placeholder="Search species..." class="creatures-search-input">
    `
    container.appendChild(searchBar)

    // Search functionality
    const searchInput = searchBar.querySelector('input')
    searchInput.addEventListener('input', (e) => {
      this.filterSpecies(e.target.value)
    })

    // Categories
    const categoriesContainer = document.createElement('div')
    categoriesContainer.className = 'creatures-categories'

    for (const [categoryId, category] of Object.entries(SPECIES_CATALOG)) {
      const categoryEl = this.createCategory(categoryId, category)
      categoriesContainer.appendChild(categoryEl)
    }

    container.appendChild(categoriesContainer)
    this.appendContent(container)
  }

  createCategory(categoryId, category) {
    const categoryEl = document.createElement('div')
    categoryEl.className = 'creatures-category'
    categoryEl.dataset.categoryId = categoryId

    const isExpanded = this.expandedCategories.has(categoryId)

    categoryEl.innerHTML = `
      <div class="category-header ${isExpanded ? 'expanded' : ''}">
        <span class="category-toggle">${isExpanded ? '\u25BC' : '\u25B6'}</span>
        <span class="category-name">${category.name}</span>
        <span class="category-count">${category.species.length}</span>
      </div>
      <div class="category-species ${isExpanded ? 'expanded' : ''}"></div>
    `

    // Toggle expand/collapse
    const header = categoryEl.querySelector('.category-header')
    header.addEventListener('click', () => {
      const speciesList = categoryEl.querySelector('.category-species')
      const toggle = categoryEl.querySelector('.category-toggle')
      const isNowExpanded = !speciesList.classList.contains('expanded')

      speciesList.classList.toggle('expanded')
      header.classList.toggle('expanded')
      toggle.textContent = isNowExpanded ? '\u25BC' : '\u25B6'

      if (isNowExpanded) {
        this.expandedCategories.add(categoryId)
      } else {
        this.expandedCategories.delete(categoryId)
      }
    })

    // Add species cards
    const speciesList = categoryEl.querySelector('.category-species')
    for (const species of category.species) {
      const card = this.createSpeciesCard(species)
      speciesList.appendChild(card)
    }

    return categoryEl
  }

  createSpeciesCard(species) {
    const playerLevel = gameState.player?.level || 1
    const isUnlocked = playerLevel >= species.unlockLevel
    const isImplemented = IMPLEMENTED_SPECIES.includes(species.id)

    const card = document.createElement('div')
    card.className = `species-card ${isUnlocked ? 'unlocked' : 'locked'} ${isImplemented ? '' : 'not-implemented'}`
    card.dataset.speciesId = species.id

    // Difficulty indicator (dots)
    const difficultyDots = this.getDifficultyDots(species.difficulty)

    card.innerHTML = `
      <div class="species-thumbnail" style="background-color: ${this.getSpeciesColor(species.id)}">
        ${isUnlocked ? '' : '<span class="lock-icon">&#x1F512;</span>'}
      </div>
      <div class="species-info">
        <div class="species-name">${species.name}</div>
        <div class="species-scientific">${species.scientific}</div>
        <div class="species-meta">
          <span class="species-difficulty">${difficultyDots}</span>
          ${!isUnlocked ? `<span class="unlock-level">Lvl ${species.unlockLevel}</span>` : ''}
        </div>
      </div>
      <button class="species-add-btn" ${isUnlocked && isImplemented ? '' : 'disabled'}>+</button>
    `

    // Add button click
    const addBtn = card.querySelector('.species-add-btn')
    if (isUnlocked && isImplemented) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.addCreature(species)
      })
    }

    return card
  }

  getDifficultyDots(difficulty) {
    const levels = { easy: 1, medium: 2, hard: 3, expert: 4 }
    const level = levels[difficulty] || 1
    return '\u25CF'.repeat(level) + '\u25CB'.repeat(4 - level)
  }

  getSpeciesColor(speciesId) {
    // Placeholder colors until we have real thumbnails
    const colors = {
      springtails: '#8B4513',
      powder_blue_isopod: '#4682B4',
      dwarf_white_isopod: '#F5F5F5',
      dairy_cow_isopod: '#2F4F4F',
      dendrobates_auratus: '#228B22',
      dendrobates_leucomelas: '#FFD700',
      ranitomeya_imitator: '#FF6347',
      mourning_gecko: '#8B7355',
      crested_gecko: '#DAA520'
    }
    return colors[speciesId] || '#666'
  }

  async addCreature(species) {
    if (!this.creatureManager) {
      uiManager.notify('Creature system not ready', 'warning')
      return
    }

    // Special handling for springtails (add 10 at once)
    if (species.id === 'springtails') {
      let added = 0
      for (let i = 0; i < 10; i++) {
        const creature = await this.creatureManager.addCreature(species.id)
        if (creature) added++
      }
      if (added > 0) {
        uiManager.notify(`Added ${added} ${species.name}!`, 'success')
      }
    } else {
      const creature = await this.creatureManager.addCreature(species.id)
      if (creature) {
        uiManager.notify(`Added ${species.name}!`, 'success')
      } else {
        uiManager.notify(`Failed to add ${species.name}`, 'warning')
      }
    }
  }

  filterSpecies(searchTerm) {
    const term = searchTerm.toLowerCase()
    const cards = this.element.querySelectorAll('.species-card')

    cards.forEach(card => {
      const name = card.querySelector('.species-name').textContent.toLowerCase()
      const scientific = card.querySelector('.species-scientific').textContent.toLowerCase()
      const matches = name.includes(term) || scientific.includes(term)
      card.style.display = matches ? '' : 'none'
    })

    // Also show/hide empty categories
    const categories = this.element.querySelectorAll('.creatures-category')
    categories.forEach(cat => {
      const visibleCards = cat.querySelectorAll('.species-card:not([style*="display: none"])')
      cat.style.display = visibleCards.length > 0 ? '' : 'none'
    })
  }
}

export default CreaturesPanel
