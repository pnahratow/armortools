
declare let Krom_texsynth: any;

type inpaint_node_t = {
	base?: logic_node_t;
};

let inpaint_node_image: image_t = null;
let inpaint_node_mask: image_t = null;
let inpaint_node_result: image_t = null;

let inpaint_node_temp: image_t = null;
let inpaint_node_prompt = "";
let inpaint_node_strength = 0.5;
let inpaint_node_auto = true;

function inpaint_node_create(): inpaint_node_t {
	let n: inpaint_node_t = {};
	n.base = logic_node_create();
	n.base.get_as_image = inpaint_node_get_as_image;
	n.base.get_cached_image = inpaint_node_get_cached_image;

	inpaint_node_init();

	return n;
}

function inpaint_node_init() {
	if (inpaint_node_image == null) {
		inpaint_node_image = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y());
	}

	if (inpaint_node_mask == null) {
		inpaint_node_mask = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y(), tex_format_t.R8);
		base_notify_on_next_frame(() => {
			g4_begin(inpaint_node_mask);
			g4_clear(color_from_floats(1.0, 1.0, 1.0, 1.0));
			g4_end();
		});
	}

	if (inpaint_node_temp == null) {
		inpaint_node_temp = image_create_render_target(512, 512);
	}

	if (inpaint_node_result == null) {
		inpaint_node_result = image_create_render_target(config_get_texture_res_x(), config_get_texture_res_y());
	}
}

function inpaint_node_buttons(ui: zui_t, nodes: zui_nodes_t, node: zui_node_t) {
	inpaint_node_auto = node.buttons[0].default_value == 0 ? false : true;
	if (!inpaint_node_auto) {
		inpaint_node_strength = zui_slider(zui_handle("inpaintnode_0", { value: inpaint_node_strength }), tr("strength"), 0, 1, true);
		inpaint_node_prompt = zui_text_area(zui_handle("inpaintnode_1"), zui_align_t.LEFT, true, tr("prompt"), true);
		node.buttons[1].height = 1 + inpaint_node_prompt.split("\n").length;
	}
	else node.buttons[1].height = 0;
}

function inpaint_node_get_as_image(self: inpaint_node_t, from: i32, done: (img: image_t)=>void) {
	self.base.inputs[0].get_as_image((source: image_t) => {

		console_progress(tr("Processing") + " - " + tr("Inpaint"));
		base_notify_on_next_frame(() => {
			g2_begin(inpaint_node_image);
			g2_draw_scaled_image(source, 0, 0, config_get_texture_res_x(), config_get_texture_res_y());
			g2_end();

			inpaint_node_auto ? inpaint_node_texsynth_inpaint(inpaint_node_image, false, inpaint_node_mask, done) : inpaint_node_inpaint_node_sd_inpaint(inpaint_node_image, inpaint_node_mask, done);
		});
	});
}

function inpaint_node_get_cached_image(self: inpaint_node_t): image_t {
	base_notify_on_next_frame(() => {
		self.base.inputs[0].get_as_image((source: image_t) => {
			if (base_pipe_copy == null) base_make_pipe();
			if (const_data_screen_aligned_vb == null) const_data_create_screen_aligned_data();
			g4_begin(inpaint_node_image);
			g4_set_pipeline(base_pipe_inpaint_preview);
			g4_set_tex(base_tex0_inpaint_preview, source);
			g4_set_tex(base_texa_inpaint_preview, inpaint_node_mask);
			g4_set_vertex_buffer(const_data_screen_aligned_vb);
			g4_set_index_buffer(const_data_screen_aligned_ib);
			g4_draw();
			g4_end();
		});
	});
	return inpaint_node_image;
}

function inpaint_node_get_target(): image_t {
	return inpaint_node_mask;
}

function inpaint_node_texsynth_inpaint(image: image_t, tiling: bool, mask: image_t/* = null*/, done: (img: image_t)=>void) {
	let w = config_get_texture_res_x();
	let h = config_get_texture_res_y();

	let bytes_img = image_get_pixels(image);
	let bytes_mask = mask != null ? image_get_pixels(mask) : new ArrayBuffer(w * h);
	let bytes_out = new ArrayBuffer(w * h * 4);
	Krom_texsynth.inpaint(w, h, bytes_out, bytes_img, bytes_mask, tiling);

	inpaint_node_result = image_from_bytes(bytes_out, w, h);
	done(inpaint_node_result);
}

function inpaint_node_sd_inpaint(image: image_t, mask: image_t, done: (img: image_t)=>void) {
	inpaint_node_init();

	let bytes_img = image_get_pixels(mask);
	let u8 = new Uint8Array(bytes_img);
	let f32mask = new Float32Array(4 * 64 * 64);

	let vae_encoder_blob: ArrayBuffer = data_get_blob("models/sd_vae_encoder.quant.onnx");
	// for (let x = 0; x < math_floor(image.width / 512); ++x) {
		// for (let y = 0; y < math_floor(image.height / 512); ++y) {
			let x = 0;
			let y = 0;

			for (let xx = 0; xx < 64; ++xx) {
				for (let yy = 0; yy < 64; ++yy) {
					// let step = math_floor(512 / 64);
					// let j = (yy * step * mask.width + xx * step) + (y * 512 * mask.width + x * 512);
					let step = math_floor(mask.width / 64);
					let j = (yy * step * mask.width + xx * step);
					let f = u8[j] / 255.0;
					let i = yy * 64 + xx;
					f32mask[i              ] = f;
					f32mask[i + 64 * 64    ] = f;
					f32mask[i + 64 * 64 * 2] = f;
					f32mask[i + 64 * 64 * 3] = f;
				}
			}

			g2_begin(inpaint_node_temp);
			// g2_drawImage(image, -x * 512, -y * 512);
			g2_draw_scaled_image(image, 0, 0, 512, 512);
			g2_end();

			bytes_img = image_get_pixels(inpaint_node_temp);
			let u8a = new Uint8Array(bytes_img);
			let f32a = new Float32Array(3 * 512 * 512);
			for (let i = 0; i < (512 * 512); ++i) {
				f32a[i                ] = (u8a[i * 4    ] / 255.0) * 2.0 - 1.0;
				f32a[i + 512 * 512    ] = (u8a[i * 4 + 1] / 255.0) * 2.0 - 1.0;
				f32a[i + 512 * 512 * 2] = (u8a[i * 4 + 2] / 255.0) * 2.0 - 1.0;
			}

			let latents_buf = krom_ml_inference(vae_encoder_blob, [f32a.buffer], [[1, 3, 512, 512]], [1, 4, 64, 64], config_raw.gpu_inference);
			let latents = new Float32Array(latents_buf);
			for (let i = 0; i < latents.length; ++i) {
				latents[i] = 0.18215 * latents[i];
			}
			let latents_orig = latents.slice(0);

			let noise = new Float32Array(latents.length);
			for (let i = 0; i < noise.length; ++i) noise[i] = math_cos(2.0 * 3.14 * RandomNode.getFloat()) * math_sqrt(-2.0 * math_log(RandomNode.getFloat()));

			let num_inference_steps = 50;
			let init_timestep = math_floor(num_inference_steps * inpaint_node_strength);
			let timestep = TextToPhotoNode.timesteps[num_inference_steps - init_timestep];
			let alphas_cumprod = TextToPhotoNode.alphas_cumprod;
			let sqrt_alpha_prod = math_pow(alphas_cumprod[timestep], 0.5);
			let sqrt_one_minus_alpha_prod = math_pow(1.0 - alphas_cumprod[timestep], 0.5);
			for (let i = 0; i < latents.length; ++i) {
				latents[i] = sqrt_alpha_prod * latents[i] + sqrt_one_minus_alpha_prod * noise[i];
			}

			let start = num_inference_steps - init_timestep;

			TextToPhotoNode.stable_diffusion(inpaint_node_prompt, (img: image_t) => {
				// result.g2_begin();
				// result.g2_draw_image(img, x * 512, y * 512);
				// result.g2_end();
				inpaint_node_result = img;
				done(img);
			}, latents, start, true, f32mask, latents_orig);
		// }
	// }
}

let inpaint_node_def: zui_node_t = {
	id: 0,
	name: _tr("Inpaint"),
	type: "inpaint_node",
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
			default_value: new Float32Array([1.0, 1.0, 1.0, 1.0])
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
			name: "inpaint_node_buttons",
			type: "CUSTOM",
			height: 0
		}
	]
};
