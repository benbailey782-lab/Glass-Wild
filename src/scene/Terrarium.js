import * as THREE from 'three'

export class Terrarium {
  constructor(size = 20) {
    this.size = size
    this.group = new THREE.Group()

    this.createGlassEnclosure()
    this.createSubstrate()
    this.createDecorations()
    this.createMoisture()
  }

  createGlassEnclosure() {
    const size = this.size
    const glassThickness = 0.3
    const frameThickness = 0.8

    // Glass material - realistic with transmission
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      thickness: glassThickness * 5,
      roughness: 0.05,
      metalness: 0,
      ior: 1.5,
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      color: new THREE.Color(0xffffff),
      attenuationColor: new THREE.Color(0xe8f4f0),
      attenuationDistance: 5
    })

    // Frame material - dark metal edges
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.3
    })

    // Create glass panels (5 sides - open top)
    const panels = [
      { pos: [0, size/2, size/2 + glassThickness/2], rot: [0, 0, 0], size: [size, size, glassThickness] }, // back
      { pos: [0, size/2, -size/2 - glassThickness/2], rot: [0, 0, 0], size: [size, size, glassThickness] }, // front
      { pos: [size/2 + glassThickness/2, size/2, 0], rot: [0, Math.PI/2, 0], size: [size, size, glassThickness] }, // right
      { pos: [-size/2 - glassThickness/2, size/2, 0], rot: [0, Math.PI/2, 0], size: [size, size, glassThickness] }, // left
      { pos: [0, 0, 0], rot: [Math.PI/2, 0, 0], size: [size, size, glassThickness] } // bottom
    ]

    panels.forEach(panel => {
      const geo = new THREE.BoxGeometry(...panel.size)
      const mesh = new THREE.Mesh(geo, glassMaterial)
      mesh.position.set(...panel.pos)
      mesh.rotation.set(...panel.rot)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.group.add(mesh)
    })

    // Create frame edges (metal trim)
    const edgePositions = [
      // Vertical edges
      { pos: [size/2, size/2, size/2], rot: [0, 0, 0] },
      { pos: [-size/2, size/2, size/2], rot: [0, 0, 0] },
      { pos: [size/2, size/2, -size/2], rot: [0, 0, 0] },
      { pos: [-size/2, size/2, -size/2], rot: [0, 0, 0] },
      // Bottom horizontal edges
      { pos: [0, 0, size/2], rot: [0, 0, Math.PI/2] },
      { pos: [0, 0, -size/2], rot: [0, 0, Math.PI/2] },
      { pos: [size/2, 0, 0], rot: [Math.PI/2, 0, 0] },
      { pos: [-size/2, 0, 0], rot: [Math.PI/2, 0, 0] },
      // Top horizontal edges
      { pos: [0, size, size/2], rot: [0, 0, Math.PI/2] },
      { pos: [0, size, -size/2], rot: [0, 0, Math.PI/2] },
      { pos: [size/2, size, 0], rot: [Math.PI/2, 0, 0] },
      { pos: [-size/2, size, 0], rot: [Math.PI/2, 0, 0] }
    ]

    const edgeGeo = new THREE.BoxGeometry(frameThickness, size, frameThickness)
    const shortEdgeGeo = new THREE.BoxGeometry(frameThickness, size + frameThickness, frameThickness)

    edgePositions.forEach((edge, i) => {
      const geo = i < 4 ? edgeGeo : shortEdgeGeo
      const mesh = new THREE.Mesh(geo, frameMaterial)
      mesh.position.set(...edge.pos)
      mesh.rotation.set(...edge.rot)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.group.add(mesh)
    })
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
    this.group.add(drainage)

    // Middle layer - substrate (rich soil)
    const soilGeo = new THREE.BoxGeometry(size - 0.6, substrateHeight - 0.6, size - 0.6)
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 1,
      metalness: 0
    })
    const soil = new THREE.Mesh(soilGeo, soilMat)
    soil.position.set(0, 0.6 + (substrateHeight - 0.6) / 2, 0)
    soil.receiveShadow = true
    this.group.add(soil)

    // Top layer - leaf litter and moss (uneven surface)
    this.createLeafLitter(substrateHeight)
    this.createMoss(substrateHeight)
  }

  createLeafLitter(baseHeight) {
    const size = this.size
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.95,
      metalness: 0
    })

    // Create random leaf-like shapes scattered on substrate
    for (let i = 0; i < 40; i++) {
      const leafGeo = new THREE.SphereGeometry(
        0.3 + Math.random() * 0.4,
        8,
        6
      )
      leafGeo.scale(1, 0.2, 0.7 + Math.random() * 0.3)

      const leaf = new THREE.Mesh(leafGeo, leafMat)
      leaf.position.set(
        (Math.random() - 0.5) * (size - 3),
        baseHeight + Math.random() * 0.3,
        (Math.random() - 0.5) * (size - 3)
      )
      leaf.rotation.set(
        Math.random() * 0.3,
        Math.random() * Math.PI * 2,
        Math.random() * 0.3
      )
      leaf.receiveShadow = true
      leaf.castShadow = true
      this.group.add(leaf)
    }
  }

  createMoss(baseHeight) {
    const size = this.size

    // Moss material - vibrant green
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c4e,
      roughness: 0.95,
      metalness: 0
    })

    // Create moss patches using clusters of small spheres
    const mossPatches = [
      { x: -5, z: -5, scale: 1.2 },
      { x: 4, z: -6, scale: 0.8 },
      { x: -6, z: 4, scale: 1 },
      { x: 6, z: 5, scale: 0.9 },
      { x: 0, z: 7, scale: 0.7 },
      { x: -3, z: 2, scale: 0.6 }
    ]

    mossPatches.forEach(patch => {
      const clusterSize = 8 + Math.floor(Math.random() * 8)
      for (let i = 0; i < clusterSize; i++) {
        const mossGeo = new THREE.SphereGeometry(
          0.3 + Math.random() * 0.4 * patch.scale,
          8,
          6
        )
        mossGeo.scale(1, 0.5, 1)

        const moss = new THREE.Mesh(mossGeo, mossMat)
        moss.position.set(
          patch.x + (Math.random() - 0.5) * 2 * patch.scale,
          baseHeight + Math.random() * 0.2,
          patch.z + (Math.random() - 0.5) * 2 * patch.scale
        )
        moss.receiveShadow = true
        moss.castShadow = true
        this.group.add(moss)
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

    // Rock material
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x6b6b6b,
      roughness: 0.85,
      metalness: 0.1
    })

    // Create a few natural-looking rocks
    const rockPositions = [
      { x: -6, z: 6, scale: 2.5, y: 0 },
      { x: 5, z: -4, scale: 1.8, y: 0 },
      { x: -3, z: -6, scale: 1.5, y: 0 },
      { x: 7, z: 3, scale: 1.2, y: 0 }
    ]

    rockPositions.forEach(rock => {
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
          x + (Math.random() - 0.5) * 0.5,
          y * 0.7 + (Math.random() - 0.5) * 0.3,
          z + (Math.random() - 0.5) * 0.5
        )
      }
      rockGeo.computeVertexNormals()

      const mesh = new THREE.Mesh(rockGeo, rockMat)
      mesh.position.set(rock.x, baseHeight + rock.scale * 0.5, rock.z)
      mesh.rotation.set(
        Math.random() * 0.3,
        Math.random() * Math.PI * 2,
        Math.random() * 0.3
      )
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.group.add(mesh)
    })
  }

  createWood() {
    const baseHeight = 2.5

    // Wood/bark material
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

    const branchGeo = new THREE.TubeGeometry(branchCurve, 20, 0.6, 8, false)
    const branch = new THREE.Mesh(branchGeo, woodMat)
    branch.castShadow = true
    branch.receiveShadow = true
    this.group.add(branch)

    // Add a smaller secondary branch
    const branch2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1, baseHeight + 3.5, -1),
      new THREE.Vector3(0, baseHeight + 5, 1),
      new THREE.Vector3(2, baseHeight + 6, 3)
    ])

    const branch2Geo = new THREE.TubeGeometry(branch2Curve, 12, 0.3, 8, false)
    const branch2 = new THREE.Mesh(branch2Geo, woodMat)
    branch2.castShadow = true
    branch2.receiveShadow = true
    this.group.add(branch2)
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
  }

  createFern(x, y, z, scale) {
    const fernMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.8,
      metalness: 0,
      side: THREE.DoubleSide
    })

    const frondCount = 6 + Math.floor(Math.random() * 4)
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
    this.group.add(fernGroup)
  }

  createGroundPlant(x, y, z, scale) {
    const plantMat = new THREE.MeshStandardMaterial({
      color: 0x3a6b35,
      roughness: 0.8,
      metalness: 0,
      side: THREE.DoubleSide
    })

    const plantGroup = new THREE.Group()
    const leafCount = 8 + Math.floor(Math.random() * 6)

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
    this.group.add(plantGroup)
  }

  createMoisture() {
    // Add subtle water droplets on glass for humidity effect
    const dropletMat = new THREE.MeshPhysicalMaterial({
      transmission: 0.9,
      roughness: 0,
      metalness: 0,
      ior: 1.33,
      thickness: 0.1,
      transparent: true,
      opacity: 0.6
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
      const dropletCount = 15 + Math.floor(Math.random() * 10)
      for (let i = 0; i < dropletCount; i++) {
        const dropletSize = 0.1 + Math.random() * 0.2
        const dropletGeo = new THREE.SphereGeometry(dropletSize, 8, 6)
        dropletGeo.scale(1, 1.5, 0.3)

        const droplet = new THREE.Mesh(dropletGeo, dropletMat)

        // Position on glass panel
        const x = panel.offset[0] + (panel.normal[0] === 0 ? (Math.random() - 0.5) * (size - 4) : panel.normal[0] * 0.1)
        const y = 3 + Math.random() * (size - 5)
        const z = panel.offset[2] + (panel.normal[2] === 0 ? (Math.random() - 0.5) * (size - 4) : panel.normal[2] * 0.1)

        droplet.position.set(x, y, z)
        droplet.lookAt(x + panel.normal[0], y, z + panel.normal[2])
        this.group.add(droplet)
      }
    })
  }

  update() {
    // Animation updates will go here
    // For now, subtle ambient movement could be added
  }
}
