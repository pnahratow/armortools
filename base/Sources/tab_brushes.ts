
///if (is_paint || is_sculpt)

function tab_brushes_draw(htab: zui_handle_t) {
	let ui: zui_t = ui_base_ui;
	if (zui_tab(htab, tr("Brushes"))) {
		zui_begin_sticky();
		zui_row([1 / 4, 1 / 4, 1 / 4]);
		if (zui_button(tr("New"))) {
			context_raw.brush = slot_brush_create();
			project_brushes.push(context_raw.brush);
			make_material_parse_brush();
			ui_nodes_hwnd.redraws = 2;
		}
		if (zui_button(tr("Import"))) {
			project_import_brush();
		}
		if (zui_button(tr("Nodes"))) {
			ui_base_show_brush_nodes();
		}
		zui_end_sticky();
		zui_separator(3, false);

		let slotw: i32 = math_floor(51 * zui_SCALE(ui));
		let num: i32 = math_floor(config_raw.layout[layout_size_t.SIDEBAR_W] / slotw);

		for (let row: i32 = 0; row < math_floor(math_ceil(project_brushes.length / num)); ++row) {
			let mult: i32 = config_raw.show_asset_names ? 2 : 1;
			let ar: f32[] = [];
			for (let i: i32 = 0; i < num * mult; ++i) ar.push(1 / num);
			zui_row(ar);

			ui._x += 2;
			let off: f32 = config_raw.show_asset_names ? zui_ELEMENT_OFFSET(ui) * 10.0 : 6;
			if (row > 0) ui._y += off;

			for (let j: i32 = 0; j < num; ++j) {
				let imgw: i32 = math_floor(50 * zui_SCALE(ui));
				let i: i32 = j + row * num;
				if (i >= project_brushes.length) {
					zui_end_element(imgw);
					if (config_raw.show_asset_names) zui_end_element(0);
					continue;
				}
				let img: image_t = zui_SCALE(ui) > 1 ? project_brushes[i].image : project_brushes[i].image_icon;
				let img_full: image_t = project_brushes[i].image;

				if (context_raw.brush == project_brushes[i]) {
					// Zui.fill(1, -2, img.width + 3, img.height + 3, ui.t.HIGHLIGHT_COL); // TODO
					let off: i32 = row % 2 == 1 ? 1 : 0;
					let w: i32 = 50;
					if (config_raw.window_scale > 1) w += math_floor(config_raw.window_scale * 2);
					zui_fill(-1,         -2, w + 3,       2, ui.t.HIGHLIGHT_COL);
					zui_fill(-1,    w - off, w + 3, 2 + off, ui.t.HIGHLIGHT_COL);
					zui_fill(-1,         -2,     2,   w + 3, ui.t.HIGHLIGHT_COL);
					zui_fill(w + 1,      -2,     2,   w + 4, ui.t.HIGHLIGHT_COL);
				}

				let uix: f32 = ui._x;
				//let uiy: f32 = ui._y;
				let tile: i32 = zui_SCALE(ui) > 1 ? 100 : 50;
				let state: zui_state_t = project_brushes[i].preview_ready ? zui_image(img) : zui_image(resource_get("icons.k"), -1, -1.0, tile * 5, tile, tile, tile);
				if (state == zui_state_t.STARTED) {
					if (context_raw.brush != project_brushes[i]) context_select_brush(i);
					if (time_time() - context_raw.select_time < 0.25) ui_base_show_brush_nodes();
					context_raw.select_time = time_time();
					// app_drag_off_x = -(mouse_x - uix - ui._windowX - 3);
					// app_drag_off_y = -(mouse_y - uiy - ui._windowY + 1);
					// app_drag_brush = raw.brush;
				}
				if (ui.is_hovered && ui.input_released_r) {
					context_select_brush(i);
					let add: i32 = project_brushes.length > 1 ? 1 : 0;
					ui_menu_draw((ui: zui_t) => {
						//let b: SlotBrushRaw = brushes[i];

						if (ui_menu_button(ui, tr("Export"))) {
							context_select_brush(i);
							box_export_show_brush();
						}

						if (ui_menu_button(ui, tr("Duplicate"))) {
							let _init = () => {
								context_raw.brush = slot_brush_create();
								project_brushes.push(context_raw.brush);
								let cloned: any = json_parse(json_stringify(project_brushes[i].canvas));
								context_raw.brush.canvas = cloned;
								context_set_brush(context_raw.brush);
								util_render_make_brush_preview();
							}
							app_notify_on_init(_init);
						}

						if (project_brushes.length > 1 && ui_menu_button(ui, tr("Delete"), "delete")) {
							tab_brushes_delete_brush(project_brushes[i]);
						}
					}, 2 + add);
				}

				if (ui.is_hovered) {
					if (img_full == null) {
						app_notify_on_init(() => {
							let _brush: SlotBrushRaw = context_raw.brush;
							context_raw.brush = project_brushes[i];
							make_material_parse_brush();
							util_render_make_brush_preview();
							context_raw.brush = _brush;
						});
					}
					else {
						zui_tooltip_image(img_full);
						zui_tooltip(project_brushes[i].canvas.name);
					}
				}

				if (config_raw.show_asset_names) {
					ui._x = uix;
					ui._y += slotw * 0.9;
					zui_text(project_brushes[i].canvas.name, zui_align_t.CENTER);
					if (ui.is_hovered) zui_tooltip(project_brushes[i].canvas.name);
					ui._y -= slotw * 0.9;
					if (i == project_brushes.length - 1) {
						ui._y += j == num - 1 ? imgw : imgw + zui_ELEMENT_H(ui) + zui_ELEMENT_OFFSET(ui);
					}
				}
			}

			ui._y += 6;
		}

		let in_focus: bool = ui.input_x > ui._window_x && ui.input_x < ui._window_x + ui._window_w &&
								ui.input_y > ui._window_y && ui.input_y < ui._window_y + ui._window_h;
		if (in_focus && ui.is_delete_down && project_brushes.length > 1) {
			ui.is_delete_down = false;
			tab_brushes_delete_brush(context_raw.brush);
		}
	}
}

function tab_brushes_delete_brush(b: SlotBrushRaw) {
	let i: i32 = project_brushes.indexOf(b);
	context_select_brush(i == project_brushes.length - 1 ? i - 1 : i + 1);
	project_brushes.splice(i, 1);
	ui_base_hwnds[1].redraws = 2;
}

///end
