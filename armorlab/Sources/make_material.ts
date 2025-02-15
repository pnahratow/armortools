
let make_material_default_scon: shader_context_t = null;
let make_material_default_mcon: material_context_t = null;
let make_material_height_used = false;

function make_material_parse_mesh_material() {
	let m = project_material_data;

	for (let c of m._.shader.contexts) {
		if (c.name == "mesh") {
			array_remove(m._.shader.contexts, c);
			array_remove(m._.shader._.contexts, c);
			make_material_delete_context(c);
			break;
		}
	}

	let con = make_mesh_run({ name: "Material", canvas: null });
	let scon: shader_context_t = shader_context_create(con.data);
	scon._.override_context = {};
	if (con.frag.shared_samplers.length > 0) {
		let sampler = con.frag.shared_samplers[0];
		scon._.override_context.shared_sampler = sampler.substr(sampler.lastIndexOf(" ") + 1);
	}
	if (!context_raw.texture_filter) {
		scon._.override_context.filter = "point";
	}
	scon._.override_context.addressing = "repeat";
	m._.shader.contexts.push(scon);
	m._.shader._.contexts.push(scon);

	context_raw.ddirty = 2;

	///if arm_voxels
	make_material_make_voxel(m);
	///end

	///if (krom_direct3d12 || krom_vulkan)
	render_path_raytrace_dirty = 1;
	///end
}

///if arm_voxels
function make_material_make_voxel(m: material_data_t) {
	let rebuild = true; // heightUsed;
	if (config_raw.rp_gi != false && rebuild) {
		let scon: shader_context_t = null;
		for (let c of m._.shader._.contexts) {
			if (c.name == "voxel") {
				scon = c;
				break;
			}
		}
		if (scon != null) make_voxel_run(scon);
	}
}
///end

function make_material_parse_paint_material() {
	let m = project_material_data;
	let scon: shader_context_t = null;
	let mcon: material_context_t = null;
	for (let c of m._.shader.contexts) {
		if (c.name == "paint") {
			array_remove(m._.shader.contexts, c);
			array_remove(m._.shader._.contexts, c);
			if (c != make_material_default_scon) make_material_delete_context(c);
			break;
		}
	}
	for (let c of m.contexts) {
		if (c.name == "paint") {
			array_remove(m.contexts, c);
			array_remove(m._.contexts, c);
			break;
		}
	}

	let sdata: material_t = { name: "Material", canvas: null };
	let mcon2: material_context_t = { name: "paint", bind_textures: [] };
	let con = make_paint_run(sdata, mcon2);

	let compileError = false;
	let scon2: shader_context_t;
	let _scon: shader_context_t = shader_context_create(con.data);
	if (_scon == null) compileError = true;
	scon2 = _scon;

	if (compileError) return;
	scon2._.override_context = {};
	scon2._.override_context.addressing = "repeat";
	let mcon3: material_context_t = material_context_create(mcon2);

	m._.shader.contexts.push(scon2);
	m._.shader._.contexts.push(scon2);
	m.contexts.push(mcon3);
	m._.contexts.push(mcon3);

	if (make_material_default_scon == null) make_material_default_scon = scon2;
	if (make_material_default_mcon == null) make_material_default_mcon = mcon3;
}

function make_material_get_displace_strength(): f32 {
	let sc = context_main_object().base.transform.scale.x;
	return config_raw.displace_strength * 0.02 * sc;
}

function make_material_voxelgi_half_extents(): string {
	let ext = context_raw.vxao_ext;
	return `const vec3 voxelgiHalfExtents = vec3(${ext}, ${ext}, ${ext});`;
}

function make_material_delete_context(c: shader_context_t) {
	base_notify_on_next_frame(() => { // Ensure pipeline is no longer in use
		shader_context_delete(c);
	});
}
