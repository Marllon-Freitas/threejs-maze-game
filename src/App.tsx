import { useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

const GRID_SIZE = 14

function App() {
  useEffect(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#008eb9')

    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    const canvas = document.getElementById('maze-game') as HTMLCanvasElement
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight('#ffffff', 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 100
    scene.add(directionalLight)

    const planeGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
    const planeMaterial = new THREE.MeshPhongMaterial({
      color: 0x808080,
      side: THREE.DoubleSide
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true

    const grid = new THREE.GridHelper(
      GRID_SIZE,
      GRID_SIZE,
      '#000000',
      '#000000'
    )
    grid.position.y = 0.01

    const wallGeometry = new THREE.BoxGeometry(GRID_SIZE, 1, 1)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: '#8d4225',
      roughness: 0.7,
      metalness: 0.2
    })
    const walls: THREE.Mesh[] = []

    const createWall = (position: THREE.Vector3, rotation: number = 0) => {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial)
      wall.position.copy(position)
      wall.rotation.y = rotation
      wall.castShadow = true
      wall.receiveShadow = true
      return wall
    }

    walls.push(
      createWall(new THREE.Vector3(0, 0.5, Math.floor(GRID_SIZE / 2))),
      createWall(new THREE.Vector3(0, 0.5, -Math.floor(GRID_SIZE / 2))),
      createWall(
        new THREE.Vector3(Math.floor(GRID_SIZE / 2), 0.5, 0),
        Math.PI / 2
      ),
      createWall(
        new THREE.Vector3(-Math.floor(GRID_SIZE / 2), 0.5, 0),
        Math.PI / 2
      )
    )

    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: '#505050',
      metalness: 0.9,
      roughness: 0.1
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(
      Math.floor(GRID_SIZE / 2) - 2,
      0.5,
      Math.floor(-GRID_SIZE / 2) + 2
    )
    sphere.castShadow = true

    const goalGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const goalMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    })
    const goal = new THREE.Mesh(goalGeometry, goalMaterial)
    goal.position.set(0, 0.25, 0)
    goal.castShadow = true
    goal.receiveShadow = true

    const baseGroup = new THREE.Group()
    baseGroup.add(plane, grid, ...walls, sphere, goal)
    scene.add(baseGroup)

    const maxTilt = 0.5
    let mouseX = 0
    let mouseY = 0
    let isMouseDown = false

    window.addEventListener('mousedown', () => {
      isMouseDown = true
    })

    window.addEventListener('mouseup', () => {
      isMouseDown = false
    })

    window.addEventListener('mousemove', (event) => {
      if (isMouseDown) {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1
      }
    })

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableRotate = false
    controls.enablePan = false
    controls.enableZoom = true
    controls.minDistance = 2
    controls.maxDistance = 30

    const physics = {
      gravity: 0.5,
      friction: 0.98,
      accelerationFactor: 40,
      bounce: 0.8,
      minBounceVelocity: 0.1,
      maxVelocity: 20
    }

    const sphereVelocity = new THREE.Vector3(0, 0, 0)

    const checkCollision = (sphere: THREE.Mesh, wall: THREE.Mesh) => {
      const sphereBox = new THREE.Box3().setFromObject(sphere)
      const wallBox = new THREE.Box3().setFromObject(wall)

      if (sphereBox.intersectsBox(wallBox)) {
        const normal = sphere.position.clone().sub(wall.position).normalize()

        if (wall.rotation.y !== 0) {
          normal.setX(Math.sign(normal.x)).setZ(0)
        } else {
          normal.setZ(Math.sign(normal.z)).setX(0)
        }

        const impactSpeed = Math.abs(sphereVelocity.dot(normal))

        if (impactSpeed > physics.minBounceVelocity) {
          const reflection = sphereVelocity
            .clone()
            .reflect(normal)
            .multiplyScalar(physics.bounce)

          if (reflection.length() > physics.maxVelocity) {
            reflection.normalize().multiplyScalar(physics.maxVelocity)
          }

          sphereVelocity.copy(reflection)
          sphere.position.add(normal.multiplyScalar(0.1))
        }
      }
    }

    let previousTime = 0

    const updateSphere = (deltaTime: number) => {
      if (isMouseDown) {
        baseGroup.rotation.z = mouseX * maxTilt
        baseGroup.rotation.x = mouseY * maxTilt
      }

      const tiltX = baseGroup.rotation.x
      const tiltZ = baseGroup.rotation.z

      const acceleration = new THREE.Vector3(
        -tiltZ * physics.accelerationFactor,
        0,
        tiltX * physics.accelerationFactor
      )

      sphereVelocity.add(acceleration.multiplyScalar(deltaTime))

      if (sphereVelocity.length() > 0.01) {
        sphereVelocity.multiplyScalar(physics.friction)
      }

      if (sphereVelocity.length() > physics.maxVelocity) {
        sphereVelocity.normalize().multiplyScalar(physics.maxVelocity)
      }

      sphere.position.add(sphereVelocity.clone().multiplyScalar(deltaTime))

      walls.forEach((wall) => checkCollision(sphere, wall))

      if (sphere.position.y < 0.5) {
        sphere.position.y = 0.5
        sphereVelocity.y = 0
      }

      sphere.rotation.x += sphereVelocity.z * 0.5
      sphere.rotation.z -= sphereVelocity.x * 0.5
    }

    const checkWin = () => {
      if (sphere.position.distanceTo(goal.position) < 0.5) {
        alert('Win!')

        sphere.position.set(
          Math.floor(GRID_SIZE / 2) - 2,
          0.5,
          Math.floor(-GRID_SIZE / 2) + 2
        )
        sphereVelocity.set(0, 0, 0)
        baseGroup.rotation.set(0, 0, 0)
      }
    }

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - previousTime) / 1000
      previousTime = currentTime

      updateSphere(deltaTime)
      checkWin()

      controls.update()
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    camera.position.set(0, 15, 15)
    camera.lookAt(0, 0, 0)

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    })

    requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousedown', () => {})
      window.removeEventListener('mouseup', () => {})
      window.removeEventListener('mousemove', () => {})
      renderer.dispose()
    }
  }, [])

  return (
    <>
      <canvas id="maze-game" />
      <div className="fixed bottom-4 left-4 text-white bg-black bg-opacity-50 p-2.5 rounded-md text-sm">
        Click and drag to tilt the maze
      </div>
    </>
  )
}

export default App
