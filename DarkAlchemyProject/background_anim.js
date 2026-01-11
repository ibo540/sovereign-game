const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
}

// Fullscreen Quad
const vertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const vsSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

// VOLUMETRIC RAYMARCHING SHADER (Optimized)
const fsSource = `
    precision mediump float; // Lower precision for performance
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    // Simpler Hash
    float hash(float n) { return fract(sin(n) * 43758.5453); }
    
    // Optimized 3D Noise (fewer ops)
    float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 57.0 + p.z * 113.0;
        return mix(mix(mix( hash(n + 0.0), hash(n + 1.0), f.x),
                       mix( hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                   mix(mix( hash(n + 113.0), hash(n + 114.0), f.x),
                       mix( hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
    }

    // FBM (Reduced Octaves for Speed)
    float fbm(vec3 p) {
        float f = 0.0;
        float amp = 0.5;
        // Reduced from 5 to 3 octaves for significant perf boost
        for (int i = 0; i < 3; i++) {
            f += noise(p) * amp;
            p = p * 2.0 + vec3(0.5); 
            amp *= 0.5;
        }
        return f;
    }

    // Scene Mapping
    float map(vec3 p) {
        float t = u_time * 0.1; // Slower time
        // Less complex domain warping
        p.z += t; 
        
        float d = fbm(p);
        // Hollowing
        d = d - 0.3;
        
        return max(d, 0.0);
    }

    // Raymarching Loop
    vec4 raymarch(vec3 ro, vec3 rd) {
        vec4 sum = vec4(0.0);
        float t = 0.0;
        vec3 pos = vec3(0.0);
        
        vec2 m = u_mouse / u_resolution;
        // Light follows mouse
        vec3 lightPos = vec3((m.x - 0.5) * 10.0, (0.5 - m.y) * 10.0, -1.0);
        
        // Deep Blood Red / Abyssal Palette (Darker)
        vec3 bloodRed = vec3(0.5, 0.0, 0.05); // Darker Crimson
        vec3 darkVoid = vec3(0.02, 0.0, 0.01); // Almost Black

        // Reduced interactions loop to 25 steps (was 40)
        for (int i = 0; i < 25; i++) {
            if (sum.a > 0.95 || t > 10.0) break;

            pos = ro + t * rd;
            float density = map(pos);

            if (density > 0.01) {
                // Cheaper lighting calc
                float dif = clamp((density - map(pos + 0.4 * normalize(lightPos - pos))) / 0.4, 0.0, 1.0);
                
                // Color Mixing: Void -> Red -> Bright Red (More aggressive darks)
                vec3 col = mix(darkVoid, bloodRed, density); 
                col += vec3(0.8, 0.1, 0.1) * dif * density * 0.8; // Dimmers highlights

                col *= density; 
                sum += vec4(col, density) * 0.4; 
            }
            t += 0.25; // Larger steps
        }
        return clamp(sum, 0.0, 1.0);
    }

    void main() {
        // Downscale coordination calculation slightly if needed, but keeping standard for now
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        
        vec3 ro = vec3(0.0, 0.0, -3.0);
        
        // Simpler camera movement
        vec2 m = u_mouse / u_resolution;
        ro.x += (m.x - 0.5) * 1.0;
        ro.y += (0.5 - m.y) * 1.0;

        vec3 target = vec3(0.0, 0.0, 5.0);
        vec3 fwd = normalize(target - ro);
        vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
        vec3 up = cross(right, fwd);
        
        vec3 rd = normalize(fwd + uv.x * right + uv.y * up);

        vec4 vol = raymarch(ro, rd);
        
        // Background: Dark Red/Black Gradient
        vec3 bg = mix(vec3(0.1, 0.0, 0.0), vec3(0.0), length(uv) * 1.5);
        
        vec3 finalColor = vol.rgb + bg * (1.0 - vol.a);
        
        // Vignette
        float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv));
        finalColor *= vignette;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

if (!vertexShader || !fragmentShader) {
    console.error("Shader initialization failed.");
}

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const uResolution = gl.getUniformLocation(program, "u_resolution");
const uTime = gl.getUniformLocation(program, "u_time");
const uMouse = gl.getUniformLocation(program, "u_mouse");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Smooth mouse interpolation
let targetMouseX = mouseX;
let targetMouseY = mouseY;

// Detect if device is touch-enabled (mobile/tablet)
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

document.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = canvas.height - e.clientY;

    // Update Custom Cursor Position (only on non-touch devices)
    if (!isTouchDevice) {
        const cursor = document.getElementById('custom-cursor');
        if (cursor) {
            cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        }
    }
});

// Hide custom cursor on touch devices
if (isTouchDevice) {
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        cursor.style.display = 'none';
    }
}

window.addEventListener('resize', resize);
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
resize();

function render(time) {
    time *= 0.001; // Seconds

    // Lerp mouse for smoother movement
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}
requestAnimationFrame(render);
