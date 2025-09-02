// Starfield animation for welcome screen
function starfield() {
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    const stars = [];
    for (let i = 0; i < 180; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.5,
            speed: Math.random() * 0.15 + 0.05,
            alpha: Math.random() * 0.5 + 0.5
        });
    }
    function animateStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let s of stars) {
            ctx.save();
            ctx.globalAlpha = s.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#b3e0ff';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.restore();
            s.y += s.speed;
            if (s.y > canvas.height) {
                s.y = 0;
                s.x = Math.random() * canvas.width;
            }
        }
        requestAnimationFrame(animateStars);
    }
    animateStars();
}
window.addEventListener('DOMContentLoaded', starfield);

// Smooth fade-out for welcome overlay on Arrow Up
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp') {
        var overlay = document.getElementById('welcome-overlay');
        if (overlay && overlay.style.opacity !== '0') {
            overlay.style.opacity = '0';
            setTimeout(function() {
                overlay.style.display = 'none';
            }, 850);
        }
    }
});
        let scene, camera, renderer, material, mesh;
        let mouseX = 0, mouseY = 0;
        let isMouseDown = false;
        let cameraDistance = 12.0;
        let cameraTheta = 0;
        let cameraPhi = Math.PI * 0.5; // More centered view
        let time = 0;
        let backgroundTexture, starsTexture;
        
        // Camera movement variables for mobile
        let cameraOffsetX = 0;
        let cameraOffsetY = 3.0; // Start with upward offset for better centering
        let cameraOffsetZ = 0;
        let moveSpeed = 0.1;
        
        // Load default background and stars images
        function loadDefaultTextures() {
            // Load background.jpg
            const bgImg = new Image();
            bgImg.src = 'assets/background.jpg';
            bgImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = bgImg.width;
                canvas.height = bgImg.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(bgImg, 0, 0);
                backgroundTexture = new THREE.CanvasTexture(canvas);
                backgroundTexture.wrapS = THREE.RepeatWrapping;
                backgroundTexture.wrapT = THREE.RepeatWrapping;
                if (material) {
                    material.uniforms.u_background_texture.value = backgroundTexture;
                    material.uniforms.u_has_background.value = true;
                }
                console.log('Default background texture loaded');
            };

            // Load stars.jpg
            const starsImg = new Image();
            starsImg.src = 'assets/stars.jpg';
            starsImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = starsImg.width;
                canvas.height = starsImg.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(starsImg, 0, 0);
                starsTexture = new THREE.CanvasTexture(canvas);
                starsTexture.wrapS = THREE.RepeatWrapping;
                starsTexture.wrapT = THREE.RepeatWrapping;
                if (material) {
                    material.uniforms.u_stars_texture.value = starsTexture;
                    material.uniforms.u_has_stars.value = true;
                }
                console.log('Default stars texture loaded');
            };
        }
        
        // Vertex shader
        const vertexShader = `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `;
        
        // Enhanced fragment shader with external texture support
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
            uniform sampler2D u_background_texture;
            uniform sampler2D u_stars_texture;
            uniform bool u_has_background;
            uniform bool u_has_stars;
            uniform float u_disk_brightness;
            
            const float PI = 3.14159265359;
            const float TWO_PI = 6.28318530718;
            const float SCHWARZSCHILD_RADIUS = 2.0;
            const float ACCRETION_INNER = 2.8;
            const float ACCRETION_OUTER = 20.0;
            const int MAX_STEPS = 200;
            
            // Hash function for procedural generation (fallback)
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            // Noise function (fallback)
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
            }
            
            // Convert 3D direction to spherical coordinates
            vec2 dirToSphere(vec3 dir) {
                return vec2(
                    0.5 + atan(dir.z, dir.x) / TWO_PI,
                    0.5 - asin(clamp(dir.y, -1.0, 1.0)) / PI
                );
            }
            
            // Enhanced background sampling with external textures
            vec3 getBackground(vec2 uv) {
                vec3 color = vec3(0.0);
                
                // Use external background texture if available
                if(u_has_background) {
                    color += texture2D(u_background_texture, uv).rgb * 0.8;
                }
                
                // Add external stars texture if available with proper sampling
                if(u_has_stars) {
                    // Sample stars at original resolution
                    vec3 starsColor = texture2D(u_stars_texture, uv).rgb;
                    
                    // Convert to luminance and create proper star points
                    float starLuminance = dot(starsColor, vec3(0.299, 0.587, 0.114));
                    
                    // Threshold for star detection
                    if(starLuminance > 0.1) {
                        // Enhance star brightness and add color variation
                        vec3 starColor = vec3(1.0);
                        
                        // Add star color variation based on original texture
                        if(starsColor.r > starsColor.g && starsColor.r > starsColor.b) {
                            starColor = vec3(1.2, 0.8, 0.6); // Reddish stars
                        } else if(starsColor.b > starsColor.r && starsColor.b > starsColor.g) {
                            starColor = vec3(0.8, 0.9, 1.4); // Bluish stars
                        } else {
                            starColor = vec3(1.1, 1.1, 0.9); // White/yellow stars
                        }
                        
                        // Scale star intensity
                        float starIntensity = pow(starLuminance, 0.5) * 3.0;
                        color += starColor * starIntensity;
                    }
                    
                    // Add some additional stars at different scales for depth
                    vec3 smallStars = texture2D(u_stars_texture, uv * 1.5).rgb;
                    float smallStarLum = dot(smallStars, vec3(0.299, 0.587, 0.114));
                    if(smallStarLum > 0.15) {
                        color += vec3(smallStarLum * 1.5);
                    }
                }
                
                // Fallback procedural starfield if no textures
                if(!u_has_background && !u_has_stars) {
                    // Large bright stars
                    for(int i = 0; i < 100; i++) {
                        float fi = float(i);
                        vec2 starPos = vec2(
                            hash(vec2(fi * 12.34, fi * 56.78)),
                            hash(vec2(fi * 91.23, fi * 45.67))
                        );
                        
                        float dist = distance(uv, starPos);
                        float brightness = hash(vec2(fi * 13.37, fi * 73.19));
                        
                        if(dist < 0.004 && brightness > 0.7) {
                            float intensity = (0.004 - dist) / 0.004;
                            intensity = pow(intensity, 0.5);
                            
                            vec3 starColor = vec3(1.0);
                            if(brightness > 0.95) starColor = vec3(0.6, 0.8, 1.2);
                            else if(brightness > 0.85) starColor = vec3(1.2, 1.1, 0.8);
                            else starColor = vec3(1.2, 0.8, 0.4);
                            
                            color += starColor * intensity * 2.0;
                        }
                    }
                    
                    // Milky Way galaxy band
                    float galaxyBand = abs(uv.y - 0.5);
                    if(galaxyBand < 0.15) {
                        float intensity = (0.15 - galaxyBand) / 0.15;
                        intensity = pow(intensity, 1.5);
                        
                        float galaxyNoise = noise(uv * 50.0);
                        intensity *= 0.3 + 0.7 * galaxyNoise;
                        
                        vec3 galaxyColor = mix(
                            vec3(0.1, 0.05, 0.2),
                            vec3(0.3, 0.2, 0.1),
                            noise(uv * 20.0)
                        );
                        
                        color += galaxyColor * intensity;
                    }
                }
                
                return color;
            }
            
            // Enhanced accretion disk with better visual effects and photon ring
            vec3 getAccretionDisk(vec3 pos, vec3 velocity) {
                float r = length(pos.xz);
                if(r < ACCRETION_INNER * u_black_hole_mass || r > ACCRETION_OUTER * u_black_hole_mass) 
                    return vec3(0.0);
                
                // Disk thickness with smooth falloff
                float diskHeight = 0.3 * u_black_hole_mass;
                float heightFalloff = exp(-abs(pos.y) / (diskHeight * 0.5));
                if(heightFalloff < 0.01) return vec3(0.0);
                
                float angle = atan(pos.z, pos.x);
                
                // Orbital velocity for Keplerian disk
                float orbitalVel = sqrt(u_black_hole_mass / r);
                float rotationAngle = angle + orbitalVel * u_time * 0.5;
                
                // Multiple spiral arms with different frequencies
                float spiral1 = sin(rotationAngle * 2.0 - r * 0.5);
                float spiral2 = sin(rotationAngle * 3.0 - r * 0.8);
                float spiral3 = sin(rotationAngle * 5.0 - r * 1.2);
                
                float spiralPattern = (spiral1 + spiral2 * 0.7 + spiral3 * 0.5) / 2.2;
                float spiralIntensity = 0.6 + 0.4 * spiralPattern;
                
                // Temperature gradient with realistic physics
                float temperature = 12000.0 * sqrt(u_black_hole_mass) / sqrt(r);
                temperature = clamp(temperature, 2000.0, 20000.0);
                
                // Enhanced blackbody color with better temperature mapping
                vec3 color = vec3(1.0);
                if(temperature > 15000.0) {
                    color = vec3(0.6, 0.7, 1.8); // Blue-white (very hot)
                } else if(temperature > 10000.0) {
                    color = vec3(0.8, 0.9, 1.5); // White-blue
                } else if(temperature > 7000.0) {
                    color = vec3(1.0, 1.0, 1.2); // White
                } else if(temperature > 5000.0) {
                    color = vec3(1.3, 1.0, 0.7); // Yellow-white
                } else if(temperature > 3500.0) {
                    color = vec3(1.6, 0.9, 0.4); // Orange
                } else {
                    color = vec3(1.5, 0.5, 0.2); // Red
                }
                
                // Base intensity with realistic falloff
                float baseIntensity = u_disk_brightness / (r * r * 0.5);
                baseIntensity *= smoothstep(ACCRETION_OUTER * u_black_hole_mass, ACCRETION_INNER * u_black_hole_mass, r);
                baseIntensity *= spiralIntensity;
                baseIntensity *= heightFalloff;
                
                // Enhanced Doppler beaming effect
                if(u_doppler_beaming) {
                    vec3 diskVel = normalize(vec3(-pos.z, 0.0, pos.x)) * orbitalVel;
                    vec3 viewDir = normalize(u_camera_pos - pos);
                    float dopplerFactor = 1.0 + dot(diskVel, viewDir) * 0.15;
                    baseIntensity *= pow(dopplerFactor, 3.0);
                    
                    // Color shift due to Doppler effect
                    if(dopplerFactor > 1.0) {
                        color = mix(color, color * vec3(0.8, 0.9, 1.3), (dopplerFactor - 1.0) * 2.0);
                    } else {
                        color = mix(color, color * vec3(1.3, 0.9, 0.7), (1.0 - dopplerFactor) * 2.0);
                    }
                }
                
                // Add turbulence and flickering
                float turbulence1 = noise(vec2(angle * 8.0 + u_time * 0.3, r * 1.5));
                float turbulence2 = noise(vec2(angle * 15.0 + u_time * 0.7, r * 3.0));
                float combinedTurbulence = turbulence1 * 0.7 + turbulence2 * 0.3;
                baseIntensity *= 0.7 + 0.6 * combinedTurbulence;
                
                // Add inner rim glow effect
                float innerGlow = exp(-(r - ACCRETION_INNER * u_black_hole_mass) * 2.0);
                if(r < ACCRETION_INNER * u_black_hole_mass * 1.5) {
                    baseIntensity += innerGlow * 0.5;
                    color = mix(color, vec3(0.5, 0.8, 1.5), innerGlow * 0.3);
                }
                
                return color * baseIntensity;
            }
            
            // Schwarzschild metric ray bending
            vec3 schwarzschildDeflection(vec3 pos, vec3 dir, float mass) {
                float r = length(pos);
                if(r < SCHWARZSCHILD_RADIUS * mass * 0.8) return dir;
                
                vec3 toCenter = -pos / r;
                float rs = SCHWARZSCHILD_RADIUS * mass;
                
                // Enhanced geodesic deflection
                float deflectionStrength = rs / (r * r - rs * r);
                vec3 perpComponent = dir - dot(dir, toCenter) * toCenter;
                
                return normalize(dir + toCenter * deflectionStrength * 0.12 + perpComponent * deflectionStrength * 0.08);
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
                    
                    // Check event horizon with photon sphere
                    if(r < schwarzschildRadius * 1.2) {
                        hitEventHorizon = true;
                        break;
                    }
                    
                    // Enhanced gravitational lensing
                    if(u_gravitational_lensing && r < 50.0) {
                        rayDir = schwarzschildDeflection(rayPos, rayDir, u_black_hole_mass);
                    }
                    
                    // Check accretion disk intersection
                    if(u_accretion_disk) {
                        vec3 nextPos = rayPos + rayDir * stepSize;
                        
                        // Improved disk intersection
                        if(rayPos.y * nextPos.y <= 0.0 && abs(rayPos.y) < 2.0) {
                            float t = -rayPos.y / rayDir.y;
                            if(t > 0.0 && t <= stepSize) {
                                vec3 intersectPos = rayPos + rayDir * t;
                                vec3 diskColor = getAccretionDisk(intersectPos, rayDir);
                                
                                if(length(diskColor) > 0.01) {
                                    // Enhanced bloom and scattering
                                    float bloom = 1.0 + 1.0 / (length(intersectPos.xz) + 0.5);
                                    float scattering = exp(-length(intersectPos.xz) * 0.1);
                                    color += diskColor * bloom * (1.0 + scattering * 0.3);
                                }
                            }
                        }
                    }
                    
                    // Adaptive step size based on gravitational field strength
                    float fieldStrength = schwarzschildRadius / (r * r);
                    stepSize = 0.05 + r * 0.02 - fieldStrength * 0.3;
                    stepSize = clamp(stepSize, 0.02, 0.8);
                    
                    rayPos += rayDir * stepSize;
                    
                    // Escape condition
                    if(r > 150.0) break;
                }
                
                // Render background if ray escaped
                if(!hitEventHorizon) {
                    vec2 skyUV = dirToSphere(normalize(rayPos));
                    vec3 background = getBackground(skyUV);
                    
                    // Apply gravitational redshift/blueshift
                    if(u_doppler_beaming && length(u_camera_pos) < 80.0) {
                        float gravitationalShift = 1.0 - 0.05 / length(u_camera_pos);
                        background *= vec3(gravitationalShift, 1.0, 1.0/gravitationalShift);
                    }
                    
                    color += background;
                }
                
                // Enhanced post-processing
                // HDR tone mapping (Reinhard)
                color = color / (1.0 + color * 0.8);
                
                // Contrast enhancement
                color = pow(color, vec3(0.85));
                
                // Subtle color grading
                color.r *= 1.05;
                color.b *= 1.02;
                
                // Vignette effect with smooth falloff
                float vignette = 1.0 - 0.2 * pow(length(coord), 1.5);
                color *= vignette;
                
                // Film grain effect
                float grain = (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.02;
                color += vec3(grain);
                
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
                
                // Material with enhanced uniforms including textures
                const uniforms = {
                    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                    u_time: { value: 0.0 },
                    u_camera_pos: { value: new THREE.Vector3(0, 8, 12) }, // Better initial position for centering
                    u_camera_matrix: { value: new THREE.Matrix3() },
                    u_accretion_disk: { value: true },
                    u_gravitational_lensing: { value: true },
                    u_doppler_beaming: { value: true },
                    u_black_hole_mass: { value: 1.0 },
                    u_steps: { value: 160 }, // Default to Ultra quality
                    u_background_texture: { value: backgroundTexture },
                    u_stars_texture: { value: starsTexture },
                    u_has_background: { value: backgroundTexture !== undefined },
                    u_has_stars: { value: starsTexture !== undefined },
                    u_disk_brightness: { value: 5.0 }
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
                setupTouchControls(); // Add touch gesture support
                setupMobileControls(); // Add mobile setup
                loadDefaultTextures();
                updateCamera();
                
                console.log('Enhanced Black Hole Simulation with External Images Loaded');
                
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
                diskBrightness: document.getElementById('disk_brightness'),
                distanceValue: document.getElementById('distance_value'),
                massValue: document.getElementById('mass_value'),
                timeValue: document.getElementById('time_value'),
                diskBrightnessValue: document.getElementById('disk_brightness_value')
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
            
            controls.diskBrightness.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                controls.diskBrightnessValue.textContent = value.toFixed(1);
                material.uniforms.u_disk_brightness.value = value;
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
        
        // Enhanced touch controls with pinch-to-zoom
        function setupTouchControls() {
            const canvas = renderer.domElement;
            let touches = {};
            let initialDistance = 0;
            let initialCameraDistance = cameraDistance;
            
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                
                // Handle single touch (drag to orbit)
                if (e.touches.length === 1) {
                    const touch = e.touches[0];
                    touches.single = {
                        id: touch.identifier,
                        startX: touch.clientX,
                        startY: touch.clientY,
                        lastX: touch.clientX,
                        lastY: touch.clientY
                    };
                }
                
                // Handle pinch gesture (zoom)
                if (e.touches.length === 2) {
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    
                    initialDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                    );
                    initialCameraDistance = cameraDistance;
                    
                    touches.pinch = {
                        touch1: { x: touch1.clientX, y: touch1.clientY },
                        touch2: { x: touch2.clientX, y: touch2.clientY },
                        distance: initialDistance
                    };
                    
                    // Clear single touch when pinching starts
                    touches.single = null;
                }
            });
            
            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                
                // Handle single touch drag
                if (e.touches.length === 1 && touches.single) {
                    const touch = e.touches[0];
                    const deltaX = touch.clientX - touches.single.lastX;
                    const deltaY = touch.clientY - touches.single.lastY;
                    
                    cameraTheta -= deltaX * 0.008;
                    cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi - deltaY * 0.008));
                    
                    touches.single.lastX = touch.clientX;
                    touches.single.lastY = touch.clientY;
                    
                    updateCamera();
                }
                
                // Handle pinch zoom
                if (e.touches.length === 2 && touches.pinch) {
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    
                    const currentDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                    );
                    
                    const scale = currentDistance / initialDistance;
                    const newDistance = initialCameraDistance / scale;
                    
                    cameraDistance = Math.max(3.0, Math.min(25.0, newDistance));
                    
                    document.getElementById('observer_distance').value = cameraDistance;
                    document.getElementById('distance_value').textContent = cameraDistance.toFixed(1);
                    updateCamera();
                }
            });
            
            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                
                // Clear ended touches
                if (e.touches.length === 0) {
                    touches = {};
                } else if (e.touches.length === 1) {
                    // Switch from pinch to single touch if one finger lifted
                    touches.pinch = null;
                    const touch = e.touches[0];
                    touches.single = {
                        id: touch.identifier,
                        startX: touch.clientX,
                        startY: touch.clientY,
                        lastX: touch.clientX,
                        lastY: touch.clientY
                    };
                }
            });
            
            // Prevent context menu on long press
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
        
        function updateCamera() {
            if (!material) return;
            
            // Calculate base orbital position
            const x = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
            const y = cameraDistance * Math.cos(cameraPhi);
            const z = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
            
            // Apply world-space offsets for mobile movement
            const cameraPos = new THREE.Vector3(
                x + cameraOffsetX, 
                y + cameraOffsetY, 
                z + cameraOffsetZ
            );
            
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
        
        // FPS counter variables
        let lastFpsUpdate = performance.now();
        let frameCount = 0;
        let fps = 0;

        function animate() {
            requestAnimationFrame(animate);
            frameCount++;
            const now = performance.now();
            if (now - lastFpsUpdate > 500) {
                fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
                frameCount = 0;
                lastFpsUpdate = now;
                const fpsElem = document.getElementById('fps-counter');
                if (fpsElem) fpsElem.textContent = `FPS: ${fps}`;
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
        
        // Initialize immediately
        function updateSystemInfo() {
            // Browser
            const browserElem = document.getElementById('sys-browser');
            if (browserElem) {
                browserElem.textContent = `Browser: ${navigator.userAgent}`;
            }
            // Platform
            const platformElem = document.getElementById('sys-platform');
            if (platformElem) {
                platformElem.textContent = `Platform: ${navigator.platform}`;
            }
            // Resolution
            const resElem = document.getElementById('sys-resolution');
            if (resElem) {
                resElem.textContent = `Resolution: ${window.innerWidth} x ${window.innerHeight}`;
            }
            // GPU (WebGL Renderer)
            const gpuElem = document.getElementById('sys-gpu');
            if (gpuElem) {
                let gpu = '--';
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                            gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                        } else {
                            gpu = gl.getParameter(gl.RENDERER);
                        }
                    }
                } catch (e) {}
                gpuElem.textContent = `GPU: ${gpu}`;
            }
        }

        window.addEventListener('load', () => {
            updateSystemInfo();
            init();
            animate();
        });
        
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            init();
            animate();
        }

// Detect mobile device
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768) || 
           ('ontouchstart' in window);
}

// Enhanced mobile detection for better UX
function getTouchCapability() {
    return {
        hasTouch: 'ontouchstart' in window,
        isMobile: isMobile(),
        isTablet: window.innerWidth > 768 && window.innerWidth <= 1024 && 'ontouchstart' in window,
        screenSize: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    };
}

// Optimize quality for mobile devices
function optimizeForMobile() {
    if (isMobile()) {
        const qualitySelect = document.getElementById('quality');
        if (qualitySelect) {
            // Set to Medium quality for better performance on mobile
            qualitySelect.value = '80';
            console.log('Optimized quality for mobile device');
        }
        
        // Reduce some visual effects for performance
        const timeScale = document.getElementById('time_scale');
        if (timeScale && parseFloat(timeScale.value) > 2.0) {
            timeScale.value = '2.0';
            document.getElementById('time_value').textContent = '2.0';
        }
    }
}

// Set prompt text based on device
window.addEventListener('DOMContentLoaded', function() {
    var prompt = document.getElementById('continue-prompt');
    if (prompt) {
        if (isMobile()) {
            prompt.innerHTML = 'Tap anywhere to continue';
        } else {
            prompt.innerHTML = 'Press <span style="background:#222;padding:0.2em 0.5em;border-radius:4px;color:#fff;box-shadow:0 0 8px #fff;">↑</span> Arrow Up to continue';
        }
    }
    
    // Optimize for mobile on load
    optimizeForMobile();
});

// Add tap-to-continue for mobile
window.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('welcome-overlay');
    if (overlay) {
        overlay.addEventListener('touchstart', function() {
            if (isMobile()) {
                this.style.opacity = 0;
                setTimeout(() => this.style.display = 'none', 800);
            }
        });
    }
});
function handleCustomImage(inputId, callback) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                callback(new THREE.CanvasTexture(canvas));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Call these after material is created in init()
function setupCustomImageInputs() {
    handleCustomImage('custom_bg', function(tex) {
        backgroundTexture = tex;
        if (material) {
            material.uniforms.u_background_texture.value = backgroundTexture;
            material.uniforms.u_has_background.value = true;
        }
    });
    handleCustomImage('custom_stars', function(tex) {
        starsTexture = tex;
        if (material) {
            material.uniforms.u_stars_texture.value = starsTexture;
            material.uniforms.u_has_stars.value = true;
        }
    });
}

// In your init() function, after material is created:
setupCustomImageInputs();

document.getElementById('controls-toggle').onclick = function() {
    const panel = document.getElementById('controls-content');
    panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
    this.textContent = panel.style.display === 'block' ? '⚙️ Hide Controls' : '⚙️ Controls';
};

// Mobile functionality
function setupMobileControls() {
    updateHintText();
    
    // Fix controls toggle for mobile
    const controlsToggle = document.getElementById('controls-toggle');
    const controlsContent = document.getElementById('controls-content');
    
    if (controlsToggle && controlsContent) {
        // Remove any existing onclick
        controlsToggle.onclick = null;
        
        // Add proper touch/click handling
        function toggleControls(e) {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = controlsContent.style.display === 'none' || controlsContent.style.display === '';
            controlsContent.style.display = isHidden ? 'block' : 'none';
            controlsToggle.textContent = isHidden ? '⚙️ Hide Controls' : '⚙️ Controls';
        }
        
        controlsToggle.addEventListener('click', toggleControls);
        controlsToggle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        controlsToggle.addEventListener('touchend', toggleControls);
    }
    
    // Add reset camera button functionality
    const resetButton = document.getElementById('reset-camera');
    if (resetButton) {
        resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cameraOffsetX = 0;
            cameraOffsetY = 3.0;
            cameraOffsetZ = 0;
            cameraDistance = 12.0;
            cameraTheta = 0;
            cameraPhi = Math.PI * 0.5;
            
            // Update UI
            document.getElementById('observer_distance').value = cameraDistance;
            document.getElementById('distance_value').textContent = cameraDistance.toFixed(1);
            
            updateCamera();
        });
    }
    
    // Ensure file inputs work on mobile
    const customBgInput = document.getElementById('custom_bg');
    const customStarsInput = document.getElementById('custom_stars');
    
    [customBgInput, customStarsInput].forEach(input => {
        if (input) {
            input.style.pointerEvents = 'auto';
            input.style.touchAction = 'manipulation';
            input.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            });
        }
    });
    
    // Fix quality dropdown for mobile
    const qualitySelect = document.getElementById('quality');
    if (qualitySelect) {
        qualitySelect.style.pointerEvents = 'auto';
        qualitySelect.style.touchAction = 'manipulation';
        qualitySelect.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        });
    }
}

function updateHintText() {
    const desktopHint = document.querySelector('.desktop-hint');
    const mobileHint = document.querySelector('.mobile-hint');
    const joystick = document.getElementById('mobile-joystick');
    
    if (isMobile()) {
        if (desktopHint) desktopHint.style.display = 'none';
        if (mobileHint) mobileHint.style.display = 'inline';
        if (joystick) joystick.style.display = 'block';
        setupMobileJoystick();
    } else {
        if (desktopHint) desktopHint.style.display = 'inline';
        if (mobileHint) mobileHint.style.display = 'none';
        if (joystick) joystick.style.display = 'none';
    }
}

// Mobile joystick setup
function setupMobileJoystick() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    
    if (!joystickBase || !joystickKnob) return;
    
    let isDragging = false;
    let centerX = 50, centerY = 50; // Center of joystick base
    
    function handleStart(e) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
    }
    
    function handleMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.touches ? e.touches[0] : e;
        const rect = joystickBase.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Calculate distance from center
        const deltaX = x - centerX;
        const deltaY = y - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limit to joystick base radius
        const maxDistance = 30;
        let finalX = deltaX;
        let finalY = deltaY;
        
        if (distance > maxDistance) {
            finalX = (deltaX / distance) * maxDistance;
            finalY = (deltaY / distance) * maxDistance;
        }
        
        // Update knob position
        joystickKnob.style.left = (centerX + finalX - 20) + 'px';
        joystickKnob.style.top = (centerY + finalY - 20) + 'px';
        
        // Update camera movement
        const moveX = finalX / maxDistance;
        const moveY = finalY / maxDistance;
        
        const moveSpeed = 0.1;
        cameraOffsetX += moveX * moveSpeed;
        cameraOffsetY -= moveY * moveSpeed; // Invert Y for natural movement
        
        updateCamera();
    }
    
    function handleEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = false;
        
        // Reset knob to center with smooth animation
        joystickKnob.style.transition = 'all 0.2s ease';
        joystickKnob.style.left = '30px';
        joystickKnob.style.top = '30px';
        
        setTimeout(() => {
            joystickKnob.style.transition = 'none';
        }, 200);
    }
    
    // Touch events
    joystickBase.addEventListener('touchstart', handleStart);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
    
    // Mouse events for testing
    joystickBase.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
}

// Setup mobile controls on load
window.addEventListener('DOMContentLoaded', function() {
    updateHintText();
    
    // Add reset camera button functionality
    const resetButton = document.getElementById('reset-camera');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            cameraOffsetX = 0;
            cameraOffsetY = 3.0; // Better centered default
            cameraOffsetZ = 0;
            cameraDistance = 12.0;
            cameraTheta = 0;
            cameraPhi = Math.PI * 0.5;
            
            // Update UI
            document.getElementById('observer_distance').value = cameraDistance;
            document.getElementById('distance_value').textContent = cameraDistance.toFixed(1);
            
            updateCamera();
        });
    }
});