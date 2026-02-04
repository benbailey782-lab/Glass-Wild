import * as THREE from 'three'

export class Environment {
  constructor(scene, terrariumSize = 20) {
    this.scene = scene
    this.size = terrariumSize
    this.dustParticles = null
    this.dustVelocities = []

    this.createAtmosphere()
    this.createDustParticles()
  }

  createAtmosphere() {
    // Add subtle depth-based fog for atmosphere inside terrarium
    // Using FogExp2 for more natural falloff
    this.scene.fog = new THREE.FogExp2(0x2a3a2a, 0.008)

    // Create volumetric fog effect using transparent planes
    this.createVolumetricFog()
  }

  createVolumetricFog() {
    // Disabled - using scene fog only
  }

  createDustParticles() {
    const size = this.size
    const particleCount = 150

    // Create dust mote geometry
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const opacities = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      // Position within terrarium bounds
      positions[i * 3] = (Math.random() - 0.5) * (size - 4)
      positions[i * 3 + 1] = 3 + Math.random() * (size - 6)
      positions[i * 3 + 2] = (Math.random() - 0.5) * (size - 4)

      // Vary particle size
      sizes[i] = 0.03 + Math.random() * 0.06

      // Vary opacity
      opacities[i] = 0.2 + Math.random() * 0.4

      // Store velocity for animation
      this.dustVelocities.push({
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.005 + 0.002, // Slight upward bias
        z: (Math.random() - 0.5) * 0.01,
        phase: Math.random() * Math.PI * 2
      })
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))

    // Custom shader material for dust particles
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xffffff) }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;

        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;

        void main() {
          // Soft circular particle
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    this.dustParticles = new THREE.Points(geometry, dustMaterial)
    this.dustParticles.renderOrder = 999
    this.scene.add(this.dustParticles)
  }

  update(deltaTime, elapsedTime) {
    if (!this.dustParticles) return

    const positions = this.dustParticles.geometry.attributes.position.array
    const size = this.size
    const bounds = (size - 4) / 2

    for (let i = 0; i < this.dustVelocities.length; i++) {
      const vel = this.dustVelocities[i]
      const idx = i * 3

      // Add some turbulence/wandering motion
      const turbulence = Math.sin(elapsedTime * 0.5 + vel.phase) * 0.003

      positions[idx] += vel.x + turbulence
      positions[idx + 1] += vel.y + Math.sin(elapsedTime + vel.phase) * 0.002
      positions[idx + 2] += vel.z + Math.cos(elapsedTime * 0.7 + vel.phase) * 0.003

      // Wrap around bounds
      if (positions[idx] > bounds) positions[idx] = -bounds
      if (positions[idx] < -bounds) positions[idx] = bounds
      if (positions[idx + 1] > size - 3) positions[idx + 1] = 3
      if (positions[idx + 1] < 3) positions[idx + 1] = size - 3
      if (positions[idx + 2] > bounds) positions[idx + 2] = -bounds
      if (positions[idx + 2] < -bounds) positions[idx + 2] = bounds
    }

    this.dustParticles.geometry.attributes.position.needsUpdate = true

    // Update shader time uniform
    this.dustParticles.material.uniforms.time.value = elapsedTime
  }
}
