export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  }
`;
export const bufferAShader = `
  uniform sampler2D iChannel0;
  uniform vec2 iResolution;
  uniform vec3 u_newDrop;
  uniform int iFrame;

  uniform float u_dropSize;
  uniform float u_damping;
  uniform float u_attenuation;
  uniform float u_dropIntensity;
  uniform float u_speed;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 pixel = 1.0 / iResolution;
    vec2 fragCoord = uv * iResolution;

    // Im ersten Frame ist alles ruhig
    if (iFrame == 0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float pressure = texture2D(iChannel0, uv).x;
    float pVel = texture2D(iChannel0, uv).y;

    float p_right = texture2D(iChannel0, uv + vec2(pixel.x, 0.0)).x;
    float p_left = texture2D(iChannel0, uv + vec2(-pixel.x, 0.0)).x;
    float p_up = texture2D(iChannel0, uv + vec2(0.0, pixel.y)).x;
    float p_down = texture2D(iChannel0, uv + vec2(0.0, -pixel.y)).x;

    if (fragCoord.x <= 1.0) p_left = p_right;
    if (fragCoord.x >= iResolution.x - 1.0) p_right = p_left;
    if (fragCoord.y <= 1.0) p_down = p_up;
    if (fragCoord.y >= iResolution.y - 1.0) p_up = p_down;

    pVel += u_speed * (-2.0 * pressure + p_right + p_left) / 3.8;
    pVel += u_speed * (-2.0 * pressure + p_up + p_down) / 3.8;
    
    pressure += u_speed * pVel;
    pVel -= 0.005 * u_speed * pressure;

    pVel *= 1.0 - u_attenuation;
    pressure *= u_damping;

    if (u_newDrop.z > 0.0) {
      float dist = distance(fragCoord, u_newDrop.xy);
      
      if (dist <= u_dropSize * 1.5) { 
        
        float dropShape = exp(-2.0 * pow(dist / u_dropSize, 2.0));
        
        pressure += dropShape * u_newDrop.z * u_dropIntensity;
      }
    }

    gl_FragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
  }
`;

export const imageShader = `
  uniform sampler2D iChannel0;
  uniform sampler2D u_coverTex;
  uniform vec3 u_baseWaterColor;
  uniform vec2 u_resolution;
  uniform float u_lightThreshold;

  varying vec2 vUv;

  void main() {
    vec4 data = texture2D(iChannel0, vUv);
    float slope = length(vec2(data.z, data.w));

    vec2 distortion = vec2(-data.z, -data.w) * 0.5;

    float screenAspect = u_resolution.x / u_resolution.y;
    vec2 ratio = vec2(
      max(screenAspect, 1.0),
      max(1.0 / screenAspect, 1.0)
    );
    
    vec2 coverUv = (vUv - 0.5) * ratio * 0.8 + 0.5;
    vec2 distortedUV = clamp(coverUv + distortion, 0.0, 1.0);

    vec4 coverColor = texture2D(u_coverTex, distortedUV, 8.0);

    vec3 normal = normalize(vec3(-data.z, 0.15, -data.w));
    
    float spec = pow(max(0.0, dot(normal, normalize(vec3(-2.0, 5.0, 2.0)))), 80.0);

    vec3 lightDir = normalize(vec3(-1.0, 2.0, 1.0));
    float diffuse = max(0.0, dot(normal, lightDir));

    float slopeMask = smoothstep(0.0, u_lightThreshold, slope);
    float finalMask = mix(slopeMask, diffuse, 0.2);

    vec3 puddleBase = u_baseWaterColor;

    vec3 detailColor = mix(puddleBase, coverColor.rgb, 0.8 * finalMask);  
    
    float distToCenter = distance(vUv, vec2(0.5));
    float vignette = smoothstep(1.1, 0.2, distToCenter);
    
    vec3 finalColor = detailColor * vignette;

    finalColor += vec3(spec) * (coverColor.rgb * 1.5 + 0.3);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;