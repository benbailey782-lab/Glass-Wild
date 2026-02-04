import * as THREE from 'three'
import { EventEmitter } from '../core/EventEmitter.js'
import SpeciesLoader from '../data/SpeciesLoader.js'
import { Isopod } from './Isopod.js'
import { Springtail } from './Springtail.js'
import { DartFrog } from './DartFrog.js'

/**
 * Manages all creatures in the terrarium
 * Handles creation, updates, removal, and population tracking
 */
export class CreatureManager extends EventEmitter {
  constructor(scene, terrarium, gameState) {
    super()

    this.scene = scene
    this.terrarium = terrarium
    this.gameState = gameState

    // All creatures
    this.creatures = []
    this.creaturesBySpecies = new Map()
    this.creaturesById = new Map()

    // Container for creature meshes
    this.creatureGroup = new THREE.Group()
    this.creatureGroup.name = 'creatures'

    // Add to terrarium contents if available
    if (this.terrarium && this.terrarium.contentsGroup) {
      this.terrarium.contentsGroup.add(this.creatureGroup)
    } else {
      this.scene.add(this.creatureGroup)
    }

    // Species class mapping
    this.speciesClasses = {
      powder_blue_isopod: Isopod,
      springtails: Springtail,
      dendrobates_auratus: DartFrog
    }
  }

  /**
   * Add a new creature to the terrarium
   * @param {string} speciesId - The species identifier
   * @param {Object} position - Optional position {x, y, z}
   * @param {Object} savedData - Optional saved creature data
   * @returns {Promise<Creature|null>} - The created creature or null
   */
  async addCreature(speciesId, position = null, savedData = null) {
    // Load species data
    const speciesData = await SpeciesLoader.load(speciesId)
    if (!speciesData) {
      console.warn(`Failed to load species data for: ${speciesId}`)
      return null
    }

    // Get the creature class for this species
    const CreatureClass = this.speciesClasses[speciesId] || this.getDefaultClass(speciesData)
    if (!CreatureClass) {
      console.warn(`No creature class found for species: ${speciesId}`)
      return null
    }

    // Determine position
    let creaturePosition = position
    if (!creaturePosition) {
      creaturePosition = this.getRandomSpawnPosition()
    }

    // Create the creature
    const creature = new CreatureClass(speciesData, creaturePosition)

    // Restore saved data if provided
    if (savedData) {
      creature.fromJSON(savedData)
    }

    // Set terrarium reference
    creature.terrarium = this.terrarium

    // Listen for creature events
    creature.on('death', (data) => this.handleCreatureDeath(data))
    creature.on('ate', (data) => this.emit('creatureAte', data))
    creature.on('molt', (data) => this.emit('creatureMolt', data))

    // Add mesh to scene
    if (creature.mesh) {
      this.creatureGroup.add(creature.mesh)
    }

    // Track the creature
    this.creatures.push(creature)
    this.creaturesById.set(creature.id, creature)

    // Track by species
    if (!this.creaturesBySpecies.has(speciesId)) {
      this.creaturesBySpecies.set(speciesId, [])
    }
    this.creaturesBySpecies.get(speciesId).push(creature)

    // Emit event
    this.emit('creatureAdded', { creature, speciesId })

    // Update game state
    this.updateGameState()

    return creature
  }

  /**
   * Get default creature class based on category
   */
  getDefaultClass(speciesData) {
    const subcategory = speciesData.identity.subcategory

    switch (subcategory) {
      case 'isopod':
        return Isopod
      case 'springtail':
        return Springtail
      case 'dart_frog':
        return DartFrog
      default:
        return null
    }
  }

  /**
   * Get a random valid spawn position
   */
  getRandomSpawnPosition() {
    if (this.terrarium) {
      const bounds = this.terrarium.getBounds()
      if (bounds) {
        return {
          x: bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x),
          y: bounds.min.y + 0.1, // Slightly above substrate
          z: bounds.min.z + Math.random() * (bounds.max.z - bounds.min.z)
        }
      }
    }

    // Default position (substrate height is 2.5)
    return { x: (Math.random() - 0.5) * 2, y: 2.6, z: (Math.random() - 0.5) * 2 }
  }

  /**
   * Remove a creature from the terrarium
   */
  removeCreature(creatureId) {
    const creature = this.creaturesById.get(creatureId)
    if (!creature) return false

    // Remove from tracking
    this.creaturesById.delete(creatureId)
    this.creatures = this.creatures.filter((c) => c.id !== creatureId)

    // Remove from species tracking
    const speciesCreatures = this.creaturesBySpecies.get(creature.speciesId)
    if (speciesCreatures) {
      const index = speciesCreatures.indexOf(creature)
      if (index > -1) {
        speciesCreatures.splice(index, 1)
      }
    }

    // Dispose the creature
    creature.dispose()

    // Emit event
    this.emit('creatureRemoved', { creatureId, speciesId: creature.speciesId })

    // Update game state
    this.updateGameState()

    return true
  }

  /**
   * Handle creature death
   */
  handleCreatureDeath(data) {
    const { creature, cause } = data

    // Emit death event
    this.emit('creatureDeath', data)

    // Remove after a short delay (for death animation if implemented)
    setTimeout(() => {
      this.removeCreature(creature.id)
    }, 2000)
  }

  /**
   * Update all creatures
   * @param {number} deltaTime - Time since last frame in game minutes
   * @param {Object} environment - Current environment conditions
   */
  update(deltaTime, environment) {
    // Update each creature
    for (const creature of this.creatures) {
      if (creature.isAlive) {
        creature.update(deltaTime, environment)
      }
    }

    // Age creatures (1 game day = 1 real minute at 1x speed)
    // deltaTime is in game minutes, so convert to days
    const gameDays = deltaTime / (24 * 60)
    for (const creature of this.creatures) {
      if (creature.isAlive) {
        creature.ageBy(gameDays)
      }
    }

    // Process predator/prey interactions
    this.updatePredation(deltaTime, environment)
  }

  /**
   * Update predator/prey interactions
   */
  updatePredation(deltaTime, environment) {
    // Get all predators and prey
    const predators = this.creatures.filter(c =>
      c.isAlive &&
      c.speciesData.diet.feeding_method === 'hunter' &&
      !c.isHunting
    )

    const prey = this.creatures.filter(c =>
      c.isAlive &&
      (c.speciesData.identity.subcategory === 'springtail')
    )

    // Have predators look for prey
    for (const predator of predators) {
      // Only hunt if hungry enough
      if (predator.needs.hunger > 70) continue

      // Find prey
      const target = predator.findPrey(prey)
      if (target) {
        predator.startHunting(target)
      }
    }

    // Have prey detect predators
    const allPredators = this.creatures.filter(c =>
      c.isAlive &&
      c.speciesData.diet.feeding_method === 'hunter'
    )

    for (const preyCreature of prey) {
      if (preyCreature.isFleeing) continue

      const nearbyPredator = preyCreature.detectPredator(allPredators)
      if (nearbyPredator && preyCreature.startFleeing) {
        preyCreature.startFleeing(nearbyPredator)
      }
    }
  }

  /**
   * Get prey creatures for a predator
   */
  getPreyFor(predator) {
    const preyIds = []

    // Check compatibility for prey relationships
    if (predator.speciesData.compatibility) {
      for (const compat of predator.speciesData.compatibility) {
        if (compat.interaction_type === 'predator' && compat.is_predator) {
          preyIds.push(compat.target_species_id)
        }
      }
    }

    return this.creatures.filter(c =>
      c.isAlive && preyIds.includes(c.speciesId)
    )
  }

  /**
   * Get total population count
   */
  getPopulation() {
    return this.creatures.filter((c) => c.isAlive).length
  }

  /**
   * Get population count for a specific species
   */
  getPopulationBySpecies(speciesId) {
    const creatures = this.creaturesBySpecies.get(speciesId)
    if (!creatures) return 0
    return creatures.filter((c) => c.isAlive).length
  }

  /**
   * Get all creatures of a species
   */
  getCreaturesBySpecies(speciesId) {
    return this.creaturesBySpecies.get(speciesId) || []
  }

  /**
   * Get a creature by ID
   */
  getCreatureById(id) {
    return this.creaturesById.get(id)
  }

  /**
   * Get all living creatures
   */
  getLivingCreatures() {
    return this.creatures.filter((c) => c.isAlive)
  }

  /**
   * Update game state with current creature data
   */
  updateGameState() {
    if (!this.gameState || !this.gameState.currentTank) return

    // Serialize all creatures
    const creaturesData = this.creatures.map((c) => c.toJSON())

    // Update tank data
    this.gameState.updateCurrentTank({
      creatures: creaturesData
    })
  }

  /**
   * Load creatures from saved game state
   */
  async loadFromGameState() {
    if (!this.gameState || !this.gameState.currentTank) return

    const savedCreatures = this.gameState.currentTank.creatures || []

    for (const savedData of savedCreatures) {
      if (savedData.isAlive) {
        await this.addCreature(savedData.speciesId, null, savedData)
      }
    }
  }

  /**
   * Clear all creatures
   */
  clear() {
    // Dispose all creatures
    for (const creature of this.creatures) {
      creature.dispose()
    }

    // Clear tracking
    this.creatures = []
    this.creaturesById.clear()
    this.creaturesBySpecies.clear()

    // Clear the group
    while (this.creatureGroup.children.length > 0) {
      this.creatureGroup.remove(this.creatureGroup.children[0])
    }
  }

  /**
   * Dispose of the manager
   */
  dispose() {
    this.clear()

    if (this.creatureGroup.parent) {
      this.creatureGroup.parent.remove(this.creatureGroup)
    }

    this.removeAllListeners()
  }
}

export default CreatureManager
