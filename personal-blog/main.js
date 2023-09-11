import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

// Setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 10, 200)
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  // antialias: true
})

const INTRO = 'intro'
const PROJECTS = 'projects'
const PUPS = 'pups'
const SOCIAL = 'social'

const CLOSE = 'Close'
const CONTENT = 'Content'

const menuItems = {} // map of menu items, visualised as armillary spheres
const menuTitles = {}
const menuContents = {'intro':[INTRO+CLOSE, INTRO+CONTENT],
                      'projects':[PROJECTS+CLOSE, PROJECTS+CONTENT],
                      'pups':[PUPS+CLOSE, PUPS+CONTENT],
                      'social':[SOCIAL+CLOSE, SOCIAL+CONTENT]}
console.log(menuContents)

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

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = true
controls.enableRotate = true
controls.enablePan = true

// rotation
controls.autoRotate = true
controls.autoRotateSpeed = -1
controls.enableDamping = true
controls.dampingFactor = 0.05


function openMenu(){
  if (intersected === null) {
    return
  }
  console.log(intersected.name)
 
  document.getElementById( menuContents[intersected.name][1]).style.display ='block'
  // pause the auto rotation
  controls.autoRotate = false
  controls.enableRotate = false
  // temp disable the mouse click
  window.removeEventListener('mousedown', onMousePress)
  window.removeEventListener('mouseup', onMouseRelease)
  window.removeEventListener('mousemove', onMouseMove)
}

function closeMenu(id) {
  document.getElementById(id).style.display ='none'
  // turn auto rotation back on
  controls.autoRotate = true
  controls.enableRotate = true
  window.addEventListener('mousedown', onMousePress)
  window.addEventListener('mouseup', onMouseRelease)
  window.addEventListener('mousemove', onMouseMove)
}
bindCloseMenues()








// Torus
function create_torus(radius, tube, radialSegments, tubularSegments, color, x, y, z, name=''){
  const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
  const material = new THREE.MeshStandardMaterial({ color: color})
  const torus = new THREE.Mesh(geometry, material)
  torus.name = name
  torus.position.set(x, y, z)
  return torus
}

// blog title
new FontLoader().load('/optimer_bold.typeface.json', function (font) {
  const geometry = new TextGeometry("Welcome to Jeff\'s Space!", {
    font: font,
    size: 2,
    height: 1,
    curveSegments: 10,
    bevelEnabled: false,
    bevelOffset: 0,
    bevelSegments: 1,
    bevelSize: 0.3,
    bevelThickness: 1
  });
  const materials = [
    new THREE.MeshPhongMaterial({ color: 0xff6600 }), // front
    new THREE.MeshPhongMaterial({ color: 0x0000ff })  // side
  ];
  const title = new THREE.Mesh(geometry, materials);
  title.castShadow = true
  // centre the position above the armillary sphere
  title.geometry.computeBoundingBox()
  title.geometry.translate(-title.geometry.boundingBox.max.x/2,0,0)
  title.position.set(0, 15, 0)
  title.name = "title"
  // add the menu text to the scene
  scene.add(title)
  menuTitles["title"] = title
});

// create a armillary sphere with a dice inside
function create_menu(name, titleText, x, y, z, images=[]){
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
  // attach a light source to the title of the menu
  const titleLight = new THREE.PointLight(0xa3c8f7, 100)
  titleLight.position.set(x, y+9, z)
  titleLight.visible = false
  // create the menu title text
  new FontLoader().load('/optimer_bold.typeface.json', function (font) {
    const geometry = new TextGeometry(titleText, {
      font: font,
      size: 2,
      height: 1,
      curveSegments: 10,
      bevelEnabled: false,
      bevelOffset: 0,
      bevelSegments: 1,
      bevelSize: 0.3,
      bevelThickness: 1
    });
    const materials = [
      new THREE.MeshPhongMaterial({ color: 0xff6600 }), // front
      new THREE.MeshPhongMaterial({ color: 0x0000ff })  // side
    ];
    const menuText = new THREE.Mesh(geometry, materials);
    menuText.castShadow = true
    // centre the position above the armillary sphere
    menuText.geometry.computeBoundingBox()
    menuText.geometry.translate(-menuText.geometry.boundingBox.max.x/2,0,0)
    menuText.position.set(x, 8, z)
    menuText.name = name+'Title'
    menuText.visible = false
    // add the menu text to the scene
    scene.add(menuText)
    menuTitles[name] = menuText
  });

  // add all the objects to the scene
  toruses.forEach(torus => scene.add(torus))
  scene.add(dice, outerSphere, sphereLight, titleLight)
  menuItems[name] = [dice, toruses, sphereLight, titleLight]
}

create_menu("intro", "About Me!", 0, 0, 20, [
  '/res/pups/01.jpg',
  '/res/pups/02.jpg',
  '/res/pups/03.jpg',
  '/res/pups/04.jpg',
  '/res/pups/05.jpg',
  '/res/pups/06.jpg'
])
create_menu("projects", "Projects", 20, 0, 0, [
  '/res/pups/01.jpg',
  '/res/pups/02.jpg',
  '/res/pups/03.jpg',
  '/res/pups/04.jpg',
  '/res/pups/05.jpg',
  '/res/pups/06.jpg'
])
create_menu("pups", "Puppies!", -20, 0, 0, [
  '/res/pups/01.jpg',
  '/res/pups/02.jpg',
  '/res/pups/03.jpg',
  '/res/pups/04.jpg',
  '/res/pups/05.jpg',
  '/res/pups/06.jpg'
])
create_menu("social", "Contact Me", 0, 0, -20, [
  '/res/pups/01.jpg',
  '/res/pups/02.jpg',
  '/res/pups/03.jpg',
  '/res/pups/04.jpg',
  '/res/pups/05.jpg',
  '/res/pups/06.jpg'
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
// const lightHelper = new THREE.PointLightHelper(0xffffff)
// const gridHelper = new THREE.GridHelper(200, 50)
// scene.add(gridHelper)


// when mouse enters the torus, it will glow
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let intersected;
const selectedObjects = [];

function addSelectedObjects(object){
  selectedObjects.pop();
  selectedObjects.push(object);
}

function highlightMenu(){
  raycaster.setFromCamera(mouse,camera);
  const intersects = raycaster.intersectObjects(scene.children, false);

  if ( intersects.length > 0 ) {
    if ( intersected != intersects[0].object && intersects[0].object.type === "Mesh" ) {
      turnOffAllLight()
      turnOffAllTitle()
      intersected = intersects[0].object;

      if (menuItems[intersected.name] === undefined) { // not a menu item
        return
      }

      const [dice, toruses, sphereLight, titleLight] = menuItems[intersected.name]

      // turn on the outline effect
      addSelectedObjects(dice) 
      outline.selectedObjects = selectedObjects;

      // turn on the light
      sphereLight.visible = true
      titleLight.visible = true
      menuTitles[intersected.name].visible = true

      controls.autoRotate = false
    }
  } else {
    intersected = null;
    selectedObjects.pop();
    controls.autoRotate = true
    turnOffAllLight()
    turnOffAllTitle()
  }
}

function turnOffAllLight(){
  for (const [key, value] of Object.entries(menuItems)) {
    const [dice, toruses, sphereLight, titleLight] = value
    sphereLight.visible = false
    titleLight.visible = false
  }
}

function turnOffAllTitle(){
  for (const [key, value] of Object.entries(menuTitles)) {
    if (key === 'title') {
      continue
    }
    value.visible = false
  }
}

// Mouse controls
function onMouseMove(event){
  event.preventDefault()
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  highlightMenu()
}




function bindCloseMenues(){
  for (const [key, value] of Object.entries(menuContents)) {
    const [close, content] = value
    document.getElementById(close).onclick = closeMenu.bind(null, content);
    closeMenu(content)
    console.log(close, content)
  }
}

const selectedMenu = []

function onMousePress(event){
  event.preventDefault()

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene.children, false);
  if (intersects.length === 0) {
    return
  }
  selectedMenu.push(intersects[0].object)
}

function onMouseRelease(event){
  event.preventDefault()

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene.children, false);
  if (intersects.length === 0) {
    selectedMenu.pop()
    return
  }
  if (selectedMenu[0] === intersects[0].object) {
    openMenu()
  }
  selectedMenu.pop()
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
// window.addEventListener('click', onMouseClick)
window.addEventListener('mousedown', onMousePress)
window.addEventListener('mouseup', onMouseRelease)
window.addEventListener("resize", windowResize);


function animateArmillarySphere(){
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

function animateMenuText(){
  // make the menu text rotate to face the camera
  for (const [key, value] of Object.entries(menuTitles)) {
    value.rotation.x = camera.rotation.x
    value.rotation.y = camera.rotation.y
    value.rotation.z = camera.rotation.z
  }
}

// Animation Loop
function animate(){
  requestAnimationFrame(animate)

  animateArmillarySphere()
  animateMenuText()

  controls.update()

  // renderer.render(scene, camera)
  composer.render();
}

animate()