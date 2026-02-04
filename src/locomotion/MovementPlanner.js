import * as THREE from 'three'

/**
 * Plans creature movement considering terrain, physics, and preferences
 */
export class MovementPlanner {
  constructor(surfaceAnalyzer) {
    this.surfaceAnalyzer = surfaceAnalyzer
  }

  /**
   * Plan movement from current position to target
   * @param {Creature} creature - The creature moving
   * @param {THREE.Vector3} target - Desired destination
   * @param {LocomotionProfile} profile - Creature's locomotion profile
   * @returns {MovementPlan} - Detailed movement plan
   */
  planMovement(creature, target, profile) {
    const start = creature.position.clone()
    const directPath = this.surfaceAnalyzer.analyzePathway(start, target, 20)

    // Check if direct path is traversable
    const directTraversability = this.evaluatePathTraversability(directPath, profile)

    if (directTraversability.canTraverse) {
      const preference = profile.evaluatePathPreference(directPath)

      if (preference.willUse) {
        return this.createDirectPlan(start, target, directPath, profile)
      }
    }

    // Direct path not viable or not preferred - find alternatives
    return this.findAlternativePath(creature, target, profile, directPath)
  }

  /**
   * Evaluate if a path is physically traversable
   */
  evaluatePathTraversability(pathAnalysis, profile) {
    let canTraverse = true
    let blockingPoints = []
    let worstSection = null
    let worstDifficulty = 0

    for (const sample of pathAnalysis.samples) {
      const traverseCheck = profile.canTraverseSurface(sample.surfaceType, sample.angle)

      if (!traverseCheck.canTraverse) {
        canTraverse = false
        blockingPoints.push({
          position: sample.position,
          reason: traverseCheck.reason
        })
      }

      if (sample.angle > worstDifficulty) {
        worstDifficulty = sample.angle
        worstSection = sample
      }
    }

    return {
      canTraverse,
      blockingPoints,
      worstSection,
      worstDifficulty
    }
  }

  /**
   * Create a simple direct movement plan
   */
  createDirectPlan(start, target, pathAnalysis, profile) {
    const segments = []
    let currentPos = start.clone()

    for (let i = 1; i < pathAnalysis.samples.length; i++) {
      const sample = pathAnalysis.samples[i]

      const traverseInfo = profile.canTraverseSurface(sample.surfaceType, sample.angle)

      segments.push({
        from: currentPos.clone(),
        to: sample.position.clone(),
        surfaceType: sample.surfaceType,
        angle: sample.angle,
        speedMultiplier: traverseInfo.speedMultiplier,
        energyCost: traverseInfo.energyCost,
        movementType: this.determineMovementType(sample.angle, profile)
      })

      currentPos = sample.position.clone()
    }

    return {
      type: 'direct',
      segments: segments,
      totalDistance: pathAnalysis.distance,
      estimatedTime: this.estimateTravelTime(segments, profile),
      totalEnergyCost: this.calculateTotalEnergy(segments),
      requiresClimbing: pathAnalysis.maxAngle > 45,
      requiresJumping: false
    }
  }

  /**
   * Find alternative path when direct is blocked or undesirable
   */
  findAlternativePath(creature, target, profile, directPath) {
    const start = creature.position.clone()

    // Try several alternative strategies
    const alternatives = []

    // Strategy 1: Go around obstacles on the ground
    const groundPath = this.planGroundRoute(start, target, profile)
    if (groundPath) alternatives.push({ path: groundPath, strategy: 'ground_route' })

    // Strategy 2: Jump over obstacles (if capable)
    if (profile.canJump && profile.jumpDistance > 0) {
      const jumpPath = this.planJumpRoute(start, target, profile, directPath)
      if (jumpPath) alternatives.push({ path: jumpPath, strategy: 'jump_route' })
    }

    // Strategy 3: Climb over obstacles (if capable)
    if (profile.canClimb) {
      const climbPath = this.planClimbRoute(start, target, profile, directPath)
      if (climbPath) alternatives.push({ path: climbPath, strategy: 'climb_route' })
    }

    // Strategy 4: Give up and choose new target
    if (alternatives.length === 0) {
      return {
        type: 'blocked',
        segments: [],
        reason: 'No viable path found',
        suggestNewTarget: true
      }
    }

    // Choose best alternative based on energy cost and preference
    alternatives.sort((a, b) => {
      const aCost = a.path.totalEnergyCost
      const bCost = b.path.totalEnergyCost
      return aCost - bCost
    })

    return alternatives[0].path
  }

  /**
   * Plan a route that stays on the ground level
   */
  planGroundRoute(start, target, profile) {
    // A* or similar pathfinding on ground plane
    // Simplified version: try waypoints around obstacles

    const waypoints = this.findGroundWaypoints(start, target, profile)
    if (!waypoints) return null

    const segments = []
    let currentPos = start.clone()

    for (const waypoint of waypoints) {
      const pathToWaypoint = this.surfaceAnalyzer.analyzePathway(currentPos, waypoint, 10)
      const traversability = this.evaluatePathTraversability(pathToWaypoint, profile)

      if (!traversability.canTraverse) {
        return null  // Failed to find ground route
      }

      segments.push({
        from: currentPos.clone(),
        to: waypoint.clone(),
        surfaceType: 'ground',
        angle: pathToWaypoint.maxAngle,
        speedMultiplier: profile.speedMultipliers.flat,
        energyCost: 1.0,
        movementType: 'walk'
      })

      currentPos = waypoint.clone()
    }

    return {
      type: 'ground_route',
      segments: segments,
      totalDistance: this.calculateTotalDistance(segments),
      estimatedTime: this.estimateTravelTime(segments, profile),
      totalEnergyCost: this.calculateTotalEnergy(segments),
      requiresClimbing: false,
      requiresJumping: false
    }
  }

  /**
   * Plan a route that includes jumping
   */
  planJumpRoute(start, target, profile, directPath) {
    // Find where the obstacle is
    const blockingPoints = directPath.samples.filter(s => s.angle > 45)
    if (blockingPoints.length === 0) return null

    // Check if we can jump over the obstacle
    const obstacleStart = blockingPoints[0].position
    const obstacleEnd = blockingPoints[blockingPoints.length - 1].position
    const jumpDistance = obstacleStart.distanceTo(obstacleEnd)

    if (jumpDistance > profile.jumpDistance) {
      return null  // Can't jump far enough
    }

    // Check jump clearance (height needed)
    const maxObstacleHeight = Math.max(...blockingPoints.map(s => s.position.y))
    const jumpApex = start.y + profile.jumpHeight

    if (jumpApex < maxObstacleHeight + 0.5) {
      return null  // Can't jump high enough
    }

    // Create jump plan
    const segments = []

    // Walk to jump point
    segments.push({
      from: start.clone(),
      to: obstacleStart.clone(),
      surfaceType: 'ground',
      angle: 0,
      speedMultiplier: 1.0,
      energyCost: 1.0,
      movementType: 'walk'
    })

    // The jump
    segments.push({
      from: obstacleStart.clone(),
      to: obstacleEnd.clone(),
      surfaceType: 'air',
      angle: 0,
      speedMultiplier: 2.0,  // Jumps are fast
      energyCost: 3.0,        // But costly
      movementType: 'jump'
    })

    // Walk to target
    segments.push({
      from: obstacleEnd.clone(),
      to: target.clone(),
      surfaceType: 'ground',
      angle: 0,
      speedMultiplier: 1.0,
      energyCost: 1.0,
      movementType: 'walk'
    })

    return {
      type: 'jump_route',
      segments: segments,
      totalDistance: this.calculateTotalDistance(segments),
      estimatedTime: this.estimateTravelTime(segments, profile),
      totalEnergyCost: this.calculateTotalEnergy(segments),
      requiresClimbing: false,
      requiresJumping: true
    }
  }

  /**
   * Plan a route that climbs over obstacles
   */
  planClimbRoute(start, target, profile, directPath) {
    // Find best climbing surface near the obstacle
    const blockingPoints = directPath.samples.filter(s => !profile.canTraverseSurface(s.surfaceType, s.angle).canTraverse)

    if (blockingPoints.length === 0) return null

    // Look for climbable surfaces nearby
    // This is a simplified version - full implementation would use spatial queries

    const climbStartPos = blockingPoints[0].position.clone()
    const climbEndPos = blockingPoints[blockingPoints.length - 1].position.clone()

    // Check if climbing is viable
    const climbHeight = Math.max(...blockingPoints.map(s => s.position.y)) - start.y

    // Most creatures tire after climbing more than 5x their body length
    const maxClimbHeight = profile.bodyLength * 5
    if (climbHeight > maxClimbHeight) {
      return null  // Too high to climb
    }

    const segments = []

    // Walk to climb start
    segments.push({
      from: start.clone(),
      to: climbStartPos.clone(),
      surfaceType: 'ground',
      angle: 0,
      speedMultiplier: 1.0,
      energyCost: 1.0,
      movementType: 'walk'
    })

    // Climb up
    const climbApex = new THREE.Vector3(
      climbStartPos.x,
      Math.max(...blockingPoints.map(s => s.position.y)) + 0.5,
      climbStartPos.z
    )

    segments.push({
      from: climbStartPos.clone(),
      to: climbApex.clone(),
      surfaceType: 'rock',  // Assume climbing on rock-like surface
      angle: 80,
      speedMultiplier: profile.speedMultipliers.vertical,
      energyCost: profile.energyCostMultipliers.vertical,
      movementType: 'climb'
    })

    // Traverse top
    segments.push({
      from: climbApex.clone(),
      to: new THREE.Vector3(climbEndPos.x, climbApex.y, climbEndPos.z),
      surfaceType: 'rock',
      angle: 10,
      speedMultiplier: 0.8,
      energyCost: 1.2,
      movementType: 'walk'
    })

    // Climb down
    segments.push({
      from: new THREE.Vector3(climbEndPos.x, climbApex.y, climbEndPos.z),
      to: climbEndPos.clone(),
      surfaceType: 'rock',
      angle: 80,
      speedMultiplier: profile.speedMultipliers.vertical * 1.2,  // Downhill slightly faster
      energyCost: profile.energyCostMultipliers.vertical * 0.7, // But less energy
      movementType: 'climb'
    })

    // Walk to target
    segments.push({
      from: climbEndPos.clone(),
      to: target.clone(),
      surfaceType: 'ground',
      angle: 0,
      speedMultiplier: 1.0,
      energyCost: 1.0,
      movementType: 'walk'
    })

    return {
      type: 'climb_route',
      segments: segments,
      totalDistance: this.calculateTotalDistance(segments),
      estimatedTime: this.estimateTravelTime(segments, profile),
      totalEnergyCost: this.calculateTotalEnergy(segments),
      requiresClimbing: true,
      requiresJumping: false
    }
  }

  determineMovementType(angle, profile) {
    if (angle < 15) return 'walk'
    if (angle < 45) return 'scramble'
    if (angle < 80) return 'climb'
    return 'vertical_climb'
  }

  estimateTravelTime(segments, profile) {
    let totalTime = 0
    const baseSpeed = profile.speedNormal

    for (const seg of segments) {
      const distance = seg.from.distanceTo(seg.to)
      const effectiveSpeed = baseSpeed * seg.speedMultiplier
      totalTime += distance / effectiveSpeed
    }

    return totalTime
  }

  calculateTotalDistance(segments) {
    return segments.reduce((sum, seg) => sum + seg.from.distanceTo(seg.to), 0)
  }

  calculateTotalEnergy(segments) {
    return segments.reduce((sum, seg) => {
      const distance = seg.from.distanceTo(seg.to)
      return sum + distance * seg.energyCost
    }, 0)
  }

  findGroundWaypoints(start, target, profile) {
    // Simple implementation: try orthogonal routes
    // A full implementation would use proper pathfinding

    const waypoints = []
    const midX = (start.x + target.x) / 2
    const midZ = (start.z + target.z) / 2

    // Try going around via X first, then Z
    const route1 = [
      new THREE.Vector3(midX, start.y, start.z),
      new THREE.Vector3(target.x, start.y, start.z),
      target.clone()
    ]

    // In a full implementation, you'd properly pathfind
    return route1
  }
}

export default MovementPlanner
