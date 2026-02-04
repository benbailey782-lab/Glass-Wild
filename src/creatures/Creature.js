import * as THREE from 'three'
import { EventEmitter } from '../core/EventEmitter.js'
import { LocomotionProfile } from '../locomotion/LocomotionProfile.js'

/**
 * Base class for all creatures in the terrarium
 * Handles common functionality: needs, movement, aging, stress, and death
 */
export class Creature extends EventEmitter {
  constructor(speciesData, position, personality = null) {
    super()

    // Identity
    this.id = crypto.randomUUID()
    this.speciesId = speciesData.identity.id
    this.speciesData = speciesData
    this.name = null // Optional player-assigned name

    // Physical state
    this.age = 0 // days
    this.lifeStage = 'juvenile' // juvenile, adult, elder
    this.size = speciesData.physical.size_juvenile_inches
    this.health = 100

    // Needs (0-100, higher = more satisfied)
    this.needs = {
      hunger: 80,
      stress: speciesData.stress.stress_baseline
    }

    // Starvation tracking
    this.starvationTimer = 0

    // Personality (randomized within species range if not provided)
    this.personality = personality || this.generatePersonality()

    // Position & movement
    this.position = new THREE.Vector3(
      position?.x || 0,
      position?.y || 0,
      position?.z || 0
    )
    this.rotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0)
    this.targetPosition = null
    this.isMoving = false

    // Behavior state
    this.currentBehavior = 'idle'
    this.behaviorTimer = 0
    this.behaviorDuration = 0

    // State flags
    this.isAlive = true
    this.isHiding = false

    // 3D representation (set by subclass)
    this.mesh = null

    // Reference to terrarium (set by CreatureManager)
    this.terrarium = null

    // Locomotion system
    this.locomotionProfile = new LocomotionProfile(speciesData)
    this.currentMovementPlan = null
    this.currentSegmentIndex = 0
  }

  /**
   * Generate random personality within species ranges
   */
  generatePersonality() {
    const ranges = this.speciesData.personality_ranges
    return {
      boldness: this.randomInRange(
        ranges.boldness_min,
        ranges.boldness_max,
        ranges.boldness_default
      ),
      activity: this.randomInRange(
        ranges.activity_min,
        ranges.activity_max,
        ranges.activity_default
      )
    }
  }

  /**
   * Random value biased toward default
   */
  randomInRange(min, max, defaultVal) {
    // 70% chance to be within 20% of default, 30% chance to be anywhere in range
    if (Math.random() < 0.7) {
      const variance = (max - min) * 0.2
      return Math.max(min, Math.min(max, defaultVal + (Math.random() - 0.5) * variance))
    }
    return min + Math.random() * (max - min)
  }

  /**
   * Main update loop - called every frame
   * @param {number} deltaTime - Time since last frame in seconds (game time, affected by time scale)
   * @param {Object} environment - Current environment conditions
   */
  update(deltaTime, environment) {
    if (!this.isAlive) return

    // Convert deltaTime to game hours for need calculations
    // Assuming 1 real second at 1x speed = 1 game minute
    const gameMinutes = deltaTime
    const gameHours = gameMinutes / 60

    // Update various systems
    this.updateNeeds(gameHours, environment)
    this.updateMovement(deltaTime)
    this.updateBehavior(deltaTime, environment)

    // Update terrain height even when not moving (for idle creatures)
    if (!this.isMoving) {
      this.updateTerrainHeight()
    }

    // Sync mesh position
    if (this.mesh) {
      this.mesh.position.copy(this.position)
      this.mesh.rotation.copy(this.rotation)
    }
  }

  /**
   * Update creature needs over time
   */
  updateNeeds(gameHours, environment) {
    // Deplete hunger
    const hungerRate = this.speciesData.diet.hunger_rate_per_hour
    this.needs.hunger -= hungerRate * gameHours
    this.needs.hunger = Math.max(0, Math.min(100, this.needs.hunger))

    // Calculate and apply stress
    const stressGain = this.calculateStress(environment)
    const stressRecovery = this.speciesData.stress.stress_recovery_rate * gameHours

    // Net stress change
    this.needs.stress += (stressGain - stressRecovery) * gameHours
    this.needs.stress = Math.max(0, Math.min(100, this.needs.stress))

    // Check starvation
    if (this.needs.hunger <= 0) {
      this.starvationTimer += gameHours * 24 // Convert to days
      const starvationDays = this.speciesData.diet.starvation_days
      if (this.starvationTimer >= starvationDays) {
        this.die('starvation')
      }
    } else {
      this.starvationTimer = 0
    }

    // Check fatal stress
    if (this.needs.stress >= this.speciesData.stress.stress_fatal_threshold) {
      this.die('stress')
    }
  }

  /**
   * Calculate stress gain from environmental conditions
   */
  calculateStress(environment) {
    let stressGain = 0
    const sources = this.speciesData.stress.stress_sources

    // Check humidity
    if (sources.low_humidity && environment.humidity < sources.low_humidity.threshold) {
      stressGain += sources.low_humidity.stress_per_hour
    }

    // Check temperature
    if (sources.high_temperature && environment.temperature > sources.high_temperature.threshold) {
      stressGain += sources.high_temperature.stress_per_hour
    }

    // Check hiding spots
    if (sources.no_hiding_spots && this.terrarium && !this.terrarium.hasHidingSpots()) {
      stressGain += sources.no_hiding_spots.stress_per_hour
    }

    // Check food availability
    if (sources.no_food && this.needs.hunger < 20) {
      stressGain += sources.no_food.stress_per_hour
    }

    // Check light (for nocturnal creatures)
    if (sources.bright_light && environment.isDay && !this.isHiding) {
      stressGain += sources.bright_light.stress_per_hour
    }

    return stressGain
  }

  /**
   * Update movement toward target
   */
  updateMovement(deltaTime) {
    if (!this.targetPosition || !this.isMoving) return

    const direction = new THREE.Vector3()
      .subVectors(this.targetPosition, this.position)

    // Use XZ distance for 2D pathfinding (ignore Y difference)
    const xzDirection = new THREE.Vector2(direction.x, direction.z)
    const distance = xzDirection.length()

    // Reached target
    if (distance < 0.05) {
      this.targetPosition = null
      this.isMoving = false
      return
    }

    // Move toward target (XZ plane only)
    xzDirection.normalize()
    const speed = this.speciesData.behavior.movement_speed_normal * this.personality.activity
    // Convert speed from inches/second to world units
    // Assuming 1 world unit = 1 inch for simplicity
    const moveDistance = speed * deltaTime * 60 // Scale by 60 since deltaTime is in game minutes

    // Don't overshoot
    const actualMove = Math.min(moveDistance, distance)
    this.position.x += xzDirection.x * actualMove
    this.position.z += xzDirection.y * actualMove

    // Sample terrain height at new position and update Y
    this.updateTerrainHeight()

    // Update rotation to face movement direction
    if (xzDirection.x !== 0 || xzDirection.y !== 0) {
      this.rotation.y = Math.atan2(xzDirection.x, xzDirection.y)
    }
  }

  /**
   * Update creature Y position to match terrain height
   */
  updateTerrainHeight() {
    if (!this.terrarium || !this.terrarium.getTerrainHeight) return

    const terrainY = this.terrarium.getTerrainHeight(this.position.x, this.position.z)

    // Get creature height offset (half the creature size for ground creatures)
    const heightOffset = this.getTerrainHeightOffset()

    this.position.y = terrainY + heightOffset
  }

  /**
   * Get the height offset for terrain placement
   * Override in subclasses for creatures with different body shapes
   * @returns {number} - Height offset above terrain
   */
  getTerrainHeightOffset() {
    // Default: small offset based on creature size
    return this.size * 0.2
  }

  /**
   * Execute a movement plan with physics-based locomotion
   * @param {number} deltaTime - Time since last frame
   * @returns {boolean} - True if plan is complete
   */
  executeMovementPlan(deltaTime) {
    if (!this.currentMovementPlan || this.currentMovementPlan.type === 'blocked') {
      return false
    }

    const segments = this.currentMovementPlan.segments
    if (this.currentSegmentIndex >= segments.length) {
      // Plan complete
      this.currentMovementPlan = null
      this.currentSegmentIndex = 0
      this.isMoving = false
      return true
    }

    const segment = segments[this.currentSegmentIndex]

    // Move along current segment
    const direction = new THREE.Vector3().subVectors(segment.to, this.position)
    const distance = direction.length()

    if (distance < 0.05) {
      // Reached segment end, move to next
      this.currentSegmentIndex++
      return false
    }

    direction.normalize()

    // Calculate speed based on segment properties
    const baseSpeed = this.speciesData.behavior.movement_speed_normal
    const effectiveSpeed = baseSpeed * segment.speedMultiplier * this.personality.activity
    const moveDistance = effectiveSpeed * deltaTime * 60

    const actualMove = Math.min(moveDistance, distance)

    // Different movement types have different animations/physics
    switch (segment.movementType) {
      case 'walk':
      case 'scramble':
        this.position.addScaledVector(direction, actualMove)
        break

      case 'climb':
      case 'vertical_climb':
        // Climbing moves along surface normal
        this.position.addScaledVector(direction, actualMove)
        break

      case 'jump':
        // Parabolic trajectory - simplified for now
        this.position.addScaledVector(direction, actualMove)
        break
    }

    // Update rotation to face movement direction
    if (direction.x !== 0 || direction.z !== 0) {
      this.rotation.y = Math.atan2(direction.x, direction.z)
    }

    // For climbing, also adjust pitch
    if (segment.movementType === 'climb' || segment.movementType === 'vertical_climb') {
      const pitch = Math.atan2(direction.y, Math.sqrt(direction.x ** 2 + direction.z ** 2))
      this.rotation.x = -pitch
    } else {
      this.rotation.x = 0
    }

    return false
  }

  /**
   * Update behavior state machine
   * Override in subclass for species-specific behaviors
   */
  updateBehavior(deltaTime, environment) {
    this.behaviorTimer += deltaTime

    // Check if current behavior should end
    if (this.behaviorTimer >= this.behaviorDuration) {
      this.chooseBehavior(environment)
    }
  }

  /**
   * Choose next behavior based on needs and environment
   * Override in subclass
   */
  chooseBehavior(environment) {
    // Default: just idle
    this.setBehavior('idle', 1 + Math.random() * 2)
  }

  /**
   * Set the current behavior
   */
  setBehavior(behavior, duration) {
    this.currentBehavior = behavior
    this.behaviorTimer = 0
    this.behaviorDuration = duration
    this.emit('behaviorChange', { creature: this, behavior })
  }

  /**
   * Start moving to a target position
   */
  moveTo(target) {
    this.targetPosition = target instanceof THREE.Vector3 ? target : new THREE.Vector3(target.x, target.y, target.z)
    this.isMoving = true
  }

  /**
   * Stop current movement
   */
  stopMoving() {
    this.targetPosition = null
    this.isMoving = false
  }

  /**
   * Pick a random valid position within bounds
   */
  getRandomPosition(bounds) {
    if (!bounds) return new THREE.Vector3(0, this.position.y, 0)

    return new THREE.Vector3(
      bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x),
      this.position.y, // Keep same height for ground creatures
      bounds.min.z + Math.random() * (bounds.max.z - bounds.min.z)
    )
  }

  /**
   * Age the creature by a number of days
   */
  ageBy(days) {
    this.age += days

    // Update life stage
    const maturityDays = this.speciesData.reproduction?.sexual_maturity_days || 60
    const lifespanDays = this.speciesData.physical.lifespan_years_max * 365

    if (this.age < maturityDays) {
      this.lifeStage = 'juvenile'
    } else if (this.age < lifespanDays * 0.7) {
      this.lifeStage = 'adult'
    } else {
      this.lifeStage = 'elder'
    }

    // Update size based on age
    const adultSize = this.speciesData.physical.size_adult_inches
    const juvenileSize = this.speciesData.physical.size_juvenile_inches

    if (this.lifeStage === 'juvenile') {
      const growthProgress = this.age / maturityDays
      this.size = juvenileSize + (adultSize - juvenileSize) * growthProgress
    } else {
      this.size = adultSize
    }

    // Update mesh scale
    if (this.mesh) {
      const scale = this.size / this.speciesData.physical.size_adult_inches
      this.mesh.scale.setScalar(scale)
    }

    // Check for natural death from old age
    if (this.age >= lifespanDays) {
      const deathChance = (this.age - lifespanDays) / (lifespanDays * 0.3)
      if (Math.random() < deathChance * 0.1) {
        this.die('old_age')
      }
    }
  }

  /**
   * Eat food and restore hunger
   */
  eat(foodValue = 20) {
    this.needs.hunger = Math.min(100, this.needs.hunger + foodValue)
    this.starvationTimer = 0
    this.emit('ate', { creature: this, foodValue })
  }

  /**
   * Handle creature death
   */
  die(cause) {
    if (!this.isAlive) return

    this.isAlive = false
    this.currentBehavior = 'dead'
    this.stopMoving()

    // Emit death event
    this.emit('death', {
      creature: this,
      cause,
      age: this.age,
      speciesId: this.speciesId
    })

    console.log(`${this.speciesData.identity.common_name} died from ${cause} at age ${this.age.toFixed(1)} days`)
  }

  /**
   * Remove mesh from scene
   */
  dispose() {
    if (this.mesh) {
      if (this.mesh.parent) {
        this.mesh.parent.remove(this.mesh)
      }
      // Dispose geometry and materials
      this.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      this.mesh = null
    }
    this.removeAllListeners()
  }

  /**
   * Serialize creature data for saving
   */
  toJSON() {
    return {
      id: this.id,
      speciesId: this.speciesId,
      name: this.name,
      age: this.age,
      lifeStage: this.lifeStage,
      size: this.size,
      health: this.health,
      needs: { ...this.needs },
      personality: { ...this.personality },
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotation: { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z },
      currentBehavior: this.currentBehavior,
      isAlive: this.isAlive
    }
  }

  /**
   * Restore creature state from saved data
   */
  fromJSON(data) {
    this.id = data.id
    this.name = data.name
    this.age = data.age
    this.lifeStage = data.lifeStage
    this.size = data.size
    this.health = data.health
    this.needs = { ...data.needs }
    this.personality = { ...data.personality }
    this.position.set(data.position.x, data.position.y, data.position.z)
    this.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z)
    this.currentBehavior = data.currentBehavior
    this.isAlive = data.isAlive
  }
}

export default Creature
