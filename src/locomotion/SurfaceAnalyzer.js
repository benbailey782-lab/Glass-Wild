import * as THREE from 'three'

/**
 * Analyzes terrain surfaces for locomotion calculations
 * Extracts angle, normal, material type, and navigability
 */
export class SurfaceAnalyzer {
  constructor(terrarium) {
    this.terrarium = terrarium
    this.raycaster = new THREE.Raycaster()

    // Surface type classifications
    this.SURFACE_TYPES = {
      GROUND: 'ground',           // Flat substrate, leaf litter
      ROCK: 'rock',               // Stone surfaces
      WOOD: 'wood',               // Branches, bark
      PLANT: 'plant',             // Leaves, stems
      GLASS: 'glass',             // Terrarium walls
      MOSS: 'moss',               // Moss patches
      WATER: 'water'              // Water surfaces
    }

    // Material friction coefficients (0-1, higher = more grip)
    this.FRICTION_COEFFICIENTS = {
      ground: 0.8,
      rock: 0.6,
      wood: 0.75,
      plant: 0.5,        // Leaves can be slippery
      glass: 0.15,       // Very hard to grip
      moss: 0.9,         // Excellent grip
      water: 0.0         // No grip
    }

    // Surface mesh cache for raycasting
    this.surfaceCache = new Map()
    this.buildSurfaceCache()
  }

  /**
   * Build cache of walkable surfaces with their types
   */
  buildSurfaceCache() {
    this.surfaceCache.clear()

    this.terrarium.contentsGroup.traverse(obj => {
      if (obj.isMesh) {
        // Determine surface type from material color or name
        const surfaceType = this.classifySurface(obj)
        this.surfaceCache.set(obj.uuid, {
          mesh: obj,
          type: surfaceType,
          friction: this.FRICTION_COEFFICIENTS[surfaceType]
        })
      }
    })

    // Add glass walls
    this.terrarium.wallMeshes.forEach(wall => {
      this.surfaceCache.set(wall.uuid, {
        mesh: wall,
        type: this.SURFACE_TYPES.GLASS,
        friction: this.FRICTION_COEFFICIENTS.glass
      })
    })
  }

  /**
   * Classify a mesh as a surface type based on its properties
   */
  classifySurface(mesh) {
    const name = mesh.name?.toLowerCase() || ''
    const material = mesh.material

    // Check by name first
    if (name.includes('rock') || name.includes('stone')) return this.SURFACE_TYPES.ROCK
    if (name.includes('wood') || name.includes('branch') || name.includes('bark')) return this.SURFACE_TYPES.WOOD
    if (name.includes('fern') || name.includes('plant') || name.includes('leaf')) return this.SURFACE_TYPES.PLANT
    if (name.includes('moss')) return this.SURFACE_TYPES.MOSS
    if (name.includes('glass')) return this.SURFACE_TYPES.GLASS

    // Check by material color
    if (material && material.color) {
      const hsl = {}
      material.color.getHSL(hsl)

      // Green-ish = plant or moss
      if (hsl.h > 0.2 && hsl.h < 0.45 && hsl.s > 0.3) {
        return hsl.l > 0.3 ? this.SURFACE_TYPES.PLANT : this.SURFACE_TYPES.MOSS
      }

      // Brown = wood or ground
      if (hsl.h > 0.05 && hsl.h < 0.15) {
        return hsl.l > 0.25 ? this.SURFACE_TYPES.WOOD : this.SURFACE_TYPES.GROUND
      }

      // Gray = rock
      if (hsl.s < 0.15) {
        return this.SURFACE_TYPES.ROCK
      }
    }

    return this.SURFACE_TYPES.GROUND
  }

  /**
   * Analyze surface at a specific world position
   * @param {THREE.Vector3} position - World position to analyze
   * @param {THREE.Vector3} direction - Direction of movement (optional)
   * @returns {SurfaceData} - Complete surface analysis
   */
  analyzeSurfaceAt(position, direction = null) {
    // Cast ray downward to find surface
    const origin = new THREE.Vector3(position.x, position.y + 10, position.z)
    this.raycaster.set(origin, new THREE.Vector3(0, -1, 0))

    const surfaces = Array.from(this.surfaceCache.values()).map(s => s.mesh)
    const intersects = this.raycaster.intersectObjects(surfaces, false)

    if (intersects.length === 0) {
      return this.createDefaultSurfaceData(position)
    }

    const hit = intersects[0]
    const surfaceInfo = this.surfaceCache.get(hit.object.uuid)

    // Calculate surface angle from normal
    const normal = hit.face.normal.clone()
    normal.transformDirection(hit.object.matrixWorld)

    const upVector = new THREE.Vector3(0, 1, 0)
    const angle = Math.acos(normal.dot(upVector)) * (180 / Math.PI)

    // Calculate slope direction (which way is "down" on this surface)
    const slopeDirection = new THREE.Vector3()
    slopeDirection.crossVectors(normal, upVector)
    slopeDirection.crossVectors(slopeDirection, normal)
    slopeDirection.normalize()

    return {
      position: hit.point.clone(),
      normal: normal,
      angle: angle,                           // 0 = flat, 90 = vertical
      slopeDirection: slopeDirection,
      surfaceType: surfaceInfo?.type || this.SURFACE_TYPES.GROUND,
      friction: surfaceInfo?.friction || 0.8,
      isClimbable: angle < 90,               // Even vertical can be climbable
      isWalkable: angle < 45,                // Standard walking limit
      mesh: hit.object
    }
  }

  /**
   * Analyze the path between two points for traversability
   * @param {THREE.Vector3} start - Start position
   * @param {THREE.Vector3} end - End position
   * @param {number} sampleCount - Number of samples along path
   * @returns {PathAnalysis} - Analysis of path difficulty
   */
  analyzePathway(start, end, sampleCount = 10) {
    const samples = []
    const direction = new THREE.Vector3().subVectors(end, start).normalize()
    const distance = start.distanceTo(end)
    const step = distance / sampleCount

    let maxAngle = 0
    let totalAngleChange = 0
    let previousAngle = null
    let hasVerticalSection = false
    let surfaceTypes = new Set()

    for (let i = 0; i <= sampleCount; i++) {
      const samplePos = new THREE.Vector3()
        .copy(start)
        .addScaledVector(direction, step * i)

      const surfaceData = this.analyzeSurfaceAt(samplePos, direction)
      samples.push(surfaceData)

      maxAngle = Math.max(maxAngle, surfaceData.angle)
      surfaceTypes.add(surfaceData.surfaceType)

      if (surfaceData.angle > 85) hasVerticalSection = true

      if (previousAngle !== null) {
        totalAngleChange += Math.abs(surfaceData.angle - previousAngle)
      }
      previousAngle = surfaceData.angle
    }

    // Calculate average friction along path
    const avgFriction = samples.reduce((sum, s) => sum + s.friction, 0) / samples.length

    // Calculate elevation change
    const elevationChange = samples[samples.length - 1].position.y - samples[0].position.y

    return {
      samples: samples,
      maxAngle: maxAngle,
      averageAngleChange: totalAngleChange / sampleCount,
      hasVerticalSection: hasVerticalSection,
      surfaceTypes: Array.from(surfaceTypes),
      averageFriction: avgFriction,
      elevationChange: elevationChange,
      distance: distance,

      // Difficulty score (0-1, higher = harder)
      difficulty: this.calculatePathDifficulty(maxAngle, avgFriction, hasVerticalSection, elevationChange)
    }
  }

  calculatePathDifficulty(maxAngle, avgFriction, hasVertical, elevationChange) {
    let difficulty = 0

    // Angle contribution (45deg = 0.5, 90deg = 1.0)
    difficulty += Math.min(1, maxAngle / 90) * 0.4

    // Friction contribution (lower friction = harder)
    difficulty += (1 - avgFriction) * 0.3

    // Vertical sections are much harder
    if (hasVertical) difficulty += 0.2

    // Uphill is harder than downhill
    if (elevationChange > 0) {
      difficulty += Math.min(0.1, elevationChange / 20)
    }

    return Math.min(1, difficulty)
  }

  createDefaultSurfaceData(position) {
    return {
      position: position.clone(),
      normal: new THREE.Vector3(0, 1, 0),
      angle: 0,
      slopeDirection: new THREE.Vector3(0, 0, 0),
      surfaceType: this.SURFACE_TYPES.GROUND,
      friction: 0.8,
      isClimbable: true,
      isWalkable: true,
      mesh: null
    }
  }
}

export default SurfaceAnalyzer
