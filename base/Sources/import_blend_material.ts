
///if (is_paint || is_sculpt)

function import_blend_material_run(path: string) {
	let b: ArrayBuffer = data_get_blob(path);
	let bl: BlendRaw = parser_blend_init(b);
	if (bl.dna == null) {
		console_error(strings_error3());
		return;
	}

	let mats: BlHandleRaw[] = parser_blend_get(bl, "Material");
	if (mats.length == 0) {
		console_error("Error: No materials found");
		return;
	}

	let imported: SlotMaterialRaw[] = [];

	for (let mat of mats) {
		// Material slot
		context_raw.material = slot_material_create(project_materials[0].data);
		project_materials.push(context_raw.material);
		imported.push(context_raw.material);
		let nodes: zui_nodes_t = context_raw.material.nodes;
		let canvas: zui_node_canvas_t = context_raw.material.canvas;
		canvas.name = bl_handle_get(bl_handle_get(mat, "id"), "name").substr(2); // MAWood
		let nout: zui_node_t = null;
		for (let n of canvas.nodes) {
			if (n.type == "OUTPUT_MATERIAL_PBR") {
				nout = n;
				break;
			}
		}
		for (let n of canvas.nodes) {
			if (n.name == "RGB") {
				zui_remove_node(n, canvas);
				break;
			}
		}

		// Parse nodetree
		let nodetree: any = bl_handle_get(mat, "nodetree"); // bNodeTree
		let blnodes: any = bl_handle_get(nodetree, "nodes"); // ListBase
		let bllinks: any = bl_handle_get(nodetree, "links"); // bNodeLink

		// Look for Principled BSDF node
		let node: any = bl_handle_get(blnodes, "first", 0, "bNode");
		let last: any = bl_handle_get(blnodes, "last", 0, "bNode");
		while (true) {
			if (bl_handle_get(node, "idname") == "ShaderNodeBsdfPrincipled") break;
			if (bl_handle_get(node, "name") == bl_handle_get(last, "name")) break;
			node = bl_handle_get(node, "next");
		}
		if (bl_handle_get(node, "idname") != "ShaderNodeBsdfPrincipled") {
			console_error("Error: No Principled BSDF node found");
			continue;
		}

		// Use Principled BSDF as material output
		nout.name = bl_handle_get(node, "name");
		nout.x = bl_handle_get(node, "locx") + 400;
		nout.y = -bl_handle_get(node, "locy") + 400;

		// Place nodes
		node = bl_handle_get(blnodes, "first", 0, "bNode");
		while (true) {
			// Search for node in list
			let search: string = bl_handle_get(node, "idname").substr(10).toLowerCase();
			let base: zui_node_t = null;
			for (let list of nodes_material_list) {
				let found: bool = false;
				for (let n of list) {
					let s: string = string_replace_all(n.type, "_", "").toLowerCase();
					if (search == s) {
						base = n;
						found = true;
						break;
					}
				}
				if (found) break;
			}

			if (base != null) {
				let n: zui_node_t = ui_nodes_make_node(base, nodes, canvas);
				n.x = bl_handle_get(node, "locx") + 400;
				n.y = -bl_handle_get(node, "locy") + 400;
				n.name = bl_handle_get(node, "name");

				// Fill input socket values
				let inputs: any = bl_handle_get(node, "inputs");
				let sock: any = bl_handle_get(inputs, "first", 0, "bNodeSocket");
				let pos: i32 = 0;
				while (true) {
					if (pos >= n.inputs.length) break;
					n.inputs[pos].default_value = import_blend_material_read_blend_socket(sock);

					let last: any = sock;
					sock = bl_handle_get(sock, "next");
					if (last.block == sock.block) break;
					pos++;
				}

				// Fill button values
				if (search == "teximage") {
					let img: any = bl_handle_get(node, "id", 0, "Image");
					let file: string = bl_handle_get(img, "name").substr(2); // '//desktop\logo.png'
					file = path_base_dir(path) + file;
					import_texture_run(file);
					let ar: string[] = file.split(path_sep);
					let filename: string = ar[ar.length - 1];
					n.buttons[0].default_value = base_get_asset_index(filename);
				}
				else if (search == "valtorgb") {
					let ramp: any = bl_handle_get(node, "storage", 0, "ColorBand");
					n.buttons[0].data = bl_handle_get(ramp, "ipotype") == 0 ? 0 : 1; // Linear / Constant
					let elems: f32[][] = n.buttons[0].default_value;
					for (let i: i32 = 0; i < bl_handle_get(ramp, "tot"); ++i) {
						if (i >= elems.length) elems.push([1.0, 1.0, 1.0, 1.0, 0.0]);
						let cbdata: any = bl_handle_get(ramp, "data", i, "CBData");
						elems[i][0] = math_floor(bl_handle_get(cbdata, "r") * 100) / 100;
						elems[i][1] = math_floor(bl_handle_get(cbdata, "g") * 100) / 100;
						elems[i][2] = math_floor(bl_handle_get(cbdata, "b") * 100) / 100;
						elems[i][3] = math_floor(bl_handle_get(cbdata, "a") * 100) / 100;
						elems[i][4] = math_floor(bl_handle_get(cbdata, "pos") * 100) / 100;
					}
				}
				else if (search == "mixrgb" || search == "math") {
					n.buttons[0].default_value = bl_handle_get(node, "custom1");
					n.buttons[1].default_value = bl_handle_get(node, "custom2") & 2;
				}
				else if (search == "mapping") {
					let storage: any = bl_handle_get(node, "storage", 0, "TexMapping");
					n.buttons[0].default_value = bl_handle_get(storage, "loc");
					n.buttons[1].default_value = bl_handle_get(storage, "rot");
					n.buttons[2].default_value = bl_handle_get(storage, "size");
					// let mat: any = get(storage, "mat"); float[4][4]
					// storage.flag & 1 // use_min
					// storage.flag & 2 // use_max
					// storage.min[0]
					// storage.min[1]
					// storage.min[2]
					// storage.max[0]
					// storage.max[1]
					// storage.max[2]
				}

				// Fill output socket values
				let outputs: any = bl_handle_get(node, "outputs");
				sock = bl_handle_get(outputs, "first", 0, "bNodeSocket");
				pos = 0;
				while (true) {
					if (pos >= n.outputs.length) break;
					n.outputs[pos].default_value = import_blend_material_read_blend_socket(sock);

					let last: any = sock;
					sock = bl_handle_get(sock, "next");
					if (last.block == sock.block) break;
					pos++;
				}

				canvas.nodes.push(n);
			}

			if (bl_handle_get(node, "name") == bl_handle_get(last, "name")) break;
			node = bl_handle_get(node, "next");
		}

		// Place links
		let link: any = bl_handle_get(bllinks, "first", 0, "bNodeLink");
		while (true) {
			let fromnode: any = bl_handle_get(bl_handle_get(link, "fromnode"), "name");
			let tonode: any = bl_handle_get(bl_handle_get(link, "tonode"), "name");
			let fromsock: any = bl_handle_get(link, "fromsock");
			let tosock: any = bl_handle_get(link, "tosock");

			let from_id: i32 = -1;
			let to_id: i32 = -1;
			for (let n of canvas.nodes) {
				if (n.name == fromnode) {
					from_id = n.id;
					break;
				}
			}
			for (let n of canvas.nodes) {
				if (n.name == tonode) {
					to_id = n.id;
					break;
				}
			}

			if (from_id >= 0 && to_id >= 0) {
				let from_socket: i32 = 0;
				let sock: any = fromsock;
				while (true) {
					let last: any = sock;
					sock = bl_handle_get(sock, "prev");
					if (last.block == sock.block) break;
					from_socket++;
				}

				let to_socket: i32 = 0;
				sock = tosock;
				while (true) {
					let last: any = sock;
					sock = bl_handle_get(sock, "prev");
					if (last.block == sock.block) break;
					to_socket++;
				}

				let valid: bool = true;

				// Remap principled
				if (tonode == nout.name) {
					if (to_socket == 0) to_socket = 0; // Base
					else if (to_socket == 18) to_socket = 1; // Opac
					else if (to_socket == 7) to_socket = 3; // Rough
					else if (to_socket == 4) to_socket = 4; // Met
					else if (to_socket == 19) to_socket = 5; // TODO: auto-remove normal_map node
					else if (to_socket == 17) to_socket = 6; // Emis
					else if (to_socket == 1) to_socket = 8; // Subs
					else valid = false;
				}

				if (valid) {
					let raw: zui_node_link_t = {
						id: zui_get_link_id(canvas.links),
						from_id: from_id,
						from_socket: from_socket,
						to_id: to_id,
						to_socket: to_socket
					};
					canvas.links.push(raw);
				}
			}

			let last: any = link;
			link = bl_handle_get(link, "next");
			if (last.block == link.block) break;
		}
		history_new_material();
	}

	let _init = () => {
		for (let m of imported) {
			context_set_material(m);
			make_material_parse_paint_material();
			util_render_make_material_preview();
		}
	}
	app_notify_on_init(_init);

	ui_base_hwnds[tab_area_t.SIDEBAR1].redraws = 2;
	data_delete_blob(path);
}

function import_blend_material_read_blend_socket(sock: any): any {
	let idname: any = bl_handle_get(sock, "idname");
	if (idname.startsWith("NodeSocketVector")) {
		let v: any = bl_handle_get(bl_handle_get(sock, "default_value", 0, "bNodeSocketValueVector"), "value");
		v[0] = math_floor(v[0] * 100) / 100;
		v[1] = math_floor(v[1] * 100) / 100;
		v[2] = math_floor(v[2] * 100) / 100;
		return v;
	}
	else if (idname.startsWith("NodeSocketColor")) {
		let v: any = bl_handle_get(bl_handle_get(sock, "default_value", 0, "bNodeSocketValueRGBA"), "value");
		v[0] = math_floor(v[0] * 100) / 100;
		v[1] = math_floor(v[1] * 100) / 100;
		v[2] = math_floor(v[2] * 100) / 100;
		v[3] = math_floor(v[3] * 100) / 100;
		return v;
	}
	else if (idname.startsWith("NodeSocketFloat")) {
		let v: any = bl_handle_get(bl_handle_get(sock, "default_value", 0, "bNodeSocketValueFloat"), "value");
		v = math_floor(v * 100) / 100;
		return v;
	}
	else if (idname.startsWith("NodeSocketInt")) {
		return bl_handle_get(bl_handle_get(sock, "default_value", 0, "bNodeSocketValueInt"), "value");
	}
	else if (idname.startsWith("NodeSocketBoolean")) {
		return bl_handle_get(bl_handle_get(sock, "default_value", 0, "bNodeSocketValueBoolean"), "value");
	}
	else if (idname.startsWith("NodeSocketString")) {
		return bl_handle_get(bl_handle_get(sock, "default_value", 0, "bNodeSocketValueString"), "value");
	}
	return null;
}

///end
