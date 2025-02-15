
function import_asset_run(path: string, drop_x: f32 = -1.0, drop_y: f32 = -1.0, show_box: bool = true, hdr_as_envmap: bool = true, done: ()=>void = null) {

	if (path.startsWith("cloud")) {
		let do_cache_cloud = function () {
			file_cache_cloud(path, function (abs: string) {
				if (abs == null) return;
				import_asset_run(abs, drop_x, drop_y, show_box, hdr_as_envmap, done);
			});
		}

		///if (krom_android || krom_ios)
		base_notify_on_next_frame(function () {
			console_toast(tr("Downloading"));
			base_notify_on_next_frame(do_cache_cloud);
		});
		///else
		do_cache_cloud();
		///end

		return;
	}

	if (path_is_mesh(path)) {
		show_box ? project_import_mesh_box(path) : import_mesh_run(path);
		if (drop_x > 0) ui_box_click_to_hide = false; // Prevent closing when going back to window after drag and drop
	}
	else if (path_is_texture(path)) {
		import_texture_run(path, hdr_as_envmap);
		// Place image node
		let x0: i32 = ui_nodes_wx;
		let x1: i32 = ui_nodes_wx + ui_nodes_ww;
		if (ui_nodes_show && drop_x > x0 && drop_x < x1) {
			let asset_index: i32 = 0;
			for (let i: i32 = 0; i < project_assets.length; ++i) {
				if (project_assets[i].file == path) {
					asset_index = i;
					break;
				}
			}
			ui_nodes_accept_asset_drag(asset_index);
			ui_nodes_get_nodes().nodes_drag = false;
			ui_nodes_hwnd.redraws = 2;
		}

		///if is_paint
		if (context_raw.tool == workspace_tool_t.COLORID && project_asset_names.length == 1) {
			ui_header_handle.redraws = 2;
			context_raw.ddirty = 2;
		}
		///end
	}
	else if (path_is_project(path)) {
		import_arm_run_project(path);
	}
	else if (path_is_plugin(path)) {
		import_plugin_run(path);
	}
	else if (path_is_gimp_color_palette(path)) {
		import_gpl_run(path, false);
	}
	///if is_paint
	else if (path_is_font(path)) {
		import_font_run(path);
	}
	else if (path_is_folder(path)) {
		import_folder_run(path);
	}
	///end
	else {
		if (context_enable_import_plugin(path)) {
			import_asset_run(path, drop_x, drop_y, show_box);
		}
		else {
			console_error(strings_error1());
		}
	}

	if (done != null) done();
}
