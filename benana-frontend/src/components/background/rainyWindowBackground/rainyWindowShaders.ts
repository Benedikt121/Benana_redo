export const vertexShader = `
  varying vec2 vUv;        
  void main() {
      vUv = uv;
      gl_Position = vec4( position, 1.0 );    
  }
`;

export const fragmentShader = `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUv;
uniform sampler2D u_tex0;
uniform samper2D u_coverTex;
uniform bool u_hasCover;

uniform vec2 u_tex0_resolution;
uniform float u_time;
uniform vec2 u_resolution;
unifrom float u_speed;
uniform float u_intensity;
uniform float u_normal;
uniform float u_brightness;
uniform float u_blur_intensity;
uniform float u_zoom;
uniform int u_blur_iterations;
unifrom bool u_texture_fill;

#define S(a, b, t) smoothstep(a, b, t)

vec3 N13(float p) {
    vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

float N(float t) {
    return fract(sin(t * 12345.564) * 7658.76);
}

float Saw(float b, float t) {
    return S(0., b, t) * S(1., b, t);
}

vec2 DropLayer2(vec2 uv, float t) {
    vec2 UV = uv;
    uv.y += t * 0.75;
    vec2 a = vec2(6., 1.);
    vec2 grid = a * 2.;
    vec2 id = floor(uv * grid);
    float colShift = N(id.x);
    uv.y += colShift;

    id = floor(uv * grid);
    vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
    vec2 st = fract(uv * grid) - vec2(.5, 0);
    float x = n.x - .5;

    float y = UV.y * 20.;
    float wiggle = sin(y + sin(y));
    x += wiggle * (.5 - abs(x)) * (n.z - .5);
    x *= .7;
    float ti = fract(t + n.z);
    y = (Saw(.85, ti) - .5) * .9 + .5;
    vec2 p = vec2(x, y);
    float d = length((st - p) * a.yx);

    float mainDrop = S(.4, .0, d);
    float r = sqrt(S(1., y, st.y));
    float cd = abs(st.x - x);
    float trail = S(.23 * r, .15 * r * r, cd);
    float trailFront = S(-.02, .02, st.y - y);
    trail *= trailFront * r * r;

    y = UV.y;
    float trail2 = S(.2 * r, .0, cd);
    float droplets = max(0., (sin(y * (1. - y) * 120.) - st.y)) * trail2 * trailFront * n.z;
    y = fract(y * 10.) + (st.y - .5);
    float dd = length(st - vec2(x, y));
    droplets = S(.3, 0., dd);
    float m = mainDrop + droplets * r * trailFront;

    st.y>a.x*.165 ? 1.2 : 0.;
    return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
    uv *= 40.;
    vec2 id = floor(uv);
    uv = fract(uv) - .5;
    vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
    vec2 p = (n.xy - .5) * .7;
    float d = length(uv - p);
    float fade = Saw(.025, fract(t + n.z));
    float c = S(.3, 0., d) * fract(n.z * 10.) * fade;
    return c;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
    float s = StaticDrops(uv, t) * l0;
    vec2 m1 = DropLayer2(uv, t) * l1;
    vec2 m2 = DropLayer2(uv * 1.85, t) * l2;
    float c = s + m1.x + m2.x;
    c = S(.3, 1., c);
    return vec2(c, max(m1.y * l0, m2.y * l1));
}

float N21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
}

vec3 getSceneColor(vec2 uv) {
    // 1. Hintergrundlandschaft laden
    vec3 bg = texture2D(u_tex0, uv).rgb;
    
    // Wenn kein Song spielt, zeige nur die Landschaft
    if (!u_hasCover) return bg;

    // 2. Cover-Berechnung
    float screenAspect = u_resolution.x / u_resolution.y;
    vec2 centerUV = uv - 0.5; // In die Mitte verschieben
    centerUV.x *= screenAspect; // Verhindert, dass das Cover gestreckt wird
    
    // Skalierung: Eine größere Zahl macht das Cover kleiner
    centerUV *= 1.6; 

    // Schwebe-Animation: sin() sorgt für sanftes Auf und Ab basierend auf der Zeit
    centerUV.y += sin(u_time * 1.5) * 0.05;

    vec2 coverUV = centerUV + 0.5; // Zurückschieben

    // Prüfen, ob der aktuelle Pixel innerhalb unseres kleinen Covers liegt
    if(coverUV.x > 0.0 && coverUV.x < 1.0 && coverUV.y > 0.0 && coverUV.y < 1.0) {
        vec3 coverCol = texture2D(u_coverTex, coverUV).rgb;
        
        // Macht die Ränder des Covers weich, damit es besser im Nebel sitzt
        float borderX = smoothstep(0.0, 0.02, coverUV.x) * smoothstep(1.0, 0.98, coverUV.x);
        float borderY = smoothstep(0.0, 0.02, coverUV.y) * smoothstep(1.0, 0.98, coverUV.y);
        float alpha = borderX * borderY;

        // Cover über Landschaft legen (* 1.4 macht es künstlich heller = Leuchten)
        return mix(bg, coverCol * 1.4, alpha * 0.95);
    }
    
    return bg; // Ansonsten Landschaft zeigen
}

void main() {
    vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;
    vec2 UV = gl_FragCoord.xy / u_resolution.xy;
    float T = u_time;
    
    // Bild formatfüllend skalieren
    if(u_texture_fill) {
        float screenAspect = u_resolution.x / u_resolution.y;
        float textureAspect = u_tex0_resolution.x / u_tex0_resolution.y;
        float scaleX = 1., scaleY = 1.;
        if(textureAspect > screenAspect )
            scaleX = screenAspect / textureAspect;
        else
            scaleY = textureAspect / screenAspect;
        UV = vec2(scaleX, scaleY) * (UV - 0.5) + 0.5;
    }

    float t = T * .2 * u_speed;
    uv *= (.7) * u_zoom;
    
    // Regen-Schichten berechnen
    float staticDrops = S(-.5, 1., u_intensity) * 2.;
    float layer1 = S(.25, .75, u_intensity);
    float layer2 = S(.0, .5, u_intensity);
    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);

    // Lichtbrechung durch die Tropfen (Normals)
    vec2 e = vec2(.001, 0.) * u_normal;
    float cx = Drops(uv + e, t, staticDrops, layer1, layer2).x;
    float cy = Drops(uv + e.yx, t, staticDrops, layer1, layer2).x;
    vec2 n = vec2(cx - c.x, cy - c.x);

    // Szene abrufen (Landschaft + Cover) MIT Tropfenverzerrung (+ n)
    vec3 col = getSceneColor(UV + n); 
    vec4 texCoord = vec4(UV.x + n.x, UV.y + n.y, 0, 1.0 * 25. * 0.01 / 7.);
    
    // Nebel-Schleife (Blur)
    // Verwackelt die Farben, um "Milchglas/Nebel" zu simulieren
    if(u_blur_iterations != 1) {
        float blur = u_blur_intensity * 0.01;
        float a = N21(gl_FragCoord.xy) * 6.2831;
        for(int m = 0; m < 64; m++) {
            if(m > u_blur_iterations) break; // Bricht ab, wenn Iterationen erreicht sind
            vec2 offs = vec2(sin(a), cos(a)) * blur;
            float d = fract(sin((float(m) + 1.) * 546.) * 5424.);
            d = sqrt(d);
            offs *= d;
            
            col += getSceneColor(texCoord.xy + vec2(offs.x, offs.y));
            a++;
        }
        col /= float(u_blur_iterations);
    }

    // Leichte Vignette am Rand
    col *= 1. - dot(UV -= .5, UV) * 1.; 

    gl_FragColor = vec4(col * u_brightness, 1);
}
`;
