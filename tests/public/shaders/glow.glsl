// needs: Noise
uniform vec3 uParameter_Glow; // = 0, 0.5, 1

void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {
	emission = uParameter_Glow * noise3(position);
}
