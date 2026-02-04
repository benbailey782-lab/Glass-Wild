import * as THREE from 'three'
import { Creature } from './Creature.js'
import { createIsopodMesh, updateIsopodAnimation, getRandomIsopodColor } from './models/IsopodModel.js'

/**
 * Isopod class - extends Creature with isopod-specific behavior
 * Behaviors: idle, wander, eat, hide, flee
 */
export class Isopod extends Creature {
  constructor(speciesData, position, personality = null) {
    super(speciesData, position, personality)

    // Isopod-specific state
    this.isHiding = false
    this.moltTimer = 0
    this.nextMoltIn = this.calculateNextMolt()
    this.lastMoltAge = 0

    // Eating state
    this.isEating = false
    this.currentFoodSource = null

    // Wander state
    this.wanderCooldown = 0

    // Create the visual mesh
    this.createMesh()
  }

  /**
   * Create the isopod's 3D mesh
   */
  createMesh() {
    const sizeRatio = this.size / this.speciesData.physical.size_adult_inches
    const color = Math.random() < 0.8 ? 0x7B9BAA : getRandomIsopodColor()

    this.mesh = createIsopodMesh(sizeRatio, { color })
    this.mesh.position.copy(this.position)
    this.mesh.rotation.copy(this.rotation)

    // Store reference back to creature
    this.mesh.userData.creature = this
  }

  /**
   * Calculate time until next molt (in game hours)
   */
  calculateNextMolt() {
    const baseDays = this.speciesData.category_specific?.molt_frequency_days || 14
    // Add some randomness (+/- 30%)
    const variance = baseDays * 0.3
    return (baseDays + (Math.random() - 0.5) * 2 * variance) * 24 // Convert to hours
  }

  /**
   * Main update loop
   */
  update(deltaTime, environment) {
    if (!this.isAlive) return

    // Call parent update
    super.update(deltaTime, environment)

    // Update animation
    updateIsopodAnimation(this.mesh, deltaTime, this.isMoving)

    // Update molt timer
    const gameHours = deltaTime / 60
    this.checkMolt(gameHours)

    // Update wander cooldown
    if (this.wanderCooldown > 0) {
      this.wanderCooldown -= deltaTime
    }
  }

  /**
   * Check and handle molting
   */
  checkMolt(gameHours) {
    this.moltTimer += gameHours

    if (this.moltTimer >= this.nextMoltIn) {
      this.molt()
    }
  }

  /**
   * Perform a molt
   */
  molt() {
    this.moltTimer = 0
    this.nextMoltIn = this.calculateNextMolt()
    this.lastMoltAge = this.age

    // Molting reduces stress slightly
    this.needs.stress = Math.max(0, this.needs.stress - 5)

    // Emit molt event
    this.emit('molt', { creature: this })
  }

  /**
   * Choose behavior based on needs and environment
   * Priority: flee > hide > eat > wander > idle
   */
  chooseBehavior(environment) {
    // Check if should hide (nocturnal + daytime, or high stress)
    if (this.shouldHide(environment)) {
      this.startHiding(environment)
      return
    }

    // Check if hungry and food available
    if (this.shouldEat()) {
      this.startEating(environment)
      return
    }

    // Default: wander or idle based on activity personality
    if (this.shouldWander()) {
      this.startWandering(environment)
      return
    }

    // Idle
    this.startIdling()
  }

  /**
   * Check if isopod should hide
   */
  shouldHide(environment) {
    // Hide during daytime (nocturnal)
    if (environment.isDay && !this.isHiding) {
      // Chance based on boldness - bolder isopods might stay out
      if (Math.random() > this.personality.boldness) {
        return true
      }
    }

    // Hide if stress is high
    if (this.needs.stress > this.speciesData.stress.stress_threshold_high) {
      return true
    }

    // Random hiding urge based on time_hidden_percent
    const hideChance = this.speciesData.behavior.time_hidden_percent / 100
    if (Math.random() < hideChance * 0.1) { // Check occasionally
      return true
    }

    return false
  }

  /**
   * Start hiding behavior
   */
  startHiding(environment) {
    this.isHiding = true
    this.setBehavior('hide', 5 + Math.random() * 10)

    // Try to find a hiding spot
    if (this.terrarium) {
      const hidingSpots = this.terrarium.getHidingSpots()
      if (hidingSpots && hidingSpots.length > 0) {
        // Find nearest hiding spot
        const nearest = this.findNearest(hidingSpots)
        if (nearest) {
          this.moveTo(nearest)
        }
      }
    }
  }

  /**
   * Check if isopod should eat
   */
  shouldEat() {
    // Eat when hunger is below threshold
    return this.needs.hunger < 60
  }

  /**
   * Start eating behavior
   */
  startEating(environment) {
    this.setBehavior('eat', 2 + Math.random() * 3)

    // Try to find food (leaf litter)
    if (this.terrarium) {
      const foodPositions = this.terrarium.getLeafLitterPositions()
      if (foodPositions && foodPositions.length > 0) {
        // Find nearest food
        const nearest = this.findNearest(foodPositions)
        if (nearest) {
          this.currentFoodSource = nearest
          this.moveTo(nearest)
        }
      }
    }
  }

  /**
   * Check if isopod should wander
   */
  shouldWander() {
    // Wander based on activity personality
    if (this.wanderCooldown <= 0) {
      return Math.random() < this.personality.activity
    }
    return false
  }

  /**
   * Start wandering behavior
   */
  startWandering(environment) {
    this.isHiding = false
    this.setBehavior('wander', 2 + Math.random() * 4)

    // Pick a random destination within bounds
    if (this.terrarium) {
      const bounds = this.terrarium.getBounds()
      const target = this.getRandomPosition(bounds)
      this.moveTo(target)
    }

    // Set cooldown before next wander
    this.wanderCooldown = 1 + Math.random() * 2
  }

  /**
   * Start idle behavior
   */
  startIdling() {
    this.setBehavior('idle', 1 + Math.random() * 3)
    this.stopMoving()
  }

  /**
   * Override updateBehavior for isopod-specific logic
   */
  updateBehavior(deltaTime, environment) {
    this.behaviorTimer += deltaTime

    // Handle current behavior
    switch (this.currentBehavior) {
      case 'eat':
        this.updateEating(deltaTime)
        break
      case 'hide':
        this.updateHiding(deltaTime, environment)
        break
      case 'wander':
        this.updateWandering(deltaTime)
        break
      case 'idle':
        // Just wait
        break
    }

    // Check if current behavior should end
    if (this.behaviorTimer >= this.behaviorDuration) {
      this.chooseBehavior(environment)
    }
  }

  /**
   * Update eating behavior
   */
  updateEating(deltaTime) {
    // If we've reached food source, eat
    if (!this.isMoving && this.currentFoodSource) {
      // Eating restores hunger over time
      const eatRate = 5 // hunger points per game minute
      this.needs.hunger = Math.min(100, this.needs.hunger + eatRate * deltaTime)

      // Stop eating when satisfied
      if (this.needs.hunger >= 90) {
        this.currentFoodSource = null
        this.emit('ate', { creature: this, foodValue: 90 - this.needs.hunger })
      }
    }
  }

  /**
   * Update hiding behavior
   */
  updateHiding(deltaTime, environment) {
    // While hiding, recover from stress faster
    if (this.isHiding && !this.isMoving) {
      const bonusRecovery = 2 // Extra stress recovery per hour
      const gameHours = deltaTime / 60
      this.needs.stress = Math.max(0, this.needs.stress - bonusRecovery * gameHours)
    }

    // Check if should come out
    if (!environment.isDay && this.needs.stress < this.speciesData.stress.stress_threshold_low) {
      // Might come out if it's night and calm
      if (Math.random() < this.personality.boldness * 0.3) {
        this.isHiding = false
      }
    }
  }

  /**
   * Update wandering behavior
   */
  updateWandering(deltaTime) {
    // If we've reached destination, might pick a new one
    if (!this.isMoving && this.terrarium) {
      if (Math.random() < 0.3) {
        const bounds = this.terrarium.getBounds()
        const target = this.getRandomPosition(bounds)
        this.moveTo(target)
      }
    }
  }

  /**
   * Find nearest position from array
   */
  findNearest(positions) {
    if (!positions || positions.length === 0) return null

    let nearest = null
    let nearestDist = Infinity

    for (const pos of positions) {
      const dist = this.position.distanceTo(
        pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(pos.x, pos.y, pos.z)
      )
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = pos
      }
    }

    return nearest
  }

  /**
   * Serialize for saving
   */
  toJSON() {
    return {
      ...super.toJSON(),
      moltTimer: this.moltTimer,
      nextMoltIn: this.nextMoltIn,
      lastMoltAge: this.lastMoltAge,
      isHiding: this.isHiding
    }
  }

  /**
   * Restore from saved data
   */
  fromJSON(data) {
    super.fromJSON(data)
    this.moltTimer = data.moltTimer || 0
    this.nextMoltIn = data.nextMoltIn || this.calculateNextMolt()
    this.lastMoltAge = data.lastMoltAge || 0
    this.isHiding = data.isHiding || false
  }
}

export default Isopod
