// ---------------------------------------
// CONFIGURACIÓN INICIAL
// ---------------------------------------
let scene, camera, renderer, player;
let mixer;
let runAction;

// escena
scene = new THREE.Scene();

// cámara estilo Brawl Stars (vista ligeramente desde arriba)
camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

// renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(3, 6, 4);
scene.add(light);

// ---------------------------------------
// CARGA DEL MODELO
// ---------------------------------------
const loader = new THREE.GLTFLoader();
loader.load("models/player.glb", (gltf) => {
  player = gltf.scene;
  scene.add(player);

  mixer = new THREE.AnimationMixer(player);

  // Animación de correr (la primera del archivo)
  runAction = mixer.clipAction(gltf.animations[0]);
  runAction.loop = THREE.LoopRepeat;

  player.scale.set(1, 1, 1);
});

// posición inicial de cámara
camera.position.set(0, 8, 6);
camera.lookAt(0, 0, 0);

// ---------------------------------------
// JOYSTICK
// ---------------------------------------
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let joyX = 0, joyY = 0;

joystick.addEventListener("touchend", () => {
  joyX = 0;
  joyY = 0;

  if (runAction) runAction.stop();

  stick.style.left = "30px";
  stick.style.top = "30px";
});

joystick.addEventListener("touchmove", (e) => {
  const rect = joystick.getBoundingClientRect();
  const t = e.touches[0];

  let x = t.clientX - rect.left - 60;
  let y = t.clientY - rect.top - 60;

  const dist = Math.sqrt(x*x + y*y);
  const maxDist = 40;

  if (dist > maxDist) {
    x = (x / dist) * maxDist;
    y = (y / dist) * maxDist;
  }

  stick.style.left = `${60 + x - 30}px`;
  stick.style.top  = `${60 + y - 30}px`;

  joyX = x / maxDist;
  joyY = y / maxDist;

  if (runAction && !runAction.isRunning()) runAction.play();
});

// ---------------------------------------
// SALTO
// ---------------------------------------
let jumping = false;
let jumpHeight = 1.2;
let jumpSpeed = 0.12;
let jumpProgress = 0;

function doJump() {
  if (!player || jumping) return;
  jumping = true;
  jumpProgress = 0;
}

document.getElementById("btnJump").onclick = doJump;

// ---------------------------------------
// ANIMACIÓN / LOOP PRINCIPAL
// ---------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  if (player) {
    const speed = 0.08;

    // movimiento con joystick
    player.position.x += joyX * speed;
    player.position.z += joyY * speed;

    // rotación del personaje según movimiento
    if (joyX !== 0 || joyY !== 0) {
      player.rotation.y = Math.atan2(joyX, joyY);
    }

    // --------------------
    // SALTO
    // --------------------
    if (jumping) {
      jumpProgress += jumpSpeed;

      if (jumpProgress < 1) {
        player.position.y = jumpProgress * jumpHeight; // subir
      } else {
        player.position.y -= jumpSpeed * jumpHeight;   // bajar

        if (player.position.y <= 0) {
          player.position.y = 0;
          jumping = false;
        }
      }
    }

    // ---------------------------------------
    // CÁMARA ESTILO BRAWL STARS
    // ---------------------------------------
    const camTargetX = player.position.x;
    const camTargetZ = player.position.z - 4;
    const camTargetY = 6;

    camera.position.x += (camTargetX - camera.position.x) * 0.08;
    camera.position.y += (camTargetY - camera.position.y) * 0.08;
    camera.position.z += (camTargetZ - camera.position.z) * 0.08;

    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
  }

  renderer.render(scene, camera);
}

animate();