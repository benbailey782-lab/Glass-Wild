import * as THREE from 'three'
import { Creature } from './Creature.js'
import { updateDartFrogAnimation } from './models/DartFrogModel.js'
import { modelLoader } from './models/ModelLoader.js'

/**
 * Dart Frog class - predator that hunts springtails
 * Behaviors: idle, wander, hunt, stalk, strike, eat, hide
 */
export class DartFrog extends Creature {
  constructor(speciesData, position, personality = null) {
    super(speciesData, position, personality)

    // Hunting state
    this.isHunting = false
    this.currentPrey = null
    this.huntingState = 'searching' // searching, stalking, striking
    this.stalkTimer = 0
    this.strikeTimer = 0
    this.lastStrikeTime = 0
    this.strikeCooldown = 0.3 // seconds

    // Animation state
    this.isCalling = false
    this.callTimer = 0

    // Model loading state
    this.modelLoaded = false

    // Create placeholder mesh immediately, then load GLB async
    this.createPlaceholderMesh()
    this.loadGLBModel()
  }

  createPlaceholderMesh() {
    // Simple green sphere as placeholder while GLB loads
    const geo = new THREE.SphereGeometry(0.3, 8, 6)
    geo.scale(1, 0.6, 1.3)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27, roughness: 0.7, metalness: 0.1
    })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.position.copy(this.position)
    this.mesh.rotation.copy(this.rotation)
    this.mesh.userData.creature = this

    // Scale placeholder to approximate frog size
    this.meshScaleMultiplier = 3.5
    this.mesh.scale.setScalar(this.meshScaleMultiplier)
  }

  async loadGLBModel() {
    try {
      const model = await modelLoader.load(
        'dendrobates_auratus',
        '/models/creatures/Meshy_AI_Poison_Dart_Frog_Maje_0205052732_texture.glb'
      )

      if (!this.isAlive) return // Creature died while loading

      // Remember parent so we can re-attach
      const parent = this.mesh?.parent

      // Dispose placeholder
      if (this.mesh) {
        if (this.mesh.parent) this.mesh.parent.remove(this.mesh)
        if (this.mesh.geometry) this.mesh.geometry.dispose()
        if (this.mesh.material) this.mesh.material.dispose()
      }

      // Use the GLB model
      this.mesh = model
      this.mesh.position.copy(this.position)
      this.mesh.rotation.copy(this.rotation)
      this.mesh.userData.creature = this

      // SCALE CALCULATION:
      // The GLB bounding box is 2.0 units long (Z axis).
      // A real D. auratus is ~1.5 inches.
      // In our game, 1 unit = 1 inch.
      // So we need the model to be ~1.5 units long.
      // Scale factor = 1.5 / 2.0 = 0.75
      // Then apply the visibility multiplier (3.5) on top.
      const glbLength = 2.0 // Z-axis extent from Meshy
      const targetInches = this.speciesData.physical.size_adult_inches // 1.5
      const baseScale = targetInches / glbLength
      this.meshScaleMultiplier = 3.5
      this.mesh.scale.setScalar(baseScale * this.meshScaleMultiplier)

      // Re-attach to scene
      if (parent) {
        parent.add(this.mesh)
      }

      this.modelLoaded = true
      console.log('Dart frog GLB model loaded successfully')

    } catch (error) {
      console.warn('Failed to load dart frog GLB, keeping placeholder:', error)
      // Placeholder stays — game still works
    }
  }

  /**
   * Override ageBy to apply custom scale multiplier
   */
  ageBy(days) {
    super.ageBy(days)

    // Re-apply scale with multiplier after base class sets scale
    if (this.mesh && this.meshScaleMultiplier) {
      const baseScale = this.modelLoaded
        ? (this.size / this.speciesData.physical.size_adult_inches) * (this.speciesData.physical.size_adult_inches / 2.0)
        : this.size / this.speciesData.physical.size_adult_inches
      this.mesh.scale.setScalar(baseScale * this.meshScaleMultiplier)
    }
  }

  update(deltaTime, environment) {
    if (!this.isAlive) return

    super.update(deltaTime, environment)

    // Update animation
    updateDartFrogAnimation(this.mesh, deltaTime, this.isMoving, this.isHunting, this.isCalling)

    // Update call timer
    if (this.callTimer > 0) {
      this.callTimer -= deltaTime / 60
      if (this.callTimer <= 0) {
        this.isCalling = false
      }
    }
  }

  /**
   * Find prey within detection range
   * @param {Array} preyCreatures - List of potential prey
   * @returns {Creature|null} - Best prey target
   */
  findPrey(preyCreatures) {
    if (!preyCreatures || preyCreatures.length === 0) return null

    const detectionRange = this.speciesData.diet.prey_detection_range_inches
    let bestPrey = null
    let bestScore = -Infinity

    for (const prey of preyCreatures) {
      if (!prey.isAlive) continue
      if (prey.isFleeing) continue // Harder to catch fleeing prey

      const dist = this.position.distanceTo(prey.position)
      if (dist > detectionRange) continue

      // Score based on distance (closer = better) and if prey is moving
      let score = detectionRange - dist
      if (prey.isMoving) score += 2 // Moving prey is more visible

      if (score > bestScore) {
        bestScore = score
        bestPrey = prey
      }
    }

    return bestPrey
  }

  /**
   * Start hunting behavior
   * @param {Creature} prey - The prey to hunt
   */
  startHunting(prey) {
    this.isHunting = true
    this.currentPrey = prey
    this.huntingState = 'stalking'
    this.stalkTimer = 0
    this.setBehavior('hunt', 10)

    // Face the prey
    this.lookAt(prey.position)
  }

  /**
   * Update hunting behavior
   */
  updateHunting(deltaTime) {
    if (!this.currentPrey || !this.currentPrey.isAlive) {
      this.stopHunting()
      return
    }

    const dist = this.position.distanceTo(this.currentPrey.position)
    const strikeRange = this.speciesData.diet.strike_distance_inches
    const stalkRange = this.speciesData.diet.stalking_distance_inches

    switch (this.huntingState) {
      case 'stalking':
        // Move slowly toward prey
        if (dist > strikeRange) {
          // Stalk closer (XZ plane only)
          const direction = new THREE.Vector3()
            .subVectors(this.currentPrey.position, this.position)
          direction.y = 0 // Ignore vertical difference
          direction.normalize()

          // Move at slow speed
          const stalkSpeed = this.speciesData.behavior.movement_speed_slow
          const moveAmount = stalkSpeed * deltaTime * 30 // Slow movement

          this.position.x += direction.x * moveAmount
          this.position.z += direction.z * moveAmount

          // Update Y position to match terrain
          this.updateTerrainHeight()

          this.lookAt(this.currentPrey.position)

          // Update stalk timer - don't stalk forever
          this.stalkTimer += deltaTime / 60
          if (this.stalkTimer > 5) {
            // Give up if stalking too long
            this.stopHunting()
          }
        } else {
          // In strike range!
          this.huntingState = 'striking'
          this.strikeTimer = 0.1 // Brief pause before strike
        }
        break

      case 'striking':
        this.strikeTimer -= deltaTime / 60
        if (this.strikeTimer <= 0) {
          this.performStrike()
        }
        break
    }
  }

  /**
   * Perform strike attack on prey
   */
  performStrike() {
    if (!this.currentPrey || !this.currentPrey.isAlive) {
      this.stopHunting()
      return
    }

    const dist = this.position.distanceTo(this.currentPrey.position)
    const strikeRange = this.speciesData.diet.strike_distance_inches

    // Check if still in range
    if (dist > strikeRange * 1.5) {
      // Prey escaped, go back to stalking
      this.huntingState = 'stalking'
      return
    }

    // Calculate success chance
    const baseSuccess = this.speciesData.diet.hunting_success_rate
    let successChance = baseSuccess

    // Modify by distance
    successChance *= (strikeRange / Math.max(dist, 0.1))

    // Fleeing prey is harder to catch
    if (this.currentPrey.isFleeing) {
      successChance *= 0.5
    }

    // Cap at 95%
    successChance = Math.min(0.95, successChance)

    // Roll for success
    if (Math.random() < successChance) {
      // SUCCESS - Kill and eat prey
      this.killPrey(this.currentPrey)
    } else {
      // MISS - Prey might flee
      if (this.currentPrey.startFleeing) {
        this.currentPrey.startFleeing(this)
      }
      // Brief cooldown before next attempt
      this.huntingState = 'stalking'
      this.stalkTimer = 0
    }

    this.lastStrikeTime = performance.now() / 1000
  }

  /**
   * Kill prey and gain hunger satisfaction
   */
  killPrey(prey) {
    // Kill the prey
    prey.die('predation')

    // Restore hunger based on prey size
    const foodValue = 15 + Math.random() * 10 // 15-25 per springtail
    this.eat(foodValue)

    // Emit event
    this.emit('killedPrey', {
      predator: this,
      prey: prey,
      foodValue: foodValue
    })

    console.log(`${this.speciesData.identity.common_name} caught a ${prey.speciesData.identity.common_name}!`)

    this.stopHunting()
  }

  /**
   * Stop hunting
   */
  stopHunting() {
    this.isHunting = false
    this.currentPrey = null
    this.huntingState = 'searching'
    this.stalkTimer = 0
  }

  /**
   * Look at a position
   */
  lookAt(targetPos) {
    const direction = new THREE.Vector3()
      .subVectors(targetPos, this.position)
    if (direction.x !== 0 || direction.z !== 0) {
      this.rotation.y = Math.atan2(direction.x, direction.z)
    }
  }

  /**
   * Choose behavior - hunting takes priority when hungry
   */
  chooseBehavior(environment) {
    // Already hunting?
    if (this.isHunting && this.currentPrey && this.currentPrey.isAlive) {
      return // Continue hunting
    }

    // Hide during night (diurnal species)
    if (!environment.isDay) {
      this.startHiding(environment)
      return
    }

    // Hide if stressed
    if (this.needs.stress > this.speciesData.stress.stress_threshold_high) {
      this.startHiding(environment)
      return
    }

    // Hunt if hungry (handled by CreatureManager calling hunt method)
    // If not actively hunting, wander
    if (Math.random() < this.personality.activity) {
      this.startWandering(environment)
    } else {
      this.startIdling()
    }
  }

  startHiding(environment) {
    this.isHiding = true
    this.setBehavior('hide', 5 + Math.random() * 10)

    if (this.terrarium) {
      const hidingSpots = this.terrarium.getHidingSpots()
      if (hidingSpots && hidingSpots.length > 0) {
        const nearest = this.findNearest(hidingSpots)
        if (nearest) {
          this.moveTo(nearest)
        }
      }
    }
  }

  startWandering(environment) {
    this.isHiding = false
    this.setBehavior('wander', 3 + Math.random() * 5)

    if (this.terrarium) {
      const bounds = this.terrarium.getBounds()
      const target = this.getRandomPosition(bounds)
      this.moveTo(target)
    }
  }

  startIdling() {
    this.setBehavior('idle', 2 + Math.random() * 4)
    this.stopMoving()

    // Might call while idle
    if (Math.random() < 0.1) {
      this.startCalling()
    }
  }

  startCalling() {
    this.isCalling = true
    this.callTimer = 1 + Math.random() * 2 // Call for 1-3 seconds
    this.emit('calling', { creature: this })
  }

  /**
   * Override updateBehavior
   */
  updateBehavior(deltaTime, environment) {
    this.behaviorTimer += deltaTime

    // Handle hunting separately
    if (this.isHunting) {
      this.updateHunting(deltaTime)
      return
    }

    // Check if current behavior should end
    if (this.behaviorTimer >= this.behaviorDuration) {
      this.chooseBehavior(environment)
    }
  }

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

  toJSON() {
    return {
      ...super.toJSON(),
      isHunting: this.isHunting,
      huntingState: this.huntingState
    }
  }

  fromJSON(data) {
    super.fromJSON(data)
    this.isHunting = data.isHunting || false
    this.huntingState = data.huntingState || 'searching'
  }
}

export default DartFrog
