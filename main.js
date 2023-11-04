import './style.css'

import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

import * as dat from 'dat.gui'
import gsap from 'gsap'

// Debug
// const gui = new dat.GUI()

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
controls.maxPolarAngle = Math.PI/1.85
controls.minPolarAngle = Math.PI/3
controls.minAzimuthAngle = -0.5
controls.maxAzimuthAngle = 0.5
controls.maxDistance = 12
controls.minDistance = 5

// console.log(controls)

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

// Lights

const spot_Light = new THREE.SpotLight(0xffffff, 30, 20, 0.7, 0.75, 0.2)
spot_Light.position.set(0,8,8);
spot_Light.lookAt(0,0,0)

scene.add(spot_Light);

// gui.add(spot_Light, 'angle')
// gui.add(spot_Light, 'decay')
// gui.add(spot_Light, 'penumbra')

// const spotLight_Helper = new THREE.SpotLightHelper( spot_Light );
// scene.add( spotLight_Helper);

// Ambient Light
const ambient_Light = new THREE.AmbientLight(0xd6edff, 0.2)
scene.add(ambient_Light)

/**
 * Setting the Scene Environment
 */

scene.fog = new THREE.Fog(0x2E0423, 15, 30)

const hdrload = new RGBELoader(loading_Manager)
hdrload.load('./ENV.hdr',
    (hdrBG) => {
        hdrBG.mapping = THREE.EquirectangularReflectionMapping
        // scene.background = hdrBG
        scene.environment = hdrBG
    }
)

/**
 * glTF Loader
 */

const glb_Card_Model = new THREE.Object3D()

const BG_Model = new THREE.Group()

const loader = new GLTFLoader(loading_Manager)

// Loading Ground Model
loader.load('./W_Card.glb',
    (gltfScene) => {
        // const loadedmodel = gltfScene
        // console.log(loadedmodel.scene)

        gltfScene.scene.traverse((child) => {
            if(child.isMesh) {
                // child.material.side = THREE.FrontSide
                child.material.normalScale.x = 1.2
                child.material.normalScale.y = -1.2

                if(child.material.map != null && child.material.map.isTexture) {
                  // console.log(child.material.map)
                  child.material.map.minFilter = THREE.LinearFilter
                  child.material.map.magFilter = THREE.NearestFilter
                }
            }
        })

        glb_Card_Model.add(gltfScene.scene)
        glb_Card_Model.matrixAutoUpdate = false
    }
)

// Adding a Ground Plane
const wall_Plane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshPhongMaterial({ color: 0x7D0950, depthWrite: true }));
wall_Plane.position.z = -1
wall_Plane.receiveShadow = true;

const ground_Plane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshPhongMaterial({ color: 0x7D0950, depthWrite: true }));
ground_Plane.position.y = -2
ground_Plane.rotation.x = -Math.PI/2
ground_Plane.receiveShadow = true;

BG_Model.add(glb_Card_Model, wall_Plane, ground_Plane)
scene.add(BG_Model)

/**
 * Animate
 */

/**
* Animating Camera when Loading Done
*/

loading_Manager.onLoad = () => {
  gsap.to(loading_Bar_Container, {
      opacity: 0,
      duration: 1,
      onStart: () => {
        gsap.to(camera.position, {
          x: -5, y: 5, z: 12,
          duration: 3
      })
      },
      onComplete: () => {
          loading_Bar_Container.style.display = 'none'
      }
  })
}

// window.addEventListener('click', () => {
//   console.log(controls.getAzimuthalAngle());
// })

const open_Button = document.getElementById('open_button')
open_Button.addEventListener('click', () => {
  // console.log(glb_Card_Model.children[0].children[0])
  gsap.to(glb_Card_Model.children[0].children[0].position, {
    x: 4.5,
    duration: 1,
    onComplete: () => {
      gsap.to(glb_Card_Model.children[0].children[0].position, {
        x:0, z:0.5,
        duration: 1.5,
        onStart: () => {
          gsap.to(open_Button, {opacity: 0, duration: 1,
            onComplete: () => {
              open_Button.style.visibility = 'hidden'
              // console.log(document.getElementById('map_button').style)
              document.getElementById('map_button').style.visibility = 'visible'
            }
          })
        }
      })
    }
  })
})

document.getElementById('map_button').addEventListener('click', () => {
  window.open('https://goo.gl/maps/CTaSeRSC7cHaXBc27', '_blank')
})

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