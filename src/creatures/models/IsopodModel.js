import * as THREE from 'three'

/**
 * Create a procedural isopod mesh
 * Uses simple geometries to create a segmented body with antennae and legs
 *
 * @param {number} size - Size multiplier (1 = adult size ~0.4 inches)
 * @param {Object} options - Additional options for customization
 * @returns {THREE.Group} - The isopod mesh group
 */
export function createIsopodMesh(size = 1, options = {}) {
  const {
    color = 0x7B9BAA, // Powder blue
    roughness = 0.7,
    metalness = 0.1
  } = options

  const group = new THREE.Group()
  group.name = 'isopod'

  // Main body material
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    flatShading: false
  })

  // Darker material for legs/antennae
  const appendageMaterial = new THREE.MeshStandardMaterial({
    color: 0x5A7A8A,
    roughness: 0.8,
    metalness: 0
  })

  // Body segments (7 overlapping ellipsoids)
  const numSegments = 7
  const segmentGeometry = new THREE.SphereGeometry(0.12, 8, 6)
  segmentGeometry.scale(1.4, 0.5, 1)

  for (let i = 0; i < numSegments; i++) {
    const segment = new THREE.Mesh(segmentGeometry, bodyMaterial)

    // Position segments along z-axis
    const zPos = (i - (numSegments - 1) / 2) * 0.15
    segment.position.set(0, 0.04, zPos)

    // Taper at head and tail
    const taperFactor = 1 - Math.pow(Math.abs(i - (numSegments - 1) / 2) / ((numSegments - 1) / 2), 2) * 0.3
    segment.scale.set(taperFactor, 1, 1)

    // Add slight segmentation ridge
    if (i > 0 && i < numSegments - 1) {
      const ridgeGeom = new THREE.BoxGeometry(0.2 * taperFactor, 0.02, 0.02)
      const ridge = new THREE.Mesh(ridgeGeom, bodyMaterial)
      ridge.position.set(0, 0.055, zPos - 0.07)
      group.add(ridge)
    }

    segment.castShadow = true
    segment.receiveShadow = true
    group.add(segment)
  }

  // Head (slightly larger front segment)
  const headGeometry = new THREE.SphereGeometry(0.08, 8, 6)
  headGeometry.scale(1.2, 0.6, 1)
  const head = new THREE.Mesh(headGeometry, bodyMaterial)
  head.position.set(0, 0.04, 0.5)
  head.castShadow = true
  group.add(head)

  // Antennae
  const antennaLength = 0.25
  const antennaGeometry = new THREE.CylinderGeometry(0.008, 0.005, antennaLength, 4)

  // Left antenna
  const leftAntenna = new THREE.Mesh(antennaGeometry, appendageMaterial)
  leftAntenna.position.set(0.04, 0.05, 0.55 + antennaLength / 2)
  leftAntenna.rotation.x = -Math.PI / 6
  leftAntenna.rotation.z = Math.PI / 8
  group.add(leftAntenna)

  // Right antenna
  const rightAntenna = new THREE.Mesh(antennaGeometry, appendageMaterial)
  rightAntenna.position.set(-0.04, 0.05, 0.55 + antennaLength / 2)
  rightAntenna.rotation.x = -Math.PI / 6
  rightAntenna.rotation.z = -Math.PI / 8
  group.add(rightAntenna)

  // Store antenna references for animation
  group.userData.leftAntenna = leftAntenna
  group.userData.rightAntenna = rightAntenna

  // Legs (7 pairs = 14 legs)
  const legGeometry = new THREE.CylinderGeometry(0.006, 0.004, 0.08, 4)

  for (let i = 0; i < 7; i++) {
    const zPos = (i - 3) * 0.15

    // Vary leg length slightly
    const legLength = 0.08 + (3 - Math.abs(i - 3)) * 0.01

    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, appendageMaterial)
    leftLeg.position.set(0.1, 0, zPos)
    leftLeg.rotation.z = -Math.PI / 3
    leftLeg.scale.y = legLength / 0.08
    group.add(leftLeg)

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, appendageMaterial)
    rightLeg.position.set(-0.1, 0, zPos)
    rightLeg.rotation.z = Math.PI / 3
    rightLeg.scale.y = legLength / 0.08
    group.add(rightLeg)
  }

  // Tail segments (uropods)
  const tailGeometry = new THREE.ConeGeometry(0.02, 0.08, 4)

  const leftTail = new THREE.Mesh(tailGeometry, bodyMaterial)
  leftTail.position.set(0.03, 0.02, -0.55)
  leftTail.rotation.x = Math.PI / 2 + Math.PI / 8
  leftTail.rotation.z = Math.PI / 12
  group.add(leftTail)

  const rightTail = new THREE.Mesh(tailGeometry, bodyMaterial)
  rightTail.position.set(-0.03, 0.02, -0.55)
  rightTail.rotation.x = Math.PI / 2 + Math.PI / 8
  rightTail.rotation.z = -Math.PI / 12
  group.add(rightTail)

  // Scale the entire group
  // Base size assumes adult isopod is about 0.4 inches
  // In world units, we'll use a scale where 1 unit = ~1 inch
  const baseScale = 0.4 * size
  group.scale.setScalar(baseScale)

  // Store animation state
  group.userData.animationTime = Math.random() * Math.PI * 2
  group.userData.isWalking = false

  return group
}

/**
 * Update isopod animation
 * @param {THREE.Group} mesh - The isopod mesh
 * @param {number} deltaTime - Time since last frame
 * @param {boolean} isMoving - Whether the isopod is walking
 */
export function updateIsopodAnimation(mesh, deltaTime, isMoving) {
  if (!mesh || !mesh.userData) return

  mesh.userData.animationTime += deltaTime * (isMoving ? 8 : 2)
  mesh.userData.isWalking = isMoving

  const time = mesh.userData.animationTime

  // Antenna wiggle
  const { leftAntenna, rightAntenna } = mesh.userData
  if (leftAntenna && rightAntenna) {
    // Subtle idle movement
    const wiggleAmount = isMoving ? 0.15 : 0.08
    const wiggleSpeed = isMoving ? 3 : 1

    leftAntenna.rotation.y = Math.sin(time * wiggleSpeed) * wiggleAmount
    leftAntenna.rotation.x = -Math.PI / 6 + Math.sin(time * wiggleSpeed * 0.7) * wiggleAmount * 0.5

    rightAntenna.rotation.y = Math.sin(time * wiggleSpeed + Math.PI) * wiggleAmount
    rightAntenna.rotation.x = -Math.PI / 6 + Math.sin(time * wiggleSpeed * 0.7 + Math.PI) * wiggleAmount * 0.5
  }

  // Body bob when walking
  if (isMoving) {
    mesh.position.y += Math.sin(time * 10) * 0.002
  }
}

/**
 * Create color variations for isopods
 */
export const ISOPOD_COLORS = {
  powder_blue: 0x7B9BAA,
  gray: 0x8A8A8A,
  dark_blue: 0x5A7A9A,
  light_blue: 0x9AB5C5
}

/**
 * Get a random color variation
 */
export function getRandomIsopodColor() {
  const colors = Object.values(ISOPOD_COLORS)
  return colors[Math.floor(Math.random() * colors.length)]
}

export default {
  createIsopodMesh,
  updateIsopodAnimation,
  ISOPOD_COLORS,
  getRandomIsopodColor
}
