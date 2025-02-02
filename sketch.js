let myFont;  // Global font variable

// Global simulation parameters
let outerRadius = 300;       // Outer sphere radius (adjusted by mouse when both buttons are pressed)
let numBalls = 20000;         // Number of balls
let ballRadius = 1.5;        // Initial ball radius (in pixels; updated by slider)
let balls = [];              // Array for ball objects
let numBallsSlider;
let sphereColorPicker;


// Variables for interactive rotation
let rotationX = 0;
let rotationY = 0;
let autoRotationSpeed = 0.001;  // Automatic rotation speed when not dragging

// Global sphere center (this changes the sphere’s origin)
let sphereCenter;

// UI controls for color now use color pickers instead of RGB sliders
let bgColorPicker, ballColorPicker;
let ballSizeSlider, ballSpeedSlider;  // Removed sphereSizeSlider

// UI container div
let uiDiv;

// Global variables for UI dragging and over-UI flag
let overUI = false;
let draggingUI = false;
let uiDragOffsetX = 0;
let uiDragOffsetY = 0;

// Global auto-complete state for the editable text.
let autoCompleting = false;
let autoCompleteIndex = 0;
const autoCompletePhrase = " this was created entirely by chatgpt's o3-mini-high model,  by a guy who has almost zero coding experience under his belt. be ready for the ai singularity, because if i, a guy who literally doesn't know how to code, can make stuff like this now, who knows what is next in our world.";
let baseText = "";  // Holds the text up to 50 characters that the user typed

// Editable text element for the overlay
let editableText;

function preload() {
  // Load your custom font for canvas text (used by p5.js)
  myFont = loadFont('Xanmono-Regular.ttf');
}

function setup() {
  createCanvas(1920, 1280, WEBGL);
  background(0);
  
  // Add CSS rules: define @font-face and a blinking ::after pseudo-element for the editable text.
  let styleEl = createElement('style', 
    @font-face {
      font-family: 'Xanmono';
      src: url('Xanmono-Regular.ttf');
    }
    .editable-text::after {
      content: "_";
      animation: blink 1s steps(2, start) infinite;
    }
    @keyframes blink {
      to { visibility: hidden; }
    }
  );
  styleEl.parent(document.head);
  
  // Set the sphere’s center (for example, (0, -50, 0))
  sphereCenter = createVector(0, -50, 0);
  
  // Set up the UI panel on the screen and make it draggable
  setupUI();
  
  // Set up the editable text overlay with default text.
  setupEditableText();
  
  // Create the balls with random positions and velocities.
  // Their positions will be stored relative to the sphere’s center.
  for (let i = 0; i < numBalls; i++) {
    let pos = p5.Vector.random3D().mult(random(0, outerRadius - ballRadius));
    let vel = p5.Vector.random3D().mult(0.5);
    balls.push({
      pos: pos,
      vel: vel,
      r: ballRadius
    });
  }
}

function draw() {
  // Use the background color from the color picker
  let bgColor = bgColorPicker.value();
  background(bgColor);
  
  // Auto-rotate only when the mouse is not over the UI and not dragging the UI
  if (!overUI && !draggingUI) {
    rotationY += autoRotationSpeed;
  }
  
  // --- Draw the sphere and ball simulation relative to sphereCenter ---
  push();
    translate(sphereCenter.x, sphereCenter.y, sphereCenter.z);
    rotateX(rotationX);
    rotateY(rotationY);
    
    noFill();
    stroke(sphereColorPicker.value());
    strokeWeight(2);
    sphere(outerRadius);
    
    let newBallSize = ballSizeSlider.value();
    let speedFactor = ballSpeedSlider.value();
    let ballColor = ballColorPicker.value();
    
    noStroke();
    fill(ballColor);
    for (let ball of balls) {
      ball.r = newBallSize;
      ball.pos.add(p5.Vector.mult(ball.vel, speedFactor));
      if (ball.pos.mag() + ball.r > outerRadius) {
        let normal = ball.pos.copy().normalize();
        let dotProd = ball.vel.dot(normal);
        ball.vel = p5.Vector.sub(ball.vel, p5.Vector.mult(normal, 2 * dotProd));
        ball.pos = p5.Vector.mult(normal, outerRadius - ball.r);
      }
      push();
        translate(ball.pos.x, ball.pos.y, ball.pos.z);
        sphere(ball.r);
      pop();
    }
  pop();
  
  let desiredNum = numBallsSlider.value();
if (desiredNum > balls.length) {
  let diff = desiredNum - balls.length;
  for (let i = 0; i < diff; i++) {
    let pos = p5.Vector.random3D().mult(random(0, outerRadius - ballRadius));
    let vel = p5.Vector.random3D().mult(0.5);
    balls.push({ pos: pos, vel: vel, r: ballRadius });
  }
} else if (desiredNum < balls.length) {
  balls.splice(desiredNum);
}

  
  // --- Draw instructions in the top right corner (retain previous code) ---
  push();
    resetMatrix();
    textFont(myFont);
    textSize(30);
    fill(255, 255, 255, 150); // semi-transparent white
    textAlign(RIGHT, TOP);
    let instructions = "LMB: Rotate\nRMB: Move\nL+R: Size";
    text(instructions, width/2 - 70, -600);
  pop();
}

function mouseDragged(e) {
  if (draggingUI) {
    let newLeft = mouseX + width/2 - uiDragOffsetX;
    let newTop = mouseY + height/2 - uiDragOffsetY;
    uiDiv.style('left', newLeft + 'px');
    uiDiv.style('top', newTop + 'px');
    return;
  }
  if (overUI) return;
  
  if (e && e.buttons !== undefined) {
    if (e.buttons === 2) {
      let dx = mouseX - pmouseX;
      let dy = mouseY - pmouseY;
      sphereCenter.x += dx;
      sphereCenter.y += dy;
      return;
    }
    if (e.buttons === 3) {
      let dSize = mouseY - pmouseY;
      outerRadius += dSize;
      outerRadius = constrain(outerRadius, 50, 1000);
      return;
    }
  }
  
  let sensitivity = 0.005;
  rotationY += (mouseX - pmouseX) * sensitivity;
  rotationX += (mouseY - pmouseY) * sensitivity;
}

function mouseReleased() {
  draggingUI = false;
}

// --- Editable Text Overlay Setup ---
function setupEditableText() {
  // Calculate absolute position based on fixed text originally drawn at (-245, -540)
  let posX = width/2 - 245;
  let posY = height/2 - 540;
  
  // Create an editable HTML div with default text.
  editableText = createDiv(" THE WINDOW TO<br>THE WORLD BEYOND");
  editableText.elt.contentEditable = "true";
  // Assign the CSS class to get the blinking underscore via ::after.
  editableText.elt.classList.add("editable-text");
  editableText.style('position', 'absolute');
  editableText.style('left', posX + 'px');
  editableText.style('top', posY + 'px');
  // Set a max-width so the text doesn't run off the screen.
  editableText.style('max-width', '600px');
  // Use the custom font via our @font-face rule.
  editableText.style('font-family', 'Xanmono, sans-serif');
  editableText.style('font-size', '32px');
  editableText.style('color', '#ffffff');  // Fully white text
  editableText.style('outline', 'none');
  editableText.style('border', 'none');
  editableText.style('background', 'none');
  editableText.style('white-space', 'pre-wrap');
  editableText.style('line-height', '1.2em');
  // Keep the max-height to 4 lines.
  editableText.style('max-height', (1.2 * 4) + 'em');
  editableText.style('overflow', 'hidden');
  editableText.elt.spellcheck = false;
  
  // When clicked, focus the element.
  editableText.mousePressed(() => {
    editableText.elt.focus();
  });
  
  // (Optional) Limit to 4 lines if desired.
  editableText.elt.addEventListener('input', function() {
    let lines = this.innerText.split(/\r\n|\r|\n/);
    if (lines.length > 4) {
      this.innerText = lines.slice(0, 4).join('\n');
    }
  });
  
  // Add a keyup event listener to implement auto-completion.
  editableText.elt.addEventListener('keyup', function(e) {
    let cur = editableText.elt.innerText;
    // If less than 50 characters, update baseText and reset auto-completion state.
    if (cur.length < 50) {
      baseText = cur;
      autoCompleting = false;
      autoCompleteIndex = 0;
    } else {
      // If this is the first time reaching 50, fix baseText.
      if (!autoCompleting && baseText === "") {
        baseText = cur.substring(0, 50);
      }
      // Calculate how many auto-complete characters should be appended.
      let desiredAutoCount = cur.length - baseText.length;
      // Build the desired full text.
      let desired = baseText + autoCompletePhrase.substring(0, desiredAutoCount);
      // Update the element if it doesn't match.
      if (cur !== desired) {
        editableText.elt.innerText = desired;
        moveCaretToEnd(editableText.elt);
      }
      autoCompleting = true;
      autoCompleteIndex = desiredAutoCount;
    }
  });
}

function moveCaretToEnd(el) {
  let range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// --- UI Panel and Controls Setup ---
function setupUI() {
  uiDiv = createDiv('');
  uiDiv.style('position', 'absolute');
  uiDiv.style('top', '190px');
  uiDiv.style('left', '20px');
  uiDiv.style('width', '120px');
  uiDiv.style('background-color', 'rgba(0, 0, 0, 0.5)');
  uiDiv.style('padding', '15px');
  uiDiv.style('border-radius', '8px');
  uiDiv.style('color', '#fff');
 uiDiv.style('font-family', 'Xanmono, sans-serif');
  createSliderWithLabel(uiDiv, 'Number of Balls', 1, 2000, numBalls, 1, (s) => { numBallsSlider = s; });
createColorPickerWithLabel(uiDiv, 'Sphere Color', '#ffffff', (cp) => { sphereColorPicker = cp; });


  
  uiDiv.mouseOver(() => { overUI = true; });
  uiDiv.mouseOut(() => { overUI = false; });
  
  uiDiv.mousePressed(startUIDrag);
  
  // --- Background Color Picker ---
  createColorPickerWithLabel(uiDiv, 'Background', '#640064', (cp) => { bgColorPicker = cp; });
  
  // --- Ball Color Picker ---
  createColorPickerWithLabel(uiDiv, 'Ball Color', '#64C800', (cp) => { ballColorPicker = cp; });
  
  // --- Other Sliders ---
  createSliderWithLabel(uiDiv, 'Ball Size', 0.5, 10, 1.5, 0.5, (s) => { ballSizeSlider = s; });
  createSliderWithLabel(uiDiv, 'Ball Speed', 0, 5, 1, 0.1, (s) => { ballSpeedSlider = s; });
}

function startUIDrag(e) {
  if (e.target.tagName === "INPUT") {
    draggingUI = false;
    return;
  }
  let rect = uiDiv.elt.getBoundingClientRect();
  uiDragOffsetX = mouseX + width/2 - rect.left;
  uiDragOffsetY = mouseY + height/2 - rect.top;
  draggingUI = true;
}

function mouseReleased() {
  draggingUI = false;
}

// --- Helper Functions ---
function createSliderWithLabel(parentDiv, labelText, minVal, maxVal, initVal, stepVal, cb) {
  let label = createDiv(labelText);
  label.parent(parentDiv);
  label.style('font-size', '10px');
  label.style('margin-top', '10px');
  let slider = createSlider(minVal, maxVal, initVal, stepVal);
  slider.parent(parentDiv);
  slider.style('width', '100%');
  cb(slider);
}

function createColorPickerWithLabel(parentDiv, labelText, initColor, cb) {
  let label = createDiv(labelText);
  label.parent(parentDiv);
  label.style('font-size', '10px');
  label.style('margin-top', '10px');
  let cp = createColorPicker(initColor);
  cp.parent(parentDiv);
  cp.style('width', '100%');
  cb(cp);
}
