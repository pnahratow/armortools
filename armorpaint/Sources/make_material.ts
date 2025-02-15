
let make_material_default_scon: shader_context_t = null;
let make_material_default_mcon: material_context_t = null;

let make_material_height_used = false;
let make_material_emis_used = false;
let make_material_subs_used = false;

function make_material_get_mout(): bool {
	for (let n of ui_nodes_get_canvas_material().nodes) if (n.type == "OUTPUT_MATERIAL_PBR") return true;
	return false;
}

function make_material_parse_mesh_material() {
	let m: material_data_t = project_materials[0].data;

	for (let c of m._.shader._.contexts) {
		if (c.name == "mesh") {
			array_remove(m._.shader.contexts, c);
			array_remove(m._.shader._.contexts, c);
			make_material_delete_context(c);
			break;
		}
	}

	if (make_mesh_layer_pass_count > 1) {
		let i: i32 = 0;
		while (i < m._.shader._.contexts.length) {
			let c: shader_context_t = m._.shader._.contexts[i];
			for (let j: i32 = 1; j < make_mesh_layer_pass_count; ++j) {
				if (c.name == "mesh" + j) {
					array_remove(m._.shader.contexts, c);
					array_remove(m._.shader._.contexts, c);
					make_material_delete_context(c);
					i--;
					break;
				}
			}
			i++;
		}

		i = 0;
		while (i < m._.contexts.length) {
			let c: material_context_t = m._.contexts[i];
			for (let j: i32 = 1; j < make_mesh_layer_pass_count; ++j) {
				if (c.name == "mesh" + j) {
					array_remove(m.contexts, c);
					array_remove(m._.contexts, c);
					i--;
					break;
				}
			}
			i++;
		}
	}

	let con: NodeShaderContextRaw = make_mesh_run({ name: "Material", canvas: null });
	let scon: shader_context_t = shader_context_create(con.data);
	scon._.override_context = {};
	if (con.frag.shared_samplers.length > 0) {
		let sampler: string = con.frag.shared_samplers[0];
		scon._.override_context.shared_sampler = sampler.substr(sampler.lastIndexOf(" ") + 1);
	}
	if (!context_raw.texture_filter) {
		scon._.override_context.filter = "point";
	}
	m._.shader.contexts.push(scon);
	m._.shader._.contexts.push(scon);

	for (let i: i32 = 1; i < make_mesh_layer_pass_count; ++i) {
		let con: NodeShaderContextRaw = make_mesh_run({ name: "Material", canvas: null }, i);
		let scon: shader_context_t = shader_context_create(con.data);
		scon._.override_context = {};
		if (con.frag.shared_samplers.length > 0) {
			let sampler: string = con.frag.shared_samplers[0];
			scon._.override_context.shared_sampler = sampler.substr(sampler.lastIndexOf(" ") + 1);
		}
		if (!context_raw.texture_filter) {
			scon._.override_context.filter = "point";
		}
		m._.shader.contexts.push(scon);
		m._.shader._.contexts.push(scon);

		let mcon: material_context_t;
		mcon = material_context_create({ name: "mesh" + i, bind_textures: [] });
		m.contexts.push(mcon);
		m._.contexts.push(mcon);
	}

	context_raw.ddirty = 2;

	///if arm_voxels
	make_material_make_voxel(m);
	///end

	///if (krom_direct3d12 || krom_vulkan || krom_metal)
	render_path_raytrace_dirty = 1;
	///end
}

function make_material_parse_particle_material() {
	let m: material_data_t = context_raw.particle_material;
	let sc: shader_context_t = null;
	for (let c of m._.shader._.contexts) {
		if (c.name == "mesh") {
			sc = c;
			break;
		}
	}
	if (sc != null) {
		array_remove(m._.shader.contexts, sc);
		array_remove(m._.shader._.contexts, sc);
	}
	let con: NodeShaderContextRaw = make_particle_run({ name: "MaterialParticle", canvas: null });
	if (sc != null) make_material_delete_context(sc);
	sc = shader_context_create(con.data);
	m._.shader.contexts.push(sc);
	m._.shader._.contexts.push(sc);
}

function make_material_parse_mesh_preview_material(md: material_data_t = null) {
	if (!make_material_get_mout()) return;

	let m: material_data_t = md == null ? project_materials[0].data : md;
	let scon: shader_context_t = null;
	for (let c of m._.shader._.contexts) {
		if (c.name == "mesh") {
			scon = c;
			break;
		}
	}

	array_remove(m._.shader.contexts, scon);
	array_remove(m._.shader._.contexts, scon);

	let mcon: material_context_t = { name: "mesh", bind_textures: [] };

	let sd: material_t = { name: "Material", canvas: null };
	let con: NodeShaderContextRaw = make_mesh_preview_run(sd, mcon);

	for (let i: i32 = 0; i < m._.contexts.length; ++i) {
		if (m._.contexts[i].name == "mesh") {
			m._.contexts[i] = material_context_create(mcon);
			break;
		}
	}

	if (scon != null) make_material_delete_context(scon);

	let compile_error: bool = false;
	let _scon: shader_context_t = shader_context_create(con.data);
	if (_scon == null) compile_error = true;
	scon = _scon;
	if (compile_error) return;

	m._.shader.contexts.push(scon);
	m._.shader._.contexts.push(scon);
}

///if arm_voxels
function make_material_make_voxel(m: material_data_t) {
	let rebuild: bool = make_material_height_used;
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

function make_material_parse_paint_material(bake_previews = true) {
	if (!make_material_get_mout()) return;

	if (bake_previews) {
		let current: image_t = _g2_current;
		let g2_in_use: bool = _g2_in_use;
		if (g2_in_use) g2_end();
		make_material_bake_node_previews();
		if (g2_in_use) g2_begin(current);
	}

	let m: material_data_t = project_materials[0].data;
	// let scon: TShaderContext = null;
	// let mcon: TMaterialContext = null;
	for (let c of m._.shader._.contexts) {
		if (c.name == "paint") {
			array_remove(m._.shader.contexts, c);
			array_remove(m._.shader._.contexts, c);
			if (c != make_material_default_scon) make_material_delete_context(c);
			break;
		}
	}
	for (let c of m._.contexts) {
		if (c.name == "paint") {
			array_remove(m.contexts, c);
			array_remove(m._.contexts, c);
			break;
		}
	}

	let sdata: material_t = { name: "Material", canvas: ui_nodes_get_canvas_material() };
	let tmcon: material_context_t = { name: "paint", bind_textures: [] };
	let con: NodeShaderContextRaw = make_paint_run(sdata, tmcon);

	let compile_error: bool = false;
	let scon: shader_context_t;
	let _scon: shader_context_t = shader_context_create(con.data);
	if (_scon == null) compile_error = true;
	scon = _scon;
	if (compile_error) return;
	scon._.override_context = {};
	scon._.override_context.addressing = "repeat";
	let mcon: material_context_t = material_context_create(tmcon);

	m._.shader.contexts.push(scon);
	m._.shader._.contexts.push(scon);
	m.contexts.push(mcon);
	m._.contexts.push(mcon);

	if (make_material_default_scon == null) make_material_default_scon = scon;
	if (make_material_default_mcon == null) make_material_default_mcon = mcon;
}

function make_material_bake_node_previews() {
	context_raw.node_previews_used = [];
	if (context_raw.node_previews == null) context_raw.node_previews = map_create();
	make_material_traverse_nodes(ui_nodes_get_canvas_material().nodes, null, []);
	for (let key of context_raw.node_previews.keys()) {
		if (context_raw.node_previews_used.indexOf(key) == -1) {
			let image: image_t = context_raw.node_previews.get(key);
			base_notify_on_next_frame(function() { image_unload(image); });
			context_raw.node_previews.delete(key);
		}
	}
}

function make_material_traverse_nodes(nodes: zui_node_t[], group: zui_node_canvas_t, parents: zui_node_t[]) {
	for (let node of nodes) {
		make_material_bake_node_preview(node, group, parents);
		if (node.type == "GROUP") {
			for (let g of project_material_groups) {
				if (g.canvas.name == node.name) {
					parents.push(node);
					make_material_traverse_nodes(g.canvas.nodes, g.canvas, parents);
					parents.pop();
					break;
				}
			}
		}
	}
}

function make_material_bake_node_preview(node: zui_node_t, group: zui_node_canvas_t, parents: zui_node_t[]) {
	if (node.type == "BLUR") {
		let id: string = parser_material_node_name(node, parents);
		let image: image_t = context_raw.node_previews.get(id);
		context_raw.node_previews_used.push(id);
		let resX: i32 = math_floor(config_get_texture_res_x() / 4);
		let resY: i32 = math_floor(config_get_texture_res_y() / 4);
		if (image == null || image.width != resX || image.height != resY) {
			if (image != null) image_unload(image);
			image = image_create_render_target(resX, resY);
			context_raw.node_previews.set(id, image);
		}

		parser_material_blur_passthrough = true;
		util_render_make_node_preview(ui_nodes_get_canvas_material(), node, image, group, parents);
		parser_material_blur_passthrough = false;
	}
	else if (node.type == "DIRECT_WARP") {
		let id: string = parser_material_node_name(node, parents);
		let image: image_t = context_raw.node_previews.get(id);
		context_raw.node_previews_used.push(id);
		let resX: i32 = math_floor(config_get_texture_res_x());
		let resY: i32 = math_floor(config_get_texture_res_y());
		if (image == null || image.width != resX || image.height != resY) {
			if (image != null) image_unload(image);
			image = image_create_render_target(resX, resY);
			context_raw.node_previews.set(id, image);
		}

		parser_material_warp_passthrough = true;
		util_render_make_node_preview(ui_nodes_get_canvas_material(), node, image, group, parents);
		parser_material_warp_passthrough = false;
	}
	else if (node.type == "BAKE_CURVATURE") {
		let id: string = parser_material_node_name(node, parents);
		let image: image_t = context_raw.node_previews.get(id);
		context_raw.node_previews_used.push(id);
		let resX: i32 = math_floor(config_get_texture_res_x());
		let resY: i32 = math_floor(config_get_texture_res_y());
		if (image == null || image.width != resX || image.height != resY) {
			if (image != null) image_unload(image);
			image = image_create_render_target(resX, resY, tex_format_t.R8);
			context_raw.node_previews.set(id, image);
		}

		if (render_path_paint_live_layer == null) {
			render_path_paint_live_layer = slot_layer_create("_live");
		}

		let _space: i32 = ui_header_worktab.position;
		let _tool: workspace_tool_t = context_raw.tool;
		let _bake_type: bake_type_t = context_raw.bake_type;
		ui_header_worktab.position = space_type_t.SPACE3D;
		context_raw.tool = workspace_tool_t.BAKE;
		context_raw.bake_type = bake_type_t.CURVATURE;

		parser_material_bake_passthrough = true;
		parser_material_start_node = node;
		parser_material_start_group = group;
		parser_material_start_parents = parents;
		make_material_parse_paint_material(false);
		parser_material_bake_passthrough = false;
		parser_material_start_node = null;
		parser_material_start_group = null;
		parser_material_start_parents = null;
		context_raw.pdirty = 1;
		render_path_paint_use_live_layer(true);
		render_path_paint_commands_paint(false);
		render_path_paint_dilate(true, false);
		render_path_paint_use_live_layer(false);
		context_raw.pdirty = 0;

		ui_header_worktab.position = _space;
		context_raw.tool = _tool;
		context_raw.bake_type = _bake_type;
		make_material_parse_paint_material(false);

		let rts: map_t<string, render_target_t> = render_path_render_targets;
		let texpaint_live: render_target_t = rts.get("texpaint_live");

		g2_begin(image);
		g2_draw_image(texpaint_live._image, 0, 0);
		g2_end();
	}
}

function make_material_parse_node_preview_material(node: zui_node_t, group: zui_node_canvas_t = null, parents: zui_node_t[] = null): { scon: shader_context_t, mcon: material_context_t } {
	if (node.outputs.length == 0) return null;
	let sdata: material_t = { name: "Material", canvas: ui_nodes_get_canvas_material() };
	let mcon_raw: material_context_t = { name: "mesh", bind_textures: [] };
	let con: NodeShaderContextRaw = make_node_preview_run(sdata, mcon_raw, node, group, parents);
	let compile_error: bool = false;
	let scon: shader_context_t;
	let _scon: shader_context_t = shader_context_create(con.data);
	if (_scon == null) compile_error = true;
	scon = _scon;
	if (compile_error) return null;
	let mcon: material_context_t = material_context_create(mcon_raw);
	return { scon: scon, mcon: mcon };
}

function make_material_parse_brush() {
	parser_logic_parse(context_raw.brush.canvas);
}

function make_material_blend_mode(frag: NodeShaderRaw, blending: i32, cola: string, colb: string, opac: string): string {
	if (blending == blend_type_t.MIX) {
		return `mix(${cola}, ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.DARKEN) {
		return `mix(${cola}, min(${cola}, ${colb}), ${opac})`;
	}
	else if (blending == blend_type_t.MULTIPLY) {
		return `mix(${cola}, ${cola} * ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.BURN) {
		return `mix(${cola}, vec3(1.0, 1.0, 1.0) - (vec3(1.0, 1.0, 1.0) - ${cola}) / ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.LIGHTEN) {
		return `max(${cola}, ${colb} * ${opac})`;
	}
	else if (blending == blend_type_t.SCREEN) {
		return `(vec3(1.0, 1.0, 1.0) - (vec3(1.0 - ${opac}, 1.0 - ${opac}, 1.0 - ${opac}) + ${opac} * (vec3(1.0, 1.0, 1.0) - ${colb})) * (vec3(1.0, 1.0, 1.0) - ${cola}))`;
	}
	else if (blending == blend_type_t.DODGE) {
		return `mix(${cola}, ${cola} / (vec3(1.0, 1.0, 1.0) - ${colb}), ${opac})`;
	}
	else if (blending == blend_type_t.ADD) {
		return `mix(${cola}, ${cola} + ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.OVERLAY) {
		return `mix(${cola}, vec3(
			${cola}.r < 0.5 ? 2.0 * ${cola}.r * ${colb}.r : 1.0 - 2.0 * (1.0 - ${cola}.r) * (1.0 - ${colb}.r),
			${cola}.g < 0.5 ? 2.0 * ${cola}.g * ${colb}.g : 1.0 - 2.0 * (1.0 - ${cola}.g) * (1.0 - ${colb}.g),
			${cola}.b < 0.5 ? 2.0 * ${cola}.b * ${colb}.b : 1.0 - 2.0 * (1.0 - ${cola}.b) * (1.0 - ${colb}.b)
		), ${opac})`;
	}
	else if (blending == blend_type_t.SOFT_LIGHT) {
		return `((1.0 - ${opac}) * ${cola} + ${opac} * ((vec3(1.0, 1.0, 1.0) - ${cola}) * ${colb} * ${cola} + ${cola} * (vec3(1.0, 1.0, 1.0) - (vec3(1.0, 1.0, 1.0) - ${colb}) * (vec3(1.0, 1.0, 1.0) - ${cola}))))`;
	}
	else if (blending == blend_type_t.LINEAR_LIGHT) {
		return `(${cola} + ${opac} * (vec3(2.0, 2.0, 2.0) * (${colb} - vec3(0.5, 0.5, 0.5))))`;
	}
	else if (blending == blend_type_t.DIFFERENCE) {
		return `mix(${cola}, abs(${cola} - ${colb}), ${opac})`;
	}
	else if (blending == blend_type_t.SUBTRACT) {
		return `mix(${cola}, ${cola} - ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.DIVIDE) {
		return `vec3(1.0 - ${opac}, 1.0 - ${opac}, 1.0 - ${opac}) * ${cola} + vec3(${opac}, ${opac}, ${opac}) * ${cola} / ${colb}`;
	}
	else if (blending == blend_type_t.HUE) {
		node_shader_add_function(frag, str_hue_sat);
		return `mix(${cola}, hsv_to_rgb(vec3(rgb_to_hsv(${colb}).r, rgb_to_hsv(${cola}).g, rgb_to_hsv(${cola}).b)), ${opac})`;
	}
	else if (blending == blend_type_t.SATURATION) {
		node_shader_add_function(frag, str_hue_sat);
		return `mix(${cola}, hsv_to_rgb(vec3(rgb_to_hsv(${cola}).r, rgb_to_hsv(${colb}).g, rgb_to_hsv(${cola}).b)), ${opac})`;
	}
	else if (blending == blend_type_t.COLOR) {
		node_shader_add_function(frag, str_hue_sat);
		return `mix(${cola}, hsv_to_rgb(vec3(rgb_to_hsv(${colb}).r, rgb_to_hsv(${colb}).g, rgb_to_hsv(${cola}).b)), ${opac})`;
	}
	else { // BlendValue
		node_shader_add_function(frag, str_hue_sat);
		return `mix(${cola}, hsv_to_rgb(vec3(rgb_to_hsv(${cola}).r, rgb_to_hsv(${cola}).g, rgb_to_hsv(${colb}).b)), ${opac})`;
	}
}

function make_material_blend_mode_mask(frag: NodeShaderRaw, blending: i32, cola: string, colb: string, opac: string): string {
	if (blending == blend_type_t.MIX) {
		return `mix(${cola}, ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.DARKEN) {
		return `mix(${cola}, min(${cola}, ${colb}), ${opac})`;
	}
	else if (blending == blend_type_t.MULTIPLY) {
		return `mix(${cola}, ${cola} * ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.BURN) {
		return `mix(${cola}, 1.0 - (1.0 - ${cola}) / ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.LIGHTEN) {
		return `max(${cola}, ${colb} * ${opac})`;
	}
	else if (blending == blend_type_t.SCREEN) {
		return `(1.0 - ((1.0 - ${opac}) + ${opac} * (1.0 - ${colb})) * (1.0 - ${cola}))`;
	}
	else if (blending == blend_type_t.DODGE) {
		return `mix(${cola}, ${cola} / (1.0 - ${colb}), ${opac})`;
	}
	else if (blending == blend_type_t.ADD) {
		return `mix(${cola}, ${cola} + ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.OVERLAY) {
		return `mix(${cola}, ${cola} < 0.5 ? 2.0 * ${cola} * ${colb} : 1.0 - 2.0 * (1.0 - ${cola}) * (1.0 - ${colb}), ${opac})`;
	}
	else if (blending == blend_type_t.SOFT_LIGHT) {
		return `((1.0 - ${opac}) * ${cola} + ${opac} * ((1.0 - ${cola}) * ${colb} * ${cola} + ${cola} * (1.0 - (1.0 - ${colb}) * (1.0 - ${cola}))))`;
	}
	else if (blending == blend_type_t.LINEAR_LIGHT) {
		return `(${cola} + ${opac} * (2.0 * (${colb} - 0.5)))`;
	}
	else if (blending == blend_type_t.DIFFERENCE) {
		return `mix(${cola}, abs(${cola} - ${colb}), ${opac})`;
	}
	else if (blending == blend_type_t.SUBTRACT) {
		return `mix(${cola}, ${cola} - ${colb}, ${opac})`;
	}
	else if (blending == blend_type_t.DIVIDE) {
		return `(1.0 - ${opac}) * ${cola} + ${opac} * ${cola} / ${colb}`;
	}
	else { // BlendHue, BlendSaturation, BlendColor, BlendValue
		return `mix(${cola}, ${colb}, ${opac})`;
	}
}

function make_material_get_displace_strength(): f32 {
	let sc: f32 = context_main_object().base.transform.scale.x;
	return config_raw.displace_strength * 0.02 * sc;
}

function make_material_voxelgi_half_extents(): string {
	let ext: f32 = context_raw.vxao_ext;
	return `const vec3 voxelgiHalfExtents = vec3(${ext}, ${ext}, ${ext});`;
}

function make_material_delete_context(c: shader_context_t) {
	base_notify_on_next_frame(() => { // Ensure pipeline is no longer in use
		shader_context_delete(c);
	});
}
