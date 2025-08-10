let scene, camera, renderer, material, mesh;
        let mouseX = 0, mouseY = 0;
        let isMouseDown = false;
        let cameraDistance = 12.0;
        let cameraTheta = 0;
        let cameraPhi = Math.PI * 0.4;
        let time = 0;
        
        // FPS counter variables
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 60;
        let fpsUpdateTime = 0;
        
        // Vertex shader
        const vertexShader = `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `;
        
        // Enhanced fragment shader with rich space background
        const fragmentShader = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec3 u_camera_pos;
            uniform mat3 u_camera_matrix;
            uniform bool u_accretion_disk;
            uniform bool u_gravitational_lensing;
            uniform bool u_doppler_beaming;
            uniform float u_black_hole_mass;
            uniform int u_steps;
            
            const float PI = 3.14159265359;
            const float TWO_PI = 6.28318530718;
            const float SCHWARZSCHILD_RADIUS = 2.0;
            const float ACCRETION_INNER = 3.0;
            const float ACCRETION_OUTER = 12.0;
            const int MAX_STEPS = 200;
            
            // Hash functions for procedural generation
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            float hash3(vec3 p) {
                return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
            }
            
            // Multi-octave noise
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
            }
            
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for(int i = 0; i < 6; i++) {
                    value += amplitude * noise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }
            
            // Convert 3D direction to spherical coordinates
            vec2 dirToSphere(vec3 dir) {
                return vec2(
                    0.5 + atan(dir.z, dir.x) / TWO_PI,
                    0.5 - asin(clamp(dir.y, -1.0, 1.0)) / PI
                );
            }
            
            // Enhanced cosmic background
            vec3 getCosmicBackground(vec2 uv, vec3 rayDir) {
                vec3 color = vec3(0.0);
                
                // Deep space base color gradient
                float cosmicGradient = length(uv - 0.5);
                color += vec3(0.02, 0.03, 0.08) * (1.0 - cosmicGradient * 0.5);
                
                // Distant galaxy clusters
                for(int i = 0; i < 15; i++) {
                    float fi = float(i);
                    vec2 galaxyPos = vec2(
                        hash(vec2(fi * 23.45, fi * 67.89)),
                        hash(vec2(fi * 89.12, fi * 34.56))
                    );
                    
                    float dist = distance(uv, galaxyPos);
                    float galaxySize = 0.03 + hash(vec2(fi * 12.34)) * 0.04;
                    
                    if(dist < galaxySize) {
                        float intensity = (galaxySize - dist) / galaxySize;
                        intensity = pow(intensity, 1.5);
                        
                        // Galaxy spiral structure
                        vec2 relPos = (uv - galaxyPos) / galaxySize;
                        float angle = atan(relPos.y, relPos.x);
                        float spiral = sin(angle * 3.0 + length(relPos) * 20.0) * 0.5 + 0.5;
                        intensity *= 0.3 + 0.7 * spiral;
                        
                        vec3 galaxyColor = mix(
                            vec3(0.8, 0.6, 1.0), // Blue core
                            vec3(1.0, 0.8, 0.4), // Yellow arms
                            spiral
                        );
                        
                        color += galaxyColor * intensity * 0.1;
                    }
                }
                
                // Bright stars with different types
                for(int i = 0; i < 200; i++) {
                    float fi = float(i);
                    vec2 starPos = vec2(
                        hash(vec2(fi * 12.34, fi * 56.78)),
                        hash(vec2(fi * 91.23, fi * 45.67))
                    );
                    
                    float dist = distance(uv, starPos);
                    float brightness = hash(vec2(fi * 13.37, fi * 73.19));
                    float starSize = 0.001 + brightness * 0.003;
                    
                    if(dist < starSize && brightness > 0.3) {
                        float intensity = (starSize - dist) / starSize;
                        intensity = pow(intensity, 0.3);
                        
                        // Star color based on type
                        vec3 starColor = vec3(1.0);
                        float colorSeed = hash(vec2(fi * 19.73, fi * 41.29));
                        
                        if(colorSeed > 0.9) {
                            starColor = vec3(0.5, 0.7, 1.5); // Blue giant
                        } else if(colorSeed > 0.7) {
                            starColor = vec3(1.5, 1.3, 1.0); // White dwarf
                        } else if(colorSeed > 0.4) {
                            starColor = vec3(1.2, 1.0, 0.6); // Yellow star
                        } else {
                            starColor = vec3(1.5, 0.6, 0.3); // Red giant
                        }
                        
                        // Twinkling effect
                        float twinkle = 0.8 + 0.2 * sin(u_time * 3.0 + fi * 10.0);
                        
                        color += starColor * intensity * brightness * 3.0 * twinkle;
                    }
                }
                
                // Dense star field
                vec2 starGrid = uv * 400.0;
                vec2 starCell = floor(starGrid);
                vec2 starLocal = fract(starGrid);
                
                float starChance = hash(starCell);
                if(starChance > 0.85) {
                    vec2 starCenter = vec2(hash(starCell + 0.1), hash(starCell + 0.2));
                    float dist = distance(starLocal, starCenter);
                    if(dist < 0.15) {
                        float intensity = (0.15 - dist) / 0.15;
                        intensity = pow(intensity, 2.0);
                        color += vec3(intensity * 0.3);
                    }
                }
                
                // Milky Way galaxy band with structure
                float galaxyBand = abs(uv.y - 0.5);
                if(galaxyBand < 0.25) {
                    float intensity = (0.25 - galaxyBand) / 0.25;
                    intensity = pow(intensity, 1.2);
                    
                    // Complex galaxy structure
                    float galaxyNoise1 = fbm(uv * 30.0 + vec2(u_time * 0.01, 0.0));
                    float galaxyNoise2 = fbm(uv * 80.0);
                    float galaxyStructure = galaxyNoise1 * 0.7 + galaxyNoise2 * 0.3;
                    
                    intensity *= 0.2 + 0.8 * galaxyStructure;
                    
                    // Galaxy dust lanes
                    float dustLanes = sin(uv.x * PI * 8.0 + galaxyNoise1 * 2.0) * 0.5 + 0.5;
                    intensity *= 0.6 + 0.4 * dustLanes;
                    
                    // Galaxy colors with dust absorption
                    vec3 galaxyCore = vec3(0.4, 0.3, 0.2); // Brown dust
                    vec3 galaxyArms = vec3(0.2, 0.15, 0.3); // Blue-purple stars
                    vec3 galaxyColor = mix(galaxyCore, galaxyArms, galaxyStructure);
                    
                    color += galaxyColor * intensity;
                }
                
                // Colorful nebulae
                float nebula1 = fbm(uv * 8.0 + vec2(u_time * 0.005, u_time * 0.003));
                if(nebula1 > 0.65) {
                    float nebulaIntensity = (nebula1 - 0.65) * 2.5;
                    vec3 nebulaColor = mix(
                        vec3(0.8, 0.1, 0.4), // Magenta
                        vec3(0.2, 0.4, 0.8), // Blue
                        noise(uv * 12.0)
                    );
                    color += nebulaColor * nebulaIntensity * 0.15;
                }
                
                // Green emission nebula
                float nebula2 = fbm(uv * 15.0 + vec2(-u_time * 0.002, u_time * 0.007));
                if(nebula2 > 0.7) {
                    float nebulaIntensity = (nebula2 - 0.7) * 3.0;
                    vec3 nebulaColor = vec3(0.1, 0.6, 0.2); // Green emission
                    color += nebulaColor * nebulaIntensity * 0.1;
                }
                
                // Orange/red emission regions
                float nebula3 = fbm(uv * 20.0 + vec2(u_time * 0.008, -u_time * 0.004));
                if(nebula3 > 0.72) {
                    float nebulaIntensity = (nebula3 - 0.72) * 3.5;
                    vec3 nebulaColor = vec3(0.9, 0.4, 0.1); // Orange-red
                    color += nebulaColor * nebulaIntensity * 0.08;
                }
                
                // Cosmic dust with parallax
                float dustPattern = fbm(uv * 100.0 + rayDir.xy * 0.1);
                if(dustPattern > 0.6) {
                    float dustDensity = (dustPattern - 0.6) * 2.5;
                    vec3 dustColor = vec3(0.1, 0.08, 0.05); // Dark brown dust
                    color *= (1.0 - dustDensity * 0.3); // Absorption
                    color += dustColor * dustDensity * 0.05; // Scattering
                }
                
                // Distant quasar
                vec2 quasarPos = vec2(0.8, 0.3);
                float quasarDist = distance(uv, quasarPos);
                if(quasarDist < 0.02) {
                    float intensity = (0.02 - quasarDist) / 0.02;
                    intensity = pow(intensity, 0.1);
                    vec3 quasarColor = vec3(1.2, 0.9, 1.5);
                    float flicker = 0.8 + 0.2 * sin(u_time * 5.0);
                    color += quasarColor * intensity * 0.5 * flicker;
                    
                    // Quasar jet
                    vec2 jetDir = normalize(vec2(0.3, 0.8));
                    float jetDistance = abs(dot(uv - quasarPos, vec2(-jetDir.y, jetDir.x)));
                    float jetLength = dot(uv - quasarPos, jetDir);
                    if(jetDistance < 0.005 && jetLength > 0.0 && jetLength < 0.1) {
                        float jetIntensity = (0.005 - jetDistance) / 0.005;
                        jetIntensity *= (0.1 - jetLength) / 0.1;
                        color += vec3(0.4, 0.6, 1.0) * jetIntensity * 0.3;
                    }
                }
                
                return color;
            }
            
            // Enhanced accretion disk
            vec3 getAccretionDisk(vec3 pos, vec3 velocity) {
                float r = length(pos.xz);
                if(r < ACCRETION_INNER * u_black_hole_mass || r > ACCRETION_OUTER * u_black_hole_mass) 
                    return vec3(0.0);
                
                // Only render near the disk plane
                float diskHeight = 0.2 * u_black_hole_mass;
                if(abs(pos.y) > diskHeight) return vec3(0.0);
                
                float angle = atan(pos.z, pos.x);
                
                // Orbital velocity for Keplerian disk
                float orbitalVel = sqrt(u_black_hole_mass / r);
                float expectedAngle = angle + orbitalVel * u_time;
                
                // Spiral pattern
                float spiral = sin(expectedAngle * 3.0 + r * 0.8);
                float spiralIntensity = 0.7 + 0.3 * spiral;
                
                // Temperature gradient (inner parts hotter)
                float temperature = 8000.0 * u_black_hole_mass / (r - ACCRETION_INNER * 0.5);
                temperature = clamp(temperature, 1000.0, 15000.0);
                
                // Blackbody color approximation
                vec3 color = vec3(1.0);
                if(temperature > 12000.0) {
                    color = vec3(0.7, 0.8, 1.5); // Blue-white (very hot)
                } else if(temperature > 8000.0) {
                    color = vec3(1.0, 0.9, 1.2); // White
                } else if(temperature > 5000.0) {
                    color = vec3(1.2, 1.0, 0.6); // Yellow-white
                } else if(temperature > 3000.0) {
                    color = vec3(1.5, 0.8, 0.3); // Orange
                } else {
                    color = vec3(1.2, 0.4, 0.2); // Red
                }
                
                // Intensity based on distance and disk physics
                float baseIntensity = 0.8 / (r * r);
                baseIntensity *= smoothstep(ACCRETION_OUTER * u_black_hole_mass, ACCRETION_INNER * u_black_hole_mass, r);
                baseIntensity *= spiralIntensity;
                
                // Doppler beaming effect
                if(u_doppler_beaming) {
                    vec3 diskVel = vec3(-pos.z, 0.0, pos.x) * orbitalVel / r;
                    float dopplerFactor = 1.0 + dot(normalize(velocity), diskVel) * 0.1;
                    baseIntensity *= dopplerFactor;
                    color *= pow(dopplerFactor, 0.25);
                }
                
                // Add turbulence
                float turbulence = noise(vec2(angle * 10.0, r * 2.0) + u_time * 0.5);
                baseIntensity *= 0.8 + 0.4 * turbulence;
                
                return color * baseIntensity;
            }
            
            // Schwarzschild metric ray bending
            vec3 schwarzschildDeflection(vec3 pos, vec3 dir, float mass) {
                float r = length(pos);
                if(r < SCHWARZSCHILD_RADIUS * mass * 0.6) return dir; // Inside event horizon
                
                vec3 toCenter = -pos / r;
                float rs = SCHWARZSCHILD_RADIUS * mass;
                
                // Geodesic deflection (simplified)
                float deflectionStrength = rs / (r * r - rs * r);
                vec3 perpComponent = dir - dot(dir, toCenter) * toCenter;
                
                return normalize(dir + toCenter * deflectionStrength * 0.1 + perpComponent * deflectionStrength * 0.05);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                vec2 coord = (uv - 0.5) * 2.0;
                coord.x *= u_resolution.x / u_resolution.y;
                
                // Camera ray setup
                vec3 rayDir = normalize(vec3(coord, 1.5));
                rayDir = u_camera_matrix * rayDir;
                vec3 rayPos = u_camera_pos;
                
                vec3 color = vec3(0.0);
                float stepSize = 0.08;
                bool hitEventHorizon = false;
                vec3 originalDir = rayDir;
                
                // Ray marching with gravitational effects
                for(int i = 0; i < MAX_STEPS; i++) {
                    if(i >= u_steps) break;
                    
                    float r = length(rayPos);
                    float schwarzschildRadius = SCHWARZSCHILD_RADIUS * u_black_hole_mass;
                    
                    // Check event horizon
                    if(r < schwarzschildRadius * 1.1) {
                        hitEventHorizon = true;
                        break;
                    }
                    
                    // Gravitational lensing
                    if(u_gravitational_lensing && r < 30.0) {
                        rayDir = schwarzschildDeflection(rayPos, rayDir, u_black_hole_mass);
                    }
                    
                    // Check accretion disk intersection
                    if(u_accretion_disk) {
                        vec3 nextPos = rayPos + rayDir * stepSize;
                        
                        // Disk intersection (y = 0 plane)
                        if(rayPos.y * nextPos.y <= 0.0 && abs(rayPos.y) < 1.0) {
                            float t = -rayPos.y / rayDir.y;
                            if(t > 0.0 && t <= stepSize) {
                                vec3 intersectPos = rayPos + rayDir * t;
                                vec3 diskColor = getAccretionDisk(intersectPos, rayDir);
                                
                                if(length(diskColor) > 0.01) {
                                    // Add bloom effect
                                    float bloom = 1.0 + 0.5 / (length(intersectPos.xz) + 0.1);
                                    color += diskColor * bloom;
                                }
                            }
                        }
                    }
                    
                    // Adaptive step size
                    stepSize = 0.05 + r * 0.02;
                    stepSize = min(stepSize, 0.5);
                    
                    rayPos += rayDir * stepSize;
                    
                    // Escape condition
                    if(r > 100.0) break;
                }
                
                // Render cosmic background if ray escaped
                if(!hitEventHorizon) {
                    vec2 skyUV = dirToSphere(normalize(rayPos));
                    vec3 background = getCosmicBackground(skyUV, normalize(rayPos));
                    
                    // Apply gravitational redshift/blueshift
                    if(u_doppler_beaming && length(u_camera_pos) < 50.0) {
                        float gravitationalShift = 1.0 - 0.1 / length(u_camera_pos);
                        background *= vec3(gravitationalShift, 1.0, 1.0/gravitationalShift);
                    }
                    
                    color += background;
                }
                
                // Post-processing
                // Tone mapping
                color = color / (1.0 + color * 0.5);
                
                // Gamma correction
                color = pow(color, vec3(0.85));
                
                // Subtle vignette effect
                float vignette = 1.0 - 0.2 * length(coord);
                color *= vignette;
                
                // Slight color temperature adjustment for space
                color *= vec3(1.05, 1.0, 1.1);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        function init() {
            try {
                // Scene setup
                scene = new THREE.Scene();
                camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
                camera.position.z = 1;
                
                // Renderer
                renderer = new THREE.WebGLRenderer({ 
                    antialias: true,
                    alpha: false,
                    preserveDrawingBuffer: false
                });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                document.body.appendChild(renderer.domElement);
                
                // Geometry
                const geometry = new THREE.PlaneGeometry(2, 2);
                
                // Material with enhanced uniforms
                const uniforms = {
                    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                    u_time: { value: 0.0 },
                    u_camera_pos: { value: new THREE.Vector3(12, 0, 0) },
                    u_camera_matrix: { value: new THREE.Matrix3() },
                    u_accretion_disk: { value: true },
                    u_gravitational_lensing: { value: true },
                    u_doppler_beaming: { value: true },
                    u_black_hole_mass: { value: 1.0 },
                    u_steps: { value: 80 }
                };
                
                material = new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    side: THREE.DoubleSide
                });
                
                mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);
                
                setupControls();
                setupMouseControls();
                updateCamera();
                
                console.log('Enhanced Black Hole Simulation with Rich Space Background Loaded');
                
            } catch (error) {
                console.error('Initialization failed:', error);
            }
        }
        
        function setupControls() {
            const controls = {
                accretionDisk: document.getElementById('accretion_disk'),
                gravitationalLensing: document.getElementById('gravitational_lensing'),
                dopplerBeaming: document.getElementById('doppler_beaming'),
                observerDistance: document.getElementById('observer_distance'),
                blackHoleMass: document.getElementById('black_hole_mass'),
                timeScale: document.getElementById('time_scale'),
                quality: document.getElementById('quality'),
                distanceValue: document.getElementById('distance_value'),
                massValue: document.getElementById('mass_value'),
                timeValue: document.getElementById('time_value')
            };
            
            controls.accretionDisk.addEventListener('change', (e) => {
                material.uniforms.u_accretion_disk.value = e.target.checked;
            });
            
            controls.gravitationalLensing.addEventListener('change', (e) => {
                material.uniforms.u_gravitational_lensing.value = e.target.checked;
            });
            
            controls.dopplerBeaming.addEventListener('change', (e) => {
                material.uniforms.u_doppler_beaming.value = e.target.checked;
            });
            
            controls.observerDistance.addEventListener('input', (e) => {
                cameraDistance = parseFloat(e.target.value);
                controls.distanceValue.textContent = cameraDistance.toFixed(1);
                updateCamera();
            });
            
            controls.blackHoleMass.addEventListener('input', (e) => {
                const mass = parseFloat(e.target.value);
                controls.massValue.textContent = mass.toFixed(1);
                material.uniforms.u_black_hole_mass.value = mass;
            });
            
            controls.timeScale.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                controls.timeValue.textContent = value.toFixed(1);
            });
            
            controls.quality.addEventListener('change', (e) => {
                material.uniforms.u_steps.value = parseInt(e.target.value);
            });
        }
        
        function setupMouseControls() {
            const canvas = renderer.domElement;
            
            canvas.addEventListener('mousedown', (e) => {
                isMouseDown = true;
                mouseX = e.clientX;
                mouseY = e.clientY;
                canvas.style.cursor = 'grabbing';
            });
            
            canvas.addEventListener('mouseup', () => {
                isMouseDown = false;
                canvas.style.cursor = 'grab';
            });
            
            canvas.addEventListener('mouseleave', () => {
                isMouseDown = false;
                canvas.style.cursor = 'grab';
            });
            
            canvas.addEventListener('mousemove', (e) => {
                if (isMouseDown) {
                    const deltaX = e.clientX - mouseX;
                    const deltaY = e.clientY - mouseY;
                    
                    cameraTheta -= deltaX * 0.008;
                    cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi - deltaY * 0.008));
                    
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    
                    updateCamera();
                }
            });
            
            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomSpeed = 0.1;
                cameraDistance = Math.max(3.0, Math.min(25.0, cameraDistance + e.deltaY * zoomSpeed * 0.01));
                
                document.getElementById('observer_distance').value = cameraDistance;
                document.getElementById('distance_value').textContent = cameraDistance.toFixed(1);
                updateCamera();
            });
            
            canvas.style.cursor = 'grab';
        }
        
        function updateCamera() {
            if (!material) return;
            
            const x = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
            const y = cameraDistance * Math.cos(cameraPhi);
            const z = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
            
            const cameraPos = new THREE.Vector3(x, y, z);
            
            const up = new THREE.Vector3(0, 1, 0);
            const forward = new THREE.Vector3(0, 0, 0).sub(cameraPos).normalize();
            const right = new THREE.Vector3().crossVectors(forward, up).normalize();
            const newUp = new THREE.Vector3().crossVectors(right, forward).normalize();
            
            const cameraMatrix = new THREE.Matrix3();
            cameraMatrix.set(
                right.x, newUp.x, forward.x,
                right.y, newUp.y, forward.y,
                right.z, newUp.z, forward.z
            );
            
            material.uniforms.u_camera_pos.value.copy(cameraPos);
            material.uniforms.u_camera_matrix.value.copy(cameraMatrix);
        }
        
        function onWindowResize() {
            if (!renderer || !material) return;
            
            renderer.setSize(window.innerWidth, window.innerHeight);
            material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        }
        
        function animate() {
            requestAnimationFrame(animate);
            
            // FPS calculation
            const currentTime = performance.now();
            frameCount++;
            fpsUpdateTime += currentTime - lastTime;
            lastTime = currentTime;
            
            // Update FPS display every 500ms
            if (fpsUpdateTime >= 500) {
                fps = Math.round((frameCount * 1000) / fpsUpdateTime);
                document.getElementById('fps-display').textContent = fps;
                frameCount = 0;
                fpsUpdateTime = 0;
            }
            
            try {
                if (material) {
                    const timeScale = parseFloat(document.getElementById('time_scale').value);
                    time += 0.016 * timeScale;
                    material.uniforms.u_time.value = time;
                }
                
                if (renderer && scene && camera) {
                    renderer.render(scene, camera);
                }
                
            } catch (error) {
                console.error('Render error:', error);
            }
        }
        
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('load', () => {
            init();
            animate();
        });
        
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            init();
            animate();
        }