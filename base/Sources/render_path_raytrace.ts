
///if (krom_direct3d12 || krom_vulkan || krom_metal)

let render_path_raytrace_frame: i32 = 0;
let render_path_raytrace_ready: bool = false;
let render_path_raytrace_dirty: i32 = 0;
let render_path_raytrace_uv_scale: f32 = 1.0;
let render_path_raytrace_first: bool = true;
let render_path_raytrace_f32a: Float32Array = new Float32Array(24);
let render_path_raytrace_help_mat: mat4_t = mat4_identity();
let render_path_raytrace_vb_scale: f32 = 1.0;
let render_path_raytrace_vb: vertex_buffer_t;
let render_path_raytrace_ib: index_buffer_t;

let render_path_raytrace_last_envmap: image_t = null;
let render_path_raytrace_is_bake: bool = false;

///if krom_direct3d12
let render_path_raytrace_ext: string = ".cso";
///elseif krom_metal
let render_path_raytrace_ext: string = ".metal";
///else
let render_path_raytrace_ext: string = ".spirv";
///end

///if is_lab
let render_path_raytrace_last_texpaint: image_t = null;
///end

function render_path_raytrace_init() {
}

function render_path_raytrace_commands(use_live_layer: bool) {
	if (!render_path_raytrace_ready || render_path_raytrace_is_bake) {
		render_path_raytrace_ready = true;
		render_path_raytrace_is_bake = false;
		let mode: string = context_raw.pathtrace_mode == path_trace_mode_t.CORE ? "core" : "full";
		render_path_raytrace_raytrace_init("raytrace_brute_" + mode + render_path_raytrace_ext);
		render_path_raytrace_last_envmap = null;
	}

	if (!context_raw.envmap_loaded) {
		context_load_envmap();
		context_update_envmap();
	}

	let probe: world_data_t = scene_world;
	let saved_envmap: image_t = context_raw.show_envmap_blur ? probe._.radiance_mipmaps[0] : context_raw.saved_envmap;

	if (render_path_raytrace_last_envmap != saved_envmap) {
		render_path_raytrace_last_envmap = saved_envmap;

		let bnoise_sobol: image_t = scene_embedded.get("bnoise_sobol.k");
		let bnoise_scramble: image_t = scene_embedded.get("bnoise_scramble.k");
		let bnoise_rank: image_t = scene_embedded.get("bnoise_rank.k");

		let l: any = base_flatten(true);
		krom_raytrace_set_textures(l.texpaint, l.texpaint_nor, l.texpaint_pack, saved_envmap.texture_, bnoise_sobol.texture_, bnoise_scramble.texture_, bnoise_rank.texture_);
	}

	///if is_lab
	let l: any = base_flatten(true);
	if (l.texpaint != render_path_raytrace_last_texpaint) {
		render_path_raytrace_last_texpaint = l.texpaint;

		let bnoise_sobol: image_t = scene_embedded.get("bnoise_sobol.k");
		let bnoise_scramble: image_t = scene_embedded.get("bnoise_scramble.k");
		let bnoise_rank: image_t = scene_embedded.get("bnoise_rank.k");

		krom_raytrace_set_textures(l.texpaint, l.texpaint_nor, l.texpaint_pack, saved_envmap.texture_, bnoise_sobol.texture_, bnoise_scramble.texture_, bnoise_rank.texture_);
	}
	///end

	if (context_raw.pdirty > 0 || render_path_raytrace_dirty > 0) {
		base_flatten(true);
	}

	let cam: camera_object_t = scene_camera;
	let ct: transform_t = cam.base.transform;
	mat4_set_from(render_path_raytrace_help_mat, cam.v);
	mat4_mult_mat(render_path_raytrace_help_mat, cam.p);
	mat4_get_inv(render_path_raytrace_help_mat, render_path_raytrace_help_mat);
	render_path_raytrace_f32a[0] = transform_world_x(ct);
	render_path_raytrace_f32a[1] = transform_world_y(ct);
	render_path_raytrace_f32a[2] = transform_world_z(ct);
	render_path_raytrace_f32a[3] = render_path_raytrace_frame;
	///if krom_metal
	// frame = (frame % (16)) + 1; // _PAINT
	render_path_raytrace_frame = render_path_raytrace_frame + 1; // _RENDER
	///else
	render_path_raytrace_frame = (render_path_raytrace_frame % 4) + 1; // _PAINT
	// frame = frame + 1; // _RENDER
	///end
	render_path_raytrace_f32a[4] = render_path_raytrace_help_mat.m[0];
	render_path_raytrace_f32a[5] = render_path_raytrace_help_mat.m[1];
	render_path_raytrace_f32a[6] = render_path_raytrace_help_mat.m[2];
	render_path_raytrace_f32a[7] = render_path_raytrace_help_mat.m[3];
	render_path_raytrace_f32a[8] = render_path_raytrace_help_mat.m[4];
	render_path_raytrace_f32a[9] = render_path_raytrace_help_mat.m[5];
	render_path_raytrace_f32a[10] = render_path_raytrace_help_mat.m[6];
	render_path_raytrace_f32a[11] = render_path_raytrace_help_mat.m[7];
	render_path_raytrace_f32a[12] = render_path_raytrace_help_mat.m[8];
	render_path_raytrace_f32a[13] = render_path_raytrace_help_mat.m[9];
	render_path_raytrace_f32a[14] = render_path_raytrace_help_mat.m[10];
	render_path_raytrace_f32a[15] = render_path_raytrace_help_mat.m[11];
	render_path_raytrace_f32a[16] = render_path_raytrace_help_mat.m[12];
	render_path_raytrace_f32a[17] = render_path_raytrace_help_mat.m[13];
	render_path_raytrace_f32a[18] = render_path_raytrace_help_mat.m[14];
	render_path_raytrace_f32a[19] = render_path_raytrace_help_mat.m[15];
	render_path_raytrace_f32a[20] = scene_world.strength * 1.5;
	if (!context_raw.show_envmap) render_path_raytrace_f32a[20] = -render_path_raytrace_f32a[20];
	render_path_raytrace_f32a[21] = context_raw.envmap_angle;
	render_path_raytrace_f32a[22] = render_path_raytrace_uv_scale;
	///if is_lab
	render_path_raytrace_f32a[22] *= scene_meshes[0].data.scale_tex;
	///end

	let framebuffer: image_t = render_path_render_targets.get("buf")._image;
	krom_raytrace_dispatch_rays(framebuffer.render_target_, render_path_raytrace_f32a.buffer);

	if (context_raw.ddirty == 1 || context_raw.pdirty == 1) {
		///if krom_metal
		context_raw.rdirty = 128;
		///else
		context_raw.rdirty = 4;
		///end
	}
	context_raw.ddirty--;
	context_raw.pdirty--;
	context_raw.rdirty--;

	// raw.ddirty = 1; // _RENDER
}

function render_path_raytrace_raytrace_init(shaderName: string, build: bool = true) {
	if (render_path_raytrace_first) {
		render_path_raytrace_first = false;
		scene_embed_data("bnoise_sobol.k");
		scene_embed_data("bnoise_scramble.k");
		scene_embed_data("bnoise_rank.k");
	}

	let shader: ArrayBuffer = data_get_blob(shaderName);
	if (build) render_path_raytrace_build_data();
	krom_raytrace_init(shader, render_path_raytrace_vb.buffer_, render_path_raytrace_ib.buffer_, render_path_raytrace_vb_scale);
}

function render_path_raytrace_build_data() {
	if (context_raw.merged_object == null) util_mesh_merge();
	///if is_paint
	let mo: mesh_object_t = !context_layer_filter_used() ? context_raw.merged_object : context_raw.paint_object;
	///else
	let mo: mesh_object_t = scene_meshes[0];
	///end
	let md: mesh_data_t = mo.data;
	let mo_scale: f32 = mo.base.transform.scale.x; // Uniform scale only
	render_path_raytrace_vb_scale = md.scale_pos * mo_scale;
	if (mo.base.parent != null) render_path_raytrace_vb_scale *= mo.base.parent.transform.scale.x;
	render_path_raytrace_vb = md._.vertex_buffer;
	render_path_raytrace_ib = md._.index_buffers[0];
}

function render_path_raytrace_draw(useLiveLayer: bool) {
	let is_live: bool = config_raw.brush_live && render_path_paint_live_layer_drawn > 0;
	if (context_raw.ddirty > 1 || context_raw.pdirty > 0 || is_live) render_path_raytrace_frame = 0;

	///if krom_metal
	// Delay path tracing additional samples while painting
	let down: bool = mouse_down() || pen_down();
	if (context_in_viewport() && down) render_path_raytrace_frame = 0;
	///end

	render_path_raytrace_commands(useLiveLayer);

	if (config_raw.rp_bloom != false) {
		render_path_base_draw_bloom("buf");
	}
	render_path_set_target("buf");
	render_path_draw_meshes("overlay");
	render_path_set_target("buf");
	render_path_base_draw_compass();
	render_path_set_target("taa");
	render_path_bind_target("buf", "tex");
	render_path_draw_shader("shader_datas/compositor_pass/compositor_pass");
	render_path_set_target("");
	render_path_bind_target("taa", "tex");
	render_path_draw_shader("shader_datas/copy_pass/copy_pass");
	if (config_raw.brush_3d) {
		render_path_paint_commands_cursor();
	}
}

///end
