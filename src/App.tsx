import { useEffect } from 'react'
import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/Addons.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

function App() {
  useEffect(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
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
    document.body.appendChild(renderer.domElement)

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)

    const controls = new OrbitControls(camera, renderer.domElement)

    const stats = new Stats()
    document.body.appendChild(stats.dom)

    camera.position.z = 5

    const animate = function () {
      scene.add(cube)
      controls.update()

      renderer.render(scene, camera)
      window.requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <>
      <canvas id="maze-game" />
    </>
  )
}

export default App
