
let base_ui_enabled: bool = true;
let base_is_dragging: bool = false;
let base_is_resizing: bool = false;
let base_drag_asset: asset_t = null;
let base_drag_swatch: swatch_color_t = null;
let base_drag_file: string = null;
let base_drag_file_icon: image_t = null;
let base_drag_tint = 0xffffffff;
let base_drag_size: i32 = -1;
let base_drag_rect: rect_t = null;
let base_drag_off_x: f32 = 0.0;
let base_drag_off_y: f32 = 0.0;
let base_drag_start: f32 = 0.0;
let base_drop_x: f32 = 0.0;
let base_drop_y: f32 = 0.0;
let base_font: g2_font_t = null;
let base_theme: theme_t;
let base_color_wheel: image_t;
let base_color_wheel_gradient: image_t;
let base_ui_box: zui_t;
let base_ui_menu: zui_t;
let base_default_element_w: i32 = 100;
let base_default_element_h: i32 = 28;
let base_default_font_size: i32 = 13;
let base_res_handle: zui_handle_t = zui_handle_create();
let base_bits_handle: zui_handle_t = zui_handle_create();
let base_drop_paths: string[] = [];
let base_appx: i32 = 0;
let base_appy: i32 = 0;
let base_last_window_width: i32 = 0;
let base_last_window_height: i32 = 0;
///if (is_paint || is_sculpt)
let base_drag_material: SlotMaterialRaw = null;
let base_drag_layer: SlotLayerRaw = null;
///end

let base_pipe_copy: pipeline_t;
let base_pipe_copy8: pipeline_t;
let base_pipe_copy128: pipeline_t;
let base_pipe_copy_bgra: pipeline_t;
let base_pipe_copy_rgb: pipeline_t = null;
///if (is_paint || is_sculpt)
let base_pipe_merge: pipeline_t = null;
let base_pipe_merge_r: pipeline_t = null;
let base_pipe_merge_g: pipeline_t = null;
let base_pipe_merge_b: pipeline_t = null;
let base_pipe_merge_a: pipeline_t = null;
let base_pipe_invert8: pipeline_t;
let base_pipe_apply_mask: pipeline_t;
let base_pipe_merge_mask: pipeline_t;
let base_pipe_colorid_to_mask: pipeline_t;
let base_tex0: kinc_tex_unit_t;
let base_tex1: kinc_tex_unit_t;
let base_texmask: kinc_tex_unit_t;
let base_texa: kinc_tex_unit_t;
let base_opac: kinc_const_loc_t;
let base_blending: kinc_const_loc_t;
let base_tex0_mask: kinc_tex_unit_t;
let base_texa_mask: kinc_tex_unit_t;
let base_tex0_merge_mask: kinc_tex_unit_t;
let base_texa_merge_mask: kinc_tex_unit_t;
let base_tex_colorid: kinc_tex_unit_t;
let base_texpaint_colorid: kinc_tex_unit_t;
let base_opac_merge_mask: kinc_const_loc_t;
let base_blending_merge_mask: kinc_const_loc_t;
let base_temp_mask_image: image_t = null;
///end
///if is_lab
let base_pipe_copy_r: pipeline_t;
let base_pipe_copy_g: pipeline_t;
let base_pipe_copy_b: pipeline_t;
let base_pipe_copy_a: pipeline_t;
let base_pipe_copy_a_tex: kinc_tex_unit_t;
let base_pipe_inpaint_preview: pipeline_t;
let base_tex0_inpaint_preview: kinc_tex_unit_t;
let base_texa_inpaint_preview: kinc_tex_unit_t;
///end
let base_temp_image: image_t = null;
let base_expa: image_t = null;
let base_expb: image_t = null;
let base_expc: image_t = null;
let base_pipe_cursor: pipeline_t;
let base_cursor_vp: kinc_const_loc_t;
let base_cursor_inv_vp: kinc_const_loc_t;
let base_cursor_mouse: kinc_const_loc_t;
let base_cursor_tex_step: kinc_const_loc_t;
let base_cursor_radius: kinc_const_loc_t;
let base_cursor_camera_right: kinc_const_loc_t;
let base_cursor_tint: kinc_const_loc_t;
let base_cursor_tex: kinc_tex_unit_t;
let base_cursor_gbufferd: kinc_tex_unit_t;

///if (is_paint || is_sculpt)
let base_default_base: f32 = 0.5;
let base_default_rough: f32 = 0.4;
///if (krom_android || krom_ios)
let base_max_layers: i32 = 18;
///else
let base_max_layers: i32 = 255;
///end
///end
let base_default_fov: f32 = 0.69;

let base_default_keymap: any = {
	action_paint: "left",
	action_rotate: "alt+left",
	action_pan: "alt+middle",
	action_zoom: "alt+right",
	rotate_light: "shift+middle",
	rotate_envmap: "ctrl+middle",
	set_clone_source: "alt",
	stencil_transform: "ctrl",
	stencil_hide: "z",
	brush_radius: "f",
	brush_radius_decrease: "[",
	brush_radius_increase: "]",
	brush_ruler: "shift",
	file_new: "ctrl+n",
	file_open: "ctrl+o",
	file_open_recent: "ctrl+shift+o",
	file_save: "ctrl+s",
	file_save_as: "ctrl+shift+s",
	file_reimport_mesh: "ctrl+r",
	file_reimport_textures: "ctrl+shift+r",
	file_import_assets: "ctrl+i",
	file_export_textures: "ctrl+e",
	file_export_textures_as: "ctrl+shift+e",
	edit_undo: "ctrl+z",
	edit_redo: "ctrl+shift+z",
	edit_prefs: "ctrl+k",
	view_reset: "0",
	view_front: "1",
	view_back: "ctrl+1",
	view_right: "3",
	view_left: "ctrl+3",
	view_top: "7",
	view_bottom: "ctrl+7",
	view_camera_type: "5",
	view_orbit_left: "4",
	view_orbit_right: "6",
	view_orbit_up: "8",
	view_orbit_down: "2",
	view_orbit_opposite: "9",
	view_zoom_in: "",
	view_zoom_out: "",
	view_distract_free: "f11",
	viewport_mode: "ctrl+m",
	toggle_node_editor: "tab",
	toggle_2d_view: "shift+tab",
	toggle_browser: "`",
	node_search: "space",
	operator_search: "space",
	///if (is_paint || is_sculpt)
	decal_mask: "ctrl",
	select_material: "shift+number",
	select_layer: "alt+number",
	brush_opacity: "shift+f",
	brush_angle: "alt+f",
	tool_brush: "b",
	tool_eraser: "e",
	tool_fill: "g",
	tool_decal: "d",
	tool_text: "t",
	tool_clone: "l",
	tool_blur: "u",
	tool_smudge: "m",
	tool_particle: "p",
	tool_colorid: "c",
	tool_picker: "v",
	tool_bake: "k",
	tool_gizmo: "",
	tool_material: "",
	swap_brush_eraser: "",
	///end
};

function base_init() {
	base_last_window_width = sys_width();
	base_last_window_height = sys_height();

	sys_notify_on_drop_files(function(drop_path: string) {
		///if krom_linux
		drop_path = decodeURIComponent(drop_path);
		///end
		drop_path = trim_end(drop_path);
		base_drop_paths.push(drop_path);
	});

	sys_notify_on_app_state(
		function() { // Foreground
			context_raw.foreground_event = true;
			context_raw.last_paint_x = -1;
			context_raw.last_paint_y = -1;
		},
		function() {}, // Resume
		function() {}, // Pause
		function() { // Background
			// Release keys after alt-tab / win-tab
			keyboard_up_listener(key_code_t.ALT);
			keyboard_up_listener(key_code_t.WIN);
		},
		function() { // Shutdown
			///if (krom_android || krom_ios)
			project_save();
			///end
		}
	);

	krom_set_save_and_quit_callback(base_save_and_quit_callback);

	let f: g2_font_t = data_get_font("font.ttf");
	let image_color_wheel: image_t = data_get_image("color_wheel.k");
	let image_color_wheel_gradient: image_t = data_get_image("color_wheel_gradient.k");

	base_font = f;
	config_load_theme(config_raw.theme, false);
	base_default_element_w = base_theme.ELEMENT_W;
	base_default_font_size = base_theme.FONT_SIZE;
	translator_load_translations(config_raw.locale);
	ui_files_filename = tr("untitled");
	///if (krom_android || krom_ios)
	sys_title_set(tr("untitled"));
	///end

	// Baked font for fast startup
	if (config_raw.locale == "en") {
		base_font.font_ = krom_g2_font_13(base_font.blob);
		base_font.glyphs = _g2_font_glyphs;
	}
	else g2_font_init(base_font);

	base_color_wheel = image_color_wheel;
	base_color_wheel_gradient = image_color_wheel_gradient;
	zui_set_enum_texts(base_enum_texts);
	zui_tr = tr;
	base_ui_box = zui_create({ theme: base_theme, font: f, scale_factor: config_raw.window_scale, color_wheel: base_color_wheel, black_white_gradient: base_color_wheel_gradient });
	base_ui_menu = zui_create({ theme: base_theme, font: f, scale_factor: config_raw.window_scale, color_wheel: base_color_wheel, black_white_gradient: base_color_wheel_gradient });
	base_default_element_h = base_ui_menu.t.ELEMENT_H;

	// Init plugins
	if (config_raw.plugins != null) {
		for (let plugin of config_raw.plugins) {
			plugin_start(plugin);
		}
	}

	args_parse();

	camera_init();
	ui_base_init();
	ui_nodes_init();
	ui_view2d_init();

	///if is_lab
	random_node_set_seed(math_floor(time_time() * 4294967295));
	///end

	app_notify_on_update(base_update);
	app_notify_on_render_2d(ui_view2d_render);
	app_notify_on_update(ui_view2d_update);
	///if (is_paint || is_sculpt)
	app_notify_on_render_2d(ui_base_render_cursor);
	///end
	app_notify_on_update(ui_nodes_update);
	app_notify_on_render_2d(ui_nodes_render);
	app_notify_on_update(ui_base_update);
	app_notify_on_render_2d(ui_base_render);
	app_notify_on_update(camera_update);
	app_notify_on_render_2d(base_render);

	///if (is_paint || is_sculpt)
	base_appx = ui_toolbar_w;
	///end
	///if is_lab
	base_appx = 0;
	///end

	base_appy = ui_header_h;
	if (config_raw.layout[layout_size_t.HEADER] == 1) base_appy += ui_header_h;
	let cam: camera_object_t = scene_camera;
	cam.data.fov = math_floor(cam.data.fov * 100) / 100;
	camera_object_build_proj(cam);

	args_run();

	///if (krom_android || krom_ios)
	let has_projects: bool = config_raw.recent_projects.length > 0;
	///else
	let has_projects: bool = true;
	///end

	if (config_raw.splash_screen && has_projects) {
		box_projects_show();
	}
}

function base_save_and_quit_callback(save: bool) {
	base_save_window_rect();
	if (save) project_save(true);
	else sys_stop();
}

///if (is_paint || is_sculpt)
function base_w(): i32 {
	// Drawing material preview
	if (context_raw.material_preview) {
		return util_render_material_preview_size;
	}

	// Drawing decal preview
	if (context_raw.decal_preview) {
		return util_render_decal_preview_size;
	}

	let res: i32 = 0;
	if (config_raw.layout == null) {
		let sidebarw: i32 = ui_base_default_sidebar_w;
		res = sys_width() - sidebarw - ui_toolbar_default_w;
	}
	else if (ui_nodes_show || ui_view2d_show) {
		res = sys_width() - config_raw.layout[layout_size_t.SIDEBAR_W] - config_raw.layout[layout_size_t.NODES_W] - ui_toolbar_w;
	}
	else if (ui_base_show) {
		res = sys_width() - config_raw.layout[layout_size_t.SIDEBAR_W] - ui_toolbar_w;
	}
	else { // Distract free
		res = sys_width();
	}
	if (context_raw.view_index > -1) {
		res = math_floor(res / 2);
	}
	if (context_raw.paint2d_view) {
		res = ui_view2d_ww;
	}

	return res > 0 ? res : 1; // App was minimized, force render path resize
}

function base_h(): i32 {
	// Drawing material preview
	if (context_raw.material_preview) {
		return util_render_material_preview_size;
	}

	// Drawing decal preview
	if (context_raw.decal_preview) {
		return util_render_decal_preview_size;
	}

	let res: i32 = sys_height();

	if (config_raw.layout == null) {
		res -= ui_header_default_h * 2 + ui_status_default_status_h;

		///if (krom_android || krom_ios)
		let layout_header: i32 = 0;
		///else
		let layout_header: i32 = 1;
		///end
		if (layout_header == 0) {
			res += ui_header_h;
		}
	}
	else if (ui_base_show && res > 0) {
		let statush: i32 = config_raw.layout[layout_size_t.STATUS_H];
		res -= math_floor(ui_header_default_h * 2 * config_raw.window_scale) + statush;

		if (config_raw.layout[layout_size_t.HEADER] == 0) {
			res += ui_header_h;
		}
	}

	return res > 0 ? res : 1; // App was minimized, force render path resize
}
///end

///if is_lab
function base_w(): i32 {
	let res: i32 = 0;
	if (ui_nodes_show || ui_view2d_show) {
		res = sys_width() - config_raw.layout[layout_size_t.NODES_W];
	}
	else { // Distract free
		res = sys_width();
	}

	return res > 0 ? res : 1; // App was minimized, force render path resize
}

function base_h(): i32 {
	let res: i32 = sys_height();
	if (res > 0) {
		let statush: i32 = config_raw.layout[layout_size_t.STATUS_H];
		res -= math_floor(ui_header_default_h * 2 * config_raw.window_scale) + statush;
	}

	return res > 0 ? res : 1; // App was minimized, force render path resize
}
///end

function base_x(): i32 {
	///if (is_paint || is_sculpt)
	return context_raw.view_index == 1 ? base_appx + base_w() : base_appx;
	///end
	///if is_lab
	return base_appx;
	///end
}

function base_y(): i32 {
	return base_appy;
}

function base_on_resize() {
	if (sys_width() == 0 || sys_height() == 0) return;

	let ratio_w: f32 = sys_width() / base_last_window_width;
	base_last_window_width = sys_width();
	let ratio_h: f32 = sys_height() / base_last_window_height;
	base_last_window_height = sys_height();

	config_raw.layout[layout_size_t.NODES_W] = math_floor(config_raw.layout[layout_size_t.NODES_W] * ratio_w);
	///if (is_paint || is_sculpt)
	config_raw.layout[layout_size_t.SIDEBAR_H0] = math_floor(config_raw.layout[layout_size_t.SIDEBAR_H0] * ratio_h);
	config_raw.layout[layout_size_t.SIDEBAR_H1] = sys_height() - config_raw.layout[layout_size_t.SIDEBAR_H0];
	///end

	base_resize();

	///if (krom_linux || krom_darwin)
	base_save_window_rect();
	///end
}

function base_save_window_rect() {
	///if (krom_windows || krom_linux || krom_darwin)
	config_raw.window_w = sys_width();
	config_raw.window_h = sys_height();
	config_raw.window_x = sys_x();
	config_raw.window_y = sys_y();
	config_save();
	///end
}

function base_resize() {
	if (sys_width() == 0 || sys_height() == 0) return;

	let cam: camera_object_t = scene_camera;
	if (cam.data.ortho != null) {
		cam.data.ortho[2] = -2 * (app_h() / app_w());
		cam.data.ortho[3] =  2 * (app_h() / app_w());
	}
	camera_object_build_proj(cam);

	if (context_raw.camera_type == camera_type_t.ORTHOGRAPHIC) {
		viewport_update_camera_type(context_raw.camera_type);
	}

	context_raw.ddirty = 2;

	if (ui_base_show) {
		///if (is_paint || is_sculpt)
		base_appx = ui_toolbar_w;
		///end
		///if is_lab
		base_appx = 0;
		///end
		base_appy = ui_header_h * 2;
		if (config_raw.layout[layout_size_t.HEADER] == 0) {
			base_appy -= ui_header_h;
		}
	}
	else {
		base_appx = 0;
		base_appy = 0;
	}

	if (ui_nodes_grid != null) {
		let _grid: image_t = ui_nodes_grid;
		let _next = function() {
			image_unload(_grid);
		}
		base_notify_on_next_frame(_next);
		ui_nodes_grid = null;
	}

	base_redraw_ui();
}

function base_redraw_ui() {
	ui_header_handle.redraws = 2;
	ui_base_hwnds[tab_area_t.STATUS].redraws = 2;
	ui_menubar_menu_handle.redraws = 2;
	ui_menubar_workspace_handle.redraws = 2;
	ui_nodes_hwnd.redraws = 2;
	ui_box_hwnd.redraws = 2;
	ui_view2d_hwnd.redraws = 2;
	if (context_raw.ddirty < 0) context_raw.ddirty = 0; // Redraw viewport
	///if (is_paint || is_sculpt)
	ui_base_hwnds[tab_area_t.SIDEBAR0].redraws = 2;
	ui_base_hwnds[tab_area_t.SIDEBAR1].redraws = 2;
	ui_toolbar_handle.redraws = 2;
	if (context_raw.split_view) context_raw.ddirty = 1;
	///end
}

function base_update() {
	if (mouse_movement_x != 0 || mouse_movement_y != 0) {
		krom_set_mouse_cursor(0); // Arrow
	}

	///if (is_paint || is_sculpt)
	let has_drag: bool = base_drag_asset != null || base_drag_material != null || base_drag_layer != null || base_drag_file != null || base_drag_swatch != null;
	///end
	///if is_lab
	let has_drag: bool = base_drag_asset != null || base_drag_file != null || base_drag_swatch != null;
	///end

	if (config_raw.touch_ui) {
		// Touch and hold to activate dragging
		if (base_drag_start < 0.2) {
			if (has_drag && mouse_down()) base_drag_start += time_real_delta();
			else base_drag_start = 0;
			has_drag = false;
		}
		if (mouse_released()) {
			base_drag_start = 0;
		}
		let moved: bool = math_abs(mouse_movement_x) > 1 && math_abs(mouse_movement_y) > 1;
		if ((mouse_released() || moved) && !has_drag) {
			base_drag_asset = null;
			base_drag_swatch = null;
			base_drag_file = null;
			base_drag_file_icon = null;
			base_is_dragging = false;
			///if (is_paint || is_sculpt)
			base_drag_material = null;
			base_drag_layer = null;
			///end
		}
		// Disable touch scrolling while dragging is active
		zui_set_touch_scroll(!base_is_dragging);
	}

	if (has_drag && (mouse_movement_x != 0 || mouse_movement_y != 0)) {
		base_is_dragging = true;
	}
	if (mouse_released() && has_drag) {
		if (base_drag_asset != null) {
			if (context_in_nodes()) { // Create image texture
				ui_nodes_accept_asset_drag(project_assets.indexOf(base_drag_asset));
			}
			else if (context_in_viewport()) {
				if (base_drag_asset.file.toLowerCase().endsWith(".hdr")) {
					let image: image_t = project_get_image(base_drag_asset);
					import_envmap_run(base_drag_asset.file, image);
				}
			}
			///if (is_paint || is_sculpt)
			else if (context_in_layers() || context_in_2d_view()) { // Create mask
				base_create_image_mask(base_drag_asset);
			}
			///end
			base_drag_asset = null;
		}
		else if (base_drag_swatch != null) {
			if (context_in_nodes()) { // Create RGB node
				ui_nodes_accept_swatch_drag(base_drag_swatch);
			}
			else if (context_in_swatches()) {
				tab_swatches_accept_swatch_drag(base_drag_swatch);
			}
			///if (is_paint || is_sculpt)
			else if (context_in_materials()) {
				tab_materials_accept_swatch_drag(base_drag_swatch);
			}
			else if (context_in_viewport()) {
				let color: i32 = base_drag_swatch.base;
				color = color_set_ab(color, base_drag_swatch.opacity * 255);
				base_create_color_layer(color, base_drag_swatch.occlusion, base_drag_swatch.roughness, base_drag_swatch.metallic);
			}
			else if (context_in_layers() && tab_layers_can_drop_new_layer(context_raw.drag_dest)) {
				let color: i32 = base_drag_swatch.base;
				color = color_set_ab(color, base_drag_swatch.opacity * 255);
				base_create_color_layer(color, base_drag_swatch.occlusion, base_drag_swatch.roughness, base_drag_swatch.metallic, context_raw.drag_dest);
			}
			///end

			base_drag_swatch = null;
		}
		else if (base_drag_file != null) {
			if (!context_in_browser()) {
				base_drop_x = mouse_x;
				base_drop_y = mouse_y;

				///if (is_paint || is_sculpt)
				let material_count: i32 = project_materials.length;
				import_asset_run(base_drag_file, base_drop_x, base_drop_y, true, true, function() {
					// Asset was material
					if (project_materials.length > material_count) {
						base_drag_material = context_raw.material;
						base_material_dropped();
					}
				});
				///end

				///if is_lab
				import_asset_run(base_drag_file, base_drop_x, base_drop_y);
				///end
			}
			base_drag_file = null;
			base_drag_file_icon = null;
		}
		///if (is_paint || is_sculpt)
		else if (base_drag_material != null) {
			base_material_dropped();
		}
		else if (base_drag_layer != null) {
			if (context_in_nodes()) {
				ui_nodes_accept_layer_drag(project_layers.indexOf(base_drag_layer));
			}
			else if (context_in_layers() && base_is_dragging) {
				slot_layer_move(base_drag_layer, context_raw.drag_dest);
				make_material_parse_mesh_material();
			}
			base_drag_layer = null;
		}
		///end

		krom_set_mouse_cursor(0); // Arrow
		base_is_dragging = false;
	}
	if (context_raw.color_picker_callback != null && (mouse_released() || mouse_released("right"))) {
		context_raw.color_picker_callback = null;
		context_select_tool(context_raw.color_picker_previous_tool);
	}

	base_handle_drop_paths();

	///if (is_paint || is_sculpt)
	///if krom_windows
	let is_picker: bool = context_raw.tool == workspace_tool_t.PICKER || context_raw.tool == workspace_tool_t.MATERIAL;
	let decal: bool = context_raw.tool == workspace_tool_t.DECAL || context_raw.tool == workspace_tool_t.TEXT;
	zui_set_always_redraw_window(!context_raw.cache_draws ||
		ui_menu_show ||
		ui_box_show ||
		base_is_dragging ||
		is_picker ||
		decal ||
		ui_view2d_show ||
		!config_raw.brush_3d ||
		context_raw.frame < 3);
	///end
	///end

	if (zui_always_redraw_window() && context_raw.ddirty < 0) context_raw.ddirty = 0;
}

///if (is_paint || is_sculpt)
function base_material_dropped() {
	// Material drag and dropped onto viewport or layers tab
	if (context_in_viewport()) {
		let uv_type: uv_type_t = keyboard_down("control") ? uv_type_t.PROJECT : uv_type_t.UVMAP;
		let decal_mat: mat4_t = uv_type == uv_type_t.PROJECT ? util_render_get_decal_mat() : null;
		base_create_fill_layer(uv_type, decal_mat);
	}
	if (context_in_layers() && tab_layers_can_drop_new_layer(context_raw.drag_dest)) {
		let uv_type: uv_type_t = keyboard_down("control") ? uv_type_t.PROJECT : uv_type_t.UVMAP;
		let decal_mat: mat4_t = uv_type == uv_type_t.PROJECT ? util_render_get_decal_mat() : null;
		base_create_fill_layer(uv_type, decal_mat, context_raw.drag_dest);
	}
	else if (context_in_nodes()) {
		ui_nodes_accept_material_drag(project_materials.indexOf(base_drag_material));
	}
	base_drag_material = null;
}
///end

function base_handle_drop_paths() {
	if (base_drop_paths.length > 0) {
		///if (krom_linux || krom_darwin)
		let wait: bool = !mouse_moved; // Mouse coords not updated during drag
		///else
		let wait: bool = false;
		///end
		if (!wait) {
			base_drop_x = mouse_x;
			base_drop_y = mouse_y;
			let drop_path: string = base_drop_paths.shift();
			import_asset_run(drop_path, base_drop_x, base_drop_y);
		}
	}
}

///if (is_paint || is_sculpt)
function base_get_drag_background(): rect_t {
	let icons: image_t = resource_get("icons.k");
	if (base_drag_layer != null && !slot_layer_is_group(base_drag_layer) && base_drag_layer.fill_layer == null) {
		return resource_tile50(icons, 4, 1);
	}
	return null;
}
///end

function base_get_drag_image(): image_t {
	base_drag_tint = 0xffffffff;
	base_drag_size = -1;
	base_drag_rect = null;
	if (base_drag_asset != null) {
		return project_get_image(base_drag_asset);
	}
	if (base_drag_swatch != null) {
		base_drag_tint = base_drag_swatch.base;
		base_drag_size = 26;
		return tab_swatches_empty_get()
	}
	if (base_drag_file != null) {
		if (base_drag_file_icon != null) return base_drag_file_icon;
		let icons: image_t = resource_get("icons.k");
		base_drag_rect = base_drag_file.indexOf(".") > 0 ? resource_tile50(icons, 3, 1) : resource_tile50(icons, 2, 1);
		base_drag_tint = ui_base_ui.t.HIGHLIGHT_COL;
		return icons;
	}

	///if is_paint
	if (base_drag_material != null) {
		return base_drag_material.image_icon;
	}
	if (base_drag_layer != null && slot_layer_is_group(base_drag_layer)) {
		let icons: image_t = resource_get("icons.k");
		let folder_closed: rect_t = resource_tile50(icons, 2, 1);
		let folder_open: rect_t = resource_tile50(icons, 8, 1);
		base_drag_rect = base_drag_layer.show_panel ? folder_open : folder_closed;
		base_drag_tint = ui_base_ui.t.LABEL_COL - 0x00202020;
		return icons;
	}
	if (base_drag_layer != null && slot_layer_is_mask(base_drag_layer) && base_drag_layer.fill_layer == null) {
		tab_layers_make_mask_preview_rgba32(base_drag_layer);
		return context_raw.mask_preview_rgba32;
	}
	if (base_drag_layer != null) {
		return base_drag_layer.fill_layer != null ? base_drag_layer.fill_layer.image_icon : base_drag_layer.texpaint_preview;
	}
	///end

	return null;
}

function base_render() {
	if (sys_width() == 0 || sys_height() == 0) return;

	if (context_raw.frame == 2) {
		///if (is_paint || is_sculpt)
		util_render_make_material_preview();
		ui_base_hwnds[tab_area_t.SIDEBAR1].redraws = 2;
		///end

		make_material_parse_mesh_material();
		make_material_parse_paint_material();
		context_raw.ddirty = 0;

		///if (is_paint || is_sculpt)
		if (history_undo_layers == null) {
			history_undo_layers = [];
			for (let i: i32 = 0; i < config_raw.undo_steps; ++i) {
				let l: SlotLayerRaw = slot_layer_create("_undo" + history_undo_layers.length);
				history_undo_layers.push(l);
			}
		}
		///end

		// Default workspace
		if (config_raw.workspace != 0) {
			ui_header_worktab.position = config_raw.workspace;
			ui_menubar_workspace_handle.redraws = 2;
			ui_header_worktab.changed = true;
		}

		// Default camera controls
		context_raw.camera_controls = config_raw.camera_controls;

		///if is_lab
		base_notify_on_next_frame(function() {
			base_notify_on_next_frame(function() {
				tab_meshes_set_default_mesh(".Sphere");
			});
		});
		///end

		///if is_sculpt
		base_notify_on_next_frame(function() {
			base_notify_on_next_frame(function() {
				context_raw.project_type = project_model_t.SPHERE;
				project_new();
			});
		});
		///end
	}
	else if (context_raw.frame == 3) {
		context_raw.ddirty = 3;
	}
	context_raw.frame++;

	if (base_is_dragging) {
		krom_set_mouse_cursor(1); // Hand
		let img: image_t = base_get_drag_image();

		///if (is_paint || is_sculpt)
		let scale_factor: f32 = zui_SCALE(ui_base_ui);
		///end
		///if is_lab
		let scale_factor: f32 = zui_SCALE(base_ui_box);
		///end

		let size: f32 = (base_drag_size == -1 ? 50 : base_drag_size) * scale_factor;
		let ratio: f32 = size / img.width;
		let h: f32 = img.height * ratio;

		///if (is_lab || krom_direct3d11 || krom_direct3d12 || krom_metal || krom_vulkan)
		let inv: i32 = 0;
		///else
		let inv: i32 = (base_drag_material != null || (base_drag_layer != null && base_drag_layer.fill_layer != null)) ? h : 0;
		///end

		g2_set_color(base_drag_tint);

		///if (is_paint || is_sculpt)
		let bg_rect: rect_t = base_get_drag_background();
		if (bg_rect != null) {
			g2_draw_scaled_sub_image(resource_get("icons.k"), bg_rect.x, bg_rect.y, bg_rect.w, bg_rect.h, mouse_x + base_drag_off_x, mouse_y + base_drag_off_y + inv, size, h - inv * 2);
		}
		///end

		base_drag_rect == null ?
			g2_draw_scaled_image(img, mouse_x + base_drag_off_x, mouse_y + base_drag_off_y + inv, size, h - inv * 2) :
			g2_draw_scaled_sub_image(img, base_drag_rect.x, base_drag_rect.y, base_drag_rect.w, base_drag_rect.h, mouse_x + base_drag_off_x, mouse_y + base_drag_off_y + inv, size, h - inv * 2);
		g2_set_color(0xffffffff);
	}

	let using_menu: bool = ui_menu_show && mouse_y > ui_header_h;
	base_ui_enabled = !ui_box_show && !using_menu && !base_is_combo_selected();
	if (ui_box_show) ui_box_render();
	if (ui_menu_show) ui_menu_render();

	// Save last pos for continuos paint
	context_raw.last_paint_vec_x = context_raw.paint_vec.x;
	context_raw.last_paint_vec_y = context_raw.paint_vec.y;

	///if (krom_android || krom_ios)
	// No mouse move events for touch, re-init last paint position on touch start
	if (!mouse_down()) {
		context_raw.last_paint_x = -1;
		context_raw.last_paint_y = -1;
	}
	///end
}

function base_enum_texts(node_type: string): string[] {
	///if (is_paint || is_sculpt)
	if (node_type == "TEX_IMAGE") {
		return project_asset_names.length > 0 ? project_asset_names : [""];
	}
	if (node_type == "LAYER" || node_type == "LAYER_MASK") {
		let layer_names: string[] = [];
		for (let l of project_layers) layer_names.push(l.name);
		return layer_names;
	}
	if (node_type == "MATERIAL") {
		let material_names: string[] = [];
		for (let m of project_materials) material_names.push(m.canvas.name);
		return material_names;
	}
	///end

	///if is_lab
	if (node_type == "ImageTextureNode") {
		return project_asset_names.length > 0 ? project_asset_names : [""];
	}
	///end

	return null;
}

function base_get_asset_index(fileName: string): i32 {
	let i: i32 = project_asset_names.indexOf(fileName);
	return i >= 0 ? i : 0;
}

function base_notify_on_next_frame(f: ()=>void) {
	let _render = function() {
		app_notify_on_init(function() {
			let _update = function() {
				app_notify_on_init(f);
				app_remove_update(_update);
			}
			app_notify_on_update(_update);
		});
		app_remove_render(_render);
	}
	app_notify_on_render(_render);
}

function base_toggle_fullscreen() {
	if (sys_mode() == window_mode_t.WINDOWED) {
		///if (krom_windows || krom_linux || krom_darwin)
		config_raw.window_w = sys_width();
		config_raw.window_h = sys_height();
		config_raw.window_x = sys_x();
		config_raw.window_y = sys_y();
		///end
		sys_mode_set(window_mode_t.FULLSCREEN);
	}
	else {
		sys_mode_set(window_mode_t.WINDOWED);
		sys_resize(config_raw.window_w, config_raw.window_h);
		sys_move(config_raw.window_x, config_raw.window_y);
	}
}

function base_is_scrolling(): bool {
	for (let ui of base_get_uis()) if (ui.is_scrolling) return true;
	return false;
}

function base_is_combo_selected(): bool {
	for (let ui of base_get_uis()) if (ui.combo_selected_handle_ptr != 0) return true;
	return false;
}

function base_get_uis(): zui_t[] {
	return [base_ui_box, base_ui_menu, ui_base_ui, ui_nodes_ui, ui_view2d_ui];
}

function base_is_decal_layer(): bool {
	///if is_paint
	let is_paint: bool = context_raw.tool != workspace_tool_t.MATERIAL && context_raw.tool != workspace_tool_t.BAKE;
	return is_paint && context_raw.layer.fill_layer != null && context_raw.layer.uv_type == uv_type_t.PROJECT;
	///end

	///if (is_sculpt || is_lab)
	return false;
	///end
}

function base_redraw_status() {
	ui_base_hwnds[tab_area_t.STATUS].redraws = 2;
}

function base_redraw_console() {
	let statush: i32 = config_raw.layout[layout_size_t.STATUS_H];
	if (ui_base_ui != null && statush > ui_status_default_status_h * zui_SCALE(ui_base_ui)) {
		ui_base_hwnds[tab_area_t.STATUS].redraws = 2;
	}
}

function base_init_layout() {
	let show2d: bool = ui_nodes_show || ui_view2d_show;

	let raw: config_t = config_raw;
	raw.layout = [
		///if (is_paint || is_sculpt)
		math_floor(ui_base_default_sidebar_w * raw.window_scale), // LayoutSidebarW
		math_floor(sys_height() / 2), // LayoutSidebarH0
		math_floor(sys_height() / 2), // LayoutSidebarH1
		///end

		///if krom_ios
		show2d ? math_floor((app_w() + raw.layout[layout_size_t.NODES_W]) * 0.473) : math_floor(app_w() * 0.473), // LayoutNodesW
		///elseif krom_android
		show2d ? math_floor((app_w() + raw.layout[layout_size_t.NODES_W]) * 0.473) : math_floor(app_w() * 0.473),
		///else
		show2d ? math_floor((app_w() + raw.layout[layout_size_t.NODES_W]) * 0.515) : math_floor(app_w() * 0.515), // Align with ui header controls
		///end

		math_floor(app_h() / 2), // LayoutNodesH
		math_floor(ui_status_default_status_h * raw.window_scale), // LayoutStatusH

		///if (krom_android || krom_ios)
		0, // LayoutHeader
		///else
		1,
		///end
	];

	raw.layout_tabs = [
		///if (is_paint || is_sculpt)
		0,
		0,
		///end
		0
	];
}

function base_init_config() {
	let raw: config_t = config_raw;
	raw.recent_projects = [];
	raw.bookmarks = [];
	raw.plugins = [];
	///if (krom_android || krom_ios)
	raw.keymap = "touch.json";
	///else
	raw.keymap = "default.json";
	///end
	raw.theme = "default.json";
	raw.server = "https://armorpaint.fra1.digitaloceanspaces.com";
	raw.undo_steps = 4;
	raw.pressure_radius = true;
	raw.pressure_sensitivity = 1.0;
	raw.camera_zoom_speed = 1.0;
	raw.camera_pan_speed = 1.0;
	raw.camera_rotation_speed = 1.0;
	raw.zoom_direction = zoom_direction_t.VERTICAL;
	///if (is_paint || is_sculpt)
	raw.displace_strength = 0.0;
	///else
	raw.displace_strength = 1.0;
	///end
	raw.wrap_mouse = false;
	///if is_paint
	raw.workspace = space_type_t.SPACE3D;
	///end
	///if is_sculpt
	raw.workspace = space_type_t.SPACE3D;
	///end
	///if is_lab
	raw.workspace = space_type_t.SPACE2D;
	///end
	///if (krom_android || krom_ios)
	raw.camera_controls = camera_controls_t.ROTATE;
	///else
	raw.camera_controls = camera_controls_t.ORBIT;
	///end
	raw.layer_res = texture_res_t.RES2048;
	///if (krom_android || krom_ios)
	raw.touch_ui = true;
	raw.splash_screen = true;
	///else
	raw.touch_ui = false;
	raw.splash_screen = false;
	///end
	///if (is_paint || is_sculpt)
	raw.node_preview = true;
	///else
	raw.node_preview = false;
	///end

	///if (is_paint || is_sculpt)
	raw.pressure_hardness = true;
	raw.pressure_angle = false;
	raw.pressure_opacity = false;
	///if (krom_vulkan || krom_ios)
	raw.material_live = false;
	///else
	raw.material_live = true;
	///end
	raw.brush_3d = true;
	raw.brush_depth_reject = true;
	raw.brush_angle_reject = true;
	raw.brush_live = false;
	raw.show_asset_names = false;
	///end

	///if is_paint
	raw.dilate = dilate_type_t.INSTANT;
	raw.dilate_radius = 2;
	///end

	///if is_lab
	raw.gpu_inference = true;
	///end
}

function base_init_layers() {
	///if (is_paint || is_sculpt)
	slot_layer_clear(project_layers[0], color_from_floats(base_default_base, base_default_base, base_default_base, 1.0));
	///end

	///if is_lab
	let texpaint: image_t = render_path_render_targets.get("texpaint")._image;
	let texpaint_nor: image_t = render_path_render_targets.get("texpaint_nor")._image;
	let texpaint_pack: image_t = render_path_render_targets.get("texpaint_pack")._image;
	g2_begin(texpaint);
	g2_draw_scaled_image(resource_get("placeholder.k"), 0, 0, config_get_texture_res_x(), config_get_texture_res_y()); // Base
	g2_end();
	g4_begin(texpaint_nor);
	g4_clear(color_from_floats(0.5, 0.5, 1.0, 0.0)); // Nor
	g4_end();
	g4_begin(texpaint_pack);
	g4_clear(color_from_floats(1.0, 0.4, 0.0, 0.0)); // Occ, rough, met
	g4_end();
	let texpaint_nor_empty: image_t = render_path_render_targets.get("texpaint_nor_empty")._image;
	let texpaint_pack_empty: image_t = render_path_render_targets.get("texpaint_pack_empty")._image;
	g4_begin(texpaint_nor_empty);
	g4_clear(color_from_floats(0.5, 0.5, 1.0, 0.0)); // Nor
	g4_end();
	g4_begin(texpaint_pack_empty);
	g4_clear(color_from_floats(1.0, 0.4, 0.0, 0.0)); // Occ, rough, met
	g4_end();
	///end
}

///if (is_paint || is_sculpt)
function base_resize_layers() {
	let conf: config_t = config_raw;
	if (base_res_handle.position >= math_floor(texture_res_t.RES16384)) { // Save memory for >=16k
		conf.undo_steps = 1;
		if (context_raw.undo_handle != null) {
			context_raw.undo_handle.value = conf.undo_steps;
		}
		while (history_undo_layers.length > conf.undo_steps) {
			let l: SlotLayerRaw = history_undo_layers.pop();
			base_notify_on_next_frame(function() {
				slot_layer_unload(l);
			});
		}
	}
	for (let l of project_layers) slot_layer_resize_and_set_bits(l);
	for (let l of history_undo_layers) slot_layer_resize_and_set_bits(l);
	let rts: map_t<string, render_target_t> = render_path_render_targets;
	let _texpaint_blend0: image_t = rts.get("texpaint_blend0")._image;
	base_notify_on_next_frame(function() {
		image_unload(_texpaint_blend0);
	});
	rts.get("texpaint_blend0").width = config_get_texture_res_x();
	rts.get("texpaint_blend0").height = config_get_texture_res_y();
	rts.get("texpaint_blend0")._image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y(), tex_format_t.R8);
	let _texpaint_blend1: image_t = rts.get("texpaint_blend1")._image;
	base_notify_on_next_frame(function() {
		image_unload(_texpaint_blend1);
	});
	rts.get("texpaint_blend1").width = config_get_texture_res_x();
	rts.get("texpaint_blend1").height = config_get_texture_res_y();
	rts.get("texpaint_blend1")._image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y(), tex_format_t.R8);
	context_raw.brush_blend_dirty = true;
	if (rts.get("texpaint_blur") != null) {
		let _texpaint_blur: image_t = rts.get("texpaint_blur")._image;
		base_notify_on_next_frame(function() {
			image_unload(_texpaint_blur);
		});
		let size_x: f32 = math_floor(config_get_texture_res_x() * 0.95);
		let size_y: f32 = math_floor(config_get_texture_res_y() * 0.95);
		rts.get("texpaint_blur").width = size_x;
		rts.get("texpaint_blur").height = size_y;
		rts.get("texpaint_blur")._image = image_create_render_target(size_x, size_y);
	}
	if (render_path_paint_live_layer != null) slot_layer_resize_and_set_bits(render_path_paint_live_layer);
	///if (krom_direct3d12 || krom_vulkan || krom_metal)
	render_path_raytrace_ready = false; // Rebuild baketex
	///end
	context_raw.ddirty = 2;
}

function base_set_layer_bits() {
	for (let l of project_layers) slot_layer_resize_and_set_bits(l);
	for (let l of history_undo_layers) slot_layer_resize_and_set_bits(l);
}

function base_make_merge_pipe(red: bool, green: bool, blue: bool, alpha: bool): pipeline_t {
	let pipe: pipeline_t = g4_pipeline_create();
	pipe.vertex_shader = sys_get_shader("pass.vert");
	pipe.fragment_shader = sys_get_shader("layer_merge.frag");
	let vs: vertex_struct_t = g4_vertex_struct_create();
	g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_2X);
	pipe.input_layout = [vs];
	pipe.color_write_masks_red = [red];
	pipe.color_write_masks_green = [green];
	pipe.color_write_masks_blue = [blue];
	pipe.color_write_masks_alpha = [alpha];
	g4_pipeline_compile(pipe);
	return pipe;
}
///end

function base_make_pipe() {
	///if (is_paint || is_sculpt)
	base_pipe_merge = base_make_merge_pipe(true, true, true, true);
	base_pipe_merge_r = base_make_merge_pipe(true, false, false, false);
	base_pipe_merge_g = base_make_merge_pipe(false, true, false, false);
	base_pipe_merge_b = base_make_merge_pipe(false, false, true, false);
	base_pipe_merge_a = base_make_merge_pipe(false, false, false, true);
	base_tex0 =g4_pipeline_get_tex_unit(base_pipe_merge, "tex0"); // Always binding texpaint.a for blending
	base_tex1 =g4_pipeline_get_tex_unit(base_pipe_merge, "tex1");
	base_texmask =g4_pipeline_get_tex_unit(base_pipe_merge, "texmask");
	base_texa =g4_pipeline_get_tex_unit(base_pipe_merge, "texa");
	base_opac =g4_pipeline_get_const_loc(base_pipe_merge, "opac");
	base_blending =g4_pipeline_get_const_loc(base_pipe_merge, "blending");
	///end

	{
		base_pipe_copy = g4_pipeline_create();
		base_pipe_copy.vertex_shader = sys_get_shader("layer_view.vert");
		base_pipe_copy.fragment_shader = sys_get_shader("layer_copy.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
		g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
		g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
		base_pipe_copy.input_layout = [vs];
		g4_pipeline_compile(base_pipe_copy);
	}

	{
		base_pipe_copy_bgra = g4_pipeline_create();
		base_pipe_copy_bgra.vertex_shader = sys_get_shader("layer_view.vert");
		base_pipe_copy_bgra.fragment_shader = sys_get_shader("layer_copy_bgra.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
		g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
		g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
		base_pipe_copy_bgra.input_layout = [vs];
		g4_pipeline_compile(base_pipe_copy_bgra);
	}

	///if (krom_metal || krom_vulkan || krom_direct3d12)
	{
		base_pipe_copy8 = g4_pipeline_create();
		base_pipe_copy8.vertex_shader = sys_get_shader("layer_view.vert");
		base_pipe_copy8.fragment_shader = sys_get_shader("layer_copy.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
		g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
		g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
		base_pipe_copy8.input_layout = [vs];
		base_pipe_copy8.color_attachment_count = 1;
		base_pipe_copy8.color_attachments[0] = tex_format_t.R8;
		g4_pipeline_compile(base_pipe_copy8);
	}

	{
		base_pipe_copy128 = g4_pipeline_create();
		base_pipe_copy128.vertex_shader = sys_get_shader("layer_view.vert");
		base_pipe_copy128.fragment_shader = sys_get_shader("layer_copy.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
		g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
		g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
		base_pipe_copy128.input_layout = [vs];
		base_pipe_copy128.color_attachment_count = 1;
		base_pipe_copy128.color_attachments[0] = tex_format_t.RGBA128;
		g4_pipeline_compile(base_pipe_copy128);
	}
	///else
	base_pipe_copy8 = base_pipe_copy;
	base_pipe_copy128 = base_pipe_copy;
	///end

	///if (is_paint || is_sculpt)
	{
		base_pipe_invert8 = g4_pipeline_create();
		base_pipe_invert8.vertex_shader = sys_get_shader("layer_view.vert");
		base_pipe_invert8.fragment_shader = sys_get_shader("layer_invert.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
		g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
		g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
		base_pipe_invert8.input_layout = [vs];
		base_pipe_invert8.color_attachment_count = 1;
		base_pipe_invert8.color_attachments[0] = tex_format_t.R8;
		g4_pipeline_compile(base_pipe_invert8);
	}

	{
		base_pipe_apply_mask = g4_pipeline_create();
		base_pipe_apply_mask.vertex_shader = sys_get_shader("pass.vert");
		base_pipe_apply_mask.fragment_shader = sys_get_shader("mask_apply.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_2X);
		base_pipe_apply_mask.input_layout = [vs];
		g4_pipeline_compile(base_pipe_apply_mask);
		base_tex0_mask = g4_pipeline_get_tex_unit(base_pipe_apply_mask, "tex0");
		base_texa_mask = g4_pipeline_get_tex_unit(base_pipe_apply_mask, "texa");
	}

	{
		base_pipe_merge_mask = g4_pipeline_create();
		base_pipe_merge_mask.vertex_shader = sys_get_shader("pass.vert");
		base_pipe_merge_mask.fragment_shader = sys_get_shader("mask_merge.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_2X);
		base_pipe_merge_mask.input_layout = [vs];
		g4_pipeline_compile(base_pipe_merge_mask);
		base_tex0_merge_mask = g4_pipeline_get_tex_unit(base_pipe_merge_mask, "tex0");
		base_texa_merge_mask = g4_pipeline_get_tex_unit(base_pipe_merge_mask, "texa");
		base_opac_merge_mask = g4_pipeline_get_const_loc(base_pipe_merge_mask, "opac");
		base_blending_merge_mask = g4_pipeline_get_const_loc(base_pipe_merge_mask, "blending");
	}

	{
		base_pipe_colorid_to_mask = g4_pipeline_create();
		base_pipe_colorid_to_mask.vertex_shader = sys_get_shader("pass.vert");
		base_pipe_colorid_to_mask.fragment_shader = sys_get_shader("mask_colorid.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_2X);
		base_pipe_colorid_to_mask.input_layout = [vs];
		g4_pipeline_compile(base_pipe_colorid_to_mask);
		base_texpaint_colorid = g4_pipeline_get_tex_unit(base_pipe_colorid_to_mask, "texpaint_colorid");
		base_tex_colorid = g4_pipeline_get_tex_unit(base_pipe_colorid_to_mask, "texcolorid");
	}
	///end

	///if is_lab
	{
		base_pipe_copy_r = g4_pipeline_create();
		base_pipe_copy_r.vertex_shader = sys_get_shader("layer_view.vert");
		base_pipe_copy_r.fragment_shader = sys_get_shader("layer_copy.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
		g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
		g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
		base_pipe_copy_r.input_layout = [vs];
		base_pipe_copy_r.color_write_masks_green = [false];
		base_pipe_copy_r.color_write_masks_blue = [false];
		base_pipe_copy_r.color_write_masks_alpha = [false];
		g4_pipeline_compile(base_pipe_copy_r);
	}

	{
		base_pipe_copy_g = g4_pipeline_create();
		base_pipe_copy_g.vertex_shader = sys_get_shader("layer_view.vert");
		base_pipe_copy_g.fragment_shader = sys_get_shader("layer_copy.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
		g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
		g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
		base_pipe_copy_g.input_layout = [vs];
		base_pipe_copy_g.color_write_masks_red = [false];
		base_pipe_copy_g.color_write_masks_blue = [false];
		base_pipe_copy_g.color_write_masks_alpha = [false];
		g4_pipeline_compile(base_pipe_copy_g);
	}

	{
		base_pipe_copy_b = g4_pipeline_create();
		base_pipe_copy_b.vertex_shader = sys_get_shader("layer_view.vert");
		base_pipe_copy_b.fragment_shader = sys_get_shader("layer_copy.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
		g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
		g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
		base_pipe_copy_b.input_layout = [vs];
		base_pipe_copy_b.color_write_masks_red = [false];
		base_pipe_copy_b.color_write_masks_green = [false];
		base_pipe_copy_b.color_write_masks_alpha = [false];
		g4_pipeline_compile(base_pipe_copy_b);
	}

	{
		base_pipe_inpaint_preview = g4_pipeline_create();
		base_pipe_inpaint_preview.vertex_shader = sys_get_shader("pass.vert");
		base_pipe_inpaint_preview.fragment_shader = sys_get_shader("inpaint_preview.frag");
		let vs: vertex_struct_t = g4_vertex_struct_create();
		g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_2X);
		base_pipe_inpaint_preview.input_layout = [vs];
		g4_pipeline_compile(base_pipe_inpaint_preview);
		base_tex0_inpaint_preview = g4_pipeline_get_tex_unit(base_pipe_inpaint_preview, "tex0");
		base_texa_inpaint_preview = g4_pipeline_get_tex_unit(base_pipe_inpaint_preview, "texa");
	}
	///end
}

function base_make_pipe_copy_rgb() {
	base_pipe_copy_rgb = g4_pipeline_create();
	base_pipe_copy_rgb.vertex_shader = sys_get_shader("layer_view.vert");
	base_pipe_copy_rgb.fragment_shader = sys_get_shader("layer_copy.frag");
	let vs: vertex_struct_t = g4_vertex_struct_create();
	g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_3X);
	g4_vertex_struct_add(vs, "tex", vertex_data_t.F32_2X);
	g4_vertex_struct_add(vs, "col", vertex_data_t.U8_4X_NORM);
	base_pipe_copy_rgb.input_layout = [vs];
	base_pipe_copy_rgb.color_write_masks_alpha = [false];
	g4_pipeline_compile(base_pipe_copy_rgb);
}

///if is_lab
function base_make_pipe_copy_a() {
	base_pipe_copy_a = g4_pipeline_create();
	base_pipe_copy_a.vertex_shader = sys_get_shader("pass.vert");
	base_pipe_copy_a.fragment_shader = sys_get_shader("layer_copy_rrrr.frag");
	let vs: vertex_struct_t = g4_vertex_struct_create();
	g4_vertex_struct_add(vs, "pos", vertex_data_t.F32_2X);
	base_pipe_copy_a.input_layout = [vs];
	base_pipe_copy_a.color_write_masks_red = [false];
	base_pipe_copy_a.color_write_masks_green = [false];
	base_pipe_copy_a.color_write_masks_blue = [false];
	g4_pipeline_compile(base_pipe_copy_a);
	base_pipe_copy_a_tex = g4_pipeline_get_tex_unit(base_pipe_copy_a, "tex");
}
///end

function base_make_cursor_pipe() {
	base_pipe_cursor = g4_pipeline_create();
	base_pipe_cursor.vertex_shader = sys_get_shader("cursor.vert");
	base_pipe_cursor.fragment_shader = sys_get_shader("cursor.frag");
	let vs: vertex_struct_t = g4_vertex_struct_create();
	///if (krom_metal || krom_vulkan)
	g4_vertex_struct_add(vs, "tex", vertex_data_t.I16_2X_NORM);
	///else
	g4_vertex_struct_add(vs, "pos", vertex_data_t.I16_4X_NORM);
	g4_vertex_struct_add(vs, "nor", vertex_data_t.I16_2X_NORM);
	g4_vertex_struct_add(vs, "tex", vertex_data_t.I16_2X_NORM);
	///end
	base_pipe_cursor.input_layout = [vs];
	base_pipe_cursor.blend_source = blend_factor_t.SOURCE_ALPHA;
	base_pipe_cursor.blend_dest = blend_factor_t.INV_SOURCE_ALPHA;
	base_pipe_cursor.depth_write = false;
	base_pipe_cursor.depth_mode = compare_mode_t.ALWAYS;
	g4_pipeline_compile(base_pipe_cursor);
	base_cursor_vp = g4_pipeline_get_const_loc(base_pipe_cursor, "VP");
	base_cursor_inv_vp = g4_pipeline_get_const_loc(base_pipe_cursor, "invVP");
	base_cursor_mouse = g4_pipeline_get_const_loc(base_pipe_cursor, "mouse");
	base_cursor_tex_step = g4_pipeline_get_const_loc(base_pipe_cursor, "texStep");
	base_cursor_radius = g4_pipeline_get_const_loc(base_pipe_cursor, "radius");
	base_cursor_camera_right = g4_pipeline_get_const_loc(base_pipe_cursor, "cameraRight");
	base_cursor_tint = g4_pipeline_get_const_loc(base_pipe_cursor, "tint");
	base_cursor_gbufferd = g4_pipeline_get_tex_unit(base_pipe_cursor, "gbufferD");
	base_cursor_tex = g4_pipeline_get_tex_unit(base_pipe_cursor, "tex");
}

function base_make_temp_img() {
	///if (is_paint || is_sculpt)
	let l: SlotLayerRaw = project_layers[0];
	///end
	///if is_lab
	let l: any = brush_output_node_inst;
	///end

	if (base_temp_image != null && (base_temp_image.width != l.texpaint.width || base_temp_image.height != l.texpaint.height || base_temp_image.format != l.texpaint.format)) {
		let _temptex0: render_target_t = render_path_render_targets.get("temptex0");
		base_notify_on_next_frame(function() {
			render_target_unload(_temptex0);
		});
		render_path_render_targets.delete("temptex0");
		base_temp_image = null;
	}
	if (base_temp_image == null) {
		///if (is_paint || is_sculpt)
		let format: string = base_bits_handle.position == texture_bits_t.BITS8  ? "RGBA32" :
								base_bits_handle.position == texture_bits_t.BITS16 ? "RGBA64" :
																				"RGBA128";
		///end
		///if is_lab
		let format: string = "RGBA32";
		///end

		let t: render_target_t = render_target_create();
		t.name = "temptex0";
		t.width = l.texpaint.width;
		t.height = l.texpaint.height;
		t.format = format;
		let rt: render_target_t = render_path_create_render_target(t);
		base_temp_image = rt._image;
	}
}

///if (is_paint || is_sculpt)
function base_make_temp_mask_img() {
	if (base_temp_mask_image != null && (base_temp_mask_image.width != config_get_texture_res_x() || base_temp_mask_image.height != config_get_texture_res_y())) {
		let _temp_mask_image: image_t = base_temp_mask_image;
		base_notify_on_next_frame(function() {
			image_unload(_temp_mask_image);
		});
		base_temp_mask_image = null;
	}
	if (base_temp_mask_image == null) {
		base_temp_mask_image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y(), tex_format_t.R8);
	}
}
///end

function base_make_export_img() {
	///if (is_paint || is_sculpt)
	let l: SlotLayerRaw = project_layers[0];
	///end
	///if is_lab
	let l: any = brush_output_node_inst;
	///end

	if (base_expa != null && (base_expa.width != l.texpaint.width || base_expa.height != l.texpaint.height || base_expa.format != l.texpaint.format)) {
		let _expa: image_t = base_expa;
		let _expb: image_t = base_expb;
		let _expc: image_t = base_expc;
		base_notify_on_next_frame(function() {
			image_unload(_expa);
			image_unload(_expb);
			image_unload(_expc);
		});
		base_expa = null;
		base_expb = null;
		base_expc = null;
		render_path_render_targets.delete("expa");
		render_path_render_targets.delete("expb");
		render_path_render_targets.delete("expc");
	}
	if (base_expa == null) {
		///if (is_paint || is_sculpt)
		let format: string = base_bits_handle.position == texture_bits_t.BITS8  ? "RGBA32" :
						base_bits_handle.position == texture_bits_t.BITS16 		? "RGBA64" :
																				"RGBA128";
		///end
		///if is_lab
		let format: string = "RGBA32";
		///end

		{
			let t: render_target_t = render_target_create();
			t.name = "expa";
			t.width = l.texpaint.width;
			t.height = l.texpaint.height;
			t.format = format;
			let rt: render_target_t = render_path_create_render_target(t);
			base_expa = rt._image;
		}

		{
			let t: render_target_t = render_target_create();
			t.name = "expb";
			t.width = l.texpaint.width;
			t.height = l.texpaint.height;
			t.format = format;
			let rt: render_target_t = render_path_create_render_target(t);
			base_expb = rt._image;
		}

		{
			let t: render_target_t = render_target_create();
			t.name = "expc";
			t.width = l.texpaint.width;
			t.height = l.texpaint.height;
			t.format = format;
			let rt: render_target_t = render_path_create_render_target(t);
			base_expc = rt._image;
		}
	}
}

///if (is_paint || is_sculpt)
function base_duplicate_layer(l: SlotLayerRaw) {
	if (!slot_layer_is_group(l)) {
		let new_layer: SlotLayerRaw = slot_layer_duplicate(l);
		context_set_layer(new_layer);
		let masks: SlotLayerRaw[] = slot_layer_get_masks(l, false);
		if (masks != null) {
			for (let m of masks) {
				m = slot_layer_duplicate(m);
				m.parent = new_layer;
				array_remove(project_layers, m);
				project_layers.splice(project_layers.indexOf(new_layer), 0, m);
			}
		}
		context_set_layer(new_layer);
	}
	else {
		let new_group: SlotLayerRaw = base_new_group();
		array_remove(project_layers, new_group);
		project_layers.splice(project_layers.indexOf(l) + 1, 0, new_group);
		// group.show_panel = true;
		for (let c of slot_layer_get_children(l)) {
			let masks: SlotLayerRaw[] = slot_layer_get_masks(c, false);
			let new_layer: SlotLayerRaw = slot_layer_duplicate(c);
			new_layer.parent = new_group;
			array_remove(project_layers, new_layer);
			project_layers.splice(project_layers.indexOf(new_group), 0, new_layer);
			if (masks != null) {
				for (let m of masks) {
					let new_mask: SlotLayerRaw = slot_layer_duplicate(m);
					new_mask.parent = new_layer;
					array_remove(project_layers, new_mask);
					project_layers.splice(project_layers.indexOf(new_layer), 0, new_mask);
				}
			}
		}
		let group_masks: SlotLayerRaw[] = slot_layer_get_masks(l);
		if (group_masks != null) {
			for (let m of group_masks) {
				let new_mask: SlotLayerRaw = slot_layer_duplicate(m);
				new_mask.parent = new_group;
				array_remove(project_layers, new_mask);
				project_layers.splice(project_layers.indexOf(new_group), 0, new_mask);
			}
		}
		context_set_layer(new_group);
	}
}

function base_apply_masks(l: SlotLayerRaw) {
	let masks: SlotLayerRaw[] = slot_layer_get_masks(l);

	if (masks != null) {
		for (let i: i32 = 0; i < masks.length - 1; ++i) {
			base_merge_layer(masks[i + 1], masks[i]);
			slot_layer_delete(masks[i]);
		}
		slot_layer_apply_mask(masks[masks.length - 1]);
		context_raw.layer_preview_dirty = true;
	}
}

function base_merge_down() {
	let l1: SlotLayerRaw = context_raw.layer;

	if (slot_layer_is_group(l1)) {
		l1 = base_merge_group(l1);
	}
	else if (slot_layer_has_masks(l1)) { // It is a layer
		base_apply_masks(l1);
		context_set_layer(l1);
	}

	let l0: SlotLayerRaw = project_layers[project_layers.indexOf(l1) - 1];

	if (slot_layer_is_group(l0)) {
		l0 = base_merge_group(l0);
	}
	else if (slot_layer_has_masks(l0)) { // It is a layer
		base_apply_masks(l0);
		context_set_layer(l0);
	}

	base_merge_layer(l0, l1);
	slot_layer_delete(l1);
	context_set_layer(l0);
	context_raw.layer_preview_dirty = true;
}

function base_merge_group(l: SlotLayerRaw) {
	if (!slot_layer_is_group(l)) return null;

	let children: SlotLayerRaw[] = slot_layer_get_children(l);

	if (children.length == 1 && slot_layer_has_masks(children[0], false)) {
		base_apply_masks(children[0]);
	}

	for (let i: i32 = 0; i < children.length - 1; ++i) {
		context_set_layer(children[children.length - 1 - i]);
		history_merge_layers();
		base_merge_down();
	}

	// Now apply the group masks
	let masks: SlotLayerRaw[] = slot_layer_get_masks(l);
	if (masks != null) {
		for (let i: i32 = 0; i < masks.length - 1; ++i) {
			base_merge_layer(masks[i + 1], masks[i]);
			slot_layer_delete(masks[i]);
		}
		base_apply_mask(children[0], masks[masks.length - 1]);
	}

	children[0].parent = null;
	children[0].name = l.name;
	if (children[0].fill_layer != null) slot_layer_to_paint_layer(children[0]);
	slot_layer_delete(l);
	return children[0];
}

function base_merge_layer(l0 : SlotLayerRaw, l1: SlotLayerRaw, use_mask: bool = false) {
	if (!l1.visible || slot_layer_is_group(l1)) return;

	if (base_pipe_merge == null) base_make_pipe();
	base_make_temp_img();
	if (const_data_screen_aligned_vb == null) const_data_create_screen_aligned_data();

	g2_begin(base_temp_image); // Copy to temp
	g2_set_pipeline(base_pipe_copy);
	g2_draw_image(l0.texpaint, 0, 0);
	g2_set_pipeline(null);
	g2_end();

	let empty: image_t = render_path_render_targets.get("empty_white")._image;
	let mask: image_t = empty;
	let l1masks: SlotLayerRaw[] =  use_mask ? slot_layer_get_masks(l1) : null;
	if (l1masks != null) {
		// for (let i: i32 = 1; i < l1masks.length - 1; ++i) {
		// 	mergeLayer(l1masks[i + 1], l1masks[i]);
		// }
		mask = l1masks[0].texpaint;
	}

	if (slot_layer_is_mask(l1)) {
		g4_begin(l0.texpaint);
		g4_set_pipeline(base_pipe_merge_mask);
		g4_set_tex(base_tex0_merge_mask, l1.texpaint);
		g4_set_tex(base_texa_merge_mask, base_temp_image);
		g4_set_float(base_opac_merge_mask, slot_layer_get_opacity(l1));
		g4_set_int(base_blending_merge_mask, l1.blending);
		g4_set_vertex_buffer(const_data_screen_aligned_vb);
		g4_set_index_buffer(const_data_screen_aligned_ib);
		g4_draw();
		g4_end();
	}

	if (slot_layer_is_layer(l1)) {
		if (l1.paint_base) {
			g4_begin(l0.texpaint);
			g4_set_pipeline(base_pipe_merge);
			g4_set_tex(base_tex0, l1.texpaint);
			g4_set_tex(base_tex1, empty);
			g4_set_tex(base_texmask, mask);
			g4_set_tex(base_texa, base_temp_image);
			g4_set_float(base_opac, slot_layer_get_opacity(l1));
			g4_set_int(base_blending, l1.blending);
			g4_set_vertex_buffer(const_data_screen_aligned_vb);
			g4_set_index_buffer(const_data_screen_aligned_ib);
			g4_draw();
			g4_end();
		}

		///if is_paint
		g2_begin(base_temp_image);
		g2_set_pipeline(base_pipe_copy);
		g2_draw_image(l0.texpaint_nor, 0, 0);
		g2_set_pipeline(null);
		g2_end();

		if (l1.paint_nor) {
			g4_begin(l0.texpaint_nor);
			g4_set_pipeline(base_pipe_merge);
			g4_set_tex(base_tex0, l1.texpaint);
			g4_set_tex(base_tex1, l1.texpaint_nor);
			g4_set_tex(base_texmask, mask);
			g4_set_tex(base_texa, base_temp_image);
			g4_set_float(base_opac, slot_layer_get_opacity(l1));
			g4_set_int(base_blending, l1.paint_nor_blend ? -2 : -1);
			g4_set_vertex_buffer(const_data_screen_aligned_vb);
			g4_set_index_buffer(const_data_screen_aligned_ib);
			g4_draw();
			g4_end();
		}

		g2_begin(base_temp_image);
		g2_set_pipeline(base_pipe_copy);
		g2_draw_image(l0.texpaint_pack, 0, 0);
		g2_set_pipeline(null);
		g2_end();

		if (l1.paint_occ || l1.paint_rough || l1.paint_met || l1.paint_height) {
			if (l1.paint_occ && l1.paint_rough && l1.paint_met && l1.paint_height) {
				base_commands_merge_pack(base_pipe_merge, l0.texpaint_pack, l1.texpaint, l1.texpaint_pack, slot_layer_get_opacity(l1), mask, l1.paint_height_blend ? -3 : -1);
			}
			else {
				if (l1.paint_occ) base_commands_merge_pack(base_pipe_merge_r, l0.texpaint_pack, l1.texpaint, l1.texpaint_pack, slot_layer_get_opacity(l1), mask);
				if (l1.paint_rough) base_commands_merge_pack(base_pipe_merge_g, l0.texpaint_pack, l1.texpaint, l1.texpaint_pack, slot_layer_get_opacity(l1), mask);
				if (l1.paint_met) base_commands_merge_pack(base_pipe_merge_b, l0.texpaint_pack, l1.texpaint, l1.texpaint_pack, slot_layer_get_opacity(l1), mask);
			}
		}
		///end
	}
}

function base_flatten(height_to_normal: bool = false, layers: SlotLayerRaw[] = null): any {
	if (layers == null) layers = project_layers;
	base_make_temp_img();
	base_make_export_img();
	if (base_pipe_merge == null) base_make_pipe();
	if (const_data_screen_aligned_vb == null) const_data_create_screen_aligned_data();
	let empty: image_t = render_path_render_targets.get("empty_white")._image;

	// Clear export layer
	g4_begin(base_expa);
	g4_clear(color_from_floats(0.0, 0.0, 0.0, 0.0));
	g4_end();
	g4_begin(base_expb);
	g4_clear(color_from_floats(0.5, 0.5, 1.0, 0.0));
	g4_end();
	g4_begin(base_expc);
	g4_clear(color_from_floats(1.0, 0.0, 0.0, 0.0));
	g4_end();

	// Flatten layers
	for (let l1 of layers) {
		if (!slot_layer_is_visible(l1)) continue;
		if (!slot_layer_is_layer(l1)) continue;

		let mask: image_t = empty;
		let l1masks: SlotLayerRaw[] = slot_layer_get_masks(l1);
		if (l1masks != null) {
			if (l1masks.length > 1) {
				base_make_temp_mask_img();
				g2_begin(base_temp_mask_image);
				g2_clear(0x00000000);
				g2_end();
				let l1: any = { texpaint: base_temp_mask_image };
				for (let i: i32 = 0; i < l1masks.length; ++i) {
					base_merge_layer(l1, l1masks[i]);
				}
				mask = base_temp_mask_image;
			}
			else mask = l1masks[0].texpaint;
		}

		if (l1.paint_base) {
			g2_begin(base_temp_image); // Copy to temp
			g2_set_pipeline(base_pipe_copy);
			g2_draw_image(base_expa, 0, 0);
			g2_set_pipeline(null);
			g2_end();

			g4_begin(base_expa);
			g4_set_pipeline(base_pipe_merge);
			g4_set_tex(base_tex0, l1.texpaint);
			g4_set_tex(base_tex1, empty);
			g4_set_tex(base_texmask, mask);
			g4_set_tex(base_texa, base_temp_image);
			g4_set_float(base_opac, slot_layer_get_opacity(l1));
			g4_set_int(base_blending, layers.length > 1 ? l1.blending : 0);
			g4_set_vertex_buffer(const_data_screen_aligned_vb);
			g4_set_index_buffer(const_data_screen_aligned_ib);
			g4_draw();
			g4_end();
		}

		///if is_paint
		if (l1.paint_nor) {
			g2_begin(base_temp_image);
			g2_set_pipeline(base_pipe_copy);
			g2_draw_image(base_expb, 0, 0);
			g2_set_pipeline(null);
			g2_end();

			g4_begin(base_expb);
			g4_set_pipeline(base_pipe_merge);
			g4_set_tex(base_tex0, l1.texpaint);
			g4_set_tex(base_tex1, l1.texpaint_nor);
			g4_set_tex(base_texmask, mask);
			g4_set_tex(base_texa, base_temp_image);
			g4_set_float(base_opac, slot_layer_get_opacity(l1));
			g4_set_int(base_blending, l1.paint_nor_blend ? -2 : -1);
			g4_set_vertex_buffer(const_data_screen_aligned_vb);
			g4_set_index_buffer(const_data_screen_aligned_ib);
			g4_draw();
			g4_end();
		}

		if (l1.paint_occ || l1.paint_rough || l1.paint_met || l1.paint_height) {
			g2_begin(base_temp_image);
			g2_set_pipeline(base_pipe_copy);
			g2_draw_image(base_expc, 0, 0);
			g2_set_pipeline(null);
			g2_end();

			if (l1.paint_occ && l1.paint_rough && l1.paint_met && l1.paint_height) {
				base_commands_merge_pack(base_pipe_merge, base_expc, l1.texpaint, l1.texpaint_pack, slot_layer_get_opacity(l1), mask, l1.paint_height_blend ? -3 : -1);
			}
			else {
				if (l1.paint_occ) base_commands_merge_pack(base_pipe_merge_r, base_expc, l1.texpaint, l1.texpaint_pack, slot_layer_get_opacity(l1), mask);
				if (l1.paint_rough) base_commands_merge_pack(base_pipe_merge_g, base_expc, l1.texpaint, l1.texpaint_pack, slot_layer_get_opacity(l1), mask);
				if (l1.paint_met) base_commands_merge_pack(base_pipe_merge_b, base_expc, l1.texpaint, l1.texpaint_pack, slot_layer_get_opacity(l1), mask);
			}
		}
		///end
	}

	///if krom_metal
	// Flush command list
	g2_begin(base_expa);
	g2_end();
	g2_begin(base_expb);
	g2_end();
	g2_begin(base_expc);
	g2_end();
	///end

	let l0: any = { texpaint: base_expa, texpaint_nor: base_expb, texpaint_pack: base_expc };

	// Merge height map into normal map
	if (height_to_normal && make_material_height_used) {

		g2_begin(base_temp_image);
		g2_set_pipeline(base_pipe_copy);
		g2_draw_image(l0.texpaint_nor, 0, 0);
		g2_set_pipeline(null);
		g2_end();

		g4_begin(l0.texpaint_nor);
		g4_set_pipeline(base_pipe_merge);
		g4_set_tex(base_tex0, base_temp_image);
		g4_set_tex(base_tex1, l0.texpaint_pack);
		g4_set_tex(base_texmask, empty);
		g4_set_tex(base_texa, empty);
		g4_set_float(base_opac, 1.0);
		g4_set_int(base_blending, -4);
		g4_set_vertex_buffer(const_data_screen_aligned_vb);
		g4_set_index_buffer(const_data_screen_aligned_ib);
		g4_draw();
		g4_end();
	}

	return l0;
}

function base_apply_mask(l: SlotLayerRaw, m: SlotLayerRaw) {
	if (!slot_layer_is_layer(l) || !slot_layer_is_mask(m)) return;

	if (base_pipe_merge == null) base_make_pipe();
	base_make_temp_img();

	// Copy layer to temp
	g2_begin(base_temp_image);
	g2_set_pipeline(base_pipe_copy);
	g2_draw_image(l.texpaint, 0, 0);
	g2_set_pipeline(null);
	g2_end();

	// Apply mask
	if (const_data_screen_aligned_vb == null) const_data_create_screen_aligned_data();
	g4_begin(l.texpaint);
	g4_set_pipeline(base_pipe_apply_mask);
	g4_set_tex(base_tex0_mask, base_temp_image);
	g4_set_tex(base_texa_mask, m.texpaint);
	g4_set_vertex_buffer(const_data_screen_aligned_vb);
	g4_set_index_buffer(const_data_screen_aligned_ib);
	g4_draw();
	g4_end();
}

function base_commands_merge_pack(pipe: pipeline_t, i0: image_t, i1: image_t, i1pack: image_t, i1mask_opacity: f32, i1texmask: image_t, i1blending: i32 = -1) {
	g4_begin(i0);
	g4_set_pipeline(pipe);
	g4_set_tex(base_tex0, i1);
	g4_set_tex(base_tex1, i1pack);
	g4_set_tex(base_texmask, i1texmask);
	g4_set_tex(base_texa, base_temp_image);
	g4_set_float(base_opac, i1mask_opacity);
	g4_set_int(base_blending, i1blending);
	g4_set_vertex_buffer(const_data_screen_aligned_vb);
	g4_set_index_buffer(const_data_screen_aligned_ib);
	g4_draw();
	g4_end();
}

function base_is_fill_material(): bool {
	///if is_paint
	if (context_raw.tool == workspace_tool_t.MATERIAL) return true;
	///end

	let m: SlotMaterialRaw = context_raw.material;
	for (let l of project_layers) if (l.fill_layer == m) return true;
	return false;
}

function base_update_fill_layers() {
	let _layer: SlotLayerRaw = context_raw.layer;
	let _tool: workspace_tool_t = context_raw.tool;
	let _fill_type: i32 = context_raw.fill_type_handle.position;
	let current: image_t = null;

	///if is_paint
	if (context_raw.tool == workspace_tool_t.MATERIAL) {
		if (render_path_paint_live_layer == null) {
			render_path_paint_live_layer = slot_layer_create("_live");
		}

		current = _g2_current;
		if (current != null) g2_end();

		context_raw.tool = workspace_tool_t.FILL;
		context_raw.fill_type_handle.position = fill_type_t.OBJECT;
		make_material_parse_paint_material(false);
		context_raw.pdirty = 1;
		render_path_paint_use_live_layer(true);
		render_path_paint_commands_paint(false);
		render_path_paint_dilate(true, true);
		render_path_paint_use_live_layer(false);
		context_raw.tool = _tool;
		context_raw.fill_type_handle.position = _fill_type;
		context_raw.pdirty = 0;
		context_raw.rdirty = 2;

		if (current != null) g2_begin(current);
		return;
	}
	///end

	let has_fill_layer: bool = false;
	let has_fill_mask: bool = false;
	for (let l of project_layers) if (slot_layer_is_layer(l) && l.fill_layer == context_raw.material) has_fill_layer = true;
	for (let l of project_layers) if (slot_layer_is_mask(l) && l.fill_layer == context_raw.material) has_fill_mask = true;

	if (has_fill_layer || has_fill_mask) {
		current = _g2_current;
		if (current != null) g2_end();
		context_raw.pdirty = 1;
		context_raw.tool = workspace_tool_t.FILL;
		context_raw.fill_type_handle.position = fill_type_t.OBJECT;

		if (has_fill_layer) {
			let first: bool = true;
			for (let l of project_layers) {
				if (slot_layer_is_layer(l) && l.fill_layer == context_raw.material) {
					context_raw.layer = l;
					if (first) {
						first = false;
						make_material_parse_paint_material(false);
					}
					base_set_object_mask();
					slot_layer_clear(l);
					render_path_paint_commands_paint(false);
					render_path_paint_dilate(true, true);
				}
			}
		}
		if (has_fill_mask) {
			let first: bool = true;
			for (let l of project_layers) {
				if (slot_layer_is_mask(l) && l.fill_layer == context_raw.material) {
					context_raw.layer = l;
					if (first) {
						first = false;
						make_material_parse_paint_material(false);
					}
					base_set_object_mask();
					slot_layer_clear(l);
					render_path_paint_commands_paint(false);
					render_path_paint_dilate(true, true);
				}
			}
		}

		context_raw.pdirty = 0;
		context_raw.ddirty = 2;
		context_raw.rdirty = 2;
		context_raw.layers_preview_dirty = true; // Repaint all layer previews as multiple layers might have changed.
		if (current != null) g2_begin(current);
		context_raw.layer = _layer;
		base_set_object_mask();
		context_raw.tool = _tool;
		context_raw.fill_type_handle.position = _fill_type;
		make_material_parse_paint_material(false);
	}
}

function base_update_fill_layer(parse_paint: bool = true) {
	let current: image_t = _g2_current;
	let g2_in_use: bool = _g2_in_use;
	if (g2_in_use) g2_end();

	let _tool: workspace_tool_t = context_raw.tool;
	let _fill_type: i32 = context_raw.fill_type_handle.position;
	context_raw.tool = workspace_tool_t.FILL;
	context_raw.fill_type_handle.position = fill_type_t.OBJECT;
	context_raw.pdirty = 1;

	slot_layer_clear(context_raw.layer);

	if (parse_paint) make_material_parse_paint_material(false);
	render_path_paint_commands_paint(false);
	render_path_paint_dilate(true, true);

	context_raw.rdirty = 2;
	context_raw.tool = _tool;
	context_raw.fill_type_handle.position = _fill_type;
	if (g2_in_use) g2_begin(current);
}

function base_set_object_mask() {
	///if is_sculpt
	return;
	///end

	let ar: string[] = [tr("None")];
	for (let p of project_paint_objects) ar.push(p.base.name);

	let mask: i32 = context_object_mask_used() ? slot_layer_get_object_mask(context_raw.layer) : 0;
	if (context_layer_filter_used()) mask = context_raw.layer_filter;
	if (mask > 0) {
		if (context_raw.merged_object != null) {
			context_raw.merged_object.base.visible = false;
		}
		let o: mesh_object_t = project_paint_objects[0];
		for (let p of project_paint_objects) {
			if (p.base.name == ar[mask]) {
				o = p;
				break;
			}
		}
		context_select_paint_object(o);
	}
	else {
		let is_atlas: bool = slot_layer_get_object_mask(context_raw.layer) > 0 && slot_layer_get_object_mask(context_raw.layer) <= project_paint_objects.length;
		if (context_raw.merged_object == null || is_atlas || context_raw.merged_object_is_atlas) {
			let visibles: mesh_object_t[] = is_atlas ? project_get_atlas_objects(slot_layer_get_object_mask(context_raw.layer)) : null;
			util_mesh_merge(visibles);
		}
		context_select_paint_object(context_main_object());
		context_raw.paint_object.skip_context = "paint";
		context_raw.merged_object.base.visible = true;
	}
	util_uv_dilatemap_cached = false;
}

function base_new_layer(clear: bool = true, position: i32 = -1): SlotLayerRaw {
	if (project_layers.length > base_max_layers) return null;
	let l: SlotLayerRaw = slot_layer_create();
	l.object_mask = context_raw.layer_filter;
	if (position == -1) {
		if (slot_layer_is_mask(context_raw.layer)) context_set_layer(context_raw.layer.parent);
		project_layers.splice(project_layers.indexOf(context_raw.layer) + 1, 0, l);
	}
	else {
		project_layers.splice(position, 0, l);
	}

	context_set_layer(l);
	let li: i32 = project_layers.indexOf(context_raw.layer);
	if (li > 0) {
		let below: SlotLayerRaw = project_layers[li - 1];
		if (slot_layer_is_layer(below)) {
			context_raw.layer.parent = below.parent;
		}
	}
	if (clear) app_notify_on_init(function() { slot_layer_clear(l); });
	context_raw.layer_preview_dirty = true;
	return l;
}

function base_new_mask(clear: bool = true, parent: SlotLayerRaw, position: i32 = -1): SlotLayerRaw {
	if (project_layers.length > base_max_layers) return null;
	let l: SlotLayerRaw = slot_layer_create("", layer_slot_type_t.MASK, parent);
	if (position == -1) position = project_layers.indexOf(parent);
	project_layers.splice(position, 0, l);
	context_set_layer(l);
	if (clear) app_notify_on_init(function() { slot_layer_clear(l); });
	context_raw.layer_preview_dirty = true;
	return l;
}

function base_new_group(): SlotLayerRaw {
	if (project_layers.length > base_max_layers) return null;
	let l: SlotLayerRaw = slot_layer_create("", layer_slot_type_t.GROUP);
	project_layers.push(l);
	context_set_layer(l);
	return l;
}

function base_create_fill_layer(uv_type: uv_type_t = uv_type_t.UVMAP, decal_mat: mat4_t = null, position: i32 = -1) {
	let _init = function() {
		let l: SlotLayerRaw = base_new_layer(false, position);
		history_new_layer();
		l.uv_type = uv_type;
		if (decal_mat != null) l.decal_mat = decal_mat;
		l.object_mask = context_raw.layer_filter;
		history_to_fill_layer();
		slot_layer_to_fill_layer(l);
	}
	app_notify_on_init(_init);
}

function base_create_image_mask(asset: asset_t) {
	let l: SlotLayerRaw = context_raw.layer;
	if (slot_layer_is_mask(l) || slot_layer_is_group(l)) {
		return;
	}

	history_new_layer();
	let m: SlotLayerRaw = base_new_mask(false, l);
	slot_layer_clear(m, 0x00000000, project_get_image(asset));
	context_raw.layer_preview_dirty = true;
}

function base_create_color_layer(baseColor: i32, occlusion: f32 = 1.0, roughness: f32 = base_default_rough, metallic: f32 = 0.0, position: i32 = -1) {
	let _init = function() {
		let l: SlotLayerRaw = base_new_layer(false, position);
		history_new_layer();
		l.uv_type = uv_type_t.UVMAP;
		l.object_mask = context_raw.layer_filter;
		slot_layer_clear(l, baseColor, null, occlusion, roughness, metallic);
	}
	app_notify_on_init(_init);
}

function base_on_layers_resized() {
	app_notify_on_init(function() {
		base_resize_layers();
		let _layer: SlotLayerRaw = context_raw.layer;
		let _material: SlotMaterialRaw = context_raw.material;
		for (let l of project_layers) {
			if (l.fill_layer != null) {
				context_raw.layer = l;
				context_raw.material = l.fill_layer;
				base_update_fill_layer();
			}
		}
		context_raw.layer = _layer;
		context_raw.material = _material;
		make_material_parse_paint_material();
	});
	util_uv_uvmap = null;
	util_uv_uvmap_cached = false;
	util_uv_trianglemap = null;
	util_uv_trianglemap_cached = false;
	util_uv_dilatemap_cached = false;
	///if (krom_direct3d12 || krom_vulkan || krom_metal)
	render_path_raytrace_ready = false;
	///end
}
///end

///if is_lab
function base_flatten(heightToNormal: bool = false): any {
	let texpaint: image_t = brush_output_node_inst.texpaint;
	let texpaint_nor: image_t = brush_output_node_inst.texpaint_nor;
	let texpaint_pack: image_t = brush_output_node_inst.texpaint_pack;

	let nodes: zui_nodes_t = ui_nodes_get_nodes();
	let canvas: zui_node_canvas_t = ui_nodes_get_canvas(true);
	if (nodes.nodes_selected_id.length > 0) {
		let node: zui_node_t = zui_get_node(canvas.nodes, nodes.nodes_selected_id[0]);
		let brush_node: LogicNode = parser_logic_get_logic_node(node);
		if (brush_node != null && brush_node.get_cached_image() != null) {
			texpaint = brush_node.get_cached_image();
			texpaint_nor = render_path_render_targets.get("texpaint_nor_empty")._image;
			texpaint_pack = render_path_render_targets.get("texpaint_pack_empty")._image;
		}
	}

	return { texpaint: texpaint, texpaint_nor: texpaint_nor, texpaint_pack: texpaint_pack };
}

function base_on_layers_resized() {
	image_unload(brush_output_node_inst.texpaint);
	brush_output_node_inst.texpaint = render_path_render_targets.get("texpaint")._image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y());
	image_unload(brush_output_node_inst.texpaint_nor);
	brush_output_node_inst.texpaint_nor = render_path_render_targets.get("texpaint_nor")._image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y());
	image_unload(brush_output_node_inst.texpaint_pack);
	brush_output_node_inst.texpaint_pack = render_path_render_targets.get("texpaint_pack")._image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y());

	if (InpaintNode.image != null) {
		image_unload(InpaintNode.image);
		InpaintNode.image = null;
		image_unload(InpaintNode.mask);
		InpaintNode.mask = null;
		InpaintNode.init();
	}

	if (PhotoToPBRNode.images != null) {
		for (let image of PhotoToPBRNode.images) image_unload(image);
		PhotoToPBRNode.images = null;
		PhotoToPBRNode.init();
	}

	if (TilingNode.image != null) {
		image_unload(TilingNode.image);
		TilingNode.image = null;
		TilingNode.init();
	}

	image_unload(render_path_render_targets.get("texpaint_blend0")._image);
	render_path_render_targets.get("texpaint_blend0")._image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y(), tex_format_t.R8);
	image_unload(render_path_render_targets.get("texpaint_blend1")._image);
	render_path_render_targets.get("texpaint_blend1")._image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y(), tex_format_t.R8);

	if (render_path_render_targets.get("texpaint_node") != null) {
		render_path_render_targets.delete("texpaint_node");
	}
	if (render_path_render_targets.get("texpaint_node_target") != null) {
		render_path_render_targets.delete("texpaint_node_target");
	}

	base_notify_on_next_frame(function() {
		base_init_layers();
	});

	///if (krom_direct3d12 || krom_vulkan || krom_metal)
	render_path_raytrace_ready = false;
	///end
}
///end
