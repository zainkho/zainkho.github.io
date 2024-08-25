import * as THREE from 'three';

// ESSENTIALS
// Set up the scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 320 / 320, 0.1, 1000);

// Create the renderer with alpha transparency
const renderer = new THREE.WebGLRenderer({ alpha: true });
const container = document.getElementById('avi');

// Append the renderer's canvas to the container
container.appendChild(renderer.domElement);

// Function to resize the renderer based on the container size
function resizeCanvasToContainer() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// Call the resize function initially and on window resize
resizeCanvasToContainer();
window.addEventListener('resize', resizeCanvasToContainer);

// Ensure initial size calculation
document.addEventListener('DOMContentLoaded', resizeCanvasToContainer);





// GEOMETRIES
// Create a plane geometry for the photo with a Polaroid aspect ratio
const geometry = new THREE.PlaneGeometry(1, 1.15);
// Create a plane for the shadow
const shadowGeometry = new THREE.PlaneGeometry(1.1, 1.265); // Slightly larger than the Polaroid





// TEXTURES
// Load the texture (your image file)
const texture = new THREE.TextureLoader().load('/images/zk-avi.jpg', function (texture) {
    // Set the filtering method for better quality
    texture.magFilter = THREE.LinearFilter; // Linear filtering for zoomed-in areas
    texture.minFilter = THREE.LinearFilter; // Linear filtering for minification (zoomed out)
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Enable anisotropic filtering for better detail
    texture.generateMipmaps = false; // Disable mipmaps for full-resolution textures
});
texture.flipY = false; // Disable vertical flip



// MATERIALS
// Create a shader material to display the image with borders
const material = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: texture },
    },
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
    uniform sampler2D uTexture;
    varying vec2 vUv;

    void main() {
        // Flip the UV coordinates vertically to correct the image orientation
        vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);

        // Define borders
        float border = 0.05; // Width of the side borders
        float bottomBorder = 0.2; // Height of the bottom border
        float topBorder = border; // Assume the top border is equal to the side borders

        // Calculate the area where the image should be displayed
        float imageLeft = border;
        float imageRight = 1.0 - border;
        float imageBottom = bottomBorder;
        float imageTop = 1.0 - topBorder;

        // Calculate the amount to move the image upward
        float verticalShift = (topBorder - bottomBorder) / (imageTop - imageBottom);

        // Check if the current fragment is within the image area
        if (vUv.x >= imageLeft && vUv.x <= imageRight && vUv.y >= imageBottom && vUv.y <= imageTop) {
            // Adjusted UV mapping for the image to fit within the borders
            vec2 adjustedUv = vec2(
                (flippedUv.x - imageLeft) / (imageRight - imageLeft),
                (flippedUv.y - imageBottom) / (imageTop - imageBottom) - verticalShift
            );

            // Sample the texture using the adjusted UV coordinates
            vec4 texture = texture2D(uTexture, adjustedUv);

            // Calculate the distance to the closest edge
            float edgeDist = min(min(vUv.x - imageLeft, imageRight - vUv.x), min(vUv.y - imageBottom, imageTop - vUv.y));
            float shadowStrength = 1.0 - smoothstep(0.0, 0.016, edgeDist); // Invert the gradient direction

            // Apply the shadow effect with the gradient reversed
            vec4 shadowColor = vec4(0.0, 0.0, 0.0, shadowStrength * 0.55); // Darker near the edges
            gl_FragColor = mix(texture, shadowColor, shadowStrength);
        } else {
            gl_FragColor = vec4(vec3(1.0), 1.0); // White border
        }
    }
`,
});
const shadowMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uColor: { value: new THREE.Color(0x000000) }, // Shadow color (black)
        uOpacity: { value: 0.25 }, // Shadow opacity (25%)
        uOffset: { value: new THREE.Vector2(0.0, 0.0) }, // Offset in y to move the shadow down
        uBlur: { value: 0.3 }, // Blur amount (controls spread)
    },
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform vec2 uOffset;
        uniform float uBlur;
        varying vec2 vUv;

        void main() {
            // Adjust the UVs for the offset
            vec2 offsetUv = vUv + uOffset;

            // Calculate linear distance from the edges
            float dist = min(min(offsetUv.x, 1.0 - offsetUv.x), min(offsetUv.y, 1.0 - offsetUv.y));

            // Calculate the distance from the center, simulating a radial gradient
            float shadow = smoothstep(-uBlur * 0.1, uBlur, dist);


            // Apply shadow color with opacity
            gl_FragColor = vec4(uColor, uOpacity * shadow);

        }
    `,
    transparent: true,
});







// MESHES
const polaroid = new THREE.Mesh(geometry, material);
const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);




// COMPOSITION
// Position the shadow slightly behind the Polaroid
shadowMesh.position.set(0, -0.05, -0.01); // Move it slightly back in the z-axis

// Group polaroid + shadow
const sceneGroup = new THREE.Group()
sceneGroup.add(shadowMesh);
sceneGroup.add(polaroid);
scene.add(sceneGroup)


// Position the group
sceneGroup.position.set(0, 0.1, 0);


// Position the camera
camera.position.z = 0.9;

// Render the scene
function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
render();
