# Black-Hole-Simulation
-- by Ross and Kenshi
A real-time interactive black hole simulation built with Three.js and WebGL shaders, featuring accurate gravitational physics, ray tracing, and stunning cosmic visuals.

## Features

### 🌌 **Realistic Physics**
- **Gravitational Lensing**: Light rays bend around the black hole's massive gravitational field
- **Schwarzschild Metric**: Accurate spacetime curvature calculations
- **Doppler Beaming**: Relativistic effects on light from rotating accretion disk
- **Event Horizon**: Proper black hole boundary rendering

### ✨ **Visual Effects**
- **Accretion Disk**: Realistic hot plasma disk with temperature-based coloring
- **Rich Cosmic Background**: Procedurally generated stars, galaxies, nebulae, and cosmic dust
- **Ray Marching**: Real-time ray tracing through curved spacetime
- **Dynamic Lighting**: Temperature-based blackbody radiation simulation

### 🎮 **Interactive Controls**
- **Mouse Controls**: Drag to orbit, scroll to zoom
- **Real-time Parameters**: Adjust black hole mass, observer distance, and time scale
- **Quality Settings**: Adjustable ray marching steps for performance optimization
- **Toggle Features**: Enable/disable individual physics effects

## Physics & Inspiration

This simulation is heavily inspired by the excellent physics explanations from **ScienceClic English**:

**Primary Reference Video**: [Simulating Black Holes in C++ by kavan](https://youtu.be/8-B6ryuBkCM?si=lU-xfqlKhvhvAgpU)

### Physics Concepts Implemented

#### **Gravitational Lensing**
- Light follows geodesics in curved spacetime
- Massive objects bend light paths according to Einstein's General Relativity
- Implementation uses simplified Schwarzschild metric calculations

#### **Schwarzschild Black Hole**
- Event horizon at radius: `Rs = 2GM/c²`
- Spacetime curvature affects light ray trajectories
- Proper handling of the photon sphere and unstable orbits

#### **Accretion Disk Physics**
- **Keplerian Orbital Motion**: Inner disk rotates faster than outer regions
- **Temperature Gradient**: Inner regions reach higher temperatures due to friction
- **Blackbody Radiation**: Color temperature corresponds to plasma temperature
- **Spiral Structure**: Magnetic field effects and turbulence patterns

#### **Relativistic Effects**
- **Doppler Beaming**: Light from approaching disk appears brighter/bluer
- **Gravitational Redshift**: Light loses energy climbing out of gravitational well
- **Time Dilation**: Effects of strong gravitational fields on light propagation

### Additional Physics Resources

For deeper understanding of the physics behind this simulation:

1. **General Relativity & Black Holes**:
   - [ScienceClic English - Black Hole Playlist](https://www.youtube.com/c/ScienceClicEN)
   - Einstein's General Theory of Relativity
   - Schwarzschild Solution to Einstein Field Equations

2. **Accretion Disk Physics**:
   - Shakura-Sunyaev Accretion Disk Model
   - Magnetohydrodynamics (MHD) in Astrophysics
   - Relativistic Astrophysics

3. **Computational Aspects**:
   - Ray Tracing in Curved Spacetime
   - Numerical Integration of Geodesics
   - GPU Shader Programming for Physics Simulation

## Installation & Usage

### Prerequisites
- Modern web browser with WebGL support
- No additional installations required

### Running the Simulation

1. **Clone or Download** the project files:
   ```bash
   git clone [repository-url]
   cd black-hole-simulation
   ```

2. **Serve the files** using any local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Or simply open index.html in a modern browser
   ```

3. **Open in browser**: Navigate to `http://localhost:8000`

### Controls

| Control | Action |
|---------|---------|
| **Mouse Drag** | Orbit around the black hole |
| **Mouse Wheel** | Zoom in/out |
| **Accretion Disk** | Toggle plasma disk visibility |
| **Gravitational Lensing** | Enable/disable light bending |
| **Doppler Effect** | Toggle relativistic color shifts |
| **Observer Distance** | Change viewing distance (3-25 units) |
| **Black Hole Mass** | Adjust gravitational strength (0.5-3.0) |
| **Time Scale** | Control disk rotation speed |
| **Quality** | Ray marching steps (Fast/Medium/High/Ultra) |

## File Structure

```
black-hole-simulation/
├── index.html          # Main HTML page
├── app.js              # Three.js application and physics
├── styles.css          # UI styling
└── README.md           # This file
```

## Technical Implementation

### **WebGL Shaders**
- **Fragment Shader**: Implements ray marching through curved spacetime
- **Physics Calculations**: Real-time gravitational deflection
- **Procedural Generation**: Cosmic background with multiple layers

### **Performance Optimization**
- **Adaptive Step Size**: Larger steps far from black hole
- **Quality Settings**: Adjustable ray marching iterations
- **Efficient Rendering**: Optimized shader code for 60fps

### **Key Algorithms**
1. **Schwarzschild Deflection**: Simplified geodesic integration
2. **Accretion Disk Intersection**: Ray-plane intersection with physics
3. **Cosmic Background**: Multi-layer procedural generation
4. **Camera System**: Spherical coordinate orbital mechanics

## Browser Compatibility

- ✅ **Chrome 80+**
- ✅ **Firefox 75+**
- ✅ **Safari 14+**
- ✅ **Edge 80+**

**Requirements**: WebGL 1.0 support, Hardware acceleration recommended

## Contributing

Contributions are welcome! Areas for improvement:

- More accurate relativistic effects
- Additional cosmic phenomena
- Performance optimizations
- Mobile device support
- Educational overlays

## Credits

**Physics Inspiration**: [kavan]([https://youtu.be/8-B6ryuBkCM?si=lU-xfqlKhvhvAgpU](https://www.youtube.com/@kevkev-70))

**Technical Stack**:
- [Three.js](https://threejs.org/) - 3D Graphics Library
- WebGL - GPU-accelerated rendering
- GLSL - Shader programming

## License

This project is open source. Feel free to use, modify, and distribute.

---

*Experience the wonder of black holes and the warping of spacetime in real-time. Drag to explore, and watch as light itself bends around one of the universe's most extreme objects.*
