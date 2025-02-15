
type float_node_t = {
	base?: logic_node_t;
	value?: f32;
	image?: image_t;
};

function float_node_create(value: f32 = 0.0): float_node_t {
	let n: float_node_t = {};
	n.base = logic_node_create();
	n.base.get = float_node_get;
	n.base.get_as_image = float_node_get_as_image;
	n.base.set = float_node_set;
	n.value = value;
	return n;
}

function float_node_get(self: float_node_t, from: i32, done: (a: any)=>void) {
	if (self.base.inputs.length > 0) logic_node_input_get(self.base.inputs[0], done);
	else done(self.value);
}

function float_node_get_as_image(self: float_node_t, from: i32, done: (img: image_t)=>void) {
	if (self.base.inputs.length > 0) { logic_node_input_get_as_image(self.base.inputs[0], done); return; }
	if (self.image != null) image_unload(self.image);
	let b: ArrayBuffer = new ArrayBuffer(16);
	let v: DataView = new DataView(b);
	v.setFloat32(0, self.value, true);
	v.setFloat32(4, self.value, true);
	v.setFloat32(8, self.value, true);
	v.setFloat32(12, 1.0, true);
	self.image = image_from_bytes(b, 1, 1, tex_format_t.RGBA128);
	done(self.image);
}

function float_node_set(self: float_node_t, value: any) {
	if (self.base.inputs.length > 0) logic_node_input_set(self.base.inputs[0], value);
	else self.value = value;
}

let float_node_def: zui_node_t = {
	id: 0,
	name: _tr("Value"),
	type: "float_node",
	x: 0,
	y: 0,
	color: 0xffb34f5a,
	inputs: [
		{
			id: 0,
			node_id: 0,
			name: _tr("Value"),
			type: "VALUE",
			color: 0xffa1a1a1,
			default_value: 0.5,
			min: 0.0,
			max: 10.0
		}
	],
	outputs: [
		{
			id: 0,
			node_id: 0,
			name: _tr("Value"),
			type: "VALUE",
			color: 0xffa1a1a1,
			default_value: 0.5
		}
	],
	buttons: []
};
