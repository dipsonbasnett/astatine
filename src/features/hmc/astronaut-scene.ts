import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  TorusGeometry,
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
  const metal = new Color(styles.getPropertyValue("--color-line-strong").trim());
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

  const base = new Mesh(
    new CylinderGeometry(0.88, 0.94, 0.1, 80),
    new MeshStandardMaterial({ color: metal, metalness: 0.8, roughness: 0.4 }),
  );
  base.position.y = 0.02;
  scene.add(base);
  for (const radius of [0.66, 0.86]) {
    const ring = new Mesh(
      new TorusGeometry(radius, 0.008, 8, 96),
      new MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.4,
        metalness: 0.65,
        roughness: 0.3,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.075;
    scene.add(ring);
  }

  let disposed = false;
  let loaded = false;
  const abort = new AbortController();
  const resize = () => {
    if (disposed || !loaded) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    const distance = Math.max(1.65, 1.12 / camera.aspect) / Math.tan(Math.PI / 10);
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
      model.position.set(-center.x, 0.075 - bounds.min.y, -center.z);
      scene.add(model);
      loaded = true;
      resize();
      onReady();
    })
    .catch(() => {
      if (!disposed) onError();
    });

  return () => {
    disposed = true;
    abort.abort();
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", lost);
    disposeMeshes(scene);
    target.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
