"use server";

import { GoogleGenAI } from "@google/genai";

/**
 * Helper function to strip non-English Unicode characters
 * @param text Text to clean
 * @returns Text with only ASCII characters
 */
function stripNonEnglishChars(text: string): string {
  // This regex keeps only ASCII characters (0-127)
  return text.replace(/[^\x00-\x7F]/g, "");
}

/**
 * Server action to generate a 3D scene from an image using Gemini 2.5 Pro
 * @param imageData Base64 encoded image data
 * @returns HTML content for 3D scene or error
 */
export async function generateThreeJsScene(
  imageData: string,
  mimeType: string
): Promise<{ htmlContent?: string; error?: string }> {
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }
    console.log("Generating 3D scene with Gemini 2.5 Pro with key", apiKey);

    const ai = new GoogleGenAI({ apiKey });

    // Create the prompt - keeping user's modifications
    const prompt = `
Given an image of an indoor scene, generate a realistic and spatially accurate Three.js scene that exactly replicates the image. generate ONLY the Three.js code (JavaScript) needed to create a visually accurate 3D model of the scene.

I will handle the HTML, importing the Three.js library, navigation controls (WASD movement, mouse look), and all other boilerplate code.

Your code will be inserted into a framework with the following structure:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>3D Interior Scene</title>
  <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.161.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.161.0/examples/jsm/"
            }
        }
    </script>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; }
    #instructions { position: absolute; ... } /* CSS for instructions */
  </style>
</head>
<body>
  <div id="instructions">Use WASD to move and mouse to look around</div>
  <script type="module">
    // THREE.JS SETUP (already provided by me)
    import * as THREE from 'three';
    import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // CONTROLS SETUP (already provided by me)
    const controls = new PointerLockControls(camera, document.body);
    // All WASD movement code will be handled

    // YOUR SCENE CREATION CODE WILL BE INSERTED HERE
    // --------------------

    // Your generated code goes here

    // --------------------
    // ANIMATION LOOP (already provided by me)
    function animate() {
      requestAnimationFrame(animate);
      // Handle movement
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>
\`\`\`

Follow these requirements:

📐 Scene Construction:
Recreate all visible objects, furniture, walls, floors, ceilings, and windows.
Ensure each element has the correct position, size, scale, and orientation relative to other elements.
Accurately represent structural elements like windows, walls, doors, and frames. Make windows transparent with visible borders.

🎨 Visual Detail:
Provide enough geometric and material detail to clearly differentiate all items.
Use basic but effective materials (e.g., matte, glossy, transparent) to reflect the real-world surfaces.
Use distinct colors, textures, or placeholder materials to visually separate similar items.

💡 Lighting:
Match the lighting conditions (color, brightness, etc) of the image using directional or ambient light (e.g., sunlight through windows).
Include realistic shadows for depth and clarity.

⚙️ Technical Constraints:
The output must be a \`\`\`js\`\`\` block of code.
Do not rely on external file dependencies (e.g., external textures or models). Inline everything or use placeholders.
Ensure the scene renders and is fully navigable in a modern browser without extra setup.

🧠 Thinking Process:
First, in your thinking process, note down the relative positions of all the objects in the image, especially in relation to the walls, floors, and each other. Be sure to consider depth and perspective.
Then, think about what specific items/components you need to build the scene and how they should be positioned. If you need more than one of the same item, make sure to make it into a function that can be called multiple times.

✍️ After Thinking Process:
Finally, assemble the scene from the components you've created in the \`\`\`js\`\`\` block of code.
Ensure you use only valid unicode characters, and you MUST produce valid three.js code.
`;

    // Prepare the content for the API call
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: imageData,
        },
      },
    ];

    // Make the API call using the specified model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro-exp-03-25",
      contents: contents,
    });

    // Process the response
    if (!response.candidates || response.candidates.length === 0) {
      return { error: "No candidates in the response" };
    }

    const candidateParts = response.candidates[0]?.content?.parts;
    if (!candidateParts || candidateParts.length === 0) {
      return { error: "No parts in the candidate response" };
    }

    for (const part of candidateParts) {
      if (part.text) {
        // Strip non-English Unicode characters
        const cleanedText = stripNonEnglishChars(part.text);

        // Extract code from ```js or ```javascript blocks
        const jsCodeRegex = /```(?:js|javascript)([\s\S]*?)```/;
        const jsMatch = cleanedText.match(jsCodeRegex);

        let jsCode = "";

        if (jsMatch && jsMatch[1]) {
          jsCode = jsMatch[1].trim();
        } else {
          // If no code block markers, check if there's any HTML or use the whole text
          const htmlRegex = /<html[\s\S]*<\/html>/i;
          const htmlMatch = cleanedText.match(htmlRegex);

          if (htmlMatch && htmlMatch[0]) {
            return { htmlContent: htmlMatch[0] };
          } else {
            // Assume the whole thing is code
            jsCode = cleanedText;
          }
        }

        // Create the complete HTML with the JavaScript embedded
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>3D Interior Scene</title>
  <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.161.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.161.0/examples/jsm/"
            }
        }
    </script>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; }
    #controls { 
      position: absolute; 
      bottom: 20px; 
      left: 50%; 
      transform: translateX(-50%);
      background-color: rgba(0,0,0,0.5);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      display: flex;
      gap: 10px;
      align-items: center;
      z-index: 1000;
    }
    .control-btn {
      background: rgba(255,255,255,0.8);
      color: #222;
      border: none;
      border-radius: 5px;
      padding: 8px 15px;
      cursor: pointer;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .control-btn:hover {
      background: rgba(255,255,255,1);
    }
    .orbit-active .orbit-btn {
      background: #f59e0b;
      color: white;
    }
    .fps-active .fps-btn {
      background: #f59e0b;
      color: white;
    }
  </style>
</head>
<body>
  <div id="controls">
    <button class="control-btn orbit-btn">Orbit View</button>
    <button class="control-btn fps-btn">First Person</button>
  </div>
  <script type="module">
    // THREE.JS SETUP
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
    
    // THREE.JS SETUP
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // CONTROLS SETUP - TWO MODES
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    
    const pointerControls = new PointerLockControls(camera, document.body);
    
    // Start with orbit controls by default
    let controlMode = 'orbit';
    document.body.classList.add('orbit-active');
    
    // Control buttons
    const orbitBtn = document.querySelector('.orbit-btn');
    const fpsBtn = document.querySelector('.fps-btn');
    
    orbitBtn.addEventListener('click', () => {
      setControlMode('orbit');
    });
    
    fpsBtn.addEventListener('click', () => {
      setControlMode('fps');
    });
    
    function setControlMode(mode) {
      controlMode = mode;
      
      if (mode === 'orbit') {
        pointerControls.unlock();
        document.body.classList.add('orbit-active');
        document.body.classList.remove('fps-active');
      } else {
        pointerControls.lock();
        document.body.classList.add('fps-active');
        document.body.classList.remove('orbit-active');
      }
    }
    
    // Movement variables for FPS mode
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    
    let prevTime = performance.now();
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    
    // Handle key presses
    document.addEventListener('keydown', function(event) {
      switch(event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': 
          // Toggle control mode with spacebar
          setControlMode(controlMode === 'orbit' ? 'fps' : 'orbit');
          break;
      }
    });
    
    document.addEventListener('keyup', function(event) {
      switch(event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
      }
    });
    
    // Resize handler
    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // GENERATED SCENE CREATION CODE
    ${jsCode}

    // ANIMATION LOOP
    function animate() {
      requestAnimationFrame(animate);
      
      if (controlMode === 'fps') {
        // Handle movement with time delta
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        
        if (moveForward || moveBackward) velocity.z -= direction.z * 20.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 20.0 * delta;
        
        pointerControls.moveRight(-velocity.x * delta);
        pointerControls.moveForward(-velocity.z * delta);
        
        prevTime = time;
      } else {
        // Update orbit controls
        orbitControls.update();
      }
      
      // Render the scene
      renderer.render(scene, camera);
    }
    
    animate();
  </script>
</body>
</html>
`;

        return { htmlContent: fullHtml };
      }
    }

    return { error: "No JavaScript content was generated in the response" };
  } catch (error) {
    console.error("Error generating 3D scene:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
