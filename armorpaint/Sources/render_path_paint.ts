
let render_path_paint_live_layer: SlotLayerRaw = null;
let render_path_paint_live_layer_drawn: i32 = 0;
let render_path_paint_live_layer_locked: bool = false;
let render_path_paint_dilated: bool = true;
let render_path_paint_init_voxels: bool = true; // Bake AO
let render_path_paint_push_undo_last: bool;
let render_path_paint_painto: mesh_object_t = null;
let render_path_paint_planeo: mesh_object_t = null;
let render_path_paint_visibles: bool[] = null;
let render_path_paint_merged_object_visible: bool = false;
let render_path_paint_saved_fov: f32 = 0.0;
let render_path_paint_baking: bool = false;
let _render_path_paint_texpaint: render_target_t;
let _render_path_paint_texpaint_nor: render_target_t;
let _render_path_paint_texpaint_pack: render_target_t;
let _render_path_paint_texpaint_undo: render_target_t;
let _render_path_paint_texpaint_nor_undo: render_target_t;
let _render_path_paint_texpaint_pack_undo: render_target_t;
let render_path_paint_last_x: f32 = -1.0;
let render_path_paint_last_y: f32 = -1.0;

function render_path_paint_init() {

	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_blend0";
		t.width = config_get_texture_res_x();
		t.height = config_get_texture_res_y();
		t.format = "R8";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_blend1";
		t.width = config_get_texture_res_x();
		t.height = config_get_texture_res_y();
		t.format = "R8";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_colorid";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_picker";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_nor_picker";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_pack_picker";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_uv_picker";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_posnortex_picker0";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA128";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_posnortex_picker1";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA128";
		render_path_create_render_target(t);
	}

	render_path_load_shader("shader_datas/copy_mrt3_pass/copy_mrt3_pass");
	render_path_load_shader("shader_datas/copy_mrt3_pass/copy_mrt3RGBA64_pass");
	///if is_paint
	render_path_load_shader("shader_datas/dilate_pass/dilate_pass");
	///end
}

function render_path_paint_commands_paint(dilation = true) {
	let tid: i32 = context_raw.layer.id;

	if (context_raw.pdirty > 0) {
		///if arm_physics
		let particle_physics: bool = context_raw.particle_physics;
		///else
		let particle_physics: bool = false;
		///end
		if (context_raw.tool == workspace_tool_t.PARTICLE && !particle_physics) {
			render_path_set_target("texparticle");
			render_path_clear_target(0x00000000);
			render_path_bind_target("_main", "gbufferD");
			if ((context_raw.xray || config_raw.brush_angle_reject) && config_raw.brush_3d) {
				render_path_bind_target("gbuffer0", "gbuffer0");
			}

			let mo: mesh_object_t = scene_get_child(".ParticleEmitter").ext;
			mo.base.visible = true;
			mesh_object_render(mo, "mesh",_render_path_bind_params);
			mo.base.visible = false;

			mo = scene_get_child(".Particle").ext;
			mo.base.visible = true;
			mesh_object_render(mo, "mesh",_render_path_bind_params);
			mo.base.visible = false;
			render_path_end();
		}

		///if is_paint
		if (context_raw.tool == workspace_tool_t.COLORID) {
			render_path_set_target("texpaint_colorid");
			render_path_clear_target(0xff000000);
			render_path_bind_target("gbuffer2", "gbuffer2");
			render_path_draw_meshes("paint");
			ui_header_handle.redraws = 2;
		}
		else if (context_raw.tool == workspace_tool_t.PICKER || context_raw.tool == workspace_tool_t.MATERIAL) {
			if (context_raw.pick_pos_nor_tex) {
				if (context_raw.paint2d) {
					render_path_set_target("gbuffer0", ["gbuffer1", "gbuffer2"]);
					render_path_draw_meshes("mesh");
				}
				render_path_set_target("texpaint_posnortex_picker0", ["texpaint_posnortex_picker1"]);
				render_path_bind_target("gbuffer2", "gbuffer2");
				render_path_bind_target("_main", "gbufferD");
				render_path_draw_meshes("paint");
				let texpaint_posnortex_picker0: image_t = render_path_render_targets.get("texpaint_posnortex_picker0")._image;
				let texpaint_posnortex_picker1: image_t = render_path_render_targets.get("texpaint_posnortex_picker1")._image;
				let a: DataView = new DataView(image_get_pixels(texpaint_posnortex_picker0));
				let b: DataView = new DataView(image_get_pixels(texpaint_posnortex_picker1));
				context_raw.posx_picked = a.getFloat32(0, true);
				context_raw.posy_picked = a.getFloat32(4, true);
				context_raw.posz_picked = a.getFloat32(8, true);
				context_raw.uvx_picked = a.getFloat32(12, true);
				context_raw.norx_picked = b.getFloat32(0, true);
				context_raw.nory_picked = b.getFloat32(4, true);
				context_raw.norz_picked = b.getFloat32(8, true);
				context_raw.uvy_picked = b.getFloat32(12, true);
			}
			else {
				render_path_set_target("texpaint_picker", ["texpaint_nor_picker", "texpaint_pack_picker", "texpaint_uv_picker"]);
				render_path_bind_target("gbuffer2", "gbuffer2");
				tid = context_raw.layer.id;
				let use_live_layer: bool = context_raw.tool == workspace_tool_t.MATERIAL;
				if (use_live_layer) render_path_paint_use_live_layer(true);
				render_path_bind_target("texpaint" + tid, "texpaint");
				render_path_bind_target("texpaint_nor" + tid, "texpaint_nor");
				render_path_bind_target("texpaint_pack" + tid, "texpaint_pack");
				render_path_draw_meshes("paint");
				if (use_live_layer) render_path_paint_use_live_layer(false);
				ui_header_handle.redraws = 2;
				ui_base_hwnds[2].redraws = 2;

				let texpaint_picker: image_t = render_path_render_targets.get("texpaint_picker")._image;
				let texpaint_nor_picker: image_t = render_path_render_targets.get("texpaint_nor_picker")._image;
				let texpaint_pack_picker: image_t = render_path_render_targets.get("texpaint_pack_picker")._image;
				let texpaint_uv_picker: image_t = render_path_render_targets.get("texpaint_uv_picker")._image;
				let a: DataView = new DataView(image_get_pixels(texpaint_picker));
				let b: DataView = new DataView(image_get_pixels(texpaint_nor_picker));
				let c: DataView = new DataView(image_get_pixels(texpaint_pack_picker));
				let d: DataView = new DataView(image_get_pixels(texpaint_uv_picker));

				if (context_raw.color_picker_callback != null) {
					context_raw.color_picker_callback(context_raw.picked_color);
				}

				// Picked surface values
				///if (krom_metal || krom_vulkan)
				let i0: i32 = 2;
				let i1: i32 = 1;
				let i2: i32 = 0;
				///else
				let i0: i32 = 0;
				let i1: i32 = 1;
				let i2: i32 = 2;
				///end
				let i3: i32 = 3;
				context_raw.picked_color.base = color_set_rb(context_raw.picked_color.base, a.getUint8(i0));
				context_raw.picked_color.base = color_set_gb(context_raw.picked_color.base, a.getUint8(i1));
				context_raw.picked_color.base = color_set_bb(context_raw.picked_color.base, a.getUint8(i2));
				context_raw.picked_color.normal = color_set_rb(context_raw.picked_color.normal, b.getUint8(i0));
				context_raw.picked_color.normal = color_set_gb(context_raw.picked_color.normal, b.getUint8(i1));
				context_raw.picked_color.normal = color_set_bb(context_raw.picked_color.normal, b.getUint8(i2));
				context_raw.picked_color.occlusion = c.getUint8(i0) / 255;
				context_raw.picked_color.roughness = c.getUint8(i1) / 255;
				context_raw.picked_color.metallic = c.getUint8(i2) / 255;
				context_raw.picked_color.height = c.getUint8(i3) / 255;
				context_raw.picked_color.opacity = a.getUint8(i3) / 255;
				context_raw.uvx_picked = d.getUint8(i0) / 255;
				context_raw.uvy_picked = d.getUint8(i1) / 255;
				// Pick material
				if (context_raw.picker_select_material && context_raw.color_picker_callback == null) {
					// matid % 3 == 0 - normal, 1 - emission, 2 - subsurface
					let matid: i32 = math_floor((b.getUint8(3) - (b.getUint8(3) % 3)) / 3);
					for (let m of project_materials) {
						if (m.id == matid) {
							context_set_material(m);
							context_raw.materialid_picked = matid;
							break;
						}
					}
				}
			}
		}
		else {
			///if arm_voxels
			if (context_raw.tool == workspace_tool_t.BAKE && context_raw.bake_type == bake_type_t.AO) {
				if (render_path_paint_init_voxels) {
					render_path_paint_init_voxels = false;
					let _rp_gi: bool = config_raw.rp_gi;
					config_raw.rp_gi = true;
					render_path_base_init_voxels();
					config_raw.rp_gi = _rp_gi;
				}
				render_path_clear_image("voxels", 0x00000000);
				render_path_set_target("");
				render_path_set_viewport(256, 256);
				render_path_bind_target("voxels", "voxels");
				render_path_draw_meshes("voxel");
				render_path_gen_mipmaps("voxels");
			}
			///end

			let texpaint: string = "texpaint" + tid;
			if (context_raw.tool == workspace_tool_t.BAKE && context_raw.brush_time == time_delta()) {
				// Clear to black on bake start
				render_path_set_target(texpaint);
				render_path_clear_target(0xff000000);
			}

			render_path_set_target("texpaint_blend1");
			render_path_bind_target("texpaint_blend0", "tex");
			render_path_draw_shader("shader_datas/copy_pass/copyR8_pass");
			let is_mask: bool = slot_layer_is_mask(context_raw.layer);
			if (is_mask) {
				let ptid: i32 = context_raw.layer.parent.id;
				if (slot_layer_is_group(context_raw.layer.parent)) { // Group mask
					for (let c of slot_layer_get_children(context_raw.layer.parent)) {
						ptid = c.id;
						break;
					}
				}
				render_path_set_target(texpaint, ["texpaint_nor" + ptid, "texpaint_pack" + ptid, "texpaint_blend0"]);
			}
			else {
				render_path_set_target(texpaint, ["texpaint_nor" + tid, "texpaint_pack" + tid, "texpaint_blend0"]);
			}
			render_path_bind_target("_main", "gbufferD");
			if ((context_raw.xray || config_raw.brush_angle_reject) && config_raw.brush_3d) {
				render_path_bind_target("gbuffer0", "gbuffer0");
			}
			render_path_bind_target("texpaint_blend1", "paintmask");
			///if arm_voxels
			if (context_raw.tool == workspace_tool_t.BAKE && context_raw.bake_type == bake_type_t.AO) {
				render_path_bind_target("voxels", "voxels");
			}
			///end
			if (context_raw.colorid_picked) {
				render_path_bind_target("texpaint_colorid", "texpaint_colorid");
			}

			// Read texcoords from gbuffer
			let read_tc: bool = (context_raw.tool == workspace_tool_t.FILL && context_raw.fill_type_handle.position == fill_type_t.FACE) ||
									context_raw.tool == workspace_tool_t.CLONE ||
									context_raw.tool == workspace_tool_t.BLUR ||
									context_raw.tool == workspace_tool_t.SMUDGE;
			if (read_tc) {
				render_path_bind_target("gbuffer2", "gbuffer2");
			}

			render_path_draw_meshes("paint");

			if (context_raw.tool == workspace_tool_t.BAKE && context_raw.bake_type == bake_type_t.CURVATURE && context_raw.bake_curv_smooth > 0) {
				if (render_path_render_targets.get("texpaint_blur") == null) {
					let t = render_target_create();
					t.name = "texpaint_blur";
					t.width = math_floor(config_get_texture_res_x() * 0.95);
					t.height = math_floor(config_get_texture_res_y() * 0.95);
					t.format = "RGBA32";
					render_path_create_render_target(t);
				}
				let blurs: i32 = math_round(context_raw.bake_curv_smooth);
				for (let i: i32 = 0; i < blurs; ++i) {
					render_path_set_target("texpaint_blur");
					render_path_bind_target(texpaint, "tex");
					render_path_draw_shader("shader_datas/copy_pass/copy_pass");
					render_path_set_target(texpaint);
					render_path_bind_target("texpaint_blur", "tex");
					render_path_draw_shader("shader_datas/copy_pass/copy_pass");
				}
			}

			if (dilation && config_raw.dilate == dilate_type_t.INSTANT) {
				render_path_paint_dilate(true, false);
			}
		}
		///end

		///if is_sculpt
		let texpaint: string = "texpaint" + tid;
		render_path_set_target("texpaint_blend1");
		render_path_bind_target("texpaint_blend0", "tex");
		render_path_draw_shader("shader_datas/copy_pass/copyR8_pass");
		render_path_set_target(texpaint, ["texpaint_blend0"]);
		render_path_bind_target("gbufferD_undo", "gbufferD");
		if ((context_raw.xray || config_raw.brush_angle_reject) && config_raw.brush_3d) {
			render_path_bind_target("gbuffer0", "gbuffer0");
		}
		render_path_bind_target("texpaint_blend1", "paintmask");

		// Read texcoords from gbuffer
		let read_tc: bool = (context_raw.tool == workspace_tool_t.FILL && context_raw.fill_type_handle.position == fill_type_t.FACE) ||
								context_raw.tool == workspace_tool_t.CLONE ||
								context_raw.tool == workspace_tool_t.BLUR ||
								context_raw.tool == workspace_tool_t.SMUDGE;
		if (read_tc) {
			render_path_bind_target("gbuffer2", "gbuffer2");
		}
		render_path_bind_target("gbuffer0_undo", "gbuffer0_undo");

		let material_contexts: material_context_t[] = [];
		let shader_contexts: shader_context_t[] = [];
		let mats: material_data_t[] = project_paint_objects[0].materials;
		mesh_object_get_contexts(project_paint_objects[0], "paint", mats, material_contexts, shader_contexts);

		let cc_context: shader_context_t = shader_contexts[0];
		if (const_data_screen_aligned_vb == null) const_data_create_screen_aligned_data();
		g4_set_pipeline(cc_context._.pipe_state);
		uniforms_set_context_consts(cc_context,_render_path_bind_params);
		uniforms_set_obj_consts(cc_context, project_paint_objects[0].base);
		uniforms_set_material_consts(cc_context, material_contexts[0]);
		g4_set_vertex_buffer(const_data_screen_aligned_vb);
		g4_set_index_buffer(const_data_screen_aligned_ib);
		g4_draw();
		render_path_end();
		///end
	}
}

function render_path_paint_use_live_layer(use: bool) {
	let tid: i32 = context_raw.layer.id;
	let hid: i32 = history_undo_i - 1 < 0 ? config_raw.undo_steps - 1 : history_undo_i - 1;
	if (use) {
		_render_path_paint_texpaint = render_path_render_targets.get("texpaint" + tid);
		_render_path_paint_texpaint_undo = render_path_render_targets.get("texpaint_undo" + hid);
		_render_path_paint_texpaint_nor_undo = render_path_render_targets.get("texpaint_nor_undo" + hid);
		_render_path_paint_texpaint_pack_undo = render_path_render_targets.get("texpaint_pack_undo" + hid);
		_render_path_paint_texpaint_nor = render_path_render_targets.get("texpaint_nor" + tid);
		_render_path_paint_texpaint_pack = render_path_render_targets.get("texpaint_pack" + tid);
		render_path_render_targets.set("texpaint_undo" + hid,render_path_render_targets.get("texpaint" + tid));
		render_path_render_targets.set("texpaint" + tid,render_path_render_targets.get("texpaint_live"));
		if (slot_layer_is_layer(context_raw.layer)) {
			render_path_render_targets.set("texpaint_nor_undo" + hid,render_path_render_targets.get("texpaint_nor" + tid));
			render_path_render_targets.set("texpaint_pack_undo" + hid,render_path_render_targets.get("texpaint_pack" + tid));
			render_path_render_targets.set("texpaint_nor" + tid,render_path_render_targets.get("texpaint_nor_live"));
			render_path_render_targets.set("texpaint_pack" + tid,render_path_render_targets.get("texpaint_pack_live"));
		}
	}
	else {
		render_path_render_targets.set("texpaint" + tid, _render_path_paint_texpaint);
		render_path_render_targets.set("texpaint_undo" + hid, _render_path_paint_texpaint_undo);
		if (slot_layer_is_layer(context_raw.layer)) {
			render_path_render_targets.set("texpaint_nor_undo" + hid, _render_path_paint_texpaint_nor_undo);
			render_path_render_targets.set("texpaint_pack_undo" + hid, _render_path_paint_texpaint_pack_undo);
			render_path_render_targets.set("texpaint_nor" + tid, _render_path_paint_texpaint_nor);
			render_path_render_targets.set("texpaint_pack" + tid, _render_path_paint_texpaint_pack);
		}
	}
	render_path_paint_live_layer_locked = use;
}

function render_path_paint_commands_live_brush() {
	let tool: workspace_tool_t = context_raw.tool;
	if (tool != workspace_tool_t.BRUSH &&
		tool != workspace_tool_t.ERASER &&
		tool != workspace_tool_t.CLONE &&
		tool != workspace_tool_t.DECAL &&
		tool != workspace_tool_t.TEXT &&
		tool != workspace_tool_t.BLUR &&
		tool != workspace_tool_t.SMUDGE) {
			return;
	}

	if (render_path_paint_live_layer_locked) return;

	if (render_path_paint_live_layer == null) {
		render_path_paint_live_layer = slot_layer_create("_live");
	}

	let tid: i32 = context_raw.layer.id;
	if (slot_layer_is_mask(context_raw.layer)) {
		render_path_set_target("texpaint_live");
		render_path_bind_target("texpaint" + tid, "tex");
		render_path_draw_shader("shader_datas/copy_pass/copy_pass");
	}
	else {
		render_path_set_target("texpaint_live", ["texpaint_nor_live", "texpaint_pack_live"]);
		render_path_bind_target("texpaint" + tid, "tex0");
		render_path_bind_target("texpaint_nor" + tid, "tex1");
		render_path_bind_target("texpaint_pack" + tid, "tex2");
		render_path_draw_shader("shader_datas/copy_mrt3_pass/copy_mrt3_pass");
	}

	render_path_paint_use_live_layer(true);

	render_path_paint_live_layer_drawn = 2;

	ui_view2d_hwnd.redraws = 2;
	let _x: f32 = context_raw.paint_vec.x;
	let _y: f32 = context_raw.paint_vec.y;
	if (context_raw.brush_locked) {
		context_raw.paint_vec.x = (context_raw.lock_started_x - app_x()) / app_w();
		context_raw.paint_vec.y = (context_raw.lock_started_y - app_y()) / app_h();
	}
	let _last_x: f32 = context_raw.last_paint_vec_x;
	let _last_y: f32 = context_raw.last_paint_vec_y;
	let _pdirty: i32 = context_raw.pdirty;
	context_raw.last_paint_vec_x = context_raw.paint_vec.x;
	context_raw.last_paint_vec_y = context_raw.paint_vec.y;
	if (operator_shortcut(config_keymap.brush_ruler)) {
		context_raw.last_paint_vec_x = context_raw.last_paint_x;
		context_raw.last_paint_vec_y = context_raw.last_paint_y;
	}
	context_raw.pdirty = 2;

	render_path_paint_commands_symmetry();
	render_path_paint_commands_paint();

	render_path_paint_use_live_layer(false);

	context_raw.paint_vec.x = _x;
	context_raw.paint_vec.y = _y;
	context_raw.last_paint_vec_x = _last_x;
	context_raw.last_paint_vec_y = _last_y;
	context_raw.pdirty = _pdirty;
	context_raw.brush_blend_dirty = true;
}

function render_path_paint_commands_cursor() {
	if (!config_raw.brush_3d) return;
	let decal: bool = context_raw.tool == workspace_tool_t.DECAL || context_raw.tool == workspace_tool_t.TEXT;
	let decal_mask: bool = decal && operator_shortcut(config_keymap.decal_mask, shortcut_type_t.DOWN);
	let tool: workspace_tool_t = context_raw.tool;
	if (tool != workspace_tool_t.BRUSH &&
		tool != workspace_tool_t.ERASER &&
		tool != workspace_tool_t.CLONE &&
		tool != workspace_tool_t.BLUR &&
		tool != workspace_tool_t.SMUDGE &&
		tool != workspace_tool_t.PARTICLE &&
		!decal_mask) {
			return;
	}

	let fill_layer: bool = context_raw.layer.fill_layer != null;
	let group_layer: bool = slot_layer_is_group(context_raw.layer);
	if (!base_ui_enabled || base_is_dragging || fill_layer || group_layer) {
		return;
	}

	let mx: f32 = context_raw.paint_vec.x;
	let my: f32 = 1.0 - context_raw.paint_vec.y;
	if (context_raw.brush_locked) {
		mx = (context_raw.lock_started_x - app_x()) / app_w();
		my = 1.0 - (context_raw.lock_started_y - app_y()) / app_h();
	}
	let radius: f32 = decal_mask ? context_raw.brush_decal_mask_radius : context_raw.brush_radius;
	render_path_paint_draw_cursor(mx, my, context_raw.brush_nodes_radius * radius / 3.4);
}

function render_path_paint_draw_cursor(mx: f32, my: f32, radius: f32, tint_r: f32 = 1.0, tint_g: f32 = 1.0, tint_b: f32 = 1.0) {
	let plane: mesh_object_t = scene_get_child(".Plane").ext;
	let geom: mesh_data_t = plane.data;

	if (base_pipe_cursor == null) base_make_cursor_pipe();

	render_path_set_target("");
	g4_set_pipeline(base_pipe_cursor);
	let decal: bool = context_raw.tool == workspace_tool_t.DECAL || context_raw.tool == workspace_tool_t.TEXT;
	let decal_mask: bool = decal && operator_shortcut(config_keymap.decal_mask, shortcut_type_t.DOWN);
	let img: image_t = (decal && !decal_mask) ? context_raw.decal_image : resource_get("cursor.k");
	g4_set_tex(base_cursor_tex, img);
	let gbuffer0: image_t = render_path_render_targets.get("gbuffer0")._image;
	g4_set_tex_depth(base_cursor_gbufferd, gbuffer0);
	g4_set_float2(base_cursor_mouse, mx, my);
	g4_set_float2(base_cursor_tex_step, 1 / gbuffer0.width, 1 / gbuffer0.height);
	g4_set_float(base_cursor_radius, radius);
	let right: vec4_t = vec4_normalize(camera_object_right_world(scene_camera));
	g4_set_float3(base_cursor_camera_right, right.x, right.y, right.z);
	g4_set_float3(base_cursor_tint, tint_r, tint_g, tint_b);
	g4_set_mat(base_cursor_vp, scene_camera.vp);
	let help_mat: mat4_t = mat4_identity();
	mat4_get_inv(help_mat, scene_camera.vp);
	g4_set_mat(base_cursor_inv_vp, help_mat);
	///if (krom_metal || krom_vulkan)
	g4_set_vertex_buffer(mesh_data_get(geom, [{name: "tex", data: "short2norm"}]));
	///else
	g4_set_vertex_buffer(geom._.vertex_buffer);
	///end
	g4_set_index_buffer(geom._.index_buffers[0]);
	g4_draw();

	g4_disable_scissor();
	render_path_end();
}

function render_path_paint_commands_symmetry() {
	if (context_raw.sym_x || context_raw.sym_y || context_raw.sym_z) {
		context_raw.ddirty = 2;
		let t: transform_t = context_raw.paint_object.base.transform;
		let sx: f32 = t.scale.x;
		let sy: f32 = t.scale.y;
		let sz: f32 = t.scale.z;
		if (context_raw.sym_x) {
			vec4_set(t.scale, -sx, sy, sz);
			transform_build_matrix(t);
			render_path_paint_commands_paint(false);
		}
		if (context_raw.sym_y) {
			vec4_set(t.scale, sx, -sy, sz);
			transform_build_matrix(t);
			render_path_paint_commands_paint(false);
		}
		if (context_raw.sym_z) {
			vec4_set(t.scale, sx, sy, -sz);
			transform_build_matrix(t);
			render_path_paint_commands_paint(false);
		}
		if (context_raw.sym_x && context_raw.sym_y) {
			vec4_set(t.scale, -sx, -sy, sz);
			transform_build_matrix(t);
			render_path_paint_commands_paint(false);
		}
		if (context_raw.sym_x && context_raw.sym_z) {
			vec4_set(t.scale, -sx, sy, -sz);
			transform_build_matrix(t);
			render_path_paint_commands_paint(false);
		}
		if (context_raw.sym_y && context_raw.sym_z) {
			vec4_set(t.scale, sx, -sy, -sz);
			transform_build_matrix(t);
			render_path_paint_commands_paint(false);
		}
		if (context_raw.sym_x && context_raw.sym_y && context_raw.sym_z) {
			vec4_set(t.scale, -sx, -sy, -sz);
			transform_build_matrix(t);
			render_path_paint_commands_paint(false);
		}
		vec4_set(t.scale, sx, sy, sz);
		transform_build_matrix(t);
	}
}

function render_path_paint_paint_enabled(): bool {
	///if is_paint
	let fill_layer: bool = context_raw.layer.fill_layer != null && context_raw.tool != workspace_tool_t.PICKER && context_raw.tool != workspace_tool_t.MATERIAL && context_raw.tool != workspace_tool_t.COLORID;
	///end

	///if is_sculpt
	let fill_layer: bool = context_raw.layer.fill_layer != null && context_raw.tool != workspace_tool_t.PICKER && context_raw.tool != workspace_tool_t.MATERIAL;
	///end

	let group_layer: bool = slot_layer_is_group(context_raw.layer);
	return !fill_layer && !group_layer && !context_raw.foreground_event;
}

function render_path_paint_live_brush_dirty() {
	let mx: f32 = render_path_paint_last_x;
	let my: f32 = render_path_paint_last_y;
	render_path_paint_last_x = mouse_view_x();
	render_path_paint_last_y = mouse_view_y();
	if (config_raw.brush_live && context_raw.pdirty <= 0) {
		let moved: bool = (mx != render_path_paint_last_x || my != render_path_paint_last_y) && (context_in_viewport() || context_in_2d_view());
		if (moved || context_raw.brush_locked) {
			context_raw.rdirty = 2;
		}
	}
}

function render_path_paint_begin() {

	///if is_paint
	if (!render_path_paint_dilated) {
		render_path_paint_dilate(config_raw.dilate == dilate_type_t.DELAYED, true);
		render_path_paint_dilated = true;
	}
	///end

	if (!render_path_paint_paint_enabled()) return;

	///if is_paint
	render_path_paint_push_undo_last = history_push_undo;
	///end

	if (history_push_undo && history_undo_layers != null) {
		history_paint();

		///if is_sculpt
		render_path_set_target("gbuffer0_undo");
		render_path_bind_target("gbuffer0", "tex");
		render_path_draw_shader("shader_datas/copy_pass/copy_pass");

		render_path_set_target("gbufferD_undo");
		render_path_bind_target("_main", "tex");
		render_path_draw_shader("shader_datas/copy_pass/copy_pass");
		///end
	}

	///if is_sculpt
	if (history_push_undo2 && history_undo_layers != null) {
		history_paint();
	}
	///end

	if (context_raw.paint2d) {
		render_path_paint_set_plane_mesh();
	}

	if (render_path_paint_live_layer_drawn > 0) render_path_paint_live_layer_drawn--;

	if (config_raw.brush_live && context_raw.pdirty <= 0 && context_raw.ddirty <= 0 && context_raw.brush_time == 0) {
		// Depth is unchanged, draw before gbuffer gets updated
		render_path_paint_commands_live_brush();
	}
}

function render_path_paint_end() {
	render_path_paint_commands_cursor();
	context_raw.ddirty--;
	context_raw.rdirty--;

	if (!render_path_paint_paint_enabled()) return;
	context_raw.pdirty--;
}

function render_path_paint_draw() {
	if (!render_path_paint_paint_enabled()) return;

	///if (!krom_ios) // No hover on iPad, decals are painted by pen release
	if (config_raw.brush_live && context_raw.pdirty <= 0 && context_raw.ddirty > 0 && context_raw.brush_time == 0) {
		// gbuffer has been updated now but brush will lag 1 frame
		render_path_paint_commands_live_brush();
	}
	///end

	if (history_undo_layers != null) {
		render_path_paint_commands_symmetry();

		if (context_raw.pdirty > 0) render_path_paint_dilated = false;

		///if is_paint
		if (context_raw.tool == workspace_tool_t.BAKE) {

			///if (krom_direct3d12 || krom_vulkan || krom_metal)
			let is_raytraced_bake: bool = (context_raw.bake_type == bake_type_t.AO  ||
				context_raw.bake_type == bake_type_t.LIGHTMAP ||
				context_raw.bake_type == bake_type_t.BENT_NORMAL ||
				context_raw.bake_type == bake_type_t.THICKNESS);
			///end

			if (context_raw.bake_type == bake_type_t.NORMAL || context_raw.bake_type == bake_type_t.HEIGHT || context_raw.bake_type == bake_type_t.DERIVATIVE) {
				if (!render_path_paint_baking && context_raw.pdirty > 0) {
					render_path_paint_baking = true;
					let _bake_type: bake_type_t = context_raw.bake_type;
					context_raw.bake_type = context_raw.bake_type == bake_type_t.NORMAL ? bake_type_t.NORMAL_OBJECT : bake_type_t.POSITION; // Bake high poly data
					make_material_parse_paint_material();
					let _paint_object: mesh_object_t = context_raw.paint_object;
					let high_poly: mesh_object_t = project_paint_objects[context_raw.bake_high_poly];
					let _visible: bool = high_poly.base.visible;
					high_poly.base.visible = true;
					context_select_paint_object(high_poly);
					render_path_paint_commands_paint();
					high_poly.base.visible = _visible;
					if (render_path_paint_push_undo_last) history_paint();
					context_select_paint_object(_paint_object);

					let _render_final = () => {
						context_raw.bake_type = _bake_type;
						make_material_parse_paint_material();
						context_raw.pdirty = 1;
						render_path_paint_commands_paint();
						context_raw.pdirty = 0;
						render_path_paint_baking = false;
					}
					let _render_deriv = () => {
						context_raw.bake_type = bake_type_t.HEIGHT;
						make_material_parse_paint_material();
						context_raw.pdirty = 1;
						render_path_paint_commands_paint();
						context_raw.pdirty = 0;
						if (render_path_paint_push_undo_last) history_paint();
						app_notify_on_init(_render_final);
					}
					let bake_type: bake_type_t = context_raw.bake_type as bake_type_t;
					app_notify_on_init(bake_type == bake_type_t.DERIVATIVE ? _render_deriv : _render_final);
				}
			}
			else if (context_raw.bake_type == bake_type_t.OBJECTID) {
				let _layer_filter: i32 = context_raw.layer_filter;
				let _paint_object: mesh_object_t = context_raw.paint_object;
				let is_merged: bool = context_raw.merged_object != null;
				let _visible: bool = is_merged && context_raw.merged_object.base.visible;
				context_raw.layer_filter = 1;
				if (is_merged) context_raw.merged_object.base.visible = false;

				for (let p of project_paint_objects) {
					context_select_paint_object(p);
					render_path_paint_commands_paint();
				}

				context_raw.layer_filter = _layer_filter;
				context_select_paint_object(_paint_object);
				if (is_merged) context_raw.merged_object.base.visible = _visible;
			}
			///if (krom_direct3d12 || krom_vulkan || krom_metal)
			else if (is_raytraced_bake) {
				let dirty: bool = render_path_raytrace_bake_commands(make_material_parse_paint_material);
				if (dirty) ui_header_handle.redraws = 2;
				if (config_raw.dilate == dilate_type_t.INSTANT) { // && raw.pdirty == 1
					render_path_paint_dilate(true, false);
				}
			}
			///end
			else {
				render_path_paint_commands_paint();
			}
		}
		else { // Paint
			render_path_paint_commands_paint();
		}
		///end

		///if is_sculpt
		render_path_paint_commands_paint();
		///end
	}

	if (context_raw.brush_blend_dirty) {
		context_raw.brush_blend_dirty = false;
		///if krom_metal
		render_path_set_target("texpaint_blend0");
		render_path_clear_target(0x00000000);
		render_path_set_target("texpaint_blend1");
		render_path_clear_target(0x00000000);
		///else
		render_path_set_target("texpaint_blend0", ["texpaint_blend1"]);
		render_path_clear_target(0x00000000);
		///end
	}

	if (context_raw.paint2d) {
		render_path_paint_restore_plane_mesh();
	}
}

function render_path_paint_set_plane_mesh() {
	context_raw.paint2d_view = true;
	render_path_paint_painto = context_raw.paint_object;
	render_path_paint_visibles = [];
	for (let p of project_paint_objects) {
		render_path_paint_visibles.push(p.base.visible);
		p.base.visible = false;
	}
	if (context_raw.merged_object != null) {
		render_path_paint_merged_object_visible = context_raw.merged_object.base.visible;
		context_raw.merged_object.base.visible = false;
	}

	let cam: camera_object_t = scene_camera;
	mat4_set_from(context_raw.saved_camera, cam.base.transform.local);
	render_path_paint_saved_fov = cam.data.fov;
	viewport_update_camera_type(camera_type_t.PERSPECTIVE);
	let m: mat4_t = mat4_identity();
	mat4_translate(m, 0, 0, 0.5);
	transform_set_matrix(cam.base.transform, m);
	cam.data.fov = base_default_fov;
	camera_object_build_proj(cam);
	camera_object_build_mat(cam);

	let tw: f32 = 0.95 * ui_view2d_pan_scale;
	let tx: f32 = ui_view2d_pan_x / ui_view2d_ww;
	let ty: f32 = ui_view2d_pan_y / app_h();
	mat4_set_identity(m);
	mat4_scale(m, vec4_create(tw, tw, 1));
	mat4_set_loc(m, vec4_create(tx, ty, 0));
	let m2: mat4_t = mat4_identity();
	mat4_get_inv(m2, scene_camera.vp);
	mat4_mult_mat(m, m2);

	let tiled: bool = ui_view2d_tiled_show;
	if (tiled && scene_get_child(".PlaneTiled") == null) {
		// 3x3 planes
		let posa: i32[] = [32767,0,-32767,0,10922,0,-10922,0,10922,0,-32767,0,10922,0,-10922,0,-10922,0,10922,0,-10922,0,-10922,0,-10922,0,10922,0,-32767,0,32767,0,-32767,0,10922,0,10922,0,10922,0,-10922,0,32767,0,-10922,0,10922,0,32767,0,10922,0,10922,0,32767,0,10922,0,10922,0,-10922,0,-10922,0,-32767,0,10922,0,-32767,0,-10922,0,32767,0,-10922,0,10922,0,10922,0,10922,0,-10922,0,-10922,0,-32767,0,-32767,0,-10922,0,-32767,0,-32767,0,10922,0,-32767,0,-10922,0,-10922,0,-10922,0,-32767,0,32767,0,-32767,0,32767,0,-10922,0,10922,0,-10922,0,10922,0,-10922,0,10922,0,10922,0,-10922,0,10922,0,-10922,0,10922,0,-10922,0,32767,0,-32767,0,32767,0,10922,0,10922,0,10922,0,32767,0,-10922,0,32767,0,32767,0,10922,0,32767,0,32767,0,10922,0,32767,0,-10922,0,-10922,0,-10922,0,10922,0,-32767,0,10922,0,32767,0,-10922,0,32767,0,10922,0,10922,0,10922,0,-10922,0,-32767,0,-10922,0,-10922,0,-32767,0,-10922,0,10922,0,-32767,0,10922,0,-10922,0,-10922,0,-10922,0];
		let nora: i32[] = [0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767,0,-32767];
		let texa: i32[] = [32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0,32767,32767,32767,0,0,0];
		let inda: i32[] = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53];
		let raw: mesh_data_t = {
			name: ".PlaneTiled",
			vertex_arrays: [
				{ attrib: "pos", values: new Int16Array(posa), data: "short4norm" },
				{ attrib: "nor", values: new Int16Array(nora), data: "short2norm" },
				{ attrib: "tex", values: new Int16Array(texa), data: "short2norm" }
			],
			index_arrays: [
				{ values: new Uint32Array(inda), material: 0 }
			],
			scale_pos: 1.5,
			scale_tex: 1.0
		};
		let md: mesh_data_t = mesh_data_create(raw);
		let materials: material_data_t[] = scene_get_child(".Plane").ext.materials;
		let o: mesh_object_t = scene_add_mesh_object(md, materials);
		o.base.name = ".PlaneTiled";
	}

	render_path_paint_planeo = scene_get_child(tiled ? ".PlaneTiled" : ".Plane").ext;
	render_path_paint_planeo.base.visible = true;
	context_raw.paint_object = render_path_paint_planeo;

	let v: vec4_t = vec4_create();
	let sx: f32 = vec4_len(vec4_set(v, m.m[0], m.m[1], m.m[2]));
	quat_from_euler(render_path_paint_planeo.base.transform.rot, -math_pi() / 2, 0, 0);
	vec4_set(render_path_paint_planeo.base.transform.scale, sx, 1.0, sx);
	render_path_paint_planeo.base.transform.scale.z *= config_get_texture_res_y() / config_get_texture_res_x();
	vec4_set(render_path_paint_planeo.base.transform.loc, m.m[12], -m.m[13], 0.0);
	transform_build_matrix(render_path_paint_planeo.base.transform);
}

function render_path_paint_restore_plane_mesh() {
	context_raw.paint2d_view = false;
	render_path_paint_planeo.base.visible = false;
	vec4_set(render_path_paint_planeo.base.transform.loc, 0.0, 0.0, 0.0);
	for (let i: i32 = 0; i < project_paint_objects.length; ++i) {
		project_paint_objects[i].base.visible = render_path_paint_visibles[i];
	}
	if (context_raw.merged_object != null) {
		context_raw.merged_object.base.visible = render_path_paint_merged_object_visible;
	}
	context_raw.paint_object = render_path_paint_painto;
	transform_set_matrix(scene_camera.base.transform, context_raw.saved_camera);
	scene_camera.data.fov = render_path_paint_saved_fov;
	viewport_update_camera_type(context_raw.camera_type);
	camera_object_build_proj(scene_camera);
	camera_object_build_mat(scene_camera);

	render_path_base_draw_gbuffer();
}

function render_path_paint_bind_layers() {
	///if is_paint
	let is_live: bool = config_raw.brush_live && render_path_paint_live_layer_drawn > 0;
	let is_material_tool: bool = context_raw.tool == workspace_tool_t.MATERIAL;
	if (is_live || is_material_tool) render_path_paint_use_live_layer(true);
	///end

	for (let i: i32 = 0; i < project_layers.length; ++i) {
		let l: SlotLayerRaw = project_layers[i];
		render_path_bind_target("texpaint" + l.id, "texpaint" + l.id);

		///if is_paint
		if (slot_layer_is_layer(l)) {
			render_path_bind_target("texpaint_nor" + l.id, "texpaint_nor" + l.id);
			render_path_bind_target("texpaint_pack" + l.id, "texpaint_pack" + l.id);
		}
		///end
	}
}

function render_path_paint_unbind_layers() {
	///if is_paint
	let is_live: bool = config_raw.brush_live && render_path_paint_live_layer_drawn > 0;
	let is_material_tool: bool = context_raw.tool == workspace_tool_t.MATERIAL;
	if (is_live || is_material_tool) render_path_paint_use_live_layer(false);
	///end
}

function render_path_paint_dilate(base: bool, nor_pack: bool) {
	///if is_paint
	if (config_raw.dilate_radius > 0 && !context_raw.paint2d) {
		util_uv_cache_dilate_map();
		base_make_temp_img();
		let tid: i32 = context_raw.layer.id;
		if (base) {
			let texpaint: string = "texpaint";
			render_path_set_target("temptex0");
			render_path_bind_target(texpaint + tid, "tex");
			render_path_draw_shader("shader_datas/copy_pass/copy_pass");
			render_path_set_target(texpaint + tid);
			render_path_bind_target("temptex0", "tex");
			render_path_draw_shader("shader_datas/dilate_pass/dilate_pass");
		}
		if (nor_pack && !slot_layer_is_mask(context_raw.layer)) {
			render_path_set_target("temptex0");
			render_path_bind_target("texpaint_nor" + tid, "tex");
			render_path_draw_shader("shader_datas/copy_pass/copy_pass");
			render_path_set_target("texpaint_nor" + tid);
			render_path_bind_target("temptex0", "tex");
			render_path_draw_shader("shader_datas/dilate_pass/dilate_pass");

			render_path_set_target("temptex0");
			render_path_bind_target("texpaint_pack" + tid, "tex");
			render_path_draw_shader("shader_datas/copy_pass/copy_pass");
			render_path_set_target("texpaint_pack" + tid);
			render_path_bind_target("temptex0", "tex");
			render_path_draw_shader("shader_datas/dilate_pass/dilate_pass");
		}
	}
	///end
}
