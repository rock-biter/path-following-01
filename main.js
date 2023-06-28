import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import fontSrc from 'three/examples/fonts/helvetiker_bold.typeface.json?url'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { gsap } from 'gsap'
import { Vector3 } from 'three/src/math/Vector3'
import { GrannyKnot } from 'three/examples/jsm/curves/CurveExtras'

// console.log(CurveExtras)

/**
 * Cursor
 */
const cursor = new THREE.Vector2()

const ammo = []

/**
 * Scene
 */
const scene = new THREE.Scene()

let font

/**
 * Manhattan
 */
const material = new THREE.MeshNormalMaterial({
	wireframe: true,
})

const curve = new GrannyKnot()
const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.1, 3, true)
// tubeGeometry.scale(0.5,0.54,)
const tubeMaterial = material.clone()
tubeMaterial.opacity = 0.3
tubeMaterial.transparent = true
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
scene.add(tube)

const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)

const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

mesh.add(new THREE.AxesHelper(1))
mesh.rotation.x = 0.35
mesh.rotation.y = 0.78

mesh.position.set(2, 3, -2)

const enemy = mesh.clone()
enemy.rotation.set(0, 0, 0)
enemy.position.set(1, 1, 5)

const cannon = enemy.clone()
cannon.position.set(0, 0, -0.6)
cannon.scale.set(0.2, 0.2, 1.5)
enemy.add(cannon)

// console.log(mesh)
scene.add(enemy)

const axesHelper = new THREE.AxesHelper(4)
scene.add(axesHelper)

const gridHelper = new THREE.GridHelper(4, 4)
gridHelper.position.set(2, -0.01, 2)

scene.add(gridHelper)

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

camera.position.set(0, 20, 30)
// camera.lookAt(new THREE.Vector3(0, 2.5, 0))

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
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(2, 1, 2)

const clock = new THREE.Clock()

/**
 * frame loop
 */
function tic() {
	const delta = clock.getDelta()
	const time = clock.getElapsedTime()
	const loopTime = 50
	const t = (time % loopTime) / loopTime
	const t2 = ((time + 0.1) % loopTime) / loopTime

	const pos = tube.geometry.parameters.path.getPointAt(t)
	const pos2 = tube.geometry.parameters.path.getPointAt(t2)

	mesh.position.copy(pos)
	mesh.lookAt(pos2)

	controls.update()

	// updateEnemy()

	renderer.render(scene, camera)

	ammo.forEach((ammo) => {
		ammo.position.addScaledVector(ammo.userData.vel, delta)
	})

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

function createVector(
	name,
	v = new THREE.Vector3(),
	origin = new THREE.Vector3()
) {
	const color = new THREE.Color(Math.random(), Math.random(), Math.random())

	const h = new THREE.ArrowHelper(
		v.clone().normalize(),
		origin.clone(),
		v.length(),
		color.getHex(),
		0.3,
		0.2
	)

	const textPos = v.clone().multiplyScalar(0.65).add(origin)

	createText(name, textPos, color)
	scene.add(h)

	return h
}

const loader = new FontLoader()
loader.load(fontSrc, function (res) {
	font = res

	// init()
})

function createText(text, position, color) {
	const geometry = new TextGeometry(text, {
		font,
		size: 0.3,
		height: 0.05,
	})

	geometry.computeBoundingBox()

	let mesh = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({
			color: color.getHex(),
		})
	)

	console.log(geometry.boundingBox)

	mesh.position.copy(position)

	mesh.position.y += 0.2
	mesh.position.x -=
		(geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2

	scene.add(mesh)
}

let enemyDirHelper, enemyDirProj, fireInterval

function updateEnemy() {
	if (enemy) {
		enemy.rotation.x = Math.PI * 0.5 * cursor.y
		enemy.rotation.y = -Math.PI * 0.5 * cursor.x
	}

	if (enemyDirHelper) {
		const enemyDir = new Vector3(0, 0, -1)
		enemyDir.transformDirection(enemy.matrixWorld)

		enemyDirHelper.setDirection(enemyDir)

		const d = mesh.position.clone()
		d.sub(enemy.position)

		const dot = enemyDir.dot(d.normalize())
		console.log('dot:', dot)

		const v = enemyDir.clone().multiplyScalar(4)
		v.projectOnVector(d)

		enemyDirProj.setLength(v.length())

		if (dot >= 0.995) {
			if (!fireInterval) {
				fire()
				fireInterval = setInterval(fire, 200)
			}
		} else {
			clearInterval(fireInterval)
			fireInterval = undefined
		}
	}
}

function init() {
	const v = new Vector3(0, 0, -1)
	v.transformDirection(mesh.matrixWorld).multiplyScalar(4)

	createVector('', v, mesh.position)

	const enemyDir = new Vector3(0, 0, -1)
	enemyDir.transformDirection(enemy.matrixWorld).multiplyScalar(4)

	enemyDirHelper = createVector('', enemyDir, enemy.position)

	const d = mesh.position.clone()
	d.sub(enemy.position)

	createVector('D', d, enemy.position)

	const proj = d.clone()
	proj.normalize().multiplyScalar(4)
	enemyDirProj = createVector('', proj, enemy.position)
}

window.addEventListener('mousemove', (e) => {
	cursor.x = 2 * (e.clientX / window.innerWidth) - 1
	cursor.y = -2 * (e.clientY / window.innerHeight) + 1
})

const ammoMaterial = new THREE.MeshNormalMaterial()

function fire() {
	const geometry = new THREE.IcosahedronGeometry(0.05, 1)

	const mesh = new THREE.Mesh(geometry, ammoMaterial)
	mesh.position.copy(enemy.position)

	mesh.userData.vel = new Vector3(0, 0, -1)
	mesh.userData.vel.transformDirection(enemy.matrixWorld).multiplyScalar(10)

	scene.add(mesh)
	ammo.push(mesh)
}

// window.addEventListener('click', fire)
