
type upscale_node_t = {
	base?: logic_node_t;
};

let upscale_node_temp: image_t = null;
let upscale_node_image: image_t = null;
let upscale_node_esrgan_blob: ArrayBuffer;

function upscale_node_create(): upscale_node_t {
	let n: float_node_t = {};
	n.base = logic_node_create();
	n.base.get_as_image = upscale_node_get_as_image;
	n.base.get_cached_image = upscale_node_get_cached_image;
	return n;
}

function upscale_node_get_as_image(self: upscale_node_t, from: i32, done: (img: image_t)=>void) {
	self.base.inputs[0].get_as_image((_image: image_t) => {
		upscale_node_image = _image;

		console_progress(tr("Processing") + " - " + tr("Upscale"));
		base_notify_on_next_frame(function () {
			upscale_node_load_blob(function () {
				if (upscale_node_image.width < config_get_texture_res_x()) {
					upscale_node_image = upscale_node_esrgan(upscale_node_image);
					while (upscale_node_image.width < config_get_texture_res_x()) {
						let lastImage = upscale_node_image;
						upscale_node_image = upscale_node_esrgan(upscale_node_image);
						image_unload(lastImage);
					}
				}
				done(upscale_node_image);
			});
		});
	});
}

function upscale_node_load_blob(done: ()=>void) {
	let _esrgan_blob: ArrayBuffer = data_get_blob("models/esrgan.quant.onnx");
	upscale_node_esrgan_blob = _esrgan_blob;
	done();
}

function upscale_node_get_cached_image(self: upscale_node_t): image_t {
	return upscale_node_image;
}

function upscale_node_do_tile(source: image_t) {
	let result: image_t = null;
	let size1w = source.width;
	let size1h = source.height;
	let size2w = math_floor(size1w * 2);
	let size2h = math_floor(size1h * 2);
	if (upscale_node_temp != null) {
		image_unload(upscale_node_temp);
	}
	upscale_node_temp = image_create_render_target(size1w, size1h);
	g2_begin(upscale_node_temp);
	g2_draw_scaled_image(source, 0, 0, size1w, size1h);
	g2_end();

	let bytes_img = image_get_pixels(upscale_node_temp);
	let u8a = new Uint8Array(bytes_img);
	let f32a = new Float32Array(3 * size1w * size1h);
	for (let i = 0; i < (size1w * size1h); ++i) {
		f32a[i                      ] = (u8a[i * 4    ] / 255);
		f32a[i + size1w * size1w    ] = (u8a[i * 4 + 1] / 255);
		f32a[i + size1w * size1w * 2] = (u8a[i * 4 + 2] / 255);
	}

	let esrgan2x_buf = krom_ml_inference(upscale_node_esrgan_blob, [f32a.buffer], [[1, 3, size1w, size1h]], [1, 3, size2w, size2h], config_raw.gpu_inference);
	let esrgan2x = new Float32Array(esrgan2x_buf);
	for (let i = 0; i < esrgan2x.length; ++i) {
		if (esrgan2x[i] < 0) esrgan2x[i] = 0;
		else if (esrgan2x[i] > 1) esrgan2x[i] = 1;
	}

	u8a = new Uint8Array(4 * size2w * size2h);
	for (let i = 0; i < (size2w * size2h); ++i) {
		u8a[i * 4    ] = math_floor(esrgan2x[i                      ] * 255);
		u8a[i * 4 + 1] = math_floor(esrgan2x[i + size2w * size2w    ] * 255);
		u8a[i * 4 + 2] = math_floor(esrgan2x[i + size2w * size2w * 2] * 255);
		u8a[i * 4 + 3] = 255;
	}

	result = image_from_bytes(u8a.buffer, size2w, size2h);
	return result;
}

function upscale_node_esrgan(source: image_t): image_t {
	let result: image_t = null;
	let size1w = source.width;
	let size1h = source.height;
	let tile_size = 512;
	let tile_size2x = math_floor(tile_size * 2);

	if (size1w >= tile_size2x || size1h >= tile_size2x) { // Split into tiles
		let size2w = math_floor(size1w * 2);
		let size2h = math_floor(size1h * 2);
		result = image_create_render_target(size2w, size2h);
		let tile_source = image_create_render_target(tile_size + 32 * 2, tile_size + 32 * 2);
		for (let x: i32 = 0; x < math_floor(size1w / tile_size); ++x) {
			for (let y: i32 = 0; y < math_floor(size1h / tile_size); ++y) {
				g2_begin(tile_source);
				g2_draw_scaled_image(source, 32 - x * tile_size, 32 - y * tile_size, -source.width, source.height);
				g2_draw_scaled_image(source, 32 - x * tile_size, 32 - y * tile_size, source.width, -source.height);
				g2_draw_scaled_image(source, 32 - x * tile_size, 32 - y * tile_size, -source.width, -source.height);
				g2_draw_scaled_image(source, 32 - x * tile_size + tile_size, 32 - y * tile_size + tile_size, source.width, source.height);
				g2_draw_scaled_image(source, 32 - x * tile_size + tile_size, 32 - y * tile_size + tile_size, -source.width, source.height);
				g2_draw_scaled_image(source, 32 - x * tile_size + tile_size, 32 - y * tile_size + tile_size, source.width, -source.height);
				g2_draw_scaled_image(source, 32 - x * tile_size, 32 - y * tile_size, source.width, source.height);
				g2_end();
				let tileResult = upscale_node_do_tile(tile_source);
				g2_begin(result);
				g2_draw_sub_image(tileResult, x * tile_size2x, y * tile_size2x, 64, 64, tile_size2x, tile_size2x);
				g2_end();
				image_unload(tileResult);
			}
		}
		image_unload(tile_source);
	}
	else result = upscale_node_do_tile(source); // Single tile
	return result;
}

let upscale_node_def: zui_node_t = {
	id: 0,
	name: _tr("Upscale"),
	type: "upscale_node",
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
	buttons: []
};
