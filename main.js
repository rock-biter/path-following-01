import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GrannyKnot } from 'three/examples/jsm/curves/CurveExtras'
import { gsap } from 'gsap'

// console.log(CurveExtras)

const progress = {
	value: 0,
}

/**
 * Cursor
 */
const cursor = new THREE.Vector2()

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * Helpers
 */
const axesHelper = new THREE.AxesHelper(4)
scene.add(axesHelper)

const gridHelper = new THREE.GridHelper(4, 4)
gridHelper.position.set(2, -0.01, 2)

scene.add(gridHelper)

/**
 * Cube
 */
const geometry = new THREE.BoxGeometry(2, 2, 2)
const material = new THREE.MeshNormalMaterial()

const cube = new THREE.Mesh(geometry, material)
cube.add(new THREE.AxesHelper(4))

cube.position.set(0.5, 0.5, 0.5)

// scene.add(cube)

/**
 * Path
 */
// const curve = new THREE.CatmullRomCurve3([
// 	new THREE.Vector3(0, 0, 0),
// 	new THREE.Vector3(5, 0, -10),
// 	new THREE.Vector3(-5, 0, -20),
// 	new THREE.Vector3(5, 0, -30),
// 	new THREE.Vector3(-5, 0, -40),
// ])
const curve = new GrannyKnot()

const tubeGeom = new THREE.TubeGeometry(curve, 300, 3, 20, true)
const tubeMat = new THREE.MeshNormalMaterial({
	transparent: true,
	opacity: 0.9,
	flatShading: true,
	side: THREE.BackSide,
})

const tube = new THREE.Mesh(tubeGeom, tubeMat)

scene.add(tube)

function step(progress, delta = 0.01) {
	const pos = curve.getPointAt(progress)
	const pos2 = curve.getPointAt(Math.min(progress + delta, 1))

	camera.position.copy(pos)
	camera.lookAt(pos2)
}

// step(0.15)

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}
/**
 * Camera
 */
const fov = 60
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)

// camera.position.set(0, 3, 6)
camera.lookAt(0, 0, 0)
// mesh.add(camera)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
	logarithmicDepthBuffer: true,
})
renderer.setSize(sizes.width, sizes.height)

const pixelRatio = Math.min(window.devicePixelRatio, 2)
renderer.setPixelRatio(pixelRatio)
document.body.appendChild(renderer.domElement)

/**
 * OrbitControls
 */
// const controls = new OrbitControls(camera, renderer.domElement)
// controls.enableDamping = true
// controls.target.set(2, 1, 2)

const clock = new THREE.Clock()

/**
 * frame loop
 */
function tic() {
	// controls.update()

	const time = clock.getElapsedTime()
	const loopTime = 30
	const p = (time % loopTime) / loopTime
	// console.log(p)
	step(p)

	renderer.render(scene, camera)

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('resize', onResize)

function onResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}

window.addEventListener('mousemove', (e) => {
	cursor.x = 2 * (e.clientX / window.innerWidth) - 1
	cursor.y = -2 * (e.clientY / window.innerHeight) + 1
})

// window.addEventListener('click', () => {
// 	gsap.fromTo(
// 		progress,
// 		{ value: 0 },
// 		{
// 			value: 1,
// 			duration: 4,
// 			onUpdate: () => {
// 				step(progress.value)
// 			},
// 		}
// 	)
// })
