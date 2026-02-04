import * as THREE from 'three'
import { Creature } from './Creature.js'
import { createSpringtailMesh, updateSpringtailAnimation } from './models/SpringtailModel.js'

/**
 * Springtail class - tiny prey creature
 * Behaviors: wander, eat, flee
 */
export class Springtail extends Creature {
  constructor(speciesData, position, personality = null) {
    super(speciesData, position, personality)

    // Springtail-specific state
    this.isFleeing = false
    this.fleeTarget = null
    this.detectedPredator = null
    this.fleeTimer = 0
    this.lastJumpTime = 0
    this.jumpCooldown = 0.5 // seconds

    // Create the visual mesh
    this.createMesh()
  }

  createMesh() {
    const sizeRatio = this.size / this.speciesData.physical.size_adult_inches
    this.mesh = createSpringtailMesh(sizeRatio)
    this.mesh.position.copy(this.position)
    this.mesh.rotation.copy(this.rotation)
    this.mesh.userData.creature = this
  }

  update(deltaTime, environment) {
    if (!this.isAlive) return

    super.update(deltaTime, environment)

    // Update animation
    updateSpringtailAnimation(this.mesh, deltaTime, this.isMoving, this.isFleeing)

    // Decay flee timer
    if (this.fleeTimer > 0) {
      this.fleeTimer -= deltaTime / 60 // Convert to seconds
      if (this.fleeTimer <= 0) {
        this.isFleeing = false
        this.detectedPredator = null
      }
    }
  }

  /**
   * Check for nearby predators
   * @param {Array} predators - List of potential predators
   * @returns {Creature|null} - Nearest predator within detection range
   */
  detectPredator(predators) {
    if (!predators || predators.length === 0) return null

    const detectionRange = 4 // inches - springtails have short range
    let nearestPredator = null
    let nearestDist = Infinity

    for (const predator of predators) {
      if (!predator.isAlive) continue

      const dist = this.position.distanceTo(predator.position)
      if (dist < detectionRange && dist < nearestDist) {
        nearestDist = dist
        nearestPredator = predator
      }
    }

    return nearestPredator
  }

  /**
   * Start fleeing from a predator
   * @param {Creature} predator - The predator to flee from
   */
  startFleeing(predator) {
    this.isFleeing = true
    this.detectedPredator = predator
    this.fleeTimer = 2 + Math.random() * 2 // Flee for 2-4 seconds

    // Calculate flee direction (away from predator)
    const fleeDirection = new THREE.Vector3()
      .subVectors(this.position, predator.position)
      .normalize()

    // Add some randomness
    fleeDirection.x += (Math.random() - 0.5) * 0.5
    fleeDirection.z += (Math.random() - 0.5) * 0.5
    fleeDirection.normalize()

    // Set flee target
    const fleeDist = 3 + Math.random() * 3 // 3-6 inches
    this.fleeTarget = new THREE.Vector3()
      .copy(this.position)
      .add(fleeDirection.multiplyScalar(fleeDist))

    // Clamp to bounds
    if (this.terrarium) {
      const bounds = this.terrarium.getBounds()
      this.fleeTarget.x = Math.max(bounds.min.x, Math.min(bounds.max.x, this.fleeTarget.x))
      this.fleeTarget.z = Math.max(bounds.min.z, Math.min(bounds.max.z, this.fleeTarget.z))
      this.fleeTarget.y = bounds.min.y
    }

    this.moveTo(this.fleeTarget)
    this.setBehavior('flee', 3)

    // Perform jump if cooldown allows
    this.performJump()
  }

  /**
   * Perform a furcula jump (escape mechanism)
   */
  performJump() {
    const now = performance.now() / 1000
    if (now - this.lastJumpTime < this.jumpCooldown) return

    this.lastJumpTime = now

    // Jump adds instant displacement
    if (this.fleeTarget) {
      const jumpDist = 0.5 + Math.random() * 0.5 // 0.5-1 inch instant
      const direction = new THREE.Vector3()
        .subVectors(this.fleeTarget, this.position)
        .normalize()
      this.position.add(direction.multiplyScalar(jumpDist))
    }
  }

  /**
   * Override chooseBehavior for springtail-specific logic
   * Priority: flee > eat > wander
   */
  chooseBehavior(environment) {
    // Always check for predators first
    if (this.isFleeing && this.detectedPredator) {
      // Continue fleeing
      if (!this.isMoving) {
        this.startFleeing(this.detectedPredator)
      }
      return
    }

    // Check if hungry and food available
    if (this.needs.hunger < 70) {
      this.startEating(environment)
      return
    }

    // Default: wander
    this.startWandering(environment)
  }

  startEating(environment) {
    this.setBehavior('eat', 1 + Math.random() * 2)

    // Springtails eat substrate/detritus - just stay in place
    if (this.terrarium) {
      const bounds = this.terrarium.getBounds()
      // Move a tiny bit while grazing
      const target = this.getRandomPosition(bounds)
      target.x = this.position.x + (Math.random() - 0.5) * 1
      target.z = this.position.z + (Math.random() - 0.5) * 1
      target.x = Math.max(bounds.min.x, Math.min(bounds.max.x, target.x))
      target.z = Math.max(bounds.min.z, Math.min(bounds.max.z, target.z))
      this.moveTo(target)
    }

    // Eating restores hunger
    this.needs.hunger = Math.min(100, this.needs.hunger + 10)
  }

  startWandering(environment) {
    this.setBehavior('wander', 1 + Math.random() * 2)

    if (this.terrarium) {
      const bounds = this.terrarium.getBounds()
      // Small wander radius
      const target = new THREE.Vector3(
        this.position.x + (Math.random() - 0.5) * 2,
        bounds.min.y,
        this.position.z + (Math.random() - 0.5) * 2
      )
      target.x = Math.max(bounds.min.x, Math.min(bounds.max.x, target.x))
      target.z = Math.max(bounds.min.z, Math.min(bounds.max.z, target.z))
      this.moveTo(target)
    }
  }

  /**
   * Override movement for faster flee speed
   */
  updateMovement(deltaTime) {
    if (!this.targetPosition || !this.isMoving) return

    const direction = new THREE.Vector3()
      .subVectors(this.targetPosition, this.position)

    const distance = direction.length()

    if (distance < 0.02) {
      this.targetPosition = null
      this.isMoving = false
      return
    }

    direction.normalize()

    // Use faster speed when fleeing
    let speed = this.speciesData.behavior.movement_speed_normal
    if (this.isFleeing) {
      speed = this.speciesData.behavior.movement_speed_fast
    }

    const moveDistance = speed * deltaTime * 60
    const actualMove = Math.min(moveDistance, distance)
    this.position.add(direction.multiplyScalar(actualMove))

    if (direction.x !== 0 || direction.z !== 0) {
      this.rotation.y = Math.atan2(direction.x, direction.z)
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      isFleeing: this.isFleeing,
      fleeTimer: this.fleeTimer
    }
  }

  fromJSON(data) {
    super.fromJSON(data)
    this.isFleeing = data.isFleeing || false
    this.fleeTimer = data.fleeTimer || 0
  }
}

export default Springtail
