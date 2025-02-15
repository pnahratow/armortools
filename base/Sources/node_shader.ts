
class NodeShaderRaw {
	context: NodeShaderContextRaw;
	shader_type: string = '';
	includes: string[] = [];
	ins: string[] = [];
	outs: string[] = [];
	shared_samplers: string[] = [];
	uniforms: string[] = [];
	functions: map_t<string, string> = map_create();
	main: string = '';
	main_init: string = '';
	main_end: string = '';
	main_normal: string = '';
	main_textures: string = '';
	main_attribs: string = '';
	header: string = '';
	write_pre: bool = false;
	write_normal: i32 = 0;
	write_textures: i32 = 0;
	vstruct_as_vsin: bool = true;
	lock: bool = false;

	// References
	bposition: bool = false;
	wposition: bool = false;
	mposition: bool = false;
	vposition: bool = false;
	wvpposition: bool = false;
	ndcpos: bool = false;
	wtangent: bool = false;
	vvec: bool = false;
	vvec_cam: bool = false;
	n: bool = false;
	nattr: bool = false;
	dotnv: bool = false;
	inv_tbn: bool = false;
}

function node_shader_create(context: NodeShaderContextRaw, shader_type: string): NodeShaderRaw {
	let raw: NodeShaderRaw = new NodeShaderRaw();
	raw.context = context;
	raw.shader_type = shader_type;
	return raw;
}

function node_shader_add_include(raw: NodeShaderRaw, s: string) {
	raw.includes.push(s);
}

function node_shader_add_in(raw: NodeShaderRaw, s: string) {
	raw.ins.push(s);
}

function node_shader_add_out(raw: NodeShaderRaw, s: string) {
	raw.outs.push(s);
}

function node_shader_add_uniform(raw: NodeShaderRaw, s: string, link: string = null, included: bool = false) {
	let ar: string[] = s.split(' ');
	// layout(RGBA8) image3D voxels
	let utype: string = ar[ar.length - 2];
	let uname: string = ar[ar.length - 1];
	if (utype.startsWith('sampler') || utype.startsWith('image') || utype.startsWith('uimage')) {
		let is_image: bool = (utype.startsWith('image') || utype.startsWith('uimage')) ? true : false;
		node_shader_context_add_texture_unit(raw.context, utype, uname, link, is_image);
	}
	else {
		// Prefer vec4[] for d3d to avoid padding
		if (ar[0] == 'float' && ar[1].indexOf('[') >= 0) {
			ar[0] = 'floats';
			ar[1] = ar[1].split('[')[0];
		}
		else if (ar[0] == 'vec4' && ar[1].indexOf('[') >= 0) {
			ar[0] = 'floats';
			ar[1] = ar[1].split('[')[0];
		}
		node_shader_context_add_constant(raw.context, ar[0], ar[1], link);
	}
	if (included == false && raw.uniforms.indexOf(s) == -1) {
		raw.uniforms.push(s);
	}
}

function node_shader_add_shared_sampler(raw: NodeShaderRaw, s: string) {
	if (raw.shared_samplers.indexOf(s) == -1) {
		raw.shared_samplers.push(s);
		let ar: string[] = s.split(' ');
		// layout(RGBA8) sampler2D tex
		let utype: string = ar[ar.length - 2];
		let uname: string = ar[ar.length - 1];
		node_shader_context_add_texture_unit(raw.context, utype, uname, null, false);
	}
}

function node_shader_add_function(raw: NodeShaderRaw, s: string) {
	let fname: string = s.split('(')[0];
	if (raw.functions.has(fname)) return;
	raw.functions.set(fname, s);
}

function node_shader_contains(raw: NodeShaderRaw, s: string): bool {
	return raw.main.indexOf(s) >= 0 ||
			raw.main_init.indexOf(s) >= 0 ||
			raw.main_normal.indexOf(s) >= 0 ||
			raw.ins.indexOf(s) >= 0 ||
			raw.main_textures.indexOf(s) >= 0 ||
			raw.main_attribs.indexOf(s) >= 0;
}

function node_shader_write_init(raw: NodeShaderRaw, s: string) {
	raw.main_init = s + '\n' + raw.main_init;
}

function node_shader_write(raw: NodeShaderRaw, s: string) {
	if (raw.lock) return;
	if (raw.write_textures > 0) {
		raw.main_textures += s + '\n';
	}
	else if (raw.write_normal > 0) {
		raw.main_normal += s + '\n';
	}
	else if (raw.write_pre) {
		raw.main_init += s + '\n';
	}
	else {
		raw.main += s + '\n';
	}
}

function node_shader_write_header(raw: NodeShaderRaw, s: string) {
	raw.header += s + '\n';
}

function node_shader_write_end(raw: NodeShaderRaw, s: string) {
	raw.main_end += s + '\n';
}

function node_shader_write_attrib(raw: NodeShaderRaw, s: string) {
	raw.main_attribs += s + '\n';
}

function node_shader_data_size(raw: NodeShaderRaw, data: string): string {
	if (data == 'float1') return '1';
	else if (data == 'float2') return '2';
	else if (data == 'float3') return '3';
	else if (data == 'float4') return '4';
	else if (data == 'short2norm') return '2';
	else if (data == 'short4norm') return '4';
	else return '1';
}

function node_shader_vstruct_to_vsin(raw: NodeShaderRaw) {
	// if self.shader_type != 'vert' or self.ins != [] or not self.vstruct_as_vsin: # Vertex structure as vertex shader input
		// return
	let vs: vertex_element_t[] = raw.context.data.vertex_elements;
	for (let e of vs) {
		node_shader_add_in(raw, 'vec' + node_shader_data_size(raw, e.data) + ' ' + e.name);
	}
}

///if (krom_direct3d11 || krom_direct3d12)
function node_shader_get_hlsl(raw: NodeShaderRaw, sharedSampler: string): string {
	let s: string = '#define HLSL\n';
	s += '#define textureArg(tex) Texture2D tex,SamplerState tex ## _sampler\n';
	s += '#define texturePass(tex) tex,tex ## _sampler\n';
	s += '#define sampler2D Texture2D\n';
	s += '#define sampler3D Texture3D\n';
	s += '#define texture(tex, coord) tex.Sample(tex ## _sampler, coord)\n';
	s += `#define textureShared(tex, coord) tex.Sample(${sharedSampler}, coord)\n`;
	s += '#define textureLod(tex, coord, lod) tex.SampleLevel(tex ## _sampler, coord, lod)\n';
	s += `#define textureLodShared(tex, coord, lod) tex.SampleLevel(${sharedSampler}, coord, lod)\n`;
	s += '#define texelFetch(tex, coord, lod) tex.Load(float3(coord.xy, lod))\n';
	s += 'uint2 _GetDimensions(Texture2D tex, uint lod) { uint x, y; tex.GetDimensions(x, y); return uint2(x, y); }\n';
	s += '#define textureSize _GetDimensions\n';
	s += '#define mod(a, b) (a % b)\n';
	s += '#define vec2 float2\n';
	s += '#define vec3 float3\n';
	s += '#define vec4 float4\n';
	s += '#define ivec2 int2\n';
	s += '#define ivec3 int3\n';
	s += '#define ivec4 int4\n';
	s += '#define mat2 float2x2\n';
	s += '#define mat3 float3x3\n';
	s += '#define mat4 float4x4\n';
	s += '#define dFdx ddx\n';
	s += '#define dFdy ddy\n';
	s += '#define inversesqrt rsqrt\n';
	s += '#define fract frac\n';
	s += '#define mix lerp\n';
	// s += '#define fma mad\n';

	s += raw.header;

	let in_ext: string = '';
	let out_ext: string = '';

	for (let a of raw.includes) {
		s += '#include "' + a + '"\n';
	}

	// Input structure
	let index: i32 = 0;
	if (raw.ins.length > 0) {
		s += 'struct SPIRV_Cross_Input {\n';
		index = 0;
		raw.ins.sort((a, b): i32 => {
			// Sort inputs by name
			return a.substring(4) >= b.substring(4) ? 1 : -1;
		});
		for (let a of raw.ins) {
			s += `${a}${in_ext} : TEXCOORD${index};\n`;
			index++;
		}
		// Built-ins
		if (raw.shader_type == 'vert' && raw.main.indexOf("gl_VertexID") >= 0) {
			s += 'uint gl_VertexID : SV_VertexID;\n';
			raw.ins.push('uint gl_VertexID');
		}
		if (raw.shader_type == 'vert' && raw.main.indexOf("gl_InstanceID") >= 0) {
			s += 'uint gl_InstanceID : SV_InstanceID;\n';
			raw.ins.push('uint gl_InstanceID');
		}
		s += '};\n';
	}

	// Output structure
	let num: i32 = 0;
	if (raw.outs.length > 0 || raw.shader_type == 'vert') {
		s += 'struct SPIRV_Cross_Output {\n';
		raw.outs.sort((a, b): i32 => {
			// Sort outputs by name
			return a.substring(4) >= b.substring(4) ? 1 : -1;
		});
		index = 0;
		if (raw.shader_type == 'vert') {
			for (let a of raw.outs) {
				s += `${a}${out_ext} : TEXCOORD${index};\n`;
				index++;
			}
			s += 'float4 svpos : SV_POSITION;\n';
		}
		else {
			let out: string = raw.outs[0];
			// Multiple render targets
			if (out.charAt(out.length - 1) == ']') {
				num = parseInt(out.charAt(out.length - 2));
				s += `vec4 fragColor[${num}] : SV_TARGET0;\n`;
			}
			else {
				s += 'vec4 fragColor : SV_TARGET0;\n';
			}
		}
		s += '};\n';
	}

	for (let a of raw.uniforms) {
		s += 'uniform ' + a + ';\n';
		if (a.startsWith('sampler')) {
			s += 'SamplerState ' + a.split(' ')[1] + '_sampler;\n';
		}
	}

	if (raw.shared_samplers.length > 0) {
		for (let a of raw.shared_samplers) {
			s += 'uniform ' + a + ';\n';
		}
		s += `SamplerState ${sharedSampler};\n`;
	}

	for (let f of raw.functions.values()) {
		s += f + '\n';
	}

	// Begin main
	if (raw.outs.length > 0 || raw.shader_type == 'vert') {
		if (raw.ins.length > 0) {
			s += 'SPIRV_Cross_Output main(SPIRV_Cross_Input stage_input) {\n';
		}
		else {
			s += 'SPIRV_Cross_Output main() {\n';
		}
	}
	else {
		if (raw.ins.length > 0) {
			s += 'void main(SPIRV_Cross_Input stage_input) {\n';
		}
		else {
			s += 'void main() {\n';
		}
	}

	// Declare inputs
	for (let a of raw.ins) {
		let b: string = a.substring(5); // Remove type 'vec4 '
		s += `${a} = stage_input.${b};\n`;
	}

	if (raw.shader_type == 'vert') {
		s += 'vec4 gl_Position;\n';
		for (let a of raw.outs) {
			s += `${a};\n`;
		}
	}
	else {
		if (raw.outs.length > 0) {
			if (num > 0) s += `vec4 fragColor[${num}];\n`;
			else s += 'vec4 fragColor;\n';
		}
	}

	s += raw.main_attribs;
	s += raw.main_textures;
	s += raw.main_normal;
	s += raw.main_init;
	s += raw.main;
	s += raw.main_end;

	// Write output structure
	if (raw.outs.length > 0 || raw.shader_type == 'vert') {
		s += 'SPIRV_Cross_Output stage_output;\n';
		if (raw.shader_type == 'vert') {
			s += 'gl_Position.z = (gl_Position.z + gl_Position.w) * 0.5;\n';
			s += 'stage_output.svpos = gl_Position;\n';
			for (let a of raw.outs) {
				let b: string = a.substring(5); // Remove type 'vec4 '
				s += `stage_output.${b} = ${b};\n`;
			}
		}
		else {
			if (num > 0) {
				for (let i: i32 = 0; i < num; ++i) {
					s += `stage_output.fragColor[${i}] = fragColor[${i}];\n`;
				}
			}
			else {
				s += 'stage_output.fragColor = fragColor;\n';
			}
		}
		s += 'return stage_output;\n';
	}
	s += '}\n';
	return s;
}
///end

///if krom_metal
function node_shader_get_msl(raw: NodeShaderRaw, sharedSampler: string): string {
	let s: string = '#define METAL\n';
	s += '#include <metal_stdlib>\n';
	s += '#include <simd/simd.h>\n';
	s += 'using namespace metal;\n';

	s += '#define textureArg(tex) texture2d<float> tex,sampler tex ## _sampler\n';
	s += '#define texturePass(tex) tex,tex ## _sampler\n';
	s += '#define sampler2D texture2d<float>\n';
	s += '#define sampler3D texture3d<float>\n';
	s += '#define texture(tex, coord) tex.sample(tex ## _sampler, coord)\n';
	s += `#define textureShared(tex, coord) tex.sample(${sharedSampler}, coord)\n`;
	s += '#define textureLod(tex, coord, lod) tex.sample(tex ## _sampler, coord, level(lod))\n';
	s += `#define textureLodShared(tex, coord, lod) tex.sample(${sharedSampler}, coord, level(lod))\n`;
	s += '#define texelFetch(tex, coord, lod) tex.read(uint2(coord), uint(lod))\n';
	s += 'float2 _getDimensions(texture2d<float> tex, uint lod) { return float2(tex.get_width(lod), tex.get_height(lod)); }\n';
	s += '#define textureSize _getDimensions\n';
	s += '#define mod(a, b) fmod(a, b)\n';
	s += '#define vec2 float2\n';
	s += '#define vec3 float3\n';
	s += '#define vec4 float4\n';
	s += '#define ivec2 int2\n';
	s += '#define ivec3 int3\n';
	s += '#define ivec4 int4\n';
	s += '#define mat2 float2x2\n';
	s += '#define mat3 float3x3\n';
	s += '#define mat4 float4x4\n';
	s += '#define dFdx dfdx\n';
	s += '#define dFdy dfdy\n';
	s += '#define inversesqrt rsqrt\n';
	s += '#define mul(a, b) b * a\n';
	s += '#define discard discard_fragment()\n';

	for (let a of raw.includes) {
		s += '#include "' + a + '"\n';
	}

	s += raw.header;

	// Input structure
	let index: i32 = 0;
	//if (ins.length > 0) {
		s += 'struct main_in {\n';
		index = 0;
		raw.ins.sort((a, b): i32 => {
			// Sort inputs by name
			return a.substring(4) >= b.substring(4) ? 1 : -1;
		});
		if (raw.shader_type == 'vert') {
			for (let a of raw.ins) {
				s += `${a} [[attribute(${index})]];\n`;
				index++;
			}
		}
		else {
			for (let a of raw.ins) {
				s += `${a} [[user(locn${index})]];\n`;
				index++;
			}
		}
		s += '};\n';
	//}

	// Output structure
	let num: i32 = 0;
	if (raw.outs.length > 0 || raw.shader_type == 'vert') {
		s += 'struct main_out {\n';
		raw.outs.sort((a, b): i32 => {
			// Sort outputs by name
			return a.substring(4) >= b.substring(4) ? 1 : -1;
		});
		index = 0;
		if (raw.shader_type == 'vert') {
			for (let a of raw.outs) {
				s += `${a} [[user(locn${index})]];\n`;
				index++;
			}
			s += 'float4 svpos [[position]];\n';
		}
		else {
			let out: string = raw.outs[0];
			// Multiple render targets
			if (out.charAt(out.length - 1) == ']') {
				num = parseInt(out.charAt(out.length - 2));
				for (let i: i32 = 0; i < num; ++i) {
					s += `float4 fragColor_${i} [[color(${i})]];\n`;
				}
			}
			else {
				s += 'float4 fragColor [[color(0)]];\n';
			}
		}
		s += '};\n';
	}

	let samplers: string[] = [];

	if (raw.uniforms.length > 0) {
		s += 'struct main_uniforms {\n';

		for (let a of raw.uniforms) {
			if (a.startsWith('sampler')) {
				samplers.push(a);
			}
			else {
				s += a + ';\n';
			}
		}

		s += '};\n';
	}

	for (let f of raw.functions.values()) {
		s += f + '\n';
	}

	// Begin main declaration
	s += '#undef texture\n';

	s += raw.shader_type == 'vert' ? 'vertex ' : 'fragment ';
	s += (raw.outs.length > 0 || raw.shader_type == 'vert') ? 'main_out ' : 'void ';
	s += 'my_main(';
	//if (ins.length > 0) {
		s += 'main_in in [[stage_in]]';
	//}
	if (raw.uniforms.length > 0) {
		let bufi: i32 = raw.shader_type == 'vert' ? 1 : 0;
		s += `, constant main_uniforms& uniforms [[buffer(${bufi})]]`;
	}

	if (samplers.length > 0) {
		for (let i: i32 = 0; i < samplers.length; ++i) {
			s += `, ${samplers[i]} [[texture(${i})]]`;
			s += ', sampler ' + samplers[i].split(' ')[1] + `_sampler [[sampler(${i})]]`;
		}
	}

	if (raw.shared_samplers.length > 0) {
		for (let i: i32 = 0; i < raw.shared_samplers.length; ++i) {
			let index: i32 = samplers.length + i;
			s += `, ${raw.shared_samplers[i]} [[texture(${index})]]`;
		}
		s += `, sampler ${sharedSampler} [[sampler(${samplers.length})]]`;
	}

	// Built-ins
	if (raw.shader_type == 'vert' && raw.main.indexOf("gl_VertexID") >= 0) {
		s += ', uint gl_VertexID [[vertex_id]]';
	}
	if (raw.shader_type == 'vert' && raw.main.indexOf("gl_InstanceID") >= 0) {
		s += ', uint gl_InstanceID [[instance_id]]';
	}

	// End main declaration
	s += ') {\n';
	s += '#define texture(tex, coord) tex.sample(tex ## _sampler, coord)\n';

	// Declare inputs
	for (let a of raw.ins) {
		let b: string = a.substring(5); // Remove type 'vec4 '
		s += `${a} = in.${b};\n`;
	}

	for (let a of raw.uniforms) {
		if (!a.startsWith('sampler')) {
			let b: string = a.split(" ")[1]; // Remove type 'vec4 '
			if (b.indexOf("[") >= 0) {
				b = b.substring(0, b.indexOf("["));
				let type: string = a.split(" ")[0];
				s += `constant ${type} *${b} = uniforms.${b};\n`;
			}
			else {
				s += `${a} = uniforms.${b};\n`;
			}
		}
	}

	if (raw.shader_type == 'vert') {
		s += 'vec4 gl_Position;\n';
		for (let a of raw.outs) {
			s += `${a};\n`;
		}
	}
	else {
		if (raw.outs.length > 0) {
			if (num > 0) s += `vec4 fragColor[${num}];\n`;
			else s += 'vec4 fragColor;\n';
		}
	}

	s += raw.main_attribs;
	s += raw.main_textures;
	s += raw.main_normal;
	s += raw.main_init;
	s += raw.main;
	s += raw.main_end;

	// Write output structure
	if (raw.outs.length > 0 || raw.shader_type == 'vert') {
		s += 'main_out out = {};\n';
		if (raw.shader_type == 'vert') {
			s += 'gl_Position.z = (gl_Position.z + gl_Position.w) * 0.5;\n';
			s += 'out.svpos = gl_Position;\n';
			for (let a of raw.outs) {
				let b: string = a.split(" ")[1]; // Remove type 'vec4 '
				s += `out.${b} = ${b};\n`;
			}
		}
		else {
			if (num > 0) {
				for (let i: i32 = 0; i < num; ++i) {
					s += `out.fragColor_${i} = fragColor[${i}];\n`;
				}
			}
			else {
				s += 'out.fragColor = fragColor;\n';
			}
		}
		s += 'return out;\n';
	}
	s += '}\n';
	return s;
}
///end

///if (krom_opengl || krom_vulkan)
function node_shader_get_glsl(raw: NodeShaderRaw, shared_sampler: string, version_header: string): string {
	let s: string = version_header;
	s += '#define textureArg(tex) sampler2D tex\n';
	s += '#define texturePass(tex) tex\n';
	s += '#define mul(a, b) b * a\n';
	s += '#define textureShared texture\n';
	s += '#define textureLodShared textureLod\n';
	s += '#define atan2(x, y) atan(y, x)\n';
	s += raw.header;

	let in_ext: string = '';
	let out_ext: string = '';

	for (let a of raw.includes) {
		s += '#include "' + a + '"\n';
	}
	for (let a of raw.ins) {
		s += `in ${a}${in_ext};\n`;
	}
	for (let a of raw.outs) {
		s += `out ${a}${out_ext};\n`;
	}
	for (let a of raw.uniforms) {
		s += 'uniform ' + a + ';\n';
	}
	for (let a of raw.shared_samplers) {
		s += 'uniform ' + a + ';\n';
	}
	for (let f of raw.functions.values()) {
		s += f + '\n';
	}
	s += 'void main() {\n';
	s += raw.main_attribs;
	s += raw.main_textures;
	s += raw.main_normal;
	s += raw.main_init;
	s += raw.main;
	s += raw.main_end;
	s += '}\n';
	return s;
}
///end

function node_shader_get(raw: NodeShaderRaw): string {

	if (raw.shader_type == 'vert' && raw.vstruct_as_vsin) {
		node_shader_vstruct_to_vsin(raw);
	}

	let sharedSampler: string = 'shared_sampler';
	if (raw.shared_samplers.length > 0) {
		sharedSampler = raw.shared_samplers[0].split(' ')[1] + '_sampler';
	}

	///if (krom_direct3d11 || krom_direct3d12)
	let s: string = node_shader_get_hlsl(raw, sharedSampler);
	///elseif krom_metal
	let s: string = node_shader_get_msl(raw, sharedSampler);
	///elseif krom_vulkan
	let version_header: string = '#version 450\n';
	let s: string = node_shader_get_glsl(raw, sharedSampler, version_header);
	///elseif krom_android
	let version_header: string = '#version 300 es\n';
	if (raw.shader_type == 'frag') {
		version_header += 'precision highp float;\n';
		version_header += 'precision mediump int;\n';
	}
	let s: string = node_shader_get_glsl(raw, sharedSampler, version_header);
	///elseif krom_opengl
	let version_header: string = '#version 330\n';
	let s: string = node_shader_get_glsl(raw, sharedSampler, version_header);
	///end

	return s;
}
