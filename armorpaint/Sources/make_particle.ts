
function make_particle_run(data: material_t): NodeShaderContextRaw {
	let context_id: string = "mesh";
	let con_part: NodeShaderContextRaw = node_shader_context_create(data, {
		name: context_id,
		depth_write: false,
		compare_mode: "always",
		cull_mode: "clockwise",
		vertex_elements: [{name: "pos", data: "short4norm"}],
		color_attachments: ["R8"]
	});

	let vert: NodeShaderRaw = node_shader_context_make_vert(con_part);
	let frag: NodeShaderRaw = node_shader_context_make_frag(con_part);
	frag.ins = vert.outs;

	node_shader_write_attrib(vert, 'vec4 spos = vec4(pos.xyz, 1.0);');

	node_shader_add_uniform(vert, 'float brushRadius', '_brushRadius');
	node_shader_write_attrib(vert, 'vec3 emitFrom = vec3(fhash(gl_InstanceID), fhash(gl_InstanceID * 2), fhash(gl_InstanceID * 3));');
	node_shader_write_attrib(vert, 'emitFrom = emitFrom * brushRadius - brushRadius / 2.0;');
	node_shader_write_attrib(vert, 'spos.xyz += emitFrom * vec3(256.0, 256.0, 256.0);');

	node_shader_add_uniform(vert, 'mat4 pd', '_particle_data');

	let str_tex_hash: string = "float fhash(int n) { return fract(sin(float(n)) * 43758.5453); }\n";
	node_shader_add_function(vert, str_tex_hash);
	node_shader_add_out(vert, 'float p_age');
	node_shader_write(vert, 'p_age = pd[3][3] - float(gl_InstanceID) * pd[0][1];');
	node_shader_write(vert, 'p_age -= p_age * fhash(gl_InstanceID) * pd[2][3];');

	node_shader_write(vert, 'if (pd[0][0] > 0.0 && p_age < 0.0) p_age += float(int(-p_age / pd[0][0]) + 1) * pd[0][0];');

	node_shader_add_out(vert, 'float p_lifetime');
	node_shader_write(vert, 'p_lifetime = pd[0][2];');
	node_shader_write(vert, 'if (p_age < 0.0 || p_age > p_lifetime) {');
	// write(vert, 'SPIRV_Cross_Output stage_output;');
	// write(vert, 'stage_output.svpos /= 0.0;');
	// write(vert, 'return stage_output;');
	node_shader_write(vert, 'spos /= 0.0;');
	node_shader_write(vert, '}');

	node_shader_add_out(vert, 'vec3 p_velocity');
	node_shader_write(vert, 'p_velocity = vec3(pd[1][0], pd[1][1], pd[1][2]);');
	node_shader_write(vert, 'p_velocity.x += fhash(gl_InstanceID)                     * pd[1][3] - pd[1][3] / 2.0;');
	node_shader_write(vert, 'p_velocity.y += fhash(gl_InstanceID +     int(pd[0][3])) * pd[1][3] - pd[1][3] / 2.0;');
	node_shader_write(vert, 'p_velocity.z += fhash(gl_InstanceID + 2 * int(pd[0][3])) * pd[1][3] - pd[1][3] / 2.0;');
	node_shader_write(vert, 'p_velocity.x += (pd[2][0] * p_age) / 5.0;');
	node_shader_write(vert, 'p_velocity.y += (pd[2][1] * p_age) / 5.0;');
	node_shader_write(vert, 'p_velocity.z += (pd[2][2] * p_age) / 5.0;');

	node_shader_add_out(vert, 'vec3 p_location');
	node_shader_write(vert, 'p_location = p_velocity * p_age;');
	node_shader_write(vert, 'spos.xyz += p_location;');
	node_shader_write(vert, 'spos.xyz *= vec3(0.01, 0.01, 0.01);');

	node_shader_add_uniform(vert, 'mat4 WVP', '_world_view_proj_matrix');
	node_shader_write(vert, 'gl_Position = mul(spos, WVP);');

	node_shader_add_uniform(vert, 'vec4 inp', '_inputBrush');
	node_shader_write(vert, 'vec2 binp = vec2(inp.x, 1.0 - inp.y);');
	node_shader_write(vert, 'binp = binp * 2.0 - 1.0;');
	node_shader_write(vert, 'binp *= gl_Position.w;');
	node_shader_write(vert, 'gl_Position.xy += binp;');

	node_shader_add_out(vert, 'float p_fade');
	node_shader_write(vert, 'p_fade = sin(min((p_age / 8.0) * 3.141592, 3.141592));');

	node_shader_add_out(frag, 'float fragColor');
	node_shader_write(frag, 'fragColor = p_fade;');

	// add_out(vert, 'vec4 wvpposition');
	// write(vert, 'wvpposition = gl_Position;');
	// write(frag, 'vec2 texCoord = wvpposition.xy / wvpposition.w;');
	// add_uniform(frag, 'sampler2D gbufferD');
	// write(frag, 'fragColor *= 1.0 - clamp(distance(textureLod(gbufferD, texCoord, 0.0).r, wvpposition.z), 0.0, 1.0);');

	// Material.finalize(con_part);
	con_part.data.shader_from_source = true;
	con_part.data.vertex_shader = node_shader_get(vert);
	con_part.data.fragment_shader = node_shader_get(frag);

	return con_part;
}

function make_particle_mask(vert: NodeShaderRaw, frag: NodeShaderRaw) {
	///if arm_physics
	if (context_raw.particle_physics) {
		node_shader_add_out(vert, 'vec4 wpos');
		node_shader_add_uniform(vert, 'mat4 W', '_world_matrix');
		node_shader_write_attrib(vert, 'wpos = mul(vec4(pos.xyz, 1.0), W);');
		node_shader_add_uniform(frag, 'vec3 particleHit', '_particleHit');
		node_shader_add_uniform(frag, 'vec3 particleHitLast', '_particleHitLast');

		node_shader_write(frag, 'vec3 pa = wpos.xyz - particleHit;');
		node_shader_write(frag, 'vec3 ba = particleHitLast - particleHit;');
		node_shader_write(frag, 'float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);');
		node_shader_write(frag, 'dist = length(pa - ba * h) * 10.0;');
		// write(frag, 'dist = distance(particleHit, wpos.xyz) * 10.0;');

		node_shader_write(frag, 'if (dist > 1.0) discard;');
		node_shader_write(frag, 'float str = clamp(pow(1.0 / dist * brushHardness * 0.2, 4.0), 0.0, 1.0) * opacity;');
		node_shader_write(frag, 'if (particleHit.x == 0.0 && particleHit.y == 0.0 && particleHit.z == 0.0) str = 0.0;');
		node_shader_write(frag, 'if (str == 0.0) discard;');
		return;
	}
	///end

	node_shader_add_uniform(frag, 'sampler2D texparticle', '_texparticle');
	///if (krom_direct3d11 || krom_direct3d12 || krom_metal || krom_vulkan)
	node_shader_write(frag, 'float str = textureLod(texparticle, sp.xy, 0.0).r;');
	///else
	node_shader_write(frag, 'float str = textureLod(texparticle, vec2(sp.x, (1.0 - sp.y)), 0.0).r;');
	///end
}
