import './style.css'

import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

import * as dat from 'dat.gui'
import gsap from 'gsap'

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loading Manager
const loading_Manager = new THREE.LoadingManager()

const loading_Bar = document.getElementById('loading-bar')
const loading_Bar_Container = document.querySelector('.loading-bar-container')

loading_Manager.onProgress = (url, loaded, total) => {
    loading_Bar.value = (loaded / total) * 100
    document.getElementById('progress').innerHTML = Math.floor(loading_Bar.value) + '%'
}

// Lights

const direct_Light = new THREE.DirectionalLight(0xffffff, 8)
direct_Light.target.x = 0
direct_Light.position.x = 0
direct_Light.position.y = 0
direct_Light.position.z = 15

scene.add(direct_Light)

gui.add(direct_Light.position, 'x')
gui.add(direct_Light.position, 'y')
gui.add(direct_Light.position, 'z')

// Ambient Light
const ambient_Light = new THREE.AmbientLight(0xd6edff, 0.2)
scene.add(ambient_Light)

/**
 * Setting the Scene Environment
 */

scene.fog = new THREE.Fog(0xd6edff, 10, 20)

const hdrload = new RGBELoader(loading_Manager)
hdrload.load('./public/ENV.hdr',
    (hdrBG) => {
        hdrBG.mapping = THREE.EquirectangularReflectionMapping
        // scene.background = hdrBG
        scene.environment = hdrBG
    }
)

/**
 * Functions to modify the materials of imported objects.
 */

// Changing UV Wrap Scale
function repeatUV(material, xscale, yscale) {
  material.map.repeat.x = xscale
  material.map.repeat.y = yscale
}

// Changing Normal to Bump
function normalToBump(material, bumpScale) {
  material.normalMap = null
  material.bumpMap = material.map
  material.bumpScale = bumpScale
}

/**
 * glTF Loader
 */

const glb_Card_Model = new THREE.Object3D()

const BG_Model = new THREE.Group()

const loader = new GLTFLoader(loading_Manager)

// Loading Ground Model
loader.load('./public/W_Card.glb',
    (gltfScene) => {
        // const loadedmodel = gltfScene
        // console.log(loadedmodel.scene)

        // gltfScene.scene.traverse((child) => {
        //     if(child.isMesh) {
        //         child.material.side = THREE.FrontSide
        //     }
        // })

        glb_Card_Model.add(gltfScene.scene)
        glb_Card_Model.matrixAutoUpdate = false
    }
)

BG_Model.add(glb_Card_Model)
scene.add(BG_Model)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () =>
{
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
* Camera
*/
// Base camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 500)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 12

// gui.add(camera.position, 'x')
// gui.add(camera.position, 'y')
// gui.add(camera.position, 'z')

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
controls.target.x = 0
controls.maxPolarAngle = Math.PI/1.5
controls.minPolarAngle = Math.PI/3
controls.minAzimuthAngle = -1
controls.maxAzimuthAngle = 1
controls.maxDistance = 12
controls.minDistance = 5

// console.log(controls)

/**
* Animating Camera when Loading Done
*/

loading_Manager.onLoad = () => {
  gsap.to(loading_Bar_Container, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
          loading_Bar_Container.style.display = 'none'

          gsap.to(camera.position, {
              x: -5, y: 5, z: 12,
              duration: 2
          })
      }
  })
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: canvas,
  alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.2

renderer.autoClear = false

window.addEventListener('click', () => {
  console.log(controls.getAzimuthalAngle());
})

/**
 * Animate
 */

// objectClickListener(camera, ButtonScene, raycaster, circle_button_sphere, showLanes)

const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()
    // console.log(elapsedTime)

    // Update Orbital Controls
    controls.update()

    // Render
    renderer.clear()
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()