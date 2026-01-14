import React, { useEffect, useRef } from 'react';

const Background3D = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        // Fullscreen Quad
        const vertices = new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
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

        const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      float hash(float n) { return fract(sin(n) * 43758.5453); }
      
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

      float fbm(vec3 p) {
          float f = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 3; i++) {
              f += noise(p) * amp;
              p = p * 2.0 + vec3(0.5); 
              amp *= 0.5;
          }
          return f;
      }

      float map(vec3 p) {
          float t = u_time * 0.1;
          p.z += t; 
          float d = fbm(p);
          d = d - 0.3;
          return max(d, 0.0);
      }

      vec4 raymarch(vec3 ro, vec3 rd) {
          vec4 sum = vec4(0.0);
          float t = 0.0;
          vec3 pos = vec3(0.0);
          vec2 m = u_mouse / u_resolution;
          vec3 lightPos = vec3((m.x - 0.5) * 10.0, (0.5 - m.y) * 10.0, -1.0);
          vec3 bloodRed = vec3(0.5, 0.0, 0.05);
          vec3 darkVoid = vec3(0.02, 0.0, 0.01);

          for (int i = 0; i < 25; i++) {
              if (sum.a > 0.95 || t > 10.0) break;
              pos = ro + t * rd;
              float density = map(pos);
              if (density > 0.01) {
                  float dif = clamp((density - map(pos + 0.4 * normalize(lightPos - pos))) / 0.4, 0.0, 1.0);
                  vec3 col = mix(darkVoid, bloodRed, density); 
                  col += vec3(0.8, 0.1, 0.1) * dif * density * 0.8;
                  col *= density; 
                  sum += vec4(col, density) * 0.4; 
              }
              t += 0.25;
          }
          return clamp(sum, 0.0, 1.0);
      }

      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
          vec3 ro = vec3(0.0, 0.0, -3.0);
          vec2 m = u_mouse / u_resolution;
          ro.x += (m.x - 0.5) * 1.0;
          ro.y += (0.5 - m.y) * 1.0;

          vec3 target = vec3(0.0, 0.0, 5.0);
          vec3 fwd = normalize(target - ro);
          vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
          vec3 up = cross(right, fwd);
          vec3 rd = normalize(fwd + uv.x * right + uv.y * up);

          vec4 vol = raymarch(ro, rd);
          vec3 bg = mix(vec3(0.1, 0.0, 0.0), vec3(0.0), length(uv) * 1.5);
          vec3 finalColor = vol.rgb + bg * (1.0 - vol.a);
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
                console.error('Shader error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

        // Safety check BEFORE program creation
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
        gl.useProgram(program);

        const positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uResolution = gl.getUniformLocation(program, "u_resolution");
        const uTime = gl.getUniformLocation(program, "u_time");
        const uMouse = gl.getUniformLocation(program, "u_mouse");

        let animationFrameId;
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let targetMouseX = mouseX;
        let targetMouseY = mouseY;

        const handleMouseMove = (e) => {
            targetMouseX = e.clientX;
            targetMouseY = canvas.height - e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const resize = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        window.addEventListener('resize', resize);
        resize();

        const render = (time) => {
            time *= 0.001;
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            gl.uniform2f(uResolution, canvas.width, canvas.height);
            gl.uniform1f(uTime, time);
            gl.uniform2f(uMouse, mouseX, mouseY);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        };
        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="glCanvas"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        />
    );
};

export default Background3D;
