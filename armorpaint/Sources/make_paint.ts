
///if (is_paint || is_forge)

function make_paint_is_raytraced_bake(): bool {
	///if (krom_direct3d12 || krom_vulkan || krom_metal)
	return context_raw.bake_type == bake_type_t.INIT;
	///else
	return false;
	///end
}

function make_paint_run(data: material_t, matcon: material_context_t): NodeShaderContextRaw {
	let context_id: string = "paint";

	let con_paint: NodeShaderContextRaw = node_shader_context_create(data, {
		name: context_id,
		depth_write: false,
		compare_mode: "always", // TODO: align texcoords winding order
		// cull_mode: "counter_clockwise",
		cull_mode: "none",
		vertex_elements: [{name: "pos", data: "short4norm"}, {name: "nor", data: "short2norm"}, {name: "tex", data: "short2norm"}],
		color_attachments:
			context_raw.tool == workspace_tool_t.COLORID ? ["RGBA32"] :
			(context_raw.tool == workspace_tool_t.PICKER && context_raw.pick_pos_nor_tex) ? ["RGBA128", "RGBA128"] :
			(context_raw.tool == workspace_tool_t.PICKER || context_raw.tool == workspace_tool_t.MATERIAL) ? ["RGBA32", "RGBA32", "RGBA32", "RGBA32"] :
			(context_raw.tool == workspace_tool_t.BAKE && make_paint_is_raytraced_bake()) ? ["RGBA64", "RGBA64"] :
				["RGBA32", "RGBA32", "RGBA32", "R8"]
	});

	con_paint.data.color_writes_red = [true, true, true, true];
	con_paint.data.color_writes_green = [true, true, true, true];
	con_paint.data.color_writes_blue = [true, true, true, true];
	con_paint.data.color_writes_alpha = [true, true, true, true];
	con_paint.allow_vcols = mesh_data_get_vertex_array(context_raw.paint_object.data, 'col') != null;

	let vert: NodeShaderRaw = node_shader_context_make_vert(con_paint);
	let frag: NodeShaderRaw = node_shader_context_make_frag(con_paint);
	frag.ins = vert.outs;

	///if (krom_direct3d12 || krom_vulkan || krom_metal)
	if (context_raw.tool == workspace_tool_t.BAKE && context_raw.bake_type == bake_type_t.INIT) {
		// Init raytraced bake
		make_bake_position_normal(vert, frag);
		con_paint.data.shader_from_source = true;
		con_paint.data.vertex_shader = node_shader_get(vert);
		con_paint.data.fragment_shader = node_shader_get(frag);
		return con_paint;
	}
	///end

	if (context_raw.tool == workspace_tool_t.BAKE) {
		make_bake_set_color_writes(con_paint);
	}

	if (context_raw.tool == workspace_tool_t.COLORID || context_raw.tool == workspace_tool_t.PICKER || context_raw.tool == workspace_tool_t.MATERIAL) {
		make_colorid_picker_run(vert, frag);
		con_paint.data.shader_from_source = true;
		con_paint.data.vertex_shader = node_shader_get(vert);
		con_paint.data.fragment_shader = node_shader_get(frag);
		return con_paint;
	}

	let face_fill: bool = context_raw.tool == workspace_tool_t.FILL && context_raw.fill_type_handle.position == fill_type_t.FACE;
	let uv_island_fill: bool = context_raw.tool == workspace_tool_t.FILL && context_raw.fill_type_handle.position == fill_type_t.UV_ISLAND;
	let decal: bool = context_raw.tool == workspace_tool_t.DECAL || context_raw.tool == workspace_tool_t.TEXT;

	///if (krom_direct3d11 || krom_direct3d12 || krom_metal || krom_vulkan)
	node_shader_write(vert, 'vec2 tpos = vec2(tex.x * 2.0 - 1.0, (1.0 - tex.y) * 2.0 - 1.0);');
	///else
	node_shader_write(vert, 'vec2 tpos = vec2(tex.xy * 2.0 - 1.0);');
	///end

	node_shader_write(vert, 'gl_Position = vec4(tpos, 0.0, 1.0);');

	let decal_layer: bool = context_raw.layer.fill_layer != null && context_raw.layer.uv_type == uv_type_t.PROJECT;
	if (decal_layer) {
		node_shader_add_uniform(vert, 'mat4 WVP', '_decalLayerMatrix');
	}
	else {
		node_shader_add_uniform(vert, 'mat4 WVP', '_world_view_proj_matrix');
	}

	node_shader_add_out(vert, 'vec4 ndc');
	node_shader_write_attrib(vert, 'ndc = mul(vec4(pos.xyz, 1.0), WVP);');

	node_shader_write_attrib(frag, 'vec3 sp = vec3((ndc.xyz / ndc.w) * 0.5 + 0.5);');
	node_shader_write_attrib(frag, 'sp.y = 1.0 - sp.y;');
	node_shader_write_attrib(frag, 'sp.z -= 0.0001;'); // small bias

	let uv_type: uv_type_t = context_raw.layer.fill_layer != null ? context_raw.layer.uv_type : context_raw.brush_paint;
	if (uv_type == uv_type_t.PROJECT) frag.ndcpos = true;

	node_shader_add_uniform(frag, 'vec4 inp', '_inputBrush');
	node_shader_add_uniform(frag, 'vec4 inplast', '_inputBrushLast');
	node_shader_add_uniform(frag, 'float aspectRatio', '_aspect_ratio_window');
	node_shader_write(frag, 'vec2 bsp = sp.xy * 2.0 - 1.0;');
	node_shader_write(frag, 'bsp.x *= aspectRatio;');
	node_shader_write(frag, 'bsp = bsp * 0.5 + 0.5;');

	node_shader_add_uniform(frag, 'sampler2D gbufferD');

	node_shader_add_out(frag, 'vec4 fragColor[4]');

	node_shader_add_uniform(frag, 'float brushRadius', '_brushRadius');
	node_shader_add_uniform(frag, 'float brushOpacity', '_brushOpacity');
	node_shader_add_uniform(frag, 'float brushHardness', '_brushHardness');

	if (context_raw.tool == workspace_tool_t.BRUSH  ||
		context_raw.tool == workspace_tool_t.ERASER ||
		context_raw.tool == workspace_tool_t.CLONE  ||
		context_raw.tool == workspace_tool_t.BLUR   ||
		context_raw.tool == workspace_tool_t.SMUDGE   ||
		context_raw.tool == workspace_tool_t.PARTICLE ||
		decal) {

		let depth_reject: bool = !context_raw.xray;
		if (config_raw.brush_3d && !config_raw.brush_depth_reject) depth_reject = false;

		// TODO: sp.z needs to take height channel into account
		let particle: bool = context_raw.tool == workspace_tool_t.PARTICLE;
		if (config_raw.brush_3d && !decal && !particle) {
			if (make_material_height_used || context_raw.sym_x || context_raw.sym_y || context_raw.sym_z) depth_reject = false;
		}

		if (depth_reject) {
			///if (krom_direct3d11 || krom_direct3d12 || krom_metal || krom_vulkan)
			node_shader_write(frag, 'if (sp.z > textureLod(gbufferD, sp.xy, 0.0).r + 0.0005) discard;');
			///else
			node_shader_write(frag, 'if (sp.z > textureLod(gbufferD, vec2(sp.x, 1.0 - sp.y), 0.0).r + 0.0005) discard;');
			///end
		}

		make_brush_run(vert, frag);
	}
	else { // Fill, Bake
		node_shader_write(frag, 'float dist = 0.0;');
		let angle_fill: bool = context_raw.tool == workspace_tool_t.FILL && context_raw.fill_type_handle.position == fill_type_t.ANGLE;
		if (angle_fill) {
			node_shader_add_function(frag, str_octahedron_wrap);
			node_shader_add_uniform(frag, 'sampler2D gbuffer0');
			node_shader_write(frag, 'vec2 g0 = textureLod(gbuffer0, inp.xy, 0.0).rg;');
			node_shader_write(frag, 'vec3 wn;');
			node_shader_write(frag, 'wn.z = 1.0 - abs(g0.x) - abs(g0.y);');
			node_shader_write(frag, 'wn.xy = wn.z >= 0.0 ? g0.xy : octahedronWrap(g0.xy);');
			node_shader_write(frag, 'wn = normalize(wn);');
			frag.n = true;
			let angle: f32 = context_raw.brush_angle_reject_dot;
			node_shader_write(frag, `if (dot(wn, n) < ${angle}) discard;`);
		}
		let stencil_fill: bool = context_raw.tool == workspace_tool_t.FILL && context_raw.brush_stencil_image != null;
		if (stencil_fill) {
			///if (krom_direct3d11 || krom_direct3d12 || krom_metal || krom_vulkan)
			node_shader_write(frag, 'if (sp.z > textureLod(gbufferD, sp.xy, 0.0).r + 0.0005) discard;');
			///else
			node_shader_write(frag, 'if (sp.z > textureLod(gbufferD, vec2(sp.x, 1.0 - sp.y), 0.0).r + 0.0005) discard;');
			///end
		}
	}

	if (context_raw.colorid_picked || face_fill || uv_island_fill) {
		node_shader_add_out(vert, 'vec2 texCoordPick');
		node_shader_write(vert, 'texCoordPick = tex;');
		if (context_raw.colorid_picked) {
			make_discard_color_id(vert, frag);
		}
		if (face_fill) {
			make_discard_face(vert, frag);
		}
		else if (uv_island_fill) {
			make_discard_uv_island(vert, frag);
		}
	}

	if (context_raw.picker_mask_handle.position == picker_mask_t.MATERIAL) {
		make_discard_material_id(vert, frag);
	}

	make_texcoord_run(vert, frag);

	if (context_raw.tool == workspace_tool_t.CLONE || context_raw.tool == workspace_tool_t.BLUR || context_raw.tool == workspace_tool_t.SMUDGE) {
		node_shader_add_uniform(frag, 'sampler2D gbuffer2');
		node_shader_add_uniform(frag, 'vec2 gbufferSize', '_gbufferSize');
		node_shader_add_uniform(frag, 'sampler2D texpaint_undo', '_texpaint_undo');
		node_shader_add_uniform(frag, 'sampler2D texpaint_nor_undo', '_texpaint_nor_undo');
		node_shader_add_uniform(frag, 'sampler2D texpaint_pack_undo', '_texpaint_pack_undo');

		if (context_raw.tool == workspace_tool_t.CLONE) {
			make_clone_run(vert, frag);
		}
		else { // Blur, Smudge
			make_blur_run(vert, frag);
		}
	}
	else {
		parser_material_parse_emission = context_raw.material.paint_emis;
		parser_material_parse_subsurface = context_raw.material.paint_subs;
		parser_material_parse_height = context_raw.material.paint_height;
		parser_material_parse_height_as_channel = true;
		let uv_type: uv_type_t = context_raw.layer.fill_layer != null ? context_raw.layer.uv_type : context_raw.brush_paint;
		parser_material_triplanar = uv_type == uv_type_t.TRIPLANAR && !decal;
		parser_material_sample_keep_aspect = decal;
		parser_material_sample_uv_scale = 'brushScale';
		let sout: shader_out_t = parser_material_parse(ui_nodes_get_canvas_material(), con_paint, vert, frag, matcon);
		parser_material_parse_emission = false;
		parser_material_parse_subsurface = false;
		parser_material_parse_height_as_channel = false;
		parser_material_parse_height = false;
		let base: string = sout.out_basecol;
		let rough: string = sout.out_roughness;
		let met: string = sout.out_metallic;
		let occ: string = sout.out_occlusion;
		let nortan: string = parser_material_out_normaltan;
		let height: string = sout.out_height;
		let opac: string = sout.out_opacity;
		let emis: string = sout.out_emission;
		let subs: string = sout.out_subsurface;
		node_shader_write(frag, `vec3 basecol = ${base};`);
		node_shader_write(frag, `float roughness = ${rough};`);
		node_shader_write(frag, `float metallic = ${met};`);
		node_shader_write(frag, `float occlusion = ${occ};`);
		node_shader_write(frag, `vec3 nortan = ${nortan};`);
		node_shader_write(frag, `float height = ${height};`);
		node_shader_write(frag, `float mat_opacity = ${opac};`);
		node_shader_write(frag, 'float opacity = mat_opacity;');
		if (context_raw.layer.fill_layer == null) {
			node_shader_write(frag, 'opacity *= brushOpacity;');
		}
		if (context_raw.material.paint_emis) {
			node_shader_write(frag, `float emis = ${emis};`);
		}
		if (context_raw.material.paint_subs) {
			node_shader_write(frag, `float subs = ${subs};`);
		}
		if (parseFloat(height) != 0.0 && !make_material_height_used) {
			make_material_height_used = true;
			// Height used for the first time, also rebuild vertex shader
			return make_paint_run(data, matcon);
		}
		if (parseFloat(emis) != 0.0) make_material_emis_used = true;
		if (parseFloat(subs) != 0.0) make_material_subs_used = true;
	}

	if (context_raw.brush_mask_image != null && context_raw.tool == workspace_tool_t.DECAL) {
		node_shader_add_uniform(frag, 'sampler2D texbrushmask', '_texbrushmask');
		node_shader_write(frag, 'vec4 mask_sample = textureLod(texbrushmask, uvsp, 0.0);');
		if (context_raw.brush_mask_image_is_alpha) {
			node_shader_write(frag, 'opacity *= mask_sample.a;');
		}
		else {
			node_shader_write(frag, 'opacity *= mask_sample.r * mask_sample.a;');
		}
	}
	else if (context_raw.tool == workspace_tool_t.TEXT) {
		node_shader_add_uniform(frag, 'sampler2D textexttool', '_textexttool');
		node_shader_write(frag, 'opacity *= textureLod(textexttool, uvsp, 0.0).r;');
	}

	if (context_raw.brush_stencil_image != null && (
		context_raw.tool == workspace_tool_t.BRUSH  ||
		context_raw.tool == workspace_tool_t.ERASER ||
		context_raw.tool == workspace_tool_t.FILL ||
		context_raw.tool == workspace_tool_t.CLONE  ||
		context_raw.tool == workspace_tool_t.BLUR   ||
		context_raw.tool == workspace_tool_t.SMUDGE   ||
		context_raw.tool == workspace_tool_t.PARTICLE ||
		decal)) {
		node_shader_add_uniform(frag, 'sampler2D texbrushstencil', '_texbrushstencil');
		node_shader_add_uniform(frag, 'vec4 stencilTransform', '_stencilTransform');
		node_shader_write(frag, 'vec2 stencil_uv = vec2((sp.xy - stencilTransform.xy) / stencilTransform.z * vec2(aspectRatio, 1.0));');
		node_shader_write(frag, 'vec2 stencil_size = vec2(textureSize(texbrushstencil, 0));');
		node_shader_write(frag, 'float stencil_ratio = stencil_size.y / stencil_size.x;');
		node_shader_write(frag, 'stencil_uv -= vec2(0.5 / stencil_ratio, 0.5);');
		node_shader_write(frag, `stencil_uv = vec2(stencil_uv.x * cos(stencilTransform.w) - stencil_uv.y * sin(stencilTransform.w),
										stencil_uv.x * sin(stencilTransform.w) + stencil_uv.y * cos(stencilTransform.w));`);
		node_shader_write(frag, 'stencil_uv += vec2(0.5 / stencil_ratio, 0.5);');
		node_shader_write(frag, 'stencil_uv.x *= stencil_ratio;');
		node_shader_write(frag, 'if (stencil_uv.x < 0 || stencil_uv.x > 1 || stencil_uv.y < 0 || stencil_uv.y > 1) discard;');
		node_shader_write(frag, 'vec4 texbrushstencil_sample = textureLod(texbrushstencil, stencil_uv, 0.0);');
		if (context_raw.brush_stencil_image_is_alpha) {
			node_shader_write(frag, 'opacity *= texbrushstencil_sample.a;');
		}
		else {
			node_shader_write(frag, 'opacity *= texbrushstencil_sample.r * texbrushstencil_sample.a;');
		}
	}

	if (context_raw.brush_mask_image != null && (context_raw.tool == workspace_tool_t.BRUSH || context_raw.tool == workspace_tool_t.ERASER)) {
		node_shader_add_uniform(frag, 'sampler2D texbrushmask', '_texbrushmask');
		node_shader_write(frag, 'vec2 binp_mask = inp.xy * 2.0 - 1.0;');
		node_shader_write(frag, 'binp_mask.x *= aspectRatio;');
		node_shader_write(frag, 'binp_mask = binp_mask * 0.5 + 0.5;');
		node_shader_write(frag, 'vec2 pa_mask = bsp.xy - binp_mask.xy;');
		if (context_raw.brush_directional) {
			node_shader_add_uniform(frag, 'vec3 brushDirection', '_brushDirection');
			node_shader_write(frag, 'if (brushDirection.z == 0.0) discard;');
			node_shader_write(frag, 'pa_mask = vec2(pa_mask.x * brushDirection.x - pa_mask.y * brushDirection.y, pa_mask.x * brushDirection.y + pa_mask.y * brushDirection.x);');
		}
		let angle: f32 = context_raw.brush_angle + context_raw.brush_nodes_angle;
		if (angle != 0.0) {
			node_shader_add_uniform(frag, 'vec2 brushAngle', '_brushAngle');
			node_shader_write(frag, 'pa_mask.xy = vec2(pa_mask.x * brushAngle.x - pa_mask.y * brushAngle.y, pa_mask.x * brushAngle.y + pa_mask.y * brushAngle.x);');
		}
		node_shader_write(frag, 'pa_mask /= brushRadius;');
		if (config_raw.brush_3d) {
			node_shader_add_uniform(frag, 'vec3 eye', '_camera_pos');
			node_shader_write(frag, 'pa_mask *= distance(eye, winp.xyz) / 1.5;');
		}
		node_shader_write(frag, 'pa_mask = pa_mask.xy * 0.5 + 0.5;');
		node_shader_write(frag, 'vec4 mask_sample = textureLod(texbrushmask, pa_mask, 0.0);');
		if (context_raw.brush_mask_image_is_alpha) {
			node_shader_write(frag, 'opacity *= mask_sample.a;');
		}
		else {
			node_shader_write(frag, 'opacity *= mask_sample.r * mask_sample.a;');
		}
	}

	node_shader_write(frag, 'if (opacity == 0.0) discard;');

	if (context_raw.tool == workspace_tool_t.PARTICLE) { // Particle mask
		make_particle_mask(vert, frag);
	}
	else { // Brush cursor mask
		node_shader_write(frag, 'float str = clamp((brushRadius - dist) * brushHardness * 400.0, 0.0, 1.0) * opacity;');
	}

	// Manual blending to preserve memory
	frag.wvpposition = true;
	node_shader_write(frag, 'vec2 sample_tc = vec2(wvpposition.xy / wvpposition.w) * 0.5 + 0.5;');
	///if (krom_direct3d11 || krom_direct3d12 || krom_metal || krom_vulkan)
	node_shader_write(frag, 'sample_tc.y = 1.0 - sample_tc.y;');
	///end
	node_shader_add_uniform(frag, 'sampler2D paintmask');
	node_shader_write(frag, 'float sample_mask = textureLod(paintmask, sample_tc, 0.0).r;');
	node_shader_write(frag, 'str = max(str, sample_mask);');
	// write(frag, 'str = clamp(str + sample_mask, 0.0, 1.0);');

	node_shader_add_uniform(frag, 'sampler2D texpaint_undo', '_texpaint_undo');
	node_shader_write(frag, 'vec4 sample_undo = textureLod(texpaint_undo, sample_tc, 0.0);');

	let matid: f32 = context_raw.material.id / 255;
	if (context_raw.picker_mask_handle.position == picker_mask_t.MATERIAL) {
		matid = context_raw.materialid_picked / 255; // Keep existing material id in place when mask is set
	}
	let matid_string: string = parser_material_vec1(matid * 3.0);
	node_shader_write(frag, `float matid = ${matid_string};`);

	// matid % 3 == 0 - normal, 1 - emission, 2 - subsurface
	if (context_raw.material.paint_emis) {
		node_shader_write(frag, 'if (emis > 0.0) {');
		node_shader_write(frag, '	matid += 1.0 / 255.0;');
		node_shader_write(frag, '	if (str == 0.0) discard;');
		node_shader_write(frag, '}');
	}
	else if (context_raw.material.paint_subs) {
		node_shader_write(frag, 'if (subs > 0.0) {');
		node_shader_write(frag, '    matid += 2.0 / 255.0;');
		node_shader_write(frag, '	if (str == 0.0) discard;');
		node_shader_write(frag, '}');
	}

	let is_mask: bool = slot_layer_is_mask(context_raw.layer);
	let layered: bool = context_raw.layer != project_layers[0];
	if (layered && !is_mask) {
		if (context_raw.tool == workspace_tool_t.ERASER) {
			node_shader_write(frag, 'fragColor[0] = vec4(mix(sample_undo.rgb, vec3(0.0, 0.0, 0.0), str), sample_undo.a - str);');
			node_shader_write(frag, 'nortan = vec3(0.5, 0.5, 1.0);');
			node_shader_write(frag, 'occlusion = 1.0;');
			node_shader_write(frag, 'roughness = 0.0;');
			node_shader_write(frag, 'metallic = 0.0;');
			node_shader_write(frag, 'matid = 0.0;');
		}
		else if (context_raw.tool == workspace_tool_t.PARTICLE || decal || context_raw.brush_mask_image != null) {
			node_shader_write(frag, 'fragColor[0] = vec4(' + make_material_blend_mode(frag, context_raw.brush_blending, 'sample_undo.rgb', 'basecol', 'str') + ', max(str, sample_undo.a));');
		}
		else {
			if (context_raw.layer.fill_layer != null) {
				node_shader_write(frag, 'fragColor[0] = vec4(' + make_material_blend_mode(frag, context_raw.brush_blending, 'sample_undo.rgb', 'basecol', 'opacity') + ', mat_opacity);');
			}
			else {
				node_shader_write(frag, 'fragColor[0] = vec4(' + make_material_blend_mode(frag, context_raw.brush_blending, 'sample_undo.rgb', 'basecol', 'opacity') + ', max(str, sample_undo.a));');
			}
		}
		node_shader_write(frag, 'fragColor[1] = vec4(nortan, matid);');

		let height: string = "0.0";
		if (context_raw.material.paint_height && make_material_height_used) {
			height = "height";
		}

		if (decal) {
			node_shader_add_uniform(frag, 'sampler2D texpaint_pack_undo', '_texpaint_pack_undo');
			node_shader_write(frag, 'vec4 sample_pack_undo = textureLod(texpaint_pack_undo, sample_tc, 0.0);');
			node_shader_write(frag, `fragColor[2] = mix(sample_pack_undo, vec4(occlusion, roughness, metallic, ${height}), str);`);
		}
		else {
			node_shader_write(frag, `fragColor[2] = vec4(occlusion, roughness, metallic, ${height});`);
		}
	}
	else {
		if (context_raw.tool == workspace_tool_t.ERASER) {
			node_shader_write(frag, 'fragColor[0] = vec4(mix(sample_undo.rgb, vec3(0.0, 0.0, 0.0), str), sample_undo.a - str);');
			node_shader_write(frag, 'fragColor[1] = vec4(0.5, 0.5, 1.0, 0.0);');
			node_shader_write(frag, 'fragColor[2] = vec4(1.0, 0.0, 0.0, 0.0);');
		}
		else {
			node_shader_add_uniform(frag, 'sampler2D texpaint_nor_undo', '_texpaint_nor_undo');
			node_shader_add_uniform(frag, 'sampler2D texpaint_pack_undo', '_texpaint_pack_undo');
			node_shader_write(frag, 'vec4 sample_nor_undo = textureLod(texpaint_nor_undo, sample_tc, 0.0);');
			node_shader_write(frag, 'vec4 sample_pack_undo = textureLod(texpaint_pack_undo, sample_tc, 0.0);');
			node_shader_write(frag, 'fragColor[0] = vec4(' + make_material_blend_mode(frag, context_raw.brush_blending, 'sample_undo.rgb', 'basecol', 'str') + ', max(str, sample_undo.a));');
			node_shader_write(frag, 'fragColor[1] = vec4(mix(sample_nor_undo.rgb, nortan, str), matid);');
			if (context_raw.material.paint_height && make_material_height_used) {
				node_shader_write(frag, 'fragColor[2] = mix(sample_pack_undo, vec4(occlusion, roughness, metallic, height), str);');
			}
			else {
				node_shader_write(frag, 'fragColor[2] = vec4(mix(sample_pack_undo.rgb, vec3(occlusion, roughness, metallic), str), 0.0);');
			}
		}
	}
	node_shader_write(frag, 'fragColor[3] = vec4(str, 0.0, 0.0, 1.0);');

	if (!context_raw.material.paint_base) {
		con_paint.data.color_writes_red[0] = false;
		con_paint.data.color_writes_green[0] = false;
		con_paint.data.color_writes_blue[0] = false;
	}
	if (!context_raw.material.paint_opac) {
		con_paint.data.color_writes_alpha[0] = false;
	}
	if (!context_raw.material.paint_nor) {
		con_paint.data.color_writes_red[1] = false;
		con_paint.data.color_writes_green[1] = false;
		con_paint.data.color_writes_blue[1] = false;
	}
	if (!context_raw.material.paint_occ) {
		con_paint.data.color_writes_red[2] = false;
	}
	if (!context_raw.material.paint_rough) {
		con_paint.data.color_writes_green[2] = false;
	}
	if (!context_raw.material.paint_met) {
		con_paint.data.color_writes_blue[2] = false;
	}
	if (!context_raw.material.paint_height) {
		con_paint.data.color_writes_alpha[2] = false;
	}

	// Base color only as mask
	if (is_mask) {
		// TODO: Apply opacity into base
		// write(frag, 'fragColor[0].rgb *= fragColor[0].a;');
		con_paint.data.color_writes_green[0] = false;
		con_paint.data.color_writes_blue[0] = false;
		con_paint.data.color_writes_alpha[0] = false;
		con_paint.data.color_writes_red[1] = false;
		con_paint.data.color_writes_green[1] = false;
		con_paint.data.color_writes_blue[1] = false;
		con_paint.data.color_writes_alpha[1] = false;
		con_paint.data.color_writes_red[2] = false;
		con_paint.data.color_writes_green[2] = false;
		con_paint.data.color_writes_blue[2] = false;
		con_paint.data.color_writes_alpha[2] = false;
	}

	if (context_raw.tool == workspace_tool_t.BAKE) {
		make_bake_run(con_paint, vert, frag);
	}

	parser_material_finalize(con_paint);
	parser_material_triplanar = false;
	parser_material_sample_keep_aspect = false;
	con_paint.data.shader_from_source = true;
	con_paint.data.vertex_shader = node_shader_get(vert);
	con_paint.data.fragment_shader = node_shader_get(frag);

	return con_paint;
}

///end
