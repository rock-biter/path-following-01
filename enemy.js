import {
	BoxGeometry,
	IcosahedronGeometry,
	Mesh,
	MeshNormalMaterial,
	Vector3,
} from 'three'

const material = new MeshNormalMaterial({
	// wireframe: true,
})

const minDistanceFire = 20

export class Enemy {
	maxSpeed = 16
	steeringVel = new Vector3()
	repulseVel = new Vector3()
	velocity = new Vector3(0, 0, 1)
	steeringFactor = 25
	ammo = []
	fireInterval = undefined
	fireRate = 200

	constructor({ position = new Vector3(), maxSpeed = 16, scene }) {
		this.scene = scene
		this.maxSpeed = maxSpeed
		this.velocity.normalize().multiplyScalar(maxSpeed)

		const geometry = this.getGeometry()
		this.mesh = new Mesh(geometry, material)
		this.scene.add(this.mesh)

		this.position.copy(position)
	}

	get position() {
		return this.mesh.position
	}

	set position(position) {
		this.mesh.copy(position)
	}

	getGeometry() {
		return new BoxGeometry(0.8, 0.8, 0.8)
	}

	update(dt = 0) {
		this.ammo.forEach((ammo) => {
			ammo.position.addScaledVector(ammo.userData.vel, dt)
		})

		this.updateSteeringVel(dt)
		this.updateRepulseVel(dt)

		this.velocity.addScaledVector(this.steeringVel, dt)
		this.velocity.addScaledVector(this.repulseVel, dt)
		this.velocity.normalize().multiplyScalar(this.maxSpeed)
		const pos2 = this.position.clone().addScaledVector(this.velocity, dt)

		this.mesh.lookAt(pos2)
		this.position.copy(pos2)

		const enemyDir = new Vector3(0, 0, 1)
		enemyDir.transformDirection(this.mesh.matrixWorld)

		// enemyDirHelper.setDirection(vel)

		const d = this.getDistanceFromTarget()

		const dot = enemyDir.dot(d.normalize())
		// console.log('dot:', dot)

		const v = enemyDir.clone().multiplyScalar(4)
		v.projectOnVector(d)

		// enemyDirProj.setLength(v.length())

		if (dot >= 0.995) {
			if (!this.fireInterval) {
				this.fire()
				this.fireInterval = setInterval(() => {
					this.fire()
				}, this.fireRate)
			}
		} else {
			clearInterval(this.fireInterval)
			this.fireInterval = undefined
		}
	}

	getDistanceFromTarget(target) {
		if (target) {
			this.target = target
		}

		if (!this.target) return new Vector3()

		const d = this.target.position.clone()
		d.sub(this.position)

		return d
	}

	follow(mesh) {
		this.target = mesh
	}

	updateSteeringVel() {
		if (!this.target) {
			this.steeringVel.setScalar(0)
			return
		}

		const d = this.getDistanceFromTarget()

		const planeN = this.velocity.clone().normalize()
		// const plane = new THREE.Plane(planeN)

		d.projectOnPlane(planeN)
		d.normalize().multiplyScalar(this.steeringFactor)
		this.steeringVel.copy(d)
	}

	updateRepulseVel() {
		if (!this.target) {
			this.repulseVel.setScalar(0)
			return
		}

		const d = this.getDistanceFromTarget().length()

		if (d < 6) {
			this.repulseVel.copy(this.steeringVel).negate()
			this.repulseVel.multiplyScalar(6 - d).multiplyScalar(2)
		} else if (d > 20) {
			this.repulseVel.set(0, 0, 0)
		}
	}

	fire() {
		const d = this.getDistanceFromTarget()
		if (d.length() > minDistanceFire || !this.target) return

		const geometry = new IcosahedronGeometry(0.2, 1)

		const mesh = new Mesh(geometry, material)
		mesh.position.copy(this.position)

		mesh.userData.vel = new Vector3(0, 0, 1)
		mesh.userData.vel
			.transformDirection(this.mesh.matrixWorld)
			.multiplyScalar(80 + this.velocity.length())

		this.scene.add(mesh)
		this.ammo.push(mesh)
	}
}
