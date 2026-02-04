import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Terrarium } from './scene/Terrarium.js'

// Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

// Camera - positioned to see the terrarium nicely
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(60, 40, 60)

// Renderer with physically correct lighting
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 30
controls.maxDistance = 150
controls.maxPolarAngle = Math.PI / 2 + 0.3 // Allow slight look from below
controls.target.set(0, 10, 0) // Focus on center of terrarium

// Lighting
setupLighting(scene)

// Create terrarium (18" cube = ~45.7cm, we'll use 20 units for nice scale)
const terrarium = new Terrarium(20)
scene.add(terrarium.group)

// Environment for reflections
const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(createEnvironment()).texture

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  terrarium.update()
  renderer.render(scene, camera)
}

// Start
animate()

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function setupLighting(scene) {
  // Ambient light - soft fill
  const ambientLight = new THREE.AmbientLight(0x404060, 0.5)
  scene.add(ambientLight)

  // Main directional light - simulates sunlight/room light
  const mainLight = new THREE.DirectionalLight(0xfff5e6, 2)
  mainLight.position.set(30, 50, 20)
  mainLight.castShadow = true
  mainLight.shadow.mapSize.width = 2048
  mainLight.shadow.mapSize.height = 2048
  mainLight.shadow.camera.near = 10
  mainLight.shadow.camera.far = 100
  mainLight.shadow.camera.left = -30
  mainLight.shadow.camera.right = 30
  mainLight.shadow.camera.top = 30
  mainLight.shadow.camera.bottom = -30
  mainLight.shadow.bias = -0.0001
  scene.add(mainLight)

  // Secondary fill light from opposite side
  const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.8)
  fillLight.position.set(-20, 30, -10)
  scene.add(fillLight)

  // Subtle rim light for glass highlights
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.4)
  rimLight.position.set(0, -10, -30)
  scene.add(rimLight)

  // Soft hemisphere light for natural feel
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.3)
  scene.add(hemiLight)
}

function createEnvironment() {
  // Create a simple environment for reflections
  const envScene = new THREE.Scene()

  // Gradient background sphere
  const envGeo = new THREE.SphereGeometry(100, 32, 32)
  const envMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: true
  })

  // Add gradient colors to vertices
  const colors = []
  const positions = envGeo.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i)
    const t = (y + 100) / 200 // normalize to 0-1
    // Warm top to cool bottom gradient
    const r = THREE.MathUtils.lerp(0.2, 0.9, t)
    const g = THREE.MathUtils.lerp(0.2, 0.85, t)
    const b = THREE.MathUtils.lerp(0.3, 0.8, t)
    colors.push(r, g, b)
  }
  envGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

  const envMesh = new THREE.Mesh(envGeo, envMat)
  envScene.add(envMesh)

  // Add some lights to the env scene
  envScene.add(new THREE.AmbientLight(0xffffff, 1))

  return envScene
}
