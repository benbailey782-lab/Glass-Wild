import * as THREE from 'three'

/**
 * Create a simple springtail mesh
 * Springtails are TINY (0.04 inches = ~1mm) so we use simple geometry
 */
export function createSpringtailMesh(sizeRatio = 1) {
  const group = new THREE.Group()

  // Base size in world units (1 unit = 1 inch)
  const baseSize = 0.04 * sizeRatio

  // Material - white/cream colored
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc,
    roughness: 0.8,
    metalness: 0.1
  })

  // Body - elongated ellipsoid
  const bodyGeo = new THREE.SphereGeometry(baseSize * 0.5, 6, 4)
  bodyGeo.scale(1, 0.6, 1.5)
  const body = new THREE.Mesh(bodyGeo, bodyMaterial)
  body.castShadow = true
  group.add(body)

  // Head - small sphere
  const headGeo = new THREE.SphereGeometry(baseSize * 0.25, 4, 4)
  const head = new THREE.Mesh(headGeo, bodyMaterial)
  head.position.set(0, 0, baseSize * 0.6)
  head.castShadow = true
  group.add(head)

  // Antennae - two tiny lines
  const antennaMaterial = new THREE.LineBasicMaterial({ color: 0xd4d4c4 })
  for (let i = -1; i <= 1; i += 2) {
    const points = [
      new THREE.Vector3(i * baseSize * 0.1, 0, baseSize * 0.7),
      new THREE.Vector3(i * baseSize * 0.2, baseSize * 0.1, baseSize * 0.9)
    ]
    const antennaGeo = new THREE.BufferGeometry().setFromPoints(points)
    const antenna = new THREE.Line(antennaGeo, antennaMaterial)
    group.add(antenna)
  }

  // Position at ground level
  group.position.y = baseSize * 0.3

  return group
}

/**
 * Update springtail animation
 */
export function updateSpringtailAnimation(mesh, deltaTime, isMoving, isFleeing) {
  if (!mesh) return

  // Subtle wobble when moving
  if (isMoving) {
    const speed = isFleeing ? 30 : 15
    mesh.rotation.z = Math.sin(performance.now() / 1000 * speed) * 0.1
    mesh.rotation.x = Math.sin(performance.now() / 1000 * speed * 0.7) * 0.05
  } else {
    mesh.rotation.z *= 0.9
    mesh.rotation.x *= 0.9
  }
}

export default { createSpringtailMesh, updateSpringtailAnimation }
