
type photo_to_pbr_node_t = {
	base?: logic_node_t;
};

let photo_to_pbr_node_temp: image_t = null;
let photo_to_pbr_node_images: image_t[] = null;
let photo_to_pbr_node_model_names: string[] = ["base", "occlusion", "roughness", "metallic", "normal", "height"];

let photo_to_pbr_node_cached_source: image_t = null;
let photo_to_pbr_node_border_w: i32 = 64;
let photo_to_pbr_node_tile_w: i32 = 2048;
let photo_to_pbr_node_tile_with_border_w: i32 = photo_to_pbr_node_tile_w + photo_to_pbr_node_border_w * 2;

function photo_to_pbr_node_create(): photo_to_pbr_node_t {
	let n: photo_to_pbr_node_t = {};
	n.base = logic_node_create();
	n.base.get_as_image = photo_to_pbr_node_get_as_image;

	if (photo_to_pbr_node_temp == null) {
		photo_to_pbr_node_temp = image_create_render_target(photo_to_pbr_node_tile_with_border_w, photo_to_pbr_node_tile_with_border_w);
	}

	photo_to_pbr_node_init();

	return n;
}

function photo_to_pbr_node_init() {
	if (photo_to_pbr_node_images == null) {
		photo_to_pbr_node_images = [];
		for (let i = 0; i < photo_to_pbr_node_model_names.length; ++i) {
			photo_to_pbr_node_images.push(image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y()));
		}
	}
}

function photo_to_pbr_node_get_as_image(self: photo_to_pbr_node_t, from: i32, done: (img: image_t)=>void) {
	let get_source = function (done: (img: image_t)=>void) {
		if (photo_to_pbr_node_cached_source != null) done(photo_to_pbr_node_cached_source);
		else self.base.inputs[0].get_as_image(done);
	}

	get_source(function (source: image_t) {
		photo_to_pbr_node_cached_source = source;

		console_progress(tr("Processing") + " - " + tr("Photo to PBR"));
		base_notify_on_next_frame(() => {
			let tile_floats: Float32Array[] = [];
			let tiles_x = math_floor(config_get_texture_res_x() / photo_to_pbr_node_tile_w);
			let tiles_y = math_floor(config_get_texture_res_y() / photo_to_pbr_node_tile_w);
			let num_tiles = tiles_x * tiles_y;
			for (let i = 0; i < num_tiles; ++i) {
				let x = i % tiles_x;
				let y = math_floor(i / tiles_x);

				g2_begin(photo_to_pbr_node_temp);
				g2_draw_scaled_image(source, photo_to_pbr_node_border_w - x * photo_to_pbr_node_tile_w, photo_to_pbr_node_border_w - y * photo_to_pbr_node_tile_w, -config_get_texture_res_x(), config_get_texture_res_y());
				g2_draw_scaled_image(source, photo_to_pbr_node_border_w - x * photo_to_pbr_node_tile_w, photo_to_pbr_node_border_w - y * photo_to_pbr_node_tile_w, config_get_texture_res_x(), -config_get_texture_res_y());
				g2_draw_scaled_image(source, photo_to_pbr_node_border_w - x * photo_to_pbr_node_tile_w, photo_to_pbr_node_border_w - y * photo_to_pbr_node_tile_w, -config_get_texture_res_x(), -config_get_texture_res_y());
				g2_draw_scaled_image(source, photo_to_pbr_node_border_w - x * photo_to_pbr_node_tile_w + photo_to_pbr_node_tile_w, photo_to_pbr_node_border_w - y * photo_to_pbr_node_tile_w + photo_to_pbr_node_tile_w, config_get_texture_res_x(), config_get_texture_res_y());
				g2_draw_scaled_image(source, photo_to_pbr_node_border_w - x * photo_to_pbr_node_tile_w + photo_to_pbr_node_tile_w, photo_to_pbr_node_border_w - y * photo_to_pbr_node_tile_w + photo_to_pbr_node_tile_w, -config_get_texture_res_x(), config_get_texture_res_y());
				g2_draw_scaled_image(source, photo_to_pbr_node_border_w - x * photo_to_pbr_node_tile_w + photo_to_pbr_node_tile_w, photo_to_pbr_node_border_w - y * photo_to_pbr_node_tile_w + photo_to_pbr_node_tile_w, config_get_texture_res_x(), -config_get_texture_res_y());
				g2_draw_scaled_image(source, photo_to_pbr_node_border_w - x * photo_to_pbr_node_tile_w, photo_to_pbr_node_border_w - y * photo_to_pbr_node_tile_w, config_get_texture_res_x(), config_get_texture_res_y());
				g2_end();

				let bytes_img = image_get_pixels(photo_to_pbr_node_temp);
				let u8a = new Uint8Array(bytes_img);
				let f32a = new Float32Array(3 * photo_to_pbr_node_tile_with_border_w * photo_to_pbr_node_tile_with_border_w);
				for (let i = 0; i < (photo_to_pbr_node_tile_with_border_w * photo_to_pbr_node_tile_with_border_w); ++i) {
					f32a[i                                        ] = (u8a[i * 4    ] / 255 - 0.5) / 0.5;
					f32a[i + photo_to_pbr_node_tile_with_border_w * photo_to_pbr_node_tile_with_border_w    ] = (u8a[i * 4 + 1] / 255 - 0.5) / 0.5;
					f32a[i + photo_to_pbr_node_tile_with_border_w * photo_to_pbr_node_tile_with_border_w * 2] = (u8a[i * 4 + 2] / 255 - 0.5) / 0.5;
				}

				let model_blob: ArrayBuffer = data_get_blob("models/photo_to_" + photo_to_pbr_node_model_names[from] + ".quant.onnx");
				let buf = krom_ml_inference(model_blob, [f32a.buffer], null, null, config_raw.gpu_inference);
				let ar = new Float32Array(buf);
				u8a = new Uint8Array(4 * photo_to_pbr_node_tile_w * photo_to_pbr_node_tile_w);
				let offset_g = (from == channel_type_t.BASE_COLOR || from == channel_type_t.NORMAL_MAP) ? photo_to_pbr_node_tile_with_border_w * photo_to_pbr_node_tile_with_border_w : 0;
				let offset_b = (from == channel_type_t.BASE_COLOR || from == channel_type_t.NORMAL_MAP) ? photo_to_pbr_node_tile_with_border_w * photo_to_pbr_node_tile_with_border_w * 2 : 0;
				for (let i = 0; i < (photo_to_pbr_node_tile_w * photo_to_pbr_node_tile_w); ++i) {
					let x = photo_to_pbr_node_border_w + i % photo_to_pbr_node_tile_w;
					let y = photo_to_pbr_node_border_w + math_floor(i / photo_to_pbr_node_tile_w);
					u8a[i * 4    ] = math_floor((ar[y * photo_to_pbr_node_tile_with_border_w + x          ] * 0.5 + 0.5) * 255);
					u8a[i * 4 + 1] = math_floor((ar[y * photo_to_pbr_node_tile_with_border_w + x + offset_g] * 0.5 + 0.5) * 255);
					u8a[i * 4 + 2] = math_floor((ar[y * photo_to_pbr_node_tile_with_border_w + x + offset_b] * 0.5 + 0.5) * 255);
					u8a[i * 4 + 3] = 255;
				}
				tile_floats.push(ar);

				// Use border pixels to blend seams
				if (i > 0) {
					if (x > 0) {
						let ar = tile_floats[i - 1];
						for (let yy = 0; yy < photo_to_pbr_node_tile_w; ++yy) {
							for (let xx = 0; xx < photo_to_pbr_node_border_w; ++xx) {
								let i = yy * photo_to_pbr_node_tile_w + xx;
								let a = u8a[i * 4];
								let b = u8a[i * 4 + 1];
								let c = u8a[i * 4 + 2];

								let aa = math_floor((ar[(photo_to_pbr_node_border_w + yy) * photo_to_pbr_node_tile_with_border_w + photo_to_pbr_node_border_w + photo_to_pbr_node_tile_w + xx          ] * 0.5 + 0.5) * 255);
								let bb = math_floor((ar[(photo_to_pbr_node_border_w + yy) * photo_to_pbr_node_tile_with_border_w + photo_to_pbr_node_border_w + photo_to_pbr_node_tile_w + xx + offset_g] * 0.5 + 0.5) * 255);
								let cc = math_floor((ar[(photo_to_pbr_node_border_w + yy) * photo_to_pbr_node_tile_with_border_w + photo_to_pbr_node_border_w + photo_to_pbr_node_tile_w + xx + offset_b] * 0.5 + 0.5) * 255);

								let f = xx / photo_to_pbr_node_border_w;
								let invf = 1.0 - f;
								a = math_floor(a * f + aa * invf);
								b = math_floor(b * f + bb * invf);
								c = math_floor(c * f + cc * invf);

								u8a[i * 4    ] = a;
								u8a[i * 4 + 1] = b;
								u8a[i * 4 + 2] = c;
							}
						}
					}
					if (y > 0) {
						let ar = tile_floats[i - tiles_x];
						for (let xx = 0; xx < photo_to_pbr_node_tile_w; ++xx) {
							for (let yy = 0; yy < photo_to_pbr_node_border_w; ++yy) {
								let i = yy * photo_to_pbr_node_tile_w + xx;
								let a = u8a[i * 4];
								let b = u8a[i * 4 + 1];
								let c = u8a[i * 4 + 2];

								let aa = math_floor((ar[(photo_to_pbr_node_border_w + photo_to_pbr_node_tile_w + yy) * photo_to_pbr_node_tile_with_border_w + photo_to_pbr_node_border_w + xx          ] * 0.5 + 0.5) * 255);
								let bb = math_floor((ar[(photo_to_pbr_node_border_w + photo_to_pbr_node_tile_w + yy) * photo_to_pbr_node_tile_with_border_w + photo_to_pbr_node_border_w + xx + offset_g] * 0.5 + 0.5) * 255);
								let cc = math_floor((ar[(photo_to_pbr_node_border_w + photo_to_pbr_node_tile_w + yy) * photo_to_pbr_node_tile_with_border_w + photo_to_pbr_node_border_w + xx + offset_b] * 0.5 + 0.5) * 255);

								let f = yy / photo_to_pbr_node_border_w;
								let invf = 1.0 - f;
								a = math_floor(a * f + aa * invf);
								b = math_floor(b * f + bb * invf);
								c = math_floor(c * f + cc * invf);

								u8a[i * 4    ] = a;
								u8a[i * 4 + 1] = b;
								u8a[i * 4 + 2] = c;
							}
						}
					}
				}

				///if (krom_metal || krom_vulkan)
				if (from == channel_type_t.BASE_COLOR) photo_to_pbr_node_bgra_swap(u8a.buffer);
				///end

				let temp2 = image_from_bytes(u8a.buffer, photo_to_pbr_node_tile_w, photo_to_pbr_node_tile_w);
				g2_begin(photo_to_pbr_node_images[from]);
				g2_draw_image(temp2, x * photo_to_pbr_node_tile_w, y * photo_to_pbr_node_tile_w);
				g2_end();
				base_notify_on_next_frame(() => {
					image_unload(temp2);
				});
			}

			done(photo_to_pbr_node_images[from]);
		});
	});
}

///if (krom_metal || krom_vulkan)
function photo_to_pbr_node_bgra_swap(buffer: ArrayBuffer) {
	let u8a = new Uint8Array(buffer);
	for (let i = 0; i < math_floor(buffer.byteLength / 4); ++i) {
		let r = u8a[i * 4];
		u8a[i * 4] = u8a[i * 4 + 2];
		u8a[i * 4 + 2] = r;
	}
	return buffer;
}
///end

let photo_to_pbr_node_def: zui_node_t = {
	id: 0,
	name: _tr("Photo to PBR"),
	type: "photo_to_pbr_node",
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
			name: _tr("Base Color"),
			type: "RGBA",
			color: 0xffc7c729,
			default_value: new Float32Array([0.0, 0.0, 0.0, 1.0])
		},
		{
			id: 0,
			node_id: 0,
			name: _tr("Occlusion"),
			type: "VALUE",
			color: 0xffa1a1a1,
			default_value: 1.0
		},
		{
			id: 0,
			node_id: 0,
			name: _tr("Roughness"),
			type: "VALUE",
			color: 0xffa1a1a1,
			default_value: 1.0
		},
		{
			id: 0,
			node_id: 0,
			name: _tr("Metallic"),
			type: "VALUE",
			color: 0xffa1a1a1,
			default_value: 0.0
		},
		{
			id: 0,
			node_id: 0,
			name: _tr("Normal Map"),
			type: "VECTOR",
			color: 0xffc7c729,
			default_value: new Float32Array([0.0, 0.0, 0.0, 1.0])
		},
		{
			id: 0,
			node_id: 0,
			name: _tr("Height"),
			type: "VALUE",
			color: 0xffa1a1a1,
			default_value: 1.0
		}
	],
	buttons: []
};
