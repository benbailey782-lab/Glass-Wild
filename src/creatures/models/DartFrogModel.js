import * as THREE from 'three'

/**
 * Create a dart frog mesh
 * More detailed than isopod/springtail since it's larger and more visible
 */
export function createDartFrogMesh(sizeRatio = 1, colors = {}) {
  const group = new THREE.Group()

  // Base size in world units (1 unit = 1 inch)
  const baseSize = 1.5 * sizeRatio

  // Materials
  const primaryColor = colors.primary || 0x2d5a27 // Green
  const secondaryColor = colors.secondary || 0x1a1a1a // Black

  const primaryMaterial = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.7,
    metalness: 0.1
  })

  const secondaryMaterial = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.8,
    metalness: 0
  })

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.2
  })

  // Body - main ellipsoid
  const bodyGeo = new THREE.SphereGeometry(baseSize * 0.35, 12, 8)
  bodyGeo.scale(1, 0.7, 1.2)
  const body = new THREE.Mesh(bodyGeo, primaryMaterial)
  body.position.y = baseSize * 0.25
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // Head - connected to body
  const headGeo = new THREE.SphereGeometry(baseSize * 0.22, 10, 8)
  headGeo.scale(1, 0.8, 1)
  const head = new THREE.Mesh(headGeo, primaryMaterial)
  head.position.set(0, baseSize * 0.32, baseSize * 0.35)
  head.castShadow = true
  group.add(head)

  // Eyes - prominent on sides of head
  const eyeGeo = new THREE.SphereGeometry(baseSize * 0.08, 8, 6)
  for (let i = -1; i <= 1; i += 2) {
    const eye = new THREE.Mesh(eyeGeo, eyeMaterial)
    eye.position.set(i * baseSize * 0.15, baseSize * 0.4, baseSize * 0.45)
    group.add(eye)
  }

  // Snout
  const snoutGeo = new THREE.SphereGeometry(baseSize * 0.1, 6, 4)
  snoutGeo.scale(1, 0.6, 1.2)
  const snout = new THREE.Mesh(snoutGeo, primaryMaterial)
  snout.position.set(0, baseSize * 0.28, baseSize * 0.5)
  group.add(snout)

  // Front legs
  const legMaterial = primaryMaterial
  for (let i = -1; i <= 1; i += 2) {
    // Upper leg
    const upperLegGeo = new THREE.CylinderGeometry(baseSize * 0.04, baseSize * 0.05, baseSize * 0.25, 6)
    const upperLeg = new THREE.Mesh(upperLegGeo, legMaterial)
    upperLeg.position.set(i * baseSize * 0.25, baseSize * 0.15, baseSize * 0.2)
    upperLeg.rotation.z = i * 0.5
    upperLeg.rotation.x = -0.3
    group.add(upperLeg)

    // Lower leg
    const lowerLegGeo = new THREE.CylinderGeometry(baseSize * 0.03, baseSize * 0.04, baseSize * 0.2, 6)
    const lowerLeg = new THREE.Mesh(lowerLegGeo, legMaterial)
    lowerLeg.position.set(i * baseSize * 0.35, baseSize * 0.05, baseSize * 0.25)
    lowerLeg.rotation.z = i * 0.3
    group.add(lowerLeg)

    // Foot - disc with toe pads
    const footGeo = new THREE.SphereGeometry(baseSize * 0.06, 6, 4)
    footGeo.scale(1, 0.3, 1.2)
    const foot = new THREE.Mesh(footGeo, legMaterial)
    foot.position.set(i * baseSize * 0.38, baseSize * 0.02, baseSize * 0.3)
    group.add(foot)
  }

  // Back legs - larger and folded
  for (let i = -1; i <= 1; i += 2) {
    // Thigh
    const thighGeo = new THREE.CylinderGeometry(baseSize * 0.06, baseSize * 0.07, baseSize * 0.3, 6)
    const thigh = new THREE.Mesh(thighGeo, legMaterial)
    thigh.position.set(i * baseSize * 0.2, baseSize * 0.18, -baseSize * 0.15)
    thigh.rotation.z = i * 0.8
    thigh.rotation.x = 0.5
    group.add(thigh)

    // Shin
    const shinGeo = new THREE.CylinderGeometry(baseSize * 0.04, baseSize * 0.05, baseSize * 0.35, 6)
    const shin = new THREE.Mesh(shinGeo, legMaterial)
    shin.position.set(i * baseSize * 0.35, baseSize * 0.08, -baseSize * 0.05)
    shin.rotation.z = i * -0.3
    shin.rotation.x = -0.8
    group.add(shin)

    // Back foot
    const backFootGeo = new THREE.SphereGeometry(baseSize * 0.08, 6, 4)
    backFootGeo.scale(1, 0.3, 1.5)
    const backFoot = new THREE.Mesh(backFootGeo, legMaterial)
    backFoot.position.set(i * baseSize * 0.4, baseSize * 0.02, -baseSize * 0.2)
    group.add(backFoot)
  }

  // Add some black spots/markings (simplified)
  const spotGeo = new THREE.SphereGeometry(baseSize * 0.08, 6, 4)
  spotGeo.scale(1, 0.2, 1)
  const spotPositions = [
    [0, baseSize * 0.35, baseSize * 0.1],
    [baseSize * 0.15, baseSize * 0.3, -baseSize * 0.1],
    [-baseSize * 0.12, baseSize * 0.32, 0],
    [0.08, baseSize * 0.28, baseSize * 0.25]
  ]
  spotPositions.forEach(pos => {
    const spot = new THREE.Mesh(spotGeo, secondaryMaterial)
    spot.position.set(...pos)
    group.add(spot)
  })

  return group
}

/**
 * Update dart frog animation
 */
export function updateDartFrogAnimation(mesh, deltaTime, isMoving, isHunting, isCalling) {
  if (!mesh) return

  const time = performance.now() / 1000

  // Breathing animation (always)
  const breathScale = 1 + Math.sin(time * 2) * 0.02
  mesh.scale.y = breathScale

  // Bobbing when moving
  if (isMoving) {
    mesh.position.y += Math.sin(time * 10) * 0.02
    mesh.rotation.z = Math.sin(time * 8) * 0.05
  }

  // Hunting crouch
  if (isHunting) {
    mesh.scale.y *= 0.9 // Lower stance
  }

  // Calling animation - throat pulse
  if (isCalling) {
    mesh.scale.y = 1 + Math.sin(time * 15) * 0.1
  }
}

export default { createDartFrogMesh, updateDartFrogAnimation }
