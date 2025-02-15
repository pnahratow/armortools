
///if arm_physics

class PhysicsWorldRaw {
	world: Ammo.btDiscreteDynamicsWorld;
	dispatcher: Ammo.btCollisionDispatcher;
	contacts: pair_t[] = [];
	body_map: map_t<i32, PhysicsBodyRaw> = map_create();
	time_scale: f32 = 1.0;
	time_step: f32 = 1 / 60;
	max_steps: i32 = 1;
}

let physics_world_active: PhysicsWorldRaw = null;
let physics_world_vec1: Ammo.btVector3 = null;
let physics_world_vec2: Ammo.btVector3 = null;
let physics_world_v1: vec4_t = vec4_create();
let physics_world_v2: vec4_t = vec4_create();

function physics_world_load(done: ()=>void) {
	let b: buffer_t = krom_load_blob("data/plugins/ammo.js");
	globalThis.eval(sys_buffer_to_string(b));
	let print = (s: string) => { krom_log(s); };
	Ammo({print: print}).then(done);
}

function physics_world_create(): PhysicsWorldRaw {
	let pw: PhysicsWorldRaw = new PhysicsWorldRaw();
	physics_world_active = pw;
	physics_world_vec1 = new Ammo.btVector3(0, 0, 0);
	physics_world_vec2 = new Ammo.btVector3(0, 0, 0);
	physics_world_init(pw);
	return pw;
}

function physics_world_reset(pw: PhysicsWorldRaw) {
	for (let body of pw.body_map.values()) physics_world_remove_body(pw, body);
}

function physics_world_init(pw: PhysicsWorldRaw) {
	let broadphase: Ammo.btDbvtBroadphase = new Ammo.btDbvtBroadphase();
	let collision_conf: Ammo.btDefaultCollisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	pw.dispatcher = new Ammo.btCollisionDispatcher(collision_conf);
	let solver: Ammo.btSequentialImpulseConstraintSolver = new Ammo.btSequentialImpulseConstraintSolver();
	pw.world = new Ammo.btDiscreteDynamicsWorld(pw.dispatcher, broadphase, solver, collision_conf);
	physics_world_set_gravity(pw, vec4_create(0, 0, -9.81));
}

function physics_world_set_gravity(pw: PhysicsWorldRaw, v: vec4_t) {
	physics_world_vec1.setValue(v.x, v.y, v.z);
	pw.world.setGravity(physics_world_vec1);
}

function physics_world_add_body(pw: PhysicsWorldRaw, pb: PhysicsBodyRaw) {
	pw.world.addRigidBody(pb.body, pb.group, pb.mask);
	pw.body_map.set(pb.id, pb);
}

function physics_world_remove_body(pw: PhysicsWorldRaw, pb: PhysicsBodyRaw) {
	if (pb.destroyed) return;
	pb.destroyed = true;
	if (pw.world != null) pw.world.removeRigidBody(pb.body);
	pw.body_map.delete(pb.id);
	physics_body_delete(pb);
}

function physics_world_get_contacts(pw: PhysicsWorldRaw, pb: PhysicsBodyRaw): PhysicsBodyRaw[] {
	if (pw.contacts.length == 0) return null;
	let res: PhysicsBodyRaw[] = [];
	for (let i: i32 = 0; i < pw.contacts.length; ++i) {
		let c: pair_t = pw.contacts[i];
		let pb: PhysicsBodyRaw = null;
		if (c.a == pb.body.userIndex) pb = pw.body_map.get(c.b);
		else if (c.b == pb.body.userIndex) pb = pw.body_map.get(c.a);
		if (pb != null && res.indexOf(pb) == -1) res.push(pb);
	}
	return res;
}

function physics_world_get_contact_pairs(pw: PhysicsWorldRaw, pb: PhysicsBodyRaw): pair_t[] {
	if (pw.contacts.length == 0) return null;
	let res: pair_t[] = [];
	for (let i: i32 = 0; i < pw.contacts.length; ++i) {
		let c: pair_t = pw.contacts[i];
		if (c.a == pb.body.userIndex) res.push(c);
		else if (c.b == pb.body.userIndex) res.push(c);
	}
	return res;
}

function physics_world_late_update(pw: PhysicsWorldRaw) {
	let t: f32 = time_delta() * pw.time_scale;
	if (t == 0.0) return; // Simulation paused

	pw.world.stepSimulation(pw.time_step, pw.max_steps, t);
	physics_world_update_contacts(pw);
	for (let body of pw.body_map.values()) physics_body_physics_update(body);
}

function physics_world_update_contacts(pw: PhysicsWorldRaw) {
	pw.contacts = [];
	let disp: Ammo.btDispatcher = pw.dispatcher;
	let num_manifolds: i32 = disp.getNumManifolds();

	for (let i: i32 = 0; i < num_manifolds; ++i) {
		let contact_manifold: Ammo.btPersistentManifold = disp.getManifoldByIndexInternal(i);
		let body0: Ammo.btRigidBody = Ammo.btRigidBody.prototype.upcast(contact_manifold.getBody0());
		let body1: Ammo.btRigidBody = Ammo.btRigidBody.prototype.upcast(contact_manifold.getBody1());

		let num_contacts: i32 = contact_manifold.getNumContacts();
		let pt: Ammo.btManifoldPoint = null;
		let pos_a: Ammo.btVector3 = null;
		let pos_b: Ammo.btVector3 = null;
		let nor: Ammo.btVector3 = null;
		for (let j: i32 = 0; j < num_contacts; ++j) {
			pt = contact_manifold.getContactPoint(j);
			pos_a = pt.get_m_positionWorldOnA();
			pos_b = pt.get_m_positionWorldOnB();
			nor = pt.get_m_normalWorldOnB();
			let cp: pair_t = {
				a: body0.userIndex,
				b: body1.userIndex,
				pos_a: vec4_create(pos_a.x(), pos_a.y(), pos_a.z()),
				pos_b: vec4_create(pos_b.x(), pos_b.y(), pos_b.z()),
				norm_on_b: vec4_create(nor.x(), nor.y(), nor.z()),
				impulse: pt.getAppliedImpulse(),
				distance: pt.getDistance()
			};
			pw.contacts.push(cp);
		}
	}
}

function physics_world_pick_closest(pw: PhysicsWorldRaw, inputX: f32, inputY: f32): PhysicsBodyRaw {
	let camera: camera_object_t = scene_camera;
	let start: vec4_t = vec4_create();
	let end: vec4_t = vec4_create();
	raycast_get_dir(start, end, inputX, inputY, camera);
	let hit: hit_t = physics_world_ray_cast(pw, mat4_get_loc(camera.base.transform.world), end);
	let body: PhysicsBodyRaw = (hit != null) ? hit.body : null;
	return body;
}

function physics_world_ray_cast(pw: PhysicsWorldRaw, from: vec4_t, to: vec4_t, group: i32 = 0x00000001, mask: i32 = 0xffffffff): hit_t {
	let ray_from: Ammo.btVector3 = physics_world_vec1;
	let ray_to: Ammo.btVector3 = physics_world_vec2;
	ray_from.setValue(from.x, from.y, from.z);
	ray_to.setValue(to.x, to.y, to.z);

	let ray_callback: Ammo.ClosestRayResultCallback = new Ammo.ClosestRayResultCallback(ray_from, ray_to);

	ray_callback.set_m_collisionFilterGroup(group);
	ray_callback.set_m_collisionFilterMask(mask);

	let world_dyn: Ammo.btDynamicsWorld = pw.world;
	let world_col: Ammo.btCollisionWorld = world_dyn;
	world_col.rayTest(ray_from, ray_to, ray_callback);
	let pb: PhysicsBodyRaw = null;
	let hit_info: hit_t = null;

	let rc: Ammo.RayResultCallback = ray_callback;
	if (rc.hasHit()) {
		let co: Ammo.btCollisionObject = ray_callback.get_m_collisionObject();
		let body: Ammo.btRigidBody = Ammo.btRigidBody.prototype.upcast(co);
		let hit: Ammo.btVector3 = ray_callback.get_m_hitPointWorld();
		vec4_set(physics_world_v1, hit.x(), hit.y(), hit.z());
		let norm: Ammo.btVector3 = ray_callback.get_m_hitNormalWorld();
		vec4_set(physics_world_v2, norm.x(), norm.y(), norm.z());
		pb = pw.body_map.get(body.userIndex);
		hit_info = {
			body: pb,
			pos: physics_world_v1,
			normal: physics_world_v2
		};
	}

	Ammo.destroy(ray_callback);
	return hit_info;
}

type hit_t = {
	body?: PhysicsBodyRaw;
	pos?: vec4_t;
	normal?: vec4_t;
};

type pair_t = {
	a?: i32;
	b?: i32;
	pos_a?: vec4_t;
	pos_b?: vec4_t;
	norm_on_b?: vec4_t;
	impulse?: f32;
	distance?: f32;
};

///end
