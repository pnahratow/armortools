
type tiling_node_t = {
	base?: logic_node_t;
	result?: image_t;
};

let tiling_node_image: image_t = null;
let tiling_node_prompt: string = "";
let tiling_node_strength: f32 = 0.5;
let tiling_node_auto: bool = true;

function tiling_node_create(): tiling_node_t {
	let n: float_node_t = {};
	n.base = logic_node_create();
	n.base.get_as_image = tiling_node_get_as_image;
	n.base.get_cached_image = tiling_node_get_cached_image;
	tiling_node_init();
	return n;
}

function tiling_node_init() {
	if (tiling_node_image == null) {
		tiling_node_image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y());
	}
}

function tiling_node_buttons(ui: zui_t, nodes: zui_nodes_t, node: zui_node_t) {
	tiling_node_auto = node.buttons[0].default_value == 0 ? false : true;
	if (!tiling_node_auto) {
		tiling_node_strength = zui_slider(zui_handle("tilingnode_0", { value: tiling_node_strength }), tr("strength"), 0, 1, true);
		tiling_node_prompt = zui_text_area(zui_handle("tilingnode_1"), zui_align_t.LEFT, true, tr("prompt"), true);
		node.buttons[1].height = 1 + tiling_node_prompt.split("\n").length;
	}
	else node.buttons[1].height = 0;
}

function tiling_node_get_as_image(self: tiling_node_t, from: i32, done: (img: image_t)=>void) {
	self.base.inputs[0].get_as_image((source: image_t) => {
		g2_begin(tiling_node_image);
		g2_draw_scaled_image(source, 0, 0, config_get_texture_res_x(), config_get_texture_res_y());
		g2_end();

		console_progress(tr("Processing") + " - " + tr("Tiling"));
		base_notify_on_next_frame(function () {
			let _done = function (image: image_t) {
				self.result = image;
				done(image);
			}
			tiling_node_auto ? inpaint_node_texsynth_inpaint(tiling_node_image, true, null, _done) : tiling_node_sd_tiling(tiling_node_image, -1, _done);
		});
	});
}

function tiling_node_get_cached_image(self: tiling_node_t): image_t => {
	return self.result;
}

function tiling_node_sd_tiling(image: image_t, seed: i32/* = -1*/, done: (img: image_t)=>void) {
	text_to_photo_node_tiling = false;
	let tile = image_create_render_target(512, 512);
	g2_begin(tile);
	g2_draw_scaled_image(image, -256, -256, 512, 512);
	g2_draw_scaled_image(image, 256, -256, 512, 512);
	g2_draw_scaled_image(image, -256, 256, 512, 512);
	g2_draw_scaled_image(image, 256, 256, 512, 512);
	g2_end();

	let u8a = new Uint8Array(512 * 512);
	for (let i = 0; i < 512 * 512; ++i) {
		let x = i % 512;
		let y = math_floor(i / 512);
		let l = y < 256 ? y : (511 - y);
		u8a[i] = (x > 256 - l && x < 256 + l) ? 0 : 255;
	}
	// for (let i = 0; i < 512 * 512; ++i) u8a[i] = 255;
	// for (let x = (256 - 32); x < (256 + 32); ++x) {
	// 	for (let y = 0; y < 512; ++y) {
	// 		u8a[y * 512 + x] = 0;
	// 	}
	// }
	// for (let x = 0; x < 512; ++x) {
	// 	for (let y = (256 - 32); y < 256 + 32); ++y) {
	// 		u8a[y * 512 + x] = 0;
	// 	}
	// }
	let mask = image_from_bytes(u8a.buffer, 512, 512, tex_format_t.R8);

	inpaint_node_prompt = tiling_node_prompt;
	inpaint_node_strength = tiling_node_strength;
	if (seed >= 0) random_node_set_seed(seed);
	inpaint_node_sd_inpaint(tile, mask, done);
}

let tiling_node_def: zui_node_t = {
	id: 0,
	name: _tr("Tiling"),
	type: "tiling_node",
	x: 0,
	y: 0,
	color: 0xff4982a0,
	inputs: [
		{
			id: 0,
			node_id: 0,
			name: _tr("Color"),
			type: "RGBA",
			color: 0xffc7c729,
			default_value: new Float32Array([0.0, 0.0, 0.0, 1.0])
		}
	],
	outputs: [
		{
			id: 0,
			node_id: 0,
			name: _tr("Color"),
			type: "RGBA",
			color: 0xffc7c729,
			default_value: new Float32Array([0.0, 0.0, 0.0, 1.0])
		}
	],
	buttons: [
		{
			name: _tr("auto"),
			type: "BOOL",
			default_value: true,
			output: 0
		},
		{
			name: "tiling_node_buttons",
			type: "CUSTOM",
			height: 0
		}
	]
};
