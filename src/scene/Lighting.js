import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

export class Lighting {
  constructor(scene, renderer) {
    this.scene = scene
    this.renderer = renderer
    this.lights = {}

    this.setupLights()
  }

  async loadHDRI() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    pmremGenerator.compileEquirectangularShader()

    return new Promise((resolve, reject) => {
      const loader = new RGBELoader()
      // Using polyhaven studio lighting HDRI
      loader.load(
        'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
        (texture) => {
          const envMap = pmremGenerator.fromEquirectangular(texture).texture
          this.scene.environment = envMap
          texture.dispose()
          pmremGenerator.dispose()
          resolve(envMap)
        },
        undefined,
        (error) => {
          console.warn('Failed to load HDRI, using fallback environment:', error)
          // Fallback to procedural environment
          this.scene.environment = pmremGenerator.fromScene(this.createFallbackEnvironment()).texture
          pmremGenerator.dispose()
          resolve(this.scene.environment)
        }
      )
    })
  }

  createFallbackEnvironment() {
    const envScene = new THREE.Scene()

    // Gradient background sphere
    const envGeo = new THREE.SphereGeometry(100, 64, 64)
    const envMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      vertexColors: true
    })

    // Add gradient colors to vertices - soft studio-like lighting
    const colors = []
    const positions = envGeo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      const t = (y + 100) / 200
      // Soft studio gradient - warm top, neutral middle, slight cool bottom
      const r = THREE.MathUtils.lerp(0.3, 0.95, t)
      const g = THREE.MathUtils.lerp(0.32, 0.92, t)
      const b = THREE.MathUtils.lerp(0.35, 0.88, t)
      colors.push(r, g, b)
    }
    envGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const envMesh = new THREE.Mesh(envGeo, envMat)
    envScene.add(envMesh)
    envScene.add(new THREE.AmbientLight(0xffffff, 1))

    return envScene
  }

  setupLights() {
    // Key Light - Main directional light (warm, strong)
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.5)
    keyLight.position.set(30, 50, 20)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 10
    keyLight.shadow.camera.far = 100
    keyLight.shadow.camera.left = -30
    keyLight.shadow.camera.right = 30
    keyLight.shadow.camera.top = 30
    keyLight.shadow.camera.bottom = -30
    keyLight.shadow.bias = -0.0001
    keyLight.shadow.normalBias = 0.02
    this.scene.add(keyLight)
    this.lights.keyLight = keyLight

    // Fill Light - Softer, cooler, from opposite side
    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 1.0)
    fillLight.position.set(-25, 35, -15)
    this.scene.add(fillLight)
    this.lights.fillLight = fillLight

    // Rim/Back Light - Creates edge highlights and glass sparkle
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8)
    rimLight.position.set(-10, 20, -40)
    this.scene.add(rimLight)
    this.lights.rimLight = rimLight

    // Ambient Light - Soft overall fill
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4)
    this.scene.add(ambientLight)
    this.lights.ambientLight = ambientLight

    // Hemisphere Light - Natural sky/ground color bleed
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.25)
    this.scene.add(hemiLight)
    this.lights.hemiLight = hemiLight

    // Subtle top light for glass rim highlight
    const topLight = new THREE.PointLight(0xffffff, 0.5, 100)
    topLight.position.set(0, 40, 0)
    this.scene.add(topLight)
    this.lights.topLight = topLight
  }

  update(deltaTime) {
    // Could add subtle light animation here if desired
  }
}
