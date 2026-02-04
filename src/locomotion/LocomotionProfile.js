/**
 * Species-specific locomotion capabilities
 * Derived from species JSON data with physics calculations
 */
export class LocomotionProfile {
  constructor(speciesData) {
    this.speciesData = speciesData
    this.behavior = speciesData.behavior

    // Extract core locomotion data
    this.canClimb = this.behavior.can_climb || false
    this.canJump = this.behavior.can_jump || false
    this.canSwim = this.behavior.can_swim || false
    this.canBurrow = this.behavior.can_burrow || false
    this.canFly = this.behavior.can_fly || false

    // Movement speeds (inches per second)
    this.speedSlow = this.behavior.movement_speed_slow || 0.05
    this.speedNormal = this.behavior.movement_speed_normal || 0.15
    this.speedFast = this.behavior.movement_speed_fast || 0.5

    // Jump capabilities
    this.jumpHeight = this.behavior.jump_height_inches || 0
    this.jumpDistance = this.behavior.jump_distance_inches || 0

    // Physical properties
    this.bodyWeight = speciesData.physical.weight_grams || this.estimateWeight(speciesData)
    this.bodyLength = speciesData.physical.size_adult_inches || 1
    this.legCount = speciesData.category_specific?.legs || 4

    // Calculate derived locomotion stats
    this.calculateGripStats()
    this.calculateClimbingStats()
    this.calculateMovementStats()
  }

  /**
   * Estimate weight from size if not provided
   */
  estimateWeight(speciesData) {
    const size = speciesData.physical.size_adult_inches
    const category = speciesData.identity.category

    // Rough density estimates by category (grams per cubic inch)
    const densities = {
      invertebrate: 0.5,
      amphibian: 1.0,
      reptile: 0.8,
      bird: 0.3,
      mammal: 0.9
    }

    const density = densities[category] || 0.8
    // Assume roughly spherical body
    const volume = (4 / 3) * Math.PI * Math.pow(size / 2, 3)
    return volume * density
  }

  /**
   * Calculate grip strength based on species characteristics
   */
  calculateGripStats() {
    // Base grip from leg count and type
    let baseGrip = 0.3

    if (this.legCount >= 6) baseGrip = 0.7      // Insects have excellent grip
    if (this.legCount >= 8) baseGrip = 0.8      // Spiders/scorpions
    if (this.legCount >= 14) baseGrip = 0.9     // Isopods, millipedes

    // Amphibians have toe pads
    if (this.speciesData.identity.category === 'amphibian') {
      const subcategory = this.speciesData.identity.subcategory
      if (subcategory === 'dart_frog' || subcategory === 'tree_frog') {
        baseGrip = 0.85  // Toe pads!
      }
    }

    // Geckos have the best grip
    if (this.speciesData.identity.subcategory === 'gecko') {
      baseGrip = 0.95  // Setae!
    }

    // Weight reduces effective grip (heavier = harder to hold on)
    // Formula: effective_grip = base_grip * (1 - weight_penalty)
    // Weight penalty maxes out at 0.5 for very heavy creatures
    const weightPenalty = Math.min(0.5, this.bodyWeight / 500)

    this.gripStrength = baseGrip * (1 - weightPenalty)

    // Surface-specific grip multipliers
    this.surfaceGripMultipliers = {
      ground: 1.0,
      rock: 0.9,
      wood: 0.95,
      plant: 0.7,          // Leaves can bend/break
      glass: this.canClimbGlass() ? 0.6 : 0.1,
      moss: 1.1,           // Moss provides extra grip
      water: 0.0
    }
  }

  /**
   * Can this species climb glass?
   */
  canClimbGlass() {
    if (!this.canClimb) return false

    const climbSurfaces = this.behavior.climb_surfaces || []
    return climbSurfaces.includes('glass')
  }

  /**
   * Calculate maximum climbable angle for different surfaces
   */
  calculateClimbingStats() {
    if (!this.canClimb) {
      this.maxClimbAngle = { ground: 30, rock: 25, wood: 20, plant: 15, glass: 0, moss: 35 }
      return
    }

    // Base max angle from grip strength (grip 1.0 = 90deg, grip 0.5 = 45deg)
    const baseMaxAngle = this.gripStrength * 90

    this.maxClimbAngle = {}
    for (const [surface, multiplier] of Object.entries(this.surfaceGripMultipliers)) {
      const effectiveGrip = this.gripStrength * multiplier
      // Max angle scales with grip, but even max grip can't exceed 90deg
      this.maxClimbAngle[surface] = Math.min(90, effectiveGrip * 100)
    }

    // Special cases
    // Geckos can climb anything including glass
    if (this.speciesData.identity.subcategory === 'gecko') {
      this.maxClimbAngle.glass = 90
    }

    // Tree frogs can climb glass with toe pads
    if (this.speciesData.identity.subcategory === 'tree_frog') {
      this.maxClimbAngle.glass = 85
    }

    // Dart frogs can climb but not vertical glass
    if (this.speciesData.identity.subcategory === 'dart_frog') {
      this.maxClimbAngle.glass = 45
    }
  }

  /**
   * Calculate movement efficiency on different terrain
   */
  calculateMovementStats() {
    // Energy cost multipliers (1.0 = normal, 2.0 = costs twice as much energy)
    this.energyCostMultipliers = {
      flat: 1.0,
      slope_mild: 1.3,      // < 30deg
      slope_steep: 1.8,     // 30-60deg
      vertical: 3.0,        // 60-90deg
      overhang: 5.0         // > 90deg (upside down)
    }

    // Speed penalties on different angles
    // Species with better climbing ability have smaller penalties
    const climbingSkill = this.canClimb ? this.gripStrength : 0.3

    this.speedMultipliers = {
      flat: 1.0,
      slope_mild: 0.8 + (climbingSkill * 0.2),
      slope_steep: 0.5 + (climbingSkill * 0.3),
      vertical: 0.2 + (climbingSkill * 0.4),
      overhang: 0.1 + (climbingSkill * 0.2)
    }

    // Preferred zones (affects behavior decisions)
    this.preferredZones = this.behavior.zone_usage || { ground: 100 }
    this.preferredZone = this.behavior.preferred_zone || 'ground'
  }

  /**
   * Check if this creature can traverse a specific surface at a specific angle
   * @param {string} surfaceType - Type of surface
   * @param {number} angle - Angle in degrees (0 = flat, 90 = vertical)
   * @returns {Object} - { canTraverse, speedMultiplier, energyCost, reason }
   */
  canTraverseSurface(surfaceType, angle) {
    const maxAngle = this.maxClimbAngle[surfaceType] || 30

    if (angle > maxAngle) {
      return {
        canTraverse: false,
        speedMultiplier: 0,
        energyCost: Infinity,
        reason: `${surfaceType} at ${angle.toFixed(1)}deg exceeds max climb angle of ${maxAngle.toFixed(1)}deg`
      }
    }

    // Determine slope category
    let slopeCategory = 'flat'
    if (angle > 15) slopeCategory = 'slope_mild'
    if (angle > 45) slopeCategory = 'slope_steep'
    if (angle > 75) slopeCategory = 'vertical'
    if (angle > 95) slopeCategory = 'overhang'

    const speedMult = this.speedMultipliers[slopeCategory]
    const energyCost = this.energyCostMultipliers[slopeCategory]

    // Additional surface-specific penalty
    const surfaceFriction = this.surfaceGripMultipliers[surfaceType] || 0.8
    const adjustedSpeed = speedMult * surfaceFriction

    return {
      canTraverse: true,
      speedMultiplier: adjustedSpeed,
      energyCost: energyCost,
      reason: null
    }
  }

  /**
   * Evaluate if creature WANTS to use a path (behavioral preference)
   * Even if physically possible, creature might prefer alternatives
   * @param {Object} pathAnalysis - From SurfaceAnalyzer
   * @returns {Object} - { willUse, preference, alternativePreferred }
   */
  evaluatePathPreference(pathAnalysis) {
    // Base willingness from zone preference
    const hasPreferredZone = this.zoneMatchesPreference(pathAnalysis)

    // Difficulty threshold based on species
    // Timid creatures avoid difficult paths
    const boldnessRange = this.speciesData.personality_ranges
    const avgBoldness = (boldnessRange.boldness_min + boldnessRange.boldness_max) / 2
    const difficultyThreshold = 0.3 + (avgBoldness * 0.5)  // Bold creatures accept harder paths

    if (pathAnalysis.difficulty > difficultyThreshold) {
      return {
        willUse: false,
        preference: 0,
        alternativePreferred: true,
        reason: 'Path too difficult for this species'
      }
    }

    // Calculate preference score (0-1)
    let preference = 1.0

    // Penalty for non-preferred zones
    if (!hasPreferredZone) preference *= 0.5

    // Penalty for high elevation change (unless arboreal)
    if (!this.behavior.arboreal && pathAnalysis.elevationChange > 2) {
      preference *= 0.7
    }

    // Bonus for preferred surfaces
    // Ground creatures prefer... ground
    if (this.preferredZone === 'ground' && pathAnalysis.surfaceTypes.includes('ground')) {
      preference *= 1.2
    }

    preference = Math.min(1, preference)

    return {
      willUse: preference > 0.3,
      preference: preference,
      alternativePreferred: preference < 0.5,
      reason: null
    }
  }

  zoneMatchesPreference(pathAnalysis) {
    const avgElevation = pathAnalysis.elevationChange / 2

    // Map elevation to zone
    let pathZone = 'ground'
    if (avgElevation > 1) pathZone = 'low'
    if (avgElevation > 3) pathZone = 'mid'
    if (avgElevation > 6) pathZone = 'high'

    // Check if path zone matches any preferred zones
    const zoneUsage = this.preferredZones
    return (zoneUsage[pathZone] || 0) > 20  // At least 20% preference
  }
}

export default LocomotionProfile
