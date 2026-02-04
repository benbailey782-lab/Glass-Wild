import * as THREE from 'three'

export class Terrarium {
  constructor(size = 20) {
    this.size = size
    this.group = new THREE.Group()

    // Separate groups for toggle visibility
    this.wallsGroup = new THREE.Group()
    this.floorGroup = new THREE.Group()
    this.frameGroup = new THREE.Group()
    this.contentsGroup = new THREE.Group()

    this.group.add(this.wallsGroup)
    this.group.add(this.floorGroup)
    this.group.add(this.frameGroup)
    this.group.add(this.contentsGroup)

    // Glass visibility state
    this.glassVisible = true
    this.glassOpacity = 1
    this.targetGlassOpacity = 1
    this.wallMeshes = []
    this.glassMaterial = null

    this.createGlassEnclosure()
    this.createSubstrate()
    this.createDecorations()
    this.createMoisture()
  }

  createGlassEnclosure() {
    const size = this.size
    const glassThickness = 0.3
    const frameThickness = 0.8

    // Premium glass material - realistic with subtle green tint
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      thickness: 2,
      roughness: 0.05,
      metalness: 0,
      ior: 1.5,
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      color: new THREE.Color(0xf0fff8), // Subtle green tint
      attenuationColor: new THREE.Color(0xe0f5ed), // Green-tinted attenuation
      attenuationDistance: 3,
      specularIntensity: 1,
      specularColor: new THREE.Color(0xffffff),
      reflectivity: 0.5,
      sheen: 0,
      sheenRoughness: 0.25,
      sheenColor: new THREE.Color(0xffffff)
    })

    // Frame material - dark metal edges with slight sheen
    this.frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.85,
      roughness: 0.25,
      envMapIntensity: 0.8,
      transparent: true,
      opacity: 1
    })

    // Wall panels (4 sides - front, back, left, right)
    const wallPanels = [
      { pos: [0, size/2, size/2 + glassThickness/2], rot: [0, 0, 0], size: [size, size, glassThickness], name: 'back' },
      { pos: [0, size/2, -size/2 - glassThickness/2], rot: [0, 0, 0], size: [size, size, glassThickness], name: 'front' },
      { pos: [size/2 + glassThickness/2, size/2, 0], rot: [0, Math.PI/2, 0], size: [size, size, glassThickness], name: 'right' },
      { pos: [-size/2 - glassThickness/2, size/2, 0], rot: [0, Math.PI/2, 0], size: [size, size, glassThickness], name: 'left' }
    ]

    wallPanels.forEach(panel => {
      const geo = new THREE.BoxGeometry(...panel.size)
      const mesh = new THREE.Mesh(geo, this.glassMaterial)
      mesh.position.set(...panel.pos)
      mesh.rotation.set(...panel.rot)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.name = `wall_${panel.name}`
      this.wallsGroup.add(mesh)
      this.wallMeshes.push(mesh)
    })

    // Floor panel (separate from walls for toggle)
    const floorGeo = new THREE.BoxGeometry(size, glassThickness, size)
    this.floorGlassMaterial = this.glassMaterial.clone()
    const floorMesh = new THREE.Mesh(floorGeo, this.floorGlassMaterial)
    floorMesh.position.set(0, 0, 0)
    floorMesh.receiveShadow = true
    floorMesh.name = 'floor'
    this.floorGroup.add(floorMesh)

    // Create frame edges (metal trim)
    const edgePositions = [
      // Vertical edges
      { pos: [size/2, size/2, size/2], rot: [0, 0, 0], height: size },
      { pos: [-size/2, size/2, size/2], rot: [0, 0, 0], height: size },
      { pos: [size/2, size/2, -size/2], rot: [0, 0, 0], height: size },
      { pos: [-size/2, size/2, -size/2], rot: [0, 0, 0], height: size },
      // Bottom horizontal edges
      { pos: [0, 0, size/2], rot: [0, 0, Math.PI/2], height: size },
      { pos: [0, 0, -size/2], rot: [0, 0, Math.PI/2], height: size },
      { pos: [size/2, 0, 0], rot: [Math.PI/2, 0, 0], height: size },
      { pos: [-size/2, 0, 0], rot: [Math.PI/2, 0, 0], height: size },
      // Top horizontal edges
      { pos: [0, size, size/2], rot: [0, 0, Math.PI/2], height: size },
      { pos: [0, size, -size/2], rot: [0, 0, Math.PI/2], height: size },
      { pos: [size/2, size, 0], rot: [Math.PI/2, 0, 0], height: size },
      { pos: [-size/2, size, 0], rot: [Math.PI/2, 0, 0], height: size }
    ]

    edgePositions.forEach((edge, i) => {
      const isVertical = i < 4
      const geo = new THREE.BoxGeometry(
        frameThickness,
        edge.height + (isVertical ? 0 : frameThickness),
        frameThickness
      )
      const mesh = new THREE.Mesh(geo, this.frameMaterial)
      mesh.position.set(...edge.pos)
      mesh.rotation.set(...edge.rot)
      mesh.castShadow = true
      mesh.receiveShadow = true

      // Top frame edges go in wallsGroup (will hide with walls)
      if (i >= 8) {
        this.wallsGroup.add(mesh)
      } else {
        this.frameGroup.add(mesh)
      }
    })
  }

  toggleGlassVisibility() {
    this.glassVisible = !this.glassVisible
    this.targetGlassOpacity = this.glassVisible ? 1 : 0
  }

  setGlassVisibility(visible) {
    this.glassVisible = visible
    this.targetGlassOpacity = visible ? 1 : 0
  }

  createSubstrate() {
    const size = this.size
    const substrateHeight = 2.5

    // Create layered substrate for realism
    // Bottom layer - drainage (dark gravel look)
    const drainageGeo = new THREE.BoxGeometry(size - 0.6, 0.6, size - 0.6)
    const drainageMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.1
    })
    const drainage = new THREE.Mesh(drainageGeo, drainageMat)
    drainage.position.set(0, 0.3, 0)
    drainage.receiveShadow = true
    this.contentsGroup.add(drainage)

    // Middle layer - substrate (rich soil) with bump texture
    const soilGeo = new THREE.BoxGeometry(size - 0.6, substrateHeight - 0.6, size - 0.6, 32, 1, 32)

    // Displace top vertices for uneven soil surface
    const positions = soilGeo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      if (y > 0) { // Only displace top vertices
        const x = positions.getX(i)
        const z = positions.getZ(i)
        // Create natural-looking displacement using noise
        const noise = Math.sin(x * 0.8) * Math.cos(z * 0.8) * 0.3 +
                     Math.sin(x * 1.5 + 1) * Math.cos(z * 1.2 + 0.5) * 0.2 +
                     Math.random() * 0.15
        positions.setY(i, y + noise)
      }
    }
    soilGeo.computeVertexNormals()

    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 1,
      metalness: 0,
      bumpScale: 0.05
    })
    const soil = new THREE.Mesh(soilGeo, soilMat)
    soil.position.set(0, 0.6 + (substrateHeight - 0.6) / 2, 0)
    soil.receiveShadow = true
    this.contentsGroup.add(soil)

    // Top layer - leaf litter and moss (uneven surface)
    this.createLeafLitter(substrateHeight)
    this.createMoss(substrateHeight)
  }

  createLeafLitter(baseHeight) {
    const size = this.size

    // Multiple leaf materials for variety
    const leafMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.95, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: 0x6b4a3a, roughness: 0.95, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: 0x4a3628, roughness: 0.95, metalness: 0 })
    ]

    // Create random leaf-like shapes scattered on substrate
    for (let i = 0; i < 50; i++) {
      const leafGeo = new THREE.SphereGeometry(
        0.3 + Math.random() * 0.5,
        8,
        6
      )
      leafGeo.scale(1, 0.15 + Math.random() * 0.1, 0.6 + Math.random() * 0.4)

      const leafMat = leafMaterials[Math.floor(Math.random() * leafMaterials.length)]
      const leaf = new THREE.Mesh(leafGeo, leafMat)
      leaf.position.set(
        (Math.random() - 0.5) * (size - 3),
        baseHeight + Math.random() * 0.4,
        (Math.random() - 0.5) * (size - 3)
      )
      leaf.rotation.set(
        Math.random() * 0.4 - 0.2,
        Math.random() * Math.PI * 2,
        Math.random() * 0.4 - 0.2
      )
      leaf.receiveShadow = true
      leaf.castShadow = true
      this.contentsGroup.add(leaf)
    }
  }

  createMoss(baseHeight) {
    const size = this.size

    // Moss material - vibrant green with slight subsurface feel
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c4e,
      roughness: 0.92,
      metalness: 0,
      emissive: 0x0a1f0a,
      emissiveIntensity: 0.05
    })

    // Create moss patches using clusters of small spheres
    const mossPatches = [
      { x: -5, z: -5, scale: 1.2 },
      { x: 4, z: -6, scale: 0.8 },
      { x: -6, z: 4, scale: 1 },
      { x: 6, z: 5, scale: 0.9 },
      { x: 0, z: 7, scale: 0.7 },
      { x: -3, z: 2, scale: 0.6 },
      { x: 2, z: 3, scale: 0.5 },
      { x: -7, z: -2, scale: 0.8 }
    ]

    mossPatches.forEach(patch => {
      const clusterSize = 10 + Math.floor(Math.random() * 10)
      for (let i = 0; i < clusterSize; i++) {
        const mossGeo = new THREE.SphereGeometry(
          0.25 + Math.random() * 0.35 * patch.scale,
          8,
          6
        )
        mossGeo.scale(1, 0.4 + Math.random() * 0.2, 1)

        const moss = new THREE.Mesh(mossGeo, mossMat)
        moss.position.set(
          patch.x + (Math.random() - 0.5) * 2.5 * patch.scale,
          baseHeight + Math.random() * 0.25,
          patch.z + (Math.random() - 0.5) * 2.5 * patch.scale
        )
        moss.receiveShadow = true
        moss.castShadow = true
        this.contentsGroup.add(moss)
      }
    })
  }

  createDecorations() {
    this.createRocks()
    this.createWood()
    this.createPlants()
  }

  createRocks() {
    const size = this.size
    const baseHeight = 2.5

    // Rock materials with slight variation
    const rockMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.85, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.8, metalness: 0.15 })
    ]

    // Create a few natural-looking rocks
    const rockPositions = [
      { x: -6, z: 6, scale: 2.5, y: 0 },
      { x: 5, z: -4, scale: 1.8, y: 0 },
      { x: -3, z: -6, scale: 1.5, y: 0 },
      { x: 7, z: 3, scale: 1.2, y: 0 }
    ]

    rockPositions.forEach((rock, idx) => {
      // Use icosahedron for natural rock shape
      const rockGeo = new THREE.IcosahedronGeometry(rock.scale, 1)

      // Distort vertices for more natural look
      const positions = rockGeo.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        positions.setXYZ(
          i,
          x + (Math.random() - 0.5) * 0.6,
          y * 0.65 + (Math.random() - 0.5) * 0.4,
          z + (Math.random() - 0.5) * 0.6
        )
      }
      rockGeo.computeVertexNormals()

      const rockMat = rockMaterials[idx % rockMaterials.length]
      const mesh = new THREE.Mesh(rockGeo, rockMat)
      mesh.position.set(rock.x, baseHeight + rock.scale * 0.5, rock.z)
      mesh.rotation.set(
        Math.random() * 0.4,
        Math.random() * Math.PI * 2,
        Math.random() * 0.4
      )
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.contentsGroup.add(mesh)
    })
  }

  createWood() {
    const baseHeight = 2.5

    // Wood/bark material with more detail
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
      metalness: 0
    })

    // Create a piece of driftwood/branch
    const branchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7, baseHeight + 0.5, 2),
      new THREE.Vector3(-4, baseHeight + 2, 1),
      new THREE.Vector3(-1, baseHeight + 3.5, -1),
      new THREE.Vector3(3, baseHeight + 2.5, -2),
      new THREE.Vector3(6, baseHeight + 1, -3)
    ])

    const branchGeo = new THREE.TubeGeometry(branchCurve, 24, 0.6, 10, false)
    const branch = new THREE.Mesh(branchGeo, woodMat)
    branch.castShadow = true
    branch.receiveShadow = true
    this.contentsGroup.add(branch)

    // Add a smaller secondary branch
    const branch2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1, baseHeight + 3.5, -1),
      new THREE.Vector3(0, baseHeight + 5, 1),
      new THREE.Vector3(2, baseHeight + 6, 3)
    ])

    const branch2Geo = new THREE.TubeGeometry(branch2Curve, 16, 0.3, 8, false)
    const branch2 = new THREE.Mesh(branch2Geo, woodMat)
    branch2.castShadow = true
    branch2.receiveShadow = true
    this.contentsGroup.add(branch2)

    // Add third branch for more interest
    const branch3Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(3, baseHeight + 2.5, -2),
      new THREE.Vector3(4, baseHeight + 4, -1),
      new THREE.Vector3(5, baseHeight + 5.5, 1)
    ])

    const branch3Geo = new THREE.TubeGeometry(branch3Curve, 12, 0.25, 8, false)
    const branch3 = new THREE.Mesh(branch3Geo, woodMat)
    branch3.castShadow = true
    branch3.receiveShadow = true
    this.contentsGroup.add(branch3)
  }

  createPlants() {
    const baseHeight = 2.5

    // Fern-like plants
    this.createFern(-7, baseHeight, -5, 1.2)
    this.createFern(6, baseHeight, -6, 0.9)
    this.createFern(-5, baseHeight, 7, 1)

    // Small ground plants
    this.createGroundPlant(3, baseHeight, 6, 0.8)
    this.createGroundPlant(-2, baseHeight, -3, 0.6)
    this.createGroundPlant(5, baseHeight, 1, 0.7)
    this.createGroundPlant(-8, baseHeight, 0, 0.5)
  }

  createFern(x, y, z, scale) {
    const fernMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.75,
      metalness: 0,
      side: THREE.DoubleSide,
      emissive: 0x0a1f0a,
      emissiveIntensity: 0.03
    })

    const frondCount = 7 + Math.floor(Math.random() * 5)
    const fernGroup = new THREE.Group()

    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.3
      const tilt = 0.3 + Math.random() * 0.4

      // Create frond as a curved shape
      const frondShape = new THREE.Shape()
      frondShape.moveTo(0, 0)
      frondShape.quadraticCurveTo(0.5 * scale, 2 * scale, 0, 4 * scale)
      frondShape.quadraticCurveTo(-0.5 * scale, 2 * scale, 0, 0)

      const frondGeo = new THREE.ShapeGeometry(frondShape)
      const frond = new THREE.Mesh(frondGeo, fernMat)
      frond.rotation.set(-tilt, angle, 0)
      frond.castShadow = true
      fernGroup.add(frond)
    }

    fernGroup.position.set(x, y, z)
    this.contentsGroup.add(fernGroup)
  }

  createGroundPlant(x, y, z, scale) {
    const plantMat = new THREE.MeshStandardMaterial({
      color: 0x3a6b35,
      roughness: 0.75,
      metalness: 0,
      side: THREE.DoubleSide,
      emissive: 0x0a150a,
      emissiveIntensity: 0.03
    })

    const plantGroup = new THREE.Group()
    const leafCount = 10 + Math.floor(Math.random() * 8)

    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2 + Math.random() * 0.2
      const tilt = 0.5 + Math.random() * 0.5
      const leafLength = (1.5 + Math.random()) * scale

      const leafShape = new THREE.Shape()
      leafShape.moveTo(0, 0)
      leafShape.quadraticCurveTo(0.15 * scale, leafLength * 0.6, 0, leafLength)
      leafShape.quadraticCurveTo(-0.15 * scale, leafLength * 0.6, 0, 0)

      const leafGeo = new THREE.ShapeGeometry(leafShape)
      const leaf = new THREE.Mesh(leafGeo, plantMat)
      leaf.rotation.set(-tilt, angle, 0)
      leaf.castShadow = true
      plantGroup.add(leaf)
    }

    plantGroup.position.set(x, y, z)
    this.contentsGroup.add(plantGroup)
  }

  createMoisture() {
    // Add subtle water droplets on glass for humidity effect
    const dropletMat = new THREE.MeshPhysicalMaterial({
      transmission: 0.9,
      roughness: 0,
      metalness: 0,
      ior: 1.33,
      thickness: 0.15,
      transparent: true,
      opacity: 0.7,
      envMapIntensity: 1.5
    })

    const size = this.size
    const glassOffset = size / 2 + 0.4

    // Add droplets to front and side panels
    const panels = [
      { normal: [0, 0, -1], offset: [0, 0, -glassOffset] },
      { normal: [1, 0, 0], offset: [glassOffset, 0, 0] },
      { normal: [-1, 0, 0], offset: [-glassOffset, 0, 0] }
    ]

    panels.forEach(panel => {
      const dropletCount = 20 + Math.floor(Math.random() * 15)
      for (let i = 0; i < dropletCount; i++) {
        const dropletSize = 0.08 + Math.random() * 0.18
        const dropletGeo = new THREE.SphereGeometry(dropletSize, 8, 6)
        dropletGeo.scale(1, 1.6, 0.25)

        const droplet = new THREE.Mesh(dropletGeo, dropletMat)

        // Position on glass panel
        const x = panel.offset[0] + (panel.normal[0] === 0 ? (Math.random() - 0.5) * (size - 4) : panel.normal[0] * 0.1)
        const y = 3 + Math.random() * (size - 5)
        const z = panel.offset[2] + (panel.normal[2] === 0 ? (Math.random() - 0.5) * (size - 4) : panel.normal[2] * 0.1)

        droplet.position.set(x, y, z)
        droplet.lookAt(x + panel.normal[0], y, z + panel.normal[2])
        this.wallsGroup.add(droplet) // Droplets hide with walls
      }
    })
  }

  update(deltaTime = 0.016) {
    // Smooth glass opacity transition
    if (this.glassOpacity !== this.targetGlassOpacity) {
      const speed = 3.3 // ~0.3 second transition
      const diff = this.targetGlassOpacity - this.glassOpacity

      if (Math.abs(diff) < 0.01) {
        this.glassOpacity = this.targetGlassOpacity
      } else {
        this.glassOpacity += diff * speed * deltaTime
      }

      // Update wall glass material
      if (this.glassMaterial) {
        this.glassMaterial.transmission = 0.95 * this.glassOpacity
        this.glassMaterial.opacity = 0.15 * this.glassOpacity
      }

      // Update floor glass material
      if (this.floorGlassMaterial) {
        this.floorGlassMaterial.transmission = 0.95 * this.glassOpacity
        this.floorGlassMaterial.opacity = 0.15 * this.glassOpacity
      }

      // Update frame material (fade to transparent)
      if (this.frameMaterial) {
        this.frameMaterial.opacity = this.glassOpacity
      }

      // Toggle visibility for all glass-related groups
      const isVisible = this.glassOpacity >= 0.01
      this.wallsGroup.visible = isVisible
      this.floorGroup.visible = isVisible
      this.frameGroup.visible = isVisible
    }
  }

  /**
   * Get the bounds of the terrarium floor where creatures can move
   * @returns {Object} - { min: {x, z}, max: {x, z} }
   */
  getBounds() {
    const padding = 1.5 // Stay away from walls
    const halfSize = (this.size / 2) - padding
    const substrateHeight = 2.5

    return {
      min: { x: -halfSize, y: substrateHeight, z: -halfSize },
      max: { x: halfSize, y: substrateHeight, z: halfSize }
    }
  }

  /**
   * Get positions where leaf litter is available for detritivores
   * @returns {Array<{x, y, z}>} - Array of positions
   */
  getLeafLitterPositions() {
    const positions = []
    const bounds = this.getBounds()
    const substrateHeight = 2.5

    // Leaf litter is scattered across the substrate
    // Return positions in a grid pattern with some randomization
    const gridSize = 2 // 2 unit grid
    for (let x = bounds.min.x; x <= bounds.max.x; x += gridSize) {
      for (let z = bounds.min.z; z <= bounds.max.z; z += gridSize) {
        positions.push({
          x: x + (Math.random() - 0.5) * gridSize * 0.8,
          y: substrateHeight + 0.1,
          z: z + (Math.random() - 0.5) * gridSize * 0.8
        })
      }
    }

    return positions
  }

  /**
   * Get positions where creatures can hide (under rocks, wood, plants)
   * @returns {Array<{x, y, z}>} - Array of hiding spot positions
   */
  getHidingSpots() {
    const substrateHeight = 2.5

    // Hiding spots are near rocks, under wood, and in plant bases
    const hidingSpots = [
      // Near rocks
      { x: -6, y: substrateHeight, z: 6 },
      { x: 5, y: substrateHeight, z: -4 },
      { x: -3, y: substrateHeight, z: -6 },
      { x: 7, y: substrateHeight, z: 3 },
      // Under wood/branches
      { x: -5, y: substrateHeight, z: 1 },
      { x: 0, y: substrateHeight, z: -1 },
      { x: 4, y: substrateHeight, z: -2 },
      // Near plant bases (ferns and ground plants)
      { x: -7, y: substrateHeight, z: -5 },
      { x: 6, y: substrateHeight, z: -6 },
      { x: -5, y: substrateHeight, z: 7 },
      { x: 3, y: substrateHeight, z: 6 },
      { x: -2, y: substrateHeight, z: -3 },
      // Moss patches (good hiding)
      { x: -5, y: substrateHeight, z: -5 },
      { x: 4, y: substrateHeight, z: -6 },
      { x: -6, y: substrateHeight, z: 4 }
    ]

    return hidingSpots
  }

  /**
   * Check if the terrarium has hiding spots
   * @returns {boolean}
   */
  hasHidingSpots() {
    return this.getHidingSpots().length > 0
  }
}
