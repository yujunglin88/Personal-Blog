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
const menuItems = {} // map of menu items, visualised as armillary spheres

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
camera.position.setZ(30)

// postprocessing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// ourline effect
const outline = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outline.edgeThickness = 4.0;
outline.edgeStrength = 8.0;
outline.edgeGlow = 0.5;
outline.visibleEdgeColor.set(0x4c9aff);
outline.hiddenEdgeColor.set(0x4c9aff);
composer.addPass(outline);

// shader effect
const fxaaShader = new ShaderPass(FXAAShader);
fxaaShader.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaShader);

// Torus
function create_torus(radius, tube, radialSegments, tubularSegments, color, x, y, z, name=''){
  const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
  const material = new THREE.MeshStandardMaterial({ color: color})
  const torus = new THREE.Mesh(geometry, material)
  torus.name = name
  torus.position.set(x, y, z)
  return torus
}

// create a armillary sphere with a dice inside
function create_armillary_sphere(name, x, y, z, images=[]){
  // 6 sided dice with with 6 different images
  const loader = new THREE.TextureLoader()
  const matx = images.map(path => new THREE.MeshBasicMaterial({ map: loader.load(path) }))
  const dice = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), matx)
  dice.position.set(x, y, z)
  // create 3 toruses
  const toruses = [
    create_torus(5, 0.1, 16, 200, 0xff12ef, x, y, z),
    create_torus(5.2, 0.1, 16, 200, 0xffdaef, x, y, z),
    create_torus(5.4, 0.1, 16, 200, 0xb612ff, x, y, z)
  ]
  // attach a invisible sphere to the armillary sphere as its outer boundary
  const outerSphereGeo = new THREE.SphereGeometry(5.5, 100, 100)
  const outerSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x4c9aff, transparent: true, opacity: 0.0 })
  const outerSphere = new THREE.Mesh(outerSphereGeo, outerSphereMaterial)
  outerSphere.name = name
  outerSphere.position.set(x, y, z)
  // attach a light source to the center of the armillary sphere
  const sphereLight = new THREE.PointLight(0xa3c8f7, 100)
  sphereLight.position.set(x, y, z)
  sphereLight.visible = false

  // add all the objects to the scene
  toruses.forEach(torus => scene.add(torus))
  scene.add(dice, outerSphere, sphereLight)
  menuItems[name] = [dice, toruses, sphereLight]
}

create_armillary_sphere("pups", 10, 0, 0, [
  '/res/pups/IMG-0167.jpg',
  '/res/pups/IMG-1102.jpg',
  '/res/pups/IMG-1684.jpg',
  '/res/pups/IMG-1690.jpg',
  '/res/pups/IMG-2108.jpg',
  '/res/pups/IMG-2111.jpg'
])
create_armillary_sphere("cats", -10, 0, 0, [
  '/res/pups/IMG-0167.jpg',
  '/res/pups/IMG-1102.jpg',
  '/res/pups/IMG-1684.jpg',
  '/res/pups/IMG-1690.jpg',
  '/res/pups/IMG-2108.jpg',
  '/res/pups/IMG-2111.jpg'
])
console.log(menuItems)

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
const mainPointLight = new THREE.PointLight(0xffffff, 100)
mainPointLight.position.set(0, 0, 0)

// soft ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(mainPointLight, ambientLight)

// light helper
// const lightHelper = new THREE.PointLightHelper(pointLight)
// const gridHelper = new THREE.GridHelper(200, 50)
// scene.add(lightHelper, gridHelper)

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
  selectedObjects.pop();
  selectedObjects.push(object);
}

function intersection(){
  raycaster.setFromCamera(mouse,camera);
  const intersects = raycaster.intersectObjects(scene.children, false);

  if ( intersects.length > 0 ) {
    if ( intersected != intersects[0].object && intersects[0].object.type === "Mesh" ) {
      
      turnOffAllLight()
      intersected = intersects[0].object;

      // console.log(intersected)
      console.log(intersected.name)
      const menu = menuItems[intersected.name]

      if (menu === undefined) { // not a armillary sphere
        return
      }

      // turn on the outline effect
      addSelectedObjects(menu[0]) // obj[0] is the dice in the armillary sphere
      outline.selectedObjects = selectedObjects;

      // turn on the light
      menu[2].visible = true
    }
  } else {
    intersected = null;
    selectedObjects.pop();
    turnOffAllLight()
  }
}

function turnOffAllLight(){
  for (const [key, value] of Object.entries(menuItems)) {
    const [dice, toruses, sphereLight] = value
    sphereLight.visible = false
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


function animate_armillary_sphere(){
  // loop through the scene objects map
  for (const [key, value] of Object.entries(menuItems)) {
    const [dice, toruses, sphereLight] = value
    
    toruses[0].rotation.x += 0.02
    toruses[0].rotation.y += 0.01
  
    toruses[1].rotation.y += 0.01
  
    dice.rotation.x -= 0.01
    dice.rotation.y -= 0.005
    dice.rotation.z -= 0.001
  }
}

// Animation Loop
function animate(){
  requestAnimationFrame(animate)

  animate_armillary_sphere()

  controls.update()

  // renderer.render(scene, camera)
  composer.render();
}

animate()