import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
})

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
camera.position.setZ(30)

renderer.render(scene, camera)

// Background
const spaceTexture = new THREE.TextureLoader().load('res/space.jpg')
// scene.background = spaceTexture


// 6 sided dice with with 6 different images
const loader = new THREE.TextureLoader()
const matx = [
  '/res/pups/IMG-0167.jpg',
  '/res/pups/IMG-1102.jpg',
  '/res/pups/IMG-1684.jpg',
  '/res/pups/IMG-1690.jpg',
  '/res/pups/IMG-2108.jpg',
  '/res/pups/IMG-2111.jpg'
].map(path => new THREE.MeshBasicMaterial({ map: loader.load(path) }))
const dice = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), matx)
dice.position.set(0, 0, 0)
scene.add(dice)


// Torus
function create_torus(radius, tube, radialSegments, tubularSegments, color, x, y, z, x_rot=0, y_rot=0, z_rot=0){
  const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
  const material = new THREE.MeshStandardMaterial({ color: color})
  const torus = new THREE.Mesh(geometry, material)
  torus.position.set(x, y, z)
  torus.rotation.x = x_rot
  torus.rotation.y = y_rot
  torus.rotation.z = z_rot
  return torus
}
const toruses = [
  create_torus(5, 0.1, 16, 200, 0xff12ef, 0, 0, 0, 0, 0, 0), // x rotation
  create_torus(5.2, 0.1, 16, 200, 0xffdaef, 0, 0, 0, 0, 0, 0), // y rotation
  create_torus(5.4, 0.1, 16, 200, 0xb612ff, 0, 0, 0, 0, 0, 0) // z rotation
]
toruses.forEach(torus => scene.add(torus))




// Stars
function addStar(){
  const geometry = new THREE.SphereGeometry(0.25, 24, 24)
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff})
  const star = new THREE.Mesh(geometry, material)

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100))

  star.position.set(x, y, z)
  scene.add(star)
}

for(let i = 0; i < 200; i++){
  addStar()
}


// Lights
const pointLight = new THREE.PointLight(0xffffff, 100)
pointLight.position.set(10, 10, 10)

// soft ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
scene.add(pointLight, ambientLight)
// scene.add(pointLight)

// light helper
// const lightHelper = new THREE.PointLightHelper(pointLight)
// const gridHelper = new THREE.GridHelper(200, 50)
// scene.add(lightHelper, gridHelper)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = false
controls.enableRotate = true
controls.enablePan = true

// rotation
controls.autoRotate = true
controls.autoRotateSpeed = -0.5
controls.enableDamping = true
controls.dampingFactor = 0.05



// when mouse enters the torus, it will glow
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let intersected;

function onMouseMove(event){
  event.preventDefault()
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene.children, true)
  intersects.forEach(intersect => {
    // intersect.object.material.emissive.set(0xff0000)
  })
}

window.addEventListener('mousemove', onMouseMove)



// Animation Loop
function animate(){
  requestAnimationFrame(animate)

  toruses[0].rotation.x += 0.02
  toruses[0].rotation.y += 0.01

  toruses[1].rotation.y += 0.01

  dice.rotation.x -= 0.01
  dice.rotation.y -= 0.005
  dice.rotation.z -= 0.001

  controls.update()

  renderer.render(scene, camera)
}

animate()