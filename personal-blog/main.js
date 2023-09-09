import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

// Setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
})

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
camera.position.setZ(30)

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);

composer.addPass(renderPass);


const outline = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outline.edgeThickness = 10.0;
outline.edgeStrength = 5.0;
outline.visibleEdgeColor.set(0x4c9aff);

composer.addPass(outline);

const fxaaShader = new ShaderPass(FXAAShader);
fxaaShader.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaShader);

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
function create_torus(radius, tube, radialSegments, tubularSegments, color, x, y, z){
  const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
  const material = new THREE.MeshStandardMaterial({ color: color})
  const torus = new THREE.Mesh(geometry, material)
  torus.position.set(x, y, z)
  return torus
}
const toruses = [
  create_torus(5, 0.1, 16, 200, 0xff12ef, 0, 0, 0), 
  create_torus(5.2, 0.1, 16, 200, 0xffdaef, 0, 0, 0), 
  create_torus(5.4, 0.1, 16, 200, 0xb612ff, 0, 0, 0) 
]
toruses.forEach(torus => scene.add(torus))
// attach a invisible sphere to the torus to make it glow
const outerSphereGeo = new THREE.SphereGeometry(5.5, 100, 200)
const outerSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x4c9aff, transparent: true, opacity: 0.0 })
const outerSphere = new THREE.Mesh(outerSphereGeo, outerSphereMaterial)
outerSphere.name = "outerSphere"
scene.add(outerSphere)

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
pointLight.position.set(0, 15, 0)

// soft ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(pointLight, ambientLight)
// scene.add(pointLight)

const sphereLight = new THREE.PointLight(0xffffff, 100)
sphereLight.position.set(0, 0, 0)
scene.add(sphereLight)


// light helper
const lightHelper = new THREE.PointLightHelper(pointLight)
const gridHelper = new THREE.GridHelper(200, 50)
scene.add(lightHelper, gridHelper)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = true
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
const selectedObjects = [];

function addSelectedObjects(object){
  if (selectedObjects.length > 0) {
    selectedObjects.pop();
  }
  selectedObjects.push(object);
}

function intersection(){
  raycaster.setFromCamera(mouse,camera);
  const intersects = raycaster.intersectObjects(scene.children, false);

  if ( intersects.length > 0 ) {
    if ( intersected != intersects[0].object && intersects[0].object.type === "Mesh" ) {

      
      intersected = intersects[0].object;

      console.log(intersected)
      console.log(intersected.name)

      addSelectedObjects(intersected);
      outline.selectedObjects = selectedObjects;
      if (intersected.name == "outerSphere") {
        console.log("outerSpherelight")
        sphereLight.power = 100
      } 
    }
  } else {
    intersected = null;
    if (selectedObjects.length > 0) {
      selectedObjects.pop();
    }
    sphereLight.power = 0
  }
}

function onMouseMove(event){
  event.preventDefault()
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  intersection()
}

// Update camera settings and renderer on screen resize
function windowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  fxaaShader.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
}

window.addEventListener('mousemove', onMouseMove)
window.addEventListener("resize", windowResize);


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

  // renderer.render(scene, camera)
  composer.render();
}

animate()