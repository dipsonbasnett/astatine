import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function mountAstronaut(
  canvas: HTMLCanvasElement,
  onReady: () => void,
  onError: () => void,
): () => void {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new Scene();
  const camera = new PerspectiveCamera(36, 1, 0.1, 40);
  const styles = getComputedStyle(canvas);
  const accent = new Color(styles.getPropertyValue("--color-accent").trim());
  const environment = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(environment, 0.04);
  scene.environment = target.texture;
  environment.dispose();
  pmrem.dispose();
  scene.add(new HemisphereLight(0xddeeff, 0x273342, 2));
  const key = new DirectionalLight(0xffffff, 3);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new DirectionalLight(accent, 2);
  rim.position.set(3, 2, -2);
  scene.add(rim);

  const ROTATION_SPEED = 0.35;
  const DRAG_RADIANS_PER_PX = 0.01;
  const INERTIA_FRICTION = 0.9;
  const INERTIA_STOP = 0.05;
  const MAX_ANGULAR_VELOCITY = 8;
  let figure: import("three").Group | null = null;
  let frame = 0;
  let last = 0;
  let rotationY = 0;
  let angularVelocity = 0;
  let dragging = false;
  let lastPointerX = 0;
  let lastPointerTime = 0;
  const animate = (time: number) => {
    frame = requestAnimationFrame(animate);
    const delta = Math.min((time - last) / 1000, 0.1);
    last = time;
    if (figure) {
      if (!dragging) {
        if (Math.abs(angularVelocity) > INERTIA_STOP) {
          rotationY += angularVelocity * delta;
          angularVelocity *= Math.pow(INERTIA_FRICTION, delta * 60);
        } else {
          angularVelocity = 0;
          rotationY += delta * ROTATION_SPEED;
        }
        rotationY %= Math.PI * 2;
      }
      figure.rotation.y = rotationY;
    }
    renderer.render(scene, camera);
  };

  const controls = new AbortController();
  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    dragging = true;
    angularVelocity = 0;
    lastPointerX = event.clientX;
    lastPointerTime = event.timeStamp;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const pointerMove = (event: PointerEvent) => {
    if (!dragging || !event.isPrimary) return;
    const elapsed = Math.max((event.timeStamp - lastPointerTime) / 1000, 1 / 240);
    const step = (event.clientX - lastPointerX) * DRAG_RADIANS_PER_PX;
    rotationY += step;
    angularVelocity = Math.max(
      -MAX_ANGULAR_VELOCITY,
      Math.min(MAX_ANGULAR_VELOCITY, step / elapsed),
    );
    lastPointerX = event.clientX;
    lastPointerTime = event.timeStamp;
  };
  const pointerEnd = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    canvas.style.cursor = "";
  };
  canvas.addEventListener("pointerdown", pointerDown, { signal: controls.signal });
  canvas.addEventListener("pointermove", pointerMove, { signal: controls.signal });
  canvas.addEventListener("pointerup", pointerEnd, { signal: controls.signal });
  canvas.addEventListener("pointercancel", pointerEnd, { signal: controls.signal });
  canvas.addEventListener("lostpointercapture", pointerEnd, { signal: controls.signal });

  let disposed = false;
  let loaded = false;
  const abort = new AbortController();
  const resize = () => {
    if (disposed || !loaded) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    const distance = Math.max(1.58, 1.07 / camera.aspect) / Math.tan(Math.PI / 10);
    camera.position.set(0.32, 1.7, distance);
    camera.lookAt(0, 1.3, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const lost = (event: Event) => {
    event.preventDefault();
    if (!disposed) onError();
  };
  canvas.addEventListener("webglcontextlost", lost);

  const disposeMeshes = (root: Scene | import("three").Group) => {
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => material.dispose());
    });
  };

  void fetch("/hmc/astronaut-unbranded.glb", { signal: abort.signal })
    .then((response) => {
      if (!response.ok) throw new Error("Model unavailable");
      return response.arrayBuffer();
    })
    .then((bytes) => new GLTFLoader().parseAsync(bytes, ""))
    .then(({ scene: model }) => {
      if (disposed) {
        disposeMeshes(model);
        return;
      }
      const bounds = new Box3().setFromObject(model);
      model.scale.multiplyScalar(2.55 / bounds.getSize(new Vector3()).y);
      bounds.setFromObject(model);
      const center = bounds.getCenter(new Vector3());
      model.position.set(-center.x, -bounds.min.y, -center.z);
      figure = model;
      scene.add(model);
      loaded = true;
      resize();
      onReady();
      last = performance.now();
      frame = requestAnimationFrame(animate);
    })
    .catch(() => {
      if (!disposed) onError();
    });

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    abort.abort();
    controls.abort();
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", lost);
    disposeMeshes(scene);
    target.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
