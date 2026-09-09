import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getDracoLoader } from '../utils/dracoLoaderManager';
import { getMeshCategory, biometricData, getHeatmapColor } from '../utils/nexusEngine';
import { OrganType } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Scissors } from 'lucide-react';

export { getMeshCategory };

export type AnatomicalLayer =
  | 'Full body'
  | 'Organs'
  | 'Muscular'
  | 'Skeletal'
  | 'Vascular'
  | 'Skin';

export const ANATOMICAL_LAYERS: AnatomicalLayer[] = [
  'Full body',
  'Organs',
  'Muscular',
  'Skeletal',
  'Vascular',
  'Skin'
];

interface Organ3DCanvasProps {
  activeOrgan: OrganType;
  heartRate: number;
}

type VisualMode = 'anatomical' | 'crossSection' | 'vascular' | 'xray';
type SlicePlane = 'coronal' | 'sagittal' | 'axial';

interface AnatomicalPin {
  name: string;
  desc: string;
  position: [number, number, number];
}

interface OrganTextureSet {
  diffuse: THREE.CanvasTexture;
}

const MAX_TEXTURE_SIZE = 256;

export const Organ3DCanvas: React.FC<Organ3DCanvasProps> = ({
  activeOrgan,
  heartRate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [visualMode, setVisualMode] = useState<VisualMode>('anatomical');
  const [activeLayer, setActiveLayer] = useState<AnatomicalLayer>('Full body');
  const lockedLayerRef = useRef<string>('full body');
  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;
  const heartRateRef = useRef(heartRate);
  heartRateRef.current = heartRate;
  const activeOrganRef = useRef(activeOrgan);
  activeOrganRef.current = activeOrgan;
  const startTickRef = useRef<(() => void) | null>(null);
  const [slicePlane, setSlicePlane] = useState<SlicePlane>('coronal');
  const [sliceOffset, setSliceOffset] = useState<number>(0.0);
  const [selectedPin, setSelectedPin] = useState<AnatomicalPin | null>(null);
  const [hoveredPin, setHoveredPin] = useState<AnatomicalPin | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [webglError, setWebglError] = useState<boolean>(false);
  const [heatmapActive, setHeatmapActive] = useState<boolean>(true);
  const [currentBiometricData, setCurrentBiometricData] = useState<Record<string, number>>(biometricData);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const organGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const bloodFlowParticlesRef = useRef<THREE.Points | null>(null);
  const pulseLightsRef = useRef<THREE.PointLight[]>([]);
  const clippingPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.0));

  // Dynamic Biometric Heatmap System (0-100 strain scale recoloring)
  const applyBiometricHeatmap = useCallback((data: Record<string, number> = biometricData) => {
    const scene = sceneRef.current;
    if (!scene) return;
    setHeatmapActive(true);
    setCurrentBiometricData(data);

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshName = mesh.name.toLowerCase();
        for (const [region, score] of Object.entries(data)) {
          if (meshName.includes(region) && score > 0) {
            // Store base color if not already saved
            if (!mesh.userData.originalColor && (mesh.material as any)?.color) {
              if (!mesh.userData.hasClonedMaterial) {
                mesh.material = (mesh.material as THREE.Material).clone();
                mesh.userData.hasClonedMaterial = true;
              }
              mesh.userData.originalColor = (mesh.material as any).color.clone();
            }
            if ((mesh.material as any)?.color) {
              (mesh.material as any).color.copy(getHeatmapColor(score));
            }
          }
        }
      }
    });

    if (typeof requestRenderRef.current === 'function') {
      requestRenderRef.current();
    }
  }, []);

  const resetHeatmap = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    setHeatmapActive(false);

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.userData && mesh.userData.originalColor && (mesh.material as any)?.color) {
          (mesh.material as any).color.copy(mesh.userData.originalColor);
        }
      }
    });

    if (typeof requestRenderRef.current === 'function') {
      requestRenderRef.current();
    }
  }, []);

  // Strict Layer Isolation Pass:
  // Before applying any active layer filter, traverse the scene and explicitly set
  // node.visible = false on every single mesh in the model (unless 'Full body' is selected)
  const switchAnatomicalLayer = useCallback((selectedLayer: string, customModel?: THREE.Object3D) => {
    const target = (selectedLayer || '').toLowerCase().trim();
    lockedLayerRef.current = target;
    setActiveLayer((selectedLayer as AnatomicalLayer) || 'Full body');

    const model = customModel || organGroupRef.current || sceneRef.current;
    if (!model) return;

    // Hard Visibility Reset Pass:
    // Before applying any active layer filter, traverse the scene and explicitly set node.visible = false on every single mesh in the model (unless 'Full body' is selected)
    if (target !== 'full body') {
      model.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          (node as THREE.Mesh).visible = false;
        }
      });
      // Also reset any other meshes in the scene root if model is organGroup
      if (sceneRef.current && sceneRef.current !== model) {
        sceneRef.current.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            const category = (mesh.userData?.category || getMeshCategory(mesh.name)).toLowerCase();
            mesh.visible = (category === target);
          }
        });
      }
    }

    model.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const category = (mesh.userData?.category || getMeshCategory(mesh.name)).toLowerCase();
        if (target === 'full body') {
          mesh.visible = true;
        } else {
          // Strict equality check: ONLY visible if category matches target exactly
          mesh.visible = (category === target);
        }
      }
    });

    if (bloodFlowParticlesRef.current) {
      bloodFlowParticlesRef.current.visible = (target === 'full body' || target === 'vascular');
    }
    if (pinsGroupRef.current) {
      pinsGroupRef.current.visible = (target === 'full body' || target === 'organs');
    }

    // Trigger an on-demand frame render to update the viewport
    if (typeof requestRenderRef.current === 'function') {
      requestRenderRef.current();
    }
    if (typeof (window as any).requestRender === 'function' && (window as any).requestRender !== requestRenderRef.current) {
      (window as any).requestRender();
    }
  }, []);

  const setActiveAnatomicalLayer = switchAnatomicalLayer;

  // Expose switchAnatomicalLayer, setActiveAnatomicalLayer, getMeshCategory, and heatmap functions on window for global access
  useEffect(() => {
    (window as any).switchAnatomicalLayer = switchAnatomicalLayer;
    (window as any).setActiveAnatomicalLayer = switchAnatomicalLayer;
    (window as any).getMeshCategory = getMeshCategory;
    (window as any).biometricData = biometricData;
    (window as any).getHeatmapColor = getHeatmapColor;
    (window as any).applyBiometricHeatmap = applyBiometricHeatmap;
    (window as any).resetHeatmap = resetHeatmap;
    (window as any).requestRender = () => requestRenderRef.current?.();

    if (window.NexusEngine) {
      window.NexusEngine.switchAnatomicalLayer = switchAnatomicalLayer;
      window.NexusEngine.setActiveAnatomicalLayer = switchAnatomicalLayer;
      window.NexusEngine.getMeshCategory = getMeshCategory;
      window.NexusEngine.biometricData = biometricData;
      window.NexusEngine.getHeatmapColor = getHeatmapColor;
      window.NexusEngine.applyBiometricHeatmap = applyBiometricHeatmap;
      window.NexusEngine.resetHeatmap = resetHeatmap;
      window.NexusEngine.requestRender = () => requestRenderRef.current?.();
    }
    return () => {
      if ((window as any).switchAnatomicalLayer === switchAnatomicalLayer) {
        delete (window as any).switchAnatomicalLayer;
      }
      if ((window as any).setActiveAnatomicalLayer === switchAnatomicalLayer) {
        delete (window as any).setActiveAnatomicalLayer;
      }
      if ((window as any).applyBiometricHeatmap === applyBiometricHeatmap) {
        delete (window as any).applyBiometricHeatmap;
        delete (window as any).resetHeatmap;
      }
    };
  }, [switchAnatomicalLayer, applyBiometricHeatmap, resetHeatmap]);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const zoomLevelRef = useRef(1);
  zoomLevelRef.current = zoomLevel;

  useEffect(() => {
    requestRenderRef.current?.();
  }, [zoomLevel]);

  // Track anatomical hotspots per organ
  const organPinsMap: Record<OrganType, AnatomicalPin[]> = {
    heart: [
      { name: 'Aortic Arch', desc: 'Distributes oxygenated blood to systemic circulation via brachiocephalic, carotid, and subclavian arteries.', position: [0.0, 0.95, 0.05] },
      { name: 'Left Ventricle', desc: 'Thick muscular chamber generating high systolic pressure for systemic perfusion.', position: [0.35, -0.2, 0.3] },
      { name: 'Coronary Arteries', desc: 'Branching microvasculature supplying the myocardium with arterial blood and nutrients.', position: [-0.05, 0.05, 0.52] },
      { name: 'Superior Vena Cava', desc: 'Returns deoxygenated venous blood from the upper body into the right atrium.', position: [-0.42, 0.72, 0.08] },
    ],
    brain: [
      { name: 'Cerebral Cortex', desc: 'Wrinkled outer gray matter governing sensory perception, cognition, speech, and voluntary motor control.', position: [0.0, 0.55, 0.35] },
      { name: 'Cerebellum', desc: 'Coordinates fine precision movements, equilibrium, posture, and motor procedural memory.', position: [-0.28, -0.42, -0.4] },
      { name: 'Brainstem (Pons/Medulla)', desc: 'Crucial relay hub regulating autonomic cardiac rhythm, respiration, and vasomotor tone.', position: [0.0, -0.68, -0.15] },
      { name: 'Longitudinal Fissure', desc: 'Deep sagittal groove separating the left and right cerebral hemispheres.', position: [0.0, 0.35, 0.5] },
    ],
    lungs: [
      { name: 'Trachea & Carina', desc: 'Cartilaginous airway bifurcating at the carina into primary bronchus branches.', position: [0.0, 0.75, 0.0] },
      { name: 'Right Superior Lobe', desc: 'Upper segment of tri-lobed right lung with dedicated apical bronchopulmonary segments.', position: [-0.55, 0.45, 0.2] },
      { name: 'Left Cardiac Notch', desc: 'Anatomical concavity in the anterior margin of the left lung accommodating the cardiac apex.', position: [0.28, -0.15, 0.35] },
      { name: 'Pulmonary Artery Arbor', desc: 'Branches conveying deoxygenated blood to alveolar capillary networks for gas exchange.', position: [0.0, 0.15, 0.15] },
    ],
    kidneys: [
      { name: 'Renal Cortex', desc: 'Outer metabolic zone containing over 1 million filtering nephrons, glomeruli, and convoluted tubules.', position: [-0.65, 0.25, 0.2] },
      { name: 'Renal Hilum', desc: 'Medial fissure where the renal artery, renal vein, lymphatic vessels, and ureter converge.', position: [-0.25, 0.0, 0.15] },
      { name: 'Adrenal Gland (Suprarenal)', desc: 'Endocrine cap synthesizing cortisol, aldosterone, and adrenaline catecholamines.', position: [-0.55, 0.65, 0.0] },
      { name: 'Ureter Conduit', desc: 'Muscular peristaltic tube conveying filtered urine from the renal pelvis down to the bladder.', position: [-0.22, -0.65, 0.05] },
    ],
    liver: [
      { name: 'Right Hepatic Lobe', desc: 'Massive primary functional lobe performing detoxification, glycogen storage, and protein synthesis.', position: [-0.35, 0.1, 0.3] },
      { name: 'Falciform Ligament', desc: 'Peritoneal fold demarcating the right and left lobes and anchoring the liver to the anterior abdominal wall.', position: [0.15, 0.2, 0.35] },
      { name: 'Gallbladder (Vesica Biliaris)', desc: 'Concentrates and stores hepatic bile salts for release during lipid digestion.', position: [-0.18, -0.45, 0.45] },
      { name: 'Porta Hepatis', desc: 'Deep transverse fissure carrying the hepatic portal vein, hepatic artery, and bile ducts.', position: [0.0, -0.2, -0.15] },
    ],
    stomach: [
      { name: 'Gastric Fundus', desc: 'Dome-shaped superior anatomical curvature storing swallowed gases and unmixed meal volume.', position: [-0.3, 0.62, 0.1] },
      { name: 'Greater Curvature (Body)', desc: 'Convex lateral margin rich in gastric rugae folds and parietal cells producing hydrochloric acid.', position: [-0.55, 0.0, 0.15] },
      { name: 'Pyloric Antrum & Sphincter', desc: 'Muscular outflow valve regulating the metered propulsion of acidic chyme into the duodenum.', position: [0.45, -0.2, -0.05] },
      { name: 'Gastroepiploic Arcade', desc: 'Branching anastomotic vascular network coursing along the greater curvature.', position: [-0.25, -0.4, 0.35] },
    ],
  };

  // =========================================================================
  // LIGHTWEIGHT 256x256 DIFFUSE TEXTURE GENERATORS (Zero Normal/Roughness Overhead)
  // =========================================================================
  const createCardiacTextures = (): OrganTextureSet => {
    const w = 256;
    const h = 256;
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w;
    diffCanvas.height = h;
    const diffCtx = diffCanvas.getContext('2d')!;

    const grad = diffCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#c1553b');
    grad.addColorStop(0.5, '#9e3820');
    grad.addColorStop(1, '#691d10');
    diffCtx.fillStyle = grad;
    diffCtx.fillRect(0, 0, w, h);

    diffCtx.strokeStyle = 'rgba(245, 241, 232, 0.16)';
    diffCtx.lineWidth = 1.3;
    for (let i = 0; i < h; i += 8) {
      diffCtx.beginPath();
      diffCtx.moveTo(0, i);
      diffCtx.lineTo(w, i + (i % 16 === 0 ? 3 : -3));
      diffCtx.stroke();
    }

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.generateMipmaps = false;
    diffuse.minFilter = THREE.LinearFilter;
    return { diffuse };
  };

  const createBrainTextures = (): OrganTextureSet => {
    const w = 256;
    const h = 256;
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w;
    diffCanvas.height = h;
    const diffCtx = diffCanvas.getContext('2d')!;
    diffCtx.fillStyle = '#b88b88';
    diffCtx.fillRect(0, 0, w, h);

    diffCtx.strokeStyle = '#6e2b2b';
    diffCtx.lineWidth = 4;
    diffCtx.lineCap = 'round';
    for (let k = 0; k < 18; k++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      diffCtx.beginPath();
      diffCtx.arc(x, y, 12 + Math.random() * 18, 0, Math.PI * 1.5);
      diffCtx.stroke();
    }

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.generateMipmaps = false;
    diffuse.minFilter = THREE.LinearFilter;
    return { diffuse };
  };

  const createLungTextures = (): OrganTextureSet => {
    const w = 256;
    const h = 256;
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w;
    diffCanvas.height = h;
    const diffCtx = diffCanvas.getContext('2d')!;
    diffCtx.fillStyle = '#9e4738';
    diffCtx.fillRect(0, 0, w, h);

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.generateMipmaps = false;
    diffuse.minFilter = THREE.LinearFilter;
    return { diffuse };
  };

  const createVisceralTextures = (type: 'kidney' | 'liver' | 'stomach'): OrganTextureSet => {
    const w = 256;
    const h = 256;
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w;
    diffCanvas.height = h;
    const diffCtx = diffCanvas.getContext('2d')!;

    const baseColor =
      type === 'kidney' ? '#9e3324' : type === 'liver' ? '#8a2c1f' : '#bd4e40';
    diffCtx.fillStyle = baseColor;
    diffCtx.fillRect(0, 0, w, h);

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.generateMipmaps = false;
    diffuse.minFilter = THREE.LinearFilter;
    return { diffuse };
  };

  const createVascularTextures = (): OrganTextureSet => {
    const w = 128;
    const h = 128;
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w;
    diffCanvas.height = h;
    const diffCtx = diffCanvas.getContext('2d')!;
    diffCtx.fillStyle = '#e8b04b';
    diffCtx.fillRect(0, 0, w, h);

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.generateMipmaps = false;
    diffuse.minFilter = THREE.LinearFilter;
    return { diffuse };
  };

  // Update Clipping Plane whenever slice controls change
  useEffect(() => {
    let normalVec = new THREE.Vector3(0, 0, 1);
    if (slicePlane === 'sagittal') {
      normalVec = new THREE.Vector3(1, 0, 0);
    } else if (slicePlane === 'axial') {
      normalVec = new THREE.Vector3(0, 1, 0);
    }
    clippingPlaneRef.current.normal = normalVec;
    clippingPlaneRef.current.constant = sliceOffset;

    if (rendererRef.current) {
      rendererRef.current.localClippingEnabled = visualMode === 'crossSection';
    }
  }, [slicePlane, sliceOffset, visualMode]);

  // =========================================================================
  // SCENE INITIALIZATION & WEBGL RENDERING PIPELINE
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.35, 4.4);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
        precision: 'mediump',
      });
    } catch (err) {
      console.warn('Organ3DCanvas: WebGL initialization failed, switching to 2D bio-visual mode:', err);
      setWebglError(true);
      return;
    }

    // Hardware Acceleration & Buffer Capping: Force 1.0 DPR and disable shadow maps
    renderer.setPixelRatio(1.0);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.localClippingEnabled = visualMode === 'crossSection';
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Unlit Ambient & Vertex Gouraud Shading: zero per-pixel PBR shader ALU overhead
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf5f1e8, 0.85);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = false;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7fa894, 0.55);
    fillLight.position.set(-4, -2, -3);
    fillLight.castShadow = false;
    scene.add(fillLight);

    pulseLightsRef.current = [];

    // Bio-Pedestal
    const platformGroup = new THREE.Group();
    scene.add(platformGroup);

    const discMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.35, 0.08, 24),
      new THREE.MeshLambertMaterial({
        color: 0x0b1613,
        transparent: true,
        opacity: 0.9,
      })
    );
    discMesh.position.set(0, -1.25, 0);
    discMesh.frustumCulled = true;
    platformGroup.add(discMesh);

    const ring1 = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.08, 32),
      new THREE.MeshBasicMaterial({ color: 0x7fa894, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.set(0, -1.2, 0);
    ring1.frustumCulled = true;
    platformGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(1.18, 1.25, 32),
      new THREE.MeshBasicMaterial({ color: 0xe8b04b, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.set(0, -1.2, 0);
    ring2.frustumCulled = true;
    platformGroup.add(ring2);

    // Organ Master Group
    const organGroup = new THREE.Group();
    organGroupRef.current = organGroup;
    scene.add(organGroup);

    // Hotspot Pins Group
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    scene.add(pinsGroup);

    // Dynamic Blood Flow Particle System
    const particleCount = 28;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    const cRed = new THREE.Color(0xc1553b);
    const cGold = new THREE.Color(0xe8b04b);
    const cBlue = new THREE.Color(0x7fa894);

    for (let i = 0; i < particleCount; i++) {
      const isVenous = i % 3 === 0;
      particlePositions[i * 3] = (Math.random() - 0.5) * 0.45;
      particlePositions[i * 3 + 1] = 0.2 + (Math.random() - 0.5) * 0.7;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.45;

      const c = isVenous ? cBlue : (i % 2 === 0 ? cRed : cGold);
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;

      particleSpeeds[i] = 0.008 + Math.random() * 0.012;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const bloodParticles = new THREE.Points(particleGeo, particleMat);
    bloodParticles.frustumCulled = true;
    bloodFlowParticlesRef.current = bloodParticles;
    organGroup.add(bloodParticles);

    // 3. Freeze-Frame Execution & Throttled Overlay Updates:
    // Completely kill requestAnimationFrame loops when the model is static.
    // Throttle HTML marker coordinate updates (updateMarkerPositions) so they only calculate every 3rd frame or during active drag events.
    let isRendering = false;
    let frameCounter = 0;

    const updateMarkerPositions = () => {
      if (pinsGroupRef.current && organGroupRef.current) {
        pinsGroupRef.current.position.copy(organGroupRef.current.position);
        pinsGroupRef.current.rotation.copy(organGroupRef.current.rotation);
        pinsGroupRef.current.scale.copy(organGroupRef.current.scale);
      }
    };

    function requestFrame(forceUpdateMarkers = true) {
      if (!isRendering) {
        isRendering = true;
        requestAnimationFrame(() => {
          // Visibility guard: lock visibility state so background updates never override layer isolation
          const currentTarget = lockedLayerRef.current;
          if (currentTarget && currentTarget !== 'full body') {
            const root = organGroupRef.current || sceneRef.current;
            if (root) {
              root.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                  const mesh = node as THREE.Mesh;
                  const category = (mesh.userData?.category || getMeshCategory(mesh.name)).toLowerCase();
                  if (mesh.visible !== (category === currentTarget)) {
                    mesh.visible = (category === currentTarget);
                  }
                }
              });
            }
          }
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          if (forceUpdateMarkers) {
            updateMarkerPositions();
          }
          isRendering = false;
        });
      }
    }
    requestRenderRef.current = () => requestFrame(true);

    // Animation Tick Loop
    const clock = new THREE.Clock();
    let animId: number | null = null;

    const tick = () => {
      // Completely kill loop when model is static (0% idle lag)
      if (!isRotatingRef.current && !isDraggingRef.current) {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
        requestFrame(true);
        return;
      }

      // Visibility guard: lock visibility state so background animation ticks never override layer isolation
      const currentTarget = lockedLayerRef.current;
      if (currentTarget && currentTarget !== 'full body') {
        const root = organGroupRef.current || sceneRef.current;
        if (root) {
          root.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              const category = (mesh.userData?.category || getMeshCategory(mesh.name)).toLowerCase();
              if (mesh.visible !== (category === currentTarget)) {
                mesh.visible = (category === currentTarget);
              }
            }
          });
        }
      }

      frameCounter++;
      const elapsedTime = clock.getElapsedTime();

      ring1.rotation.z += 0.005;
      ring2.rotation.z -= 0.003;

      if (organGroupRef.current) {
        organGroupRef.current.position.y = Math.sin(elapsedTime * 1.6) * 0.04 + 0.05;

        if (isRotatingRef.current && !isDraggingRef.current) {
          organGroupRef.current.rotation.y += 0.008;
        }

        const beatsPerSec = Math.max(0.8, heartRateRef.current / 60);
        const beatCycle = (elapsedTime * beatsPerSec * Math.PI * 2) % (Math.PI * 2);

        let pulseScale = 1;

        if (activeOrganRef.current === 'heart') {
          if (beatCycle < 0.7) {
            pulseScale = 1 + Math.sin((beatCycle * Math.PI) / 0.7) * 0.08;
          } else if (beatCycle > 0.9 && beatCycle < 1.4) {
            pulseScale = 1 + Math.sin(((beatCycle - 0.9) * Math.PI) / 0.5) * 0.04;
          }
        } else if (activeOrganRef.current === 'lungs') {
          pulseScale = 1 + Math.sin(elapsedTime * 1.8) * 0.05;
        } else {
          pulseScale = 1 + Math.sin(elapsedTime * 2.2) * 0.02;
        }

        organGroupRef.current.scale.set(
          pulseScale * zoomLevelRef.current,
          pulseScale * zoomLevelRef.current,
          pulseScale * zoomLevelRef.current
        );

        if (bloodFlowParticlesRef.current && (lockedLayerRef.current === 'full body' || lockedLayerRef.current === 'vascular')) {
          const pos = bloodFlowParticlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            pos[i * 3 + 1] += particleSpeeds[i];
            if (pos[i * 3 + 1] > 1.1) {
              pos[i * 3 + 1] = -0.3;
            }
          }
          bloodFlowParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Throttle HTML marker updates to every 3rd frame or during active drag
      const shouldUpdateMarkers = frameCounter % 3 === 0 || isDraggingRef.current;
      requestFrame(shouldUpdateMarkers);

      // Re-queue loop ONLY if rotating or dragging
      if (isRotatingRef.current || isDraggingRef.current) {
        animId = requestAnimationFrame(tick);
      } else {
        animId = null;
      }
    };

    startTickRef.current = () => {
      if (animId === null) {
        animId = requestAnimationFrame(tick);
      }
    };

    if (isRotatingRef.current) {
      animId = requestAnimationFrame(tick);
    } else {
      requestFrame(true);
    }

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      if (!animId) {
        animId = requestAnimationFrame(tick);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !organGroupRef.current) return;
      const dx = e.clientX - prevMousePosRef.current.x;
      const dy = e.clientY - prevMousePosRef.current.y;
      organGroupRef.current.rotation.y += dx * 0.012;
      organGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, organGroupRef.current.rotation.x + dy * 0.008));
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      requestFrame(true);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      if (!isRotatingRef.current && animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      requestFrame(true);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomLevel((prev) => Math.max(0.7, Math.min(1.4, prev - e.deltaY * 0.001)));
      requestFrame(true);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (!animId) {
          animId = requestAnimationFrame(tick);
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !organGroupRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMousePosRef.current.x;
      const dy = e.touches[0].clientY - prevMousePosRef.current.y;
      organGroupRef.current.rotation.y += dx * 0.012;
      organGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, organGroupRef.current.rotation.x + dy * 0.008));
      prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      requestFrame(true);
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      if (!isRotatingRef.current && animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      requestFrame(true);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Recursive Geometry and Material GPU Cleanup Helper
    const disposeObject = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh || (child as THREE.Line).isLine || (child as THREE.Points).isPoints) {
          const m = child as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else if (m.material) {
            m.material.dispose();
          }
        }
      });
    };

    let resizeFrameId: number | null = null;
    let lastWidth = 0;
    let lastHeight = 0;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const cr = entry.contentRect;
      const w = Math.round(cr?.width || container.clientWidth || 0);
      const h = Math.round(cr?.height || container.clientHeight || 0);

      if (w <= 0 || h <= 0 || (w === lastWidth && h === lastHeight)) return;

      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = requestAnimationFrame(() => {
        if (!rendererRef.current || !cameraRef.current) return;
        lastWidth = w;
        lastHeight = h;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setPixelRatio(1.0); // Hard limit render resolution buffer to 1x DPR
        // Passing updateStyle = false prevents modifying inline CSS styles on the canvas,
        // eliminating cyclic layout triggers and "ResizeObserver loop completed with undelivered notifications" errors.
        rendererRef.current.setSize(w, h, false);
        requestFrame(true);
        resizeFrameId = null;
      });
    });
    resizeObserver.observe(container);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
      startTickRef.current = null;
      requestRenderRef.current = null;
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      disposeObject(scene);
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  // Sync state changes with tick loop without tearing down the WebGL scene
  useEffect(() => {
    isRotatingRef.current = isRotating;
    if (isRotating && startTickRef.current) {
      startTickRef.current();
    } else {
      requestRenderRef.current?.();
    }
  }, [isRotating]);

  useEffect(() => {
    heartRateRef.current = heartRate;
  }, [heartRate]);

  useEffect(() => {
    activeOrganRef.current = activeOrgan;
  }, [activeOrgan]);

  // Re-build 3D Organ Meshes with Memory Disposal and Frustum Culling
  useEffect(() => {
    if (!organGroupRef.current || !pinsGroupRef.current) return;
    const organGroup = organGroupRef.current;
    const pinsGroup = pinsGroupRef.current;

    const disposeObject = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh || (child as THREE.Line).isLine || (child as THREE.Points).isPoints) {
          const m = child as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else if (m.material) {
            m.material.dispose();
          }
        }
      });
    };

    for (let i = organGroup.children.length - 1; i >= 0; i--) {
      const child = organGroup.children[i];
      if (child !== bloodFlowParticlesRef.current) {
        disposeObject(child);
        organGroup.remove(child);
      }
    }
    while (pinsGroup.children.length > 0) {
      const pinChild = pinsGroup.children[0];
      disposeObject(pinChild);
      pinsGroup.remove(pinChild);
    }

    organGroup.rotation.set(0, 0, 0);

    switch (activeOrgan) {
      case 'heart':
        buildRealisticHeart(organGroup);
        break;
      case 'brain':
        buildRealisticBrain(organGroup);
        break;
      case 'lungs':
        buildRealisticLungs(organGroup);
        break;
      case 'kidneys':
        buildRealisticKidneys(organGroup);
        break;
      case 'liver':
        buildRealisticLiver(organGroup);
        break;
      case 'stomach':
        buildRealisticStomach(organGroup);
        break;
      default:
        buildRealisticHeart(organGroup);
    }

    buildPins(pinsGroup, organPinsMap[activeOrgan]);

    // Build muscular, skeletal, and skin contextual geometry for multi-layer anatomical exploration
    buildMuscularContext(organGroup);
    buildSkeletalContext(organGroup);
    buildSkinContext(organGroup);

    // 2. Material Shader Optimization & Normal Computation (Preserve Geometry, Remove Lag)
    organGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.computeVertexNormals();
        }
        mesh.frustumCulled = true;
      }
    });

    pinsGroup.traverse((child) => {
      child.frustumCulled = true;
    });

    // 3. Apply strict reset-then-show layer visibility
    switchAnatomicalLayer(lockedLayerRef.current);

    // 4. Trigger Dynamic Biometric Heatmap on load
    applyBiometricHeatmap(biometricData);

    requestRenderRef.current?.();
  }, [activeOrgan, visualMode, slicePlane, sliceOffset, switchAnatomicalLayer, applyBiometricHeatmap]);

  // =========================================================================
  // LIGHTWEIGHT MESHLAMBERT MATERIAL FACTORY (Zero Fragment PBR Overhead)
  // Evaluates lighting per-vertex with pre-computed normals for locked 60 FPS
  // =========================================================================
  const getOrganMaterial = (params: {
    color: number;
    textures?: OrganTextureSet;
    emissive?: number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
    wireframe?: boolean;
  }) => {
    const isSlicing = visualMode === 'crossSection';
    const clippingPlanes = isSlicing ? [clippingPlaneRef.current] : [];

    if (visualMode === 'xray') {
      return new THREE.MeshLambertMaterial({
        color: 0x7fa894,
        transparent: true,
        opacity: 0.55,
        clippingPlanes,
        emissive: 0x22443a,
      });
    }

    if (visualMode === 'vascular') {
      return new THREE.MeshLambertMaterial({
        color: 0x16241f,
        wireframe: true,
        clippingPlanes,
        emissive: params.color,
      });
    }

    // Default & Cross-Section View: Lightweight MeshLambertMaterial with pre-computed vertex normals
    // Eliminates per-pixel PBR shader ALU overhead while preserving crisp anatomical contours
    return new THREE.MeshLambertMaterial({
      color: params.color,
      map: params.textures?.diffuse,
      clippingPlanes,
      side: THREE.DoubleSide,
      emissive: params.emissive ?? 0x180603,
      transparent: params.transparent ?? false,
      opacity: params.opacity ?? 1.0,
    });
  };

  // --- CONTEXTUAL ANATOMICAL LAYERS (Muscular, Skeletal, Skin) ---
  const buildMuscularContext = (group: THREE.Group) => {
    // 1. Intercostal / Torso Fibers
    const muscMat = new THREE.MeshLambertMaterial({
      color: 0x9e3a32,
      transparent: true,
      opacity: 0.82,
    });
    const m1 = new THREE.TorusGeometry(0.85, 0.045, 6, 20, Math.PI);
    m1.rotateX(Math.PI / 2);
    m1.translate(0, 0.45, 0);
    const m2 = new THREE.TorusGeometry(0.9, 0.045, 6, 20, Math.PI);
    m2.rotateX(Math.PI / 2);
    m2.translate(0, 0.15, 0);
    const m3 = new THREE.TorusGeometry(0.82, 0.045, 6, 20, Math.PI);
    m3.rotateX(Math.PI / 2);
    m3.translate(0, -0.15, 0);
    const muscGeo = BufferGeometryUtils.mergeGeometries([m1, m2, m3]);
    m1.dispose();
    m2.dispose();
    m3.dispose();
    if (muscGeo) {
      muscGeo.computeVertexNormals();
      const muscMesh = new THREE.Mesh(muscGeo, muscMat);
      muscMesh.name = 'muscular_torso_fibers';
      muscMesh.userData = { category: 'muscular' };
      group.add(muscMesh);
    }

    // 2. Pectorals (Chest muscle plates - biometric region: pectorals)
    const pecMat = new THREE.MeshLambertMaterial({
      color: 0x9e3a32,
      transparent: true,
      opacity: 0.86,
    });
    const pecL = new THREE.SphereGeometry(0.34, 14, 12);
    pecL.scale(1.1, 0.7, 0.45);
    pecL.translate(-0.32, 0.36, 0.44);
    const pecR = new THREE.SphereGeometry(0.34, 14, 12);
    pecR.scale(1.1, 0.7, 0.45);
    pecR.translate(0.32, 0.36, 0.44);
    const pecGeo = BufferGeometryUtils.mergeGeometries([pecL, pecR]);
    pecL.dispose();
    pecR.dispose();
    if (pecGeo) {
      pecGeo.computeVertexNormals();
      const pecMesh = new THREE.Mesh(pecGeo, pecMat);
      pecMesh.name = 'muscular_pectorals';
      pecMesh.userData = { category: 'muscular' };
      group.add(pecMesh);
    }

    // 3. Quadriceps (Upper leg thigh muscles - biometric region: quadriceps)
    const quadMat = new THREE.MeshLambertMaterial({
      color: 0x9e3a32,
      transparent: true,
      opacity: 0.86,
    });
    const quadL = new THREE.CylinderGeometry(0.16, 0.12, 0.65, 12);
    quadL.translate(-0.34, -0.92, 0.08);
    const quadR = new THREE.CylinderGeometry(0.16, 0.12, 0.65, 12);
    quadR.translate(0.34, -0.92, 0.08);
    const quadGeo = BufferGeometryUtils.mergeGeometries([quadL, quadR]);
    quadL.dispose();
    quadR.dispose();
    if (quadGeo) {
      quadGeo.computeVertexNormals();
      const quadMesh = new THREE.Mesh(quadGeo, quadMat);
      quadMesh.name = 'muscular_quadriceps';
      quadMesh.userData = { category: 'muscular' };
      group.add(quadMesh);
    }

    // 4. Biceps (Upper arm flexor muscles - biometric region: biceps)
    const bicMat = new THREE.MeshLambertMaterial({
      color: 0x9e3a32,
      transparent: true,
      opacity: 0.86,
    });
    const bicL = new THREE.CylinderGeometry(0.11, 0.09, 0.48, 12);
    bicL.rotateZ(0.22);
    bicL.translate(-0.84, 0.18, 0.08);
    const bicR = new THREE.CylinderGeometry(0.11, 0.09, 0.48, 12);
    bicR.rotateZ(-0.22);
    bicR.translate(0.84, 0.18, 0.08);
    const bicGeo = BufferGeometryUtils.mergeGeometries([bicL, bicR]);
    bicL.dispose();
    bicR.dispose();
    if (bicGeo) {
      bicGeo.computeVertexNormals();
      const bicMesh = new THREE.Mesh(bicGeo, bicMat);
      bicMesh.name = 'muscular_biceps';
      bicMesh.userData = { category: 'muscular' };
      group.add(bicMesh);
    }

    // 5. Abs (Rectus abdominis abdominal muscle group - biometric region: abs)
    const absMat = new THREE.MeshLambertMaterial({
      color: 0x9e3a32,
      transparent: true,
      opacity: 0.86,
    });
    const absSegments: THREE.BufferGeometry[] = [];
    [-0.02, -0.22, -0.42].forEach((yPos) => {
      const segL = new THREE.BoxGeometry(0.16, 0.15, 0.08);
      segL.translate(-0.11, yPos, 0.44);
      const segR = new THREE.BoxGeometry(0.16, 0.15, 0.08);
      segR.translate(0.11, yPos, 0.44);
      absSegments.push(segL, segR);
    });
    const absGeo = BufferGeometryUtils.mergeGeometries(absSegments);
    absSegments.forEach((g) => g.dispose());
    if (absGeo) {
      absGeo.computeVertexNormals();
      const absMesh = new THREE.Mesh(absGeo, absMat);
      absMesh.name = 'muscular_abs';
      absMesh.userData = { category: 'muscular' };
      group.add(absMesh);
    }
  };

  const buildSkeletalContext = (group: THREE.Group) => {
    const boneMat = new THREE.MeshLambertMaterial({
      color: 0xf2ece1,
      transparent: true,
      opacity: 0.88,
    });
    const spineGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.8, 10);
    spineGeo.translate(0, 0, -0.65);
    const ribGeos: THREE.BufferGeometry[] = [spineGeo];
    for (let r = 0; r < 4; r++) {
      const rib = new THREE.TorusGeometry(0.78 + r * 0.04, 0.024, 6, 18, Math.PI * 0.9);
      rib.rotateX(Math.PI / 2 + 0.1);
      rib.translate(0, 0.5 - r * 0.28, -0.15);
      ribGeos.push(rib);
    }
    const boneGeo = BufferGeometryUtils.mergeGeometries(ribGeos);
    ribGeos.forEach((g) => g.dispose());
    if (boneGeo) {
      boneGeo.computeVertexNormals();
      const boneMesh = new THREE.Mesh(boneGeo, boneMat);
      boneMesh.name = 'skeletal_ribcage_spine';
      boneMesh.userData = { category: 'skeletal' };
      group.add(boneMesh);
    }
  };

  const buildSkinContext = (group: THREE.Group) => {
    const skinMat = new THREE.MeshLambertMaterial({
      color: 0x7fa894,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const skinGeo = new THREE.CapsuleGeometry(1.05, 0.8, 10, 14);
    skinGeo.computeVertexNormals();
    const skinMesh = new THREE.Mesh(skinGeo, skinMat);
    skinMesh.name = 'skin_surface_envelope';
    skinMesh.userData = { category: 'skin' };
    group.add(skinMesh);
  };

  // --- 1. HYPER-REALISTIC HEART (Batched Geometry & Draw Call Reduction) ---
  const buildRealisticHeart = (group: THREE.Group) => {
    const cardiacTex = createCardiacTextures();
    const vascularTex = createVascularTextures();

    const heartMat = getOrganMaterial({
      color: 0xc1553b,
      textures: cardiacTex,
      emissive: 0x300b05,
    });

    const aortaMat = getOrganMaterial({
      color: 0xe8b04b,
      textures: vascularTex,
      emissive: 0x402503,
    });

    const venaMat = getOrganMaterial({
      color: 0x7fa894,
      textures: vascularTex,
      emissive: 0x12251d,
    });

    // 1. Muscular Myocardium System (Ventricles + Left Atrium + Right Atrium merged into 1 draw call)
    const ventriclesGeo = new THREE.SphereGeometry(0.72, 28, 28);
    const pos = ventriclesGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      if (y < 0) {
        const factor = 1 - Math.abs(y) * 0.45;
        x *= factor;
        z *= factor;
        x += Math.abs(y) * 0.18;
      }
      if (z > 0 && Math.abs(x + 0.05) < 0.2) {
        z *= 0.92;
      }
      pos.setXYZ(i, x, y * 1.25, z * 0.88);
    }
    ventriclesGeo.rotateZ(-0.14);
    ventriclesGeo.translate(0, -0.1, 0);

    const leftAtriumGeo = new THREE.SphereGeometry(0.38, 18, 18);
    leftAtriumGeo.scale(1.1, 0.9, 0.85);
    leftAtriumGeo.translate(0.36, 0.42, -0.05);

    const rightAtriumGeo = new THREE.SphereGeometry(0.4, 18, 18);
    rightAtriumGeo.scale(1.1, 0.95, 0.9);
    rightAtriumGeo.translate(-0.38, 0.38, -0.08);

    const myocardiumGeo = BufferGeometryUtils.mergeGeometries([ventriclesGeo, leftAtriumGeo, rightAtriumGeo]);
    ventriclesGeo.dispose();
    leftAtriumGeo.dispose();
    rightAtriumGeo.dispose();

    if (myocardiumGeo) {
      myocardiumGeo.computeVertexNormals();
      const myocardiumMesh = new THREE.Mesh(myocardiumGeo, heartMat);
      myocardiumMesh.name = 'heart_myocardium';
      myocardiumMesh.userData = { category: 'organs' };
      group.add(myocardiumMesh);
    }

    // 2. Arterial Vascular System (Aorta + 3 Branches merged into 1 draw call)
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 0.32, 0.05),
      new THREE.Vector3(0.12, 0.72, 0.12),
      new THREE.Vector3(-0.04, 0.98, 0.08),
      new THREE.Vector3(-0.32, 0.88, -0.12),
      new THREE.Vector3(-0.4, 0.35, -0.22),
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 20, 0.14, 10, false);
    const b1Geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.06, 0.95, 0.1), new THREE.Vector3(0.1, 1.25, 0.12)]), 8, 0.048, 8, false);
    const b2Geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.06, 1.0, 0.08), new THREE.Vector3(-0.05, 1.3, 0.06)]), 8, 0.042, 8, false);
    const b3Geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.18, 0.96, 0.0), new THREE.Vector3(-0.22, 1.24, -0.04)]), 8, 0.038, 8, false);

    const arterialGeo = BufferGeometryUtils.mergeGeometries([aortaGeo, b1Geo, b2Geo, b3Geo]);
    aortaGeo.dispose();
    b1Geo.dispose();
    b2Geo.dispose();
    b3Geo.dispose();

    if (arterialGeo) {
      arterialGeo.computeVertexNormals();
      const arterialMesh = new THREE.Mesh(arterialGeo, aortaMat);
      arterialMesh.name = 'artery_aorta_vascular';
      arterialMesh.userData = { category: 'vascular' };
      group.add(arterialMesh);
    }

    // 3. Venous Vascular System (SVC + Pulmonary Trunk merged into 1 draw call)
    const svcCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.42, 0.35, 0.05), new THREE.Vector3(-0.44, 0.92, 0.08)]);
    const svcGeo = new THREE.TubeGeometry(svcCurve, 12, 0.12, 10, false);
    const pulmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 0.32, 0.22),
      new THREE.Vector3(0.02, 0.62, 0.18),
      new THREE.Vector3(0.28, 0.72, -0.06),
    ]);
    const pulmGeo = new THREE.TubeGeometry(pulmCurve, 14, 0.11, 10, false);

    const venousGeo = BufferGeometryUtils.mergeGeometries([svcGeo, pulmGeo]);
    svcGeo.dispose();
    pulmGeo.dispose();

    if (venousGeo) {
      venousGeo.computeVertexNormals();
      const venousMesh = new THREE.Mesh(venousGeo, venaMat);
      venousMesh.name = 'vein_svc_vascular';
      venousMesh.userData = { category: 'vascular' };
      group.add(venousMesh);
    }

    // 4. Anterior Coronary Microvasculature
    const coronaryPoints = [
      new THREE.Vector3(0.06, 0.3, 0.46),
      new THREE.Vector3(-0.02, 0.08, 0.52),
      new THREE.Vector3(-0.08, -0.18, 0.46),
      new THREE.Vector3(-0.14, -0.45, 0.32),
      new THREE.Vector3(-0.18, -0.62, 0.16),
    ];
    const coronaryGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coronaryPoints), 16, 0.025, 6, false);
    coronaryGeo.computeVertexNormals();
    const coronaryMat = new THREE.MeshLambertMaterial({
      color: 0xf5f1e8,
      emissive: 0xe8b04b,
    });
    const coronaryMesh = new THREE.Mesh(coronaryGeo, coronaryMat);
    coronaryMesh.name = 'coronary_artery_vascular';
    coronaryMesh.userData = { category: 'vascular' };
    group.add(coronaryMesh);
  };

  // --- 2. HYPER-REALISTIC BRAIN (Batched Geometry & Draw Call Reduction) ---
  const buildRealisticBrain = (group: THREE.Group) => {
    const brainTex = createBrainTextures();

    const cortexMat = getOrganMaterial({
      color: 0xd9a59b,
      textures: brainTex,
      emissive: 0x30110e,
    });

    const stemMat = getOrganMaterial({ color: 0xf5e8d3, emissive: 0x222018 });

    const createHemisphereGeo = (isLeft: boolean) => {
      const geo = new THREE.SphereGeometry(0.72, 28, 28);
      const pos = geo.attributes.position;
      const sign = isLeft ? -1 : 1;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        if (sign * x > 0) x *= 0.65;
        if (y < 0.1 && z > -0.1 && z < 0.3) x += sign * 0.12;
        if (z < -0.2) {
          y *= 0.9;
          x *= 0.92;
        }
        if (z > 0.2) y *= 1.05;

        pos.setXYZ(i, x * 0.72 + sign * 0.28, y * 0.92 + 0.1, z * 1.15);
      }
      return geo;
    };

    const leftHemiGeo = createHemisphereGeo(true);
    const rightHemiGeo = createHemisphereGeo(false);

    const createCerebellumGeo = (isLeft: boolean) => {
      const geo = new THREE.SphereGeometry(0.38, 18, 18);
      const sign = isLeft ? -1 : 1;
      geo.scale(1.0, 0.75, 0.85);
      geo.rotateX(-0.2);
      geo.translate(sign * 0.26, -0.42, -0.42);
      return geo;
    };

    const leftCerebGeo = createCerebellumGeo(true);
    const rightCerebGeo = createCerebellumGeo(false);

    // Merge all cortical and cerebellar lobes into a single geometry (1 draw call)
    const corticalGeo = BufferGeometryUtils.mergeGeometries([leftHemiGeo, rightHemiGeo, leftCerebGeo, rightCerebGeo]);
    leftHemiGeo.dispose();
    rightHemiGeo.dispose();
    leftCerebGeo.dispose();
    rightCerebGeo.dispose();

    if (corticalGeo) {
      corticalGeo.computeVertexNormals();
      const corticalMesh = new THREE.Mesh(corticalGeo, cortexMat);
      corticalMesh.name = 'brain_cortex_organ';
      corticalMesh.userData = { category: 'organs' };
      group.add(corticalMesh);
    }

    // Brainstem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.25, -0.05),
      new THREE.Vector3(0, -0.5, -0.18),
      new THREE.Vector3(0, -0.82, -0.24),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 14, 0.14, 10, false);
    stemGeo.computeVertexNormals();
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.name = 'brain_stem_organ';
    stemMesh.userData = { category: 'organs' };
    group.add(stemMesh);
  };

  // --- 3. HYPER-REALISTIC LUNGS (Batched Geometry & Draw Call Reduction) ---
  const buildRealisticLungs = (group: THREE.Group) => {
    const lungTex = createLungTextures();
    const lungMat = getOrganMaterial({
      color: 0xb55748,
      textures: lungTex,
      emissive: 0x250b07,
    });
    const cartilageMat = getOrganMaterial({ color: 0xf0e6d6, emissive: 0x1b1b15 });

    // 1. Tracheobronchial Cartilage System (Trachea + Rings + Bronchi merged into 1 draw call)
    const tracheaCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0, 0.42, 0)]);
    const tracheaGeo = new THREE.TubeGeometry(tracheaCurve, 12, 0.11, 12, false);

    const ringGeos: THREE.BufferGeometry[] = [];
    for (let r = 0; r < 5; r++) {
      const ring = new THREE.TorusGeometry(0.115, 0.02, 6, 14);
      ring.rotateX(Math.PI / 2);
      ring.translate(0, 0.48 + r * 0.09, 0);
      ringGeos.push(ring);
    }

    const bronchusR = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.42, 0), new THREE.Vector3(-0.25, 0.22, 0.04), new THREE.Vector3(-0.48, 0.05, 0.06)]);
    const bronchusRGeo = new THREE.TubeGeometry(bronchusR, 12, 0.085, 10, false);

    const bronchusL = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.42, 0), new THREE.Vector3(0.28, 0.2, 0.02), new THREE.Vector3(0.52, 0.02, 0.04)]);
    const bronchusLGeo = new THREE.TubeGeometry(bronchusL, 12, 0.08, 10, false);

    const cartilageGeo = BufferGeometryUtils.mergeGeometries([tracheaGeo, ...ringGeos, bronchusRGeo, bronchusLGeo]);
    tracheaGeo.dispose();
    ringGeos.forEach((g) => g.dispose());
    bronchusRGeo.dispose();
    bronchusLGeo.dispose();

    if (cartilageGeo) {
      cartilageGeo.computeVertexNormals();
      const cartilageMesh = new THREE.Mesh(cartilageGeo, cartilageMat);
      cartilageMesh.name = 'trachea_cartilage_skeletal';
      cartilageMesh.userData = { category: 'skeletal' };
      group.add(cartilageMesh);
    }

    // 2. Pulmonary Parenchymal System (Right + Left Lungs merged into 1 draw call)
    const rightLungGeo = new THREE.SphereGeometry(0.72, 26, 26);
    const posR = rightLungGeo.attributes.position;
    for (let i = 0; i < posR.count; i++) {
      let x = posR.getX(i);
      let y = posR.getY(i);
      let z = posR.getZ(i);
      if (x > 0) x *= 0.55;
      if (y > 0) x *= 1 - y * 0.35;
      if (y < -0.4) y += (x * x + z * z) * 0.4;
      posR.setXYZ(i, x * 0.85, y * 1.35, z * 0.85);
    }
    rightLungGeo.translate(-0.55, -0.05, 0);

    const leftLungGeo = new THREE.SphereGeometry(0.7, 26, 26);
    const posL = leftLungGeo.attributes.position;
    for (let i = 0; i < posL.count; i++) {
      let x = posL.getX(i);
      let y = posL.getY(i);
      let z = posL.getZ(i);
      if (x < 0) x *= 0.52;
      if (x < 0.2 && y > -0.4 && y < 0.2 && z > -0.1) x += 0.22;
      if (y < -0.4) y += (x * x + z * z) * 0.38;
      posL.setXYZ(i, x * 0.82, y * 1.32, z * 0.82);
    }
    leftLungGeo.translate(0.55, -0.05, 0);

    const parenchymaGeo = BufferGeometryUtils.mergeGeometries([rightLungGeo, leftLungGeo]);
    rightLungGeo.dispose();
    leftLungGeo.dispose();

    if (parenchymaGeo) {
      parenchymaGeo.computeVertexNormals();
      const lungMesh = new THREE.Mesh(parenchymaGeo, lungMat);
      lungMesh.name = 'lung_parenchyma_organ';
      lungMesh.userData = { category: 'organs' };
      group.add(lungMesh);
    }
  };

  // --- 4. HYPER-REALISTIC KIDNEYS (Batched Geometry & Draw Call Reduction) ---
  const buildRealisticKidneys = (group: THREE.Group) => {
    const kidneyTex = createVisceralTextures('kidney');
    const kidneyMat = getOrganMaterial({
      color: 0x9e3324,
      textures: kidneyTex,
      emissive: 0x220705,
    });
    const adrenalMat = getOrganMaterial({ color: 0xe8b04b, emissive: 0x352002 });

    const createKidneyGeo = (isLeft: boolean) => {
      const geo = new THREE.SphereGeometry(0.55, 24, 24);
      const pos = geo.attributes.position;
      const sign = isLeft ? -1 : 1;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        if (sign * x > 0 && Math.abs(y) < 0.25) {
          x *= 0.52;
        }
        pos.setXYZ(i, x * 0.85, y * 1.35, z * 0.75);
      }
      geo.rotateZ(sign * -0.15);
      geo.translate(sign * 0.55, 0, 0);
      return geo;
    };

    const leftKidneyGeo = createKidneyGeo(true);
    const rightKidneyGeo = createKidneyGeo(false);
    const kidneysGeo = BufferGeometryUtils.mergeGeometries([leftKidneyGeo, rightKidneyGeo]);
    leftKidneyGeo.dispose();
    rightKidneyGeo.dispose();

    if (kidneysGeo) {
      kidneysGeo.computeVertexNormals();
      const kidneyMesh = new THREE.Mesh(kidneysGeo, kidneyMat);
      kidneyMesh.name = 'kidney_organ';
      kidneyMesh.userData = { category: 'organs' };
      group.add(kidneyMesh);
    }

    // Adrenal Caps merged into 1 draw call
    const adLGeo = new THREE.ConeGeometry(0.18, 0.22, 12);
    adLGeo.translate(-0.55, 0.65, 0);
    const adRGeo = new THREE.ConeGeometry(0.18, 0.22, 12);
    adRGeo.translate(0.55, 0.65, 0);

    const adrenalGeo = BufferGeometryUtils.mergeGeometries([adLGeo, adRGeo]);
    adLGeo.dispose();
    adRGeo.dispose();

    if (adrenalGeo) {
      adrenalGeo.computeVertexNormals();
      const adrenalMesh = new THREE.Mesh(adrenalGeo, adrenalMat);
      adrenalMesh.name = 'adrenal_gland_organ';
      adrenalMesh.userData = { category: 'organs' };
      group.add(adrenalMesh);
    }
  };

  // --- 5. HYPER-REALISTIC LIVER (Batched Geometry & Draw Call Reduction) ---
  const buildRealisticLiver = (group: THREE.Group) => {
    const liverTex = createVisceralTextures('liver');
    const liverMat = getOrganMaterial({
      color: 0x8a2c1f,
      textures: liverTex,
      emissive: 0x1f0604,
    });
    const gallMat = getOrganMaterial({ color: 0x4a7a42, emissive: 0x0f220d });

    const liverGeo = new THREE.SphereGeometry(0.85, 28, 28);
    const pos = liverGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      if (x < 0) x *= 1.45;
      if (x > 0) x *= 0.65;
      if (y < -0.1) y *= 0.65;
      if (z < -0.1) z *= 0.75;

      pos.setXYZ(i, x * 0.95, y * 0.85, z * 0.85);
    }
    liverGeo.rotateZ(-0.1);
    liverGeo.translate(0.1, 0, 0);
    liverGeo.computeVertexNormals();
    const liverMesh = new THREE.Mesh(liverGeo, liverMat);
    liverMesh.name = 'liver_organ';
    liverMesh.userData = { category: 'organs' };
    group.add(liverMesh);

    // Gallbladder
    const gallGeo = new THREE.SphereGeometry(0.18, 14, 14);
    gallGeo.scale(0.8, 1.4, 0.8);
    gallGeo.rotateX(0.4);
    gallGeo.translate(-0.18, -0.45, 0.45);
    gallGeo.computeVertexNormals();
    const gallMesh = new THREE.Mesh(gallGeo, gallMat);
    gallMesh.name = 'gallbladder_organ';
    gallMesh.userData = { category: 'organs' };
    group.add(gallMesh);
  };

  // --- 6. HYPER-REALISTIC STOMACH (Batched Geometry & Draw Call Reduction) ---
  const buildRealisticStomach = (group: THREE.Group) => {
    const stomTex = createVisceralTextures('stomach');
    const stomMat = getOrganMaterial({
      color: 0xbd4e40,
      textures: stomTex,
      emissive: 0x2e0c08,
    });

    const stomachCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, 0.72, 0.05),
      new THREE.Vector3(-0.45, 0.48, 0.15),
      new THREE.Vector3(-0.62, 0.0, 0.18),
      new THREE.Vector3(-0.35, -0.42, 0.22),
      new THREE.Vector3(0.15, -0.38, 0.08),
      new THREE.Vector3(0.48, -0.18, -0.05),
    ]);
    const stomGeo = new THREE.TubeGeometry(stomachCurve, 20, 0.35, 14, false);
    stomGeo.computeVertexNormals();
    const stomMesh = new THREE.Mesh(stomGeo, stomMat);
    stomMesh.name = 'stomach_organ';
    stomMesh.userData = { category: 'organs' };
    group.add(stomMesh);
  };

  // Hotspot Pins Batched (Under 3 Draw Calls Total)
  const buildPins = (group: THREE.Group, pins: AnatomicalPin[]) => {
    if (!pins || pins.length === 0) return;
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xe8b04b });
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x7fa894, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xe8b04b, transparent: true, opacity: 0.6 });

    const anchorGeos: THREE.BufferGeometry[] = [];
    const haloGeos: THREE.BufferGeometry[] = [];
    const linePoints: THREE.Vector3[] = [];

    pins.forEach((pin) => {
      const anchor = new THREE.SphereGeometry(0.04, 8, 8);
      anchor.translate(...pin.position);
      anchorGeos.push(anchor);

      const targetPos = new THREE.Vector3(pin.position[0] * 1.35, pin.position[1] * 1.35 + 0.1, pin.position[2] * 1.35);
      linePoints.push(new THREE.Vector3(...pin.position), targetPos);

      const halo = new THREE.RingGeometry(0.055, 0.075, 14);
      halo.translate(targetPos.x, targetPos.y, targetPos.z);
      haloGeos.push(halo);
    });

    const mergedAnchors = BufferGeometryUtils.mergeGeometries(anchorGeos);
    anchorGeos.forEach((g) => g.dispose());
    if (mergedAnchors) {
      const anchorMesh = new THREE.Mesh(mergedAnchors, pinMat);
      anchorMesh.name = 'organ_pin_anchors';
      anchorMesh.userData = { category: 'organs' };
      group.add(anchorMesh);
    }

    const mergedHalos = BufferGeometryUtils.mergeGeometries(haloGeos);
    haloGeos.forEach((g) => g.dispose());
    if (mergedHalos) {
      const haloMesh = new THREE.Mesh(mergedHalos, haloMat);
      haloMesh.name = 'organ_pin_halos';
      haloMesh.userData = { category: 'organs' };
      group.add(haloMesh);
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    lineMesh.name = 'organ_pin_lines';
    lineMesh.userData = { category: 'organs' };
    group.add(lineMesh);
  };

  return (
    <div
      id="organ-3d-container"
      className="relative w-full h-[320px] sm:h-[340px] flex items-center justify-center select-none overflow-hidden"
    >
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
      />

      {/* Top Anatomical Layer Selector Bar (Pill Tabs) */}
      <div
        id="organ-layers-bar"
        className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#16241F]/90 backdrop-blur-md px-2 py-1 rounded-full border border-[#7FA894]/30 z-20 font-['IBM_Plex_Mono',monospace] shadow-lg max-w-[calc(100%-250px)] overflow-x-auto no-scrollbar"
      >
        {ANATOMICAL_LAYERS.map((layer) => {
          const isActive = activeLayer === layer;
          return (
            <button
              key={layer}
              id={`layer-btn-${layer.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => switchAnatomicalLayer(layer)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#E8B04B] text-[#0B1613] shadow-xs'
                  : 'text-[#7FA894] hover:text-[#F5F1E8] hover:bg-white/5'
              }`}
            >
              {layer}
            </button>
          );
        })}
      </div>

      {/* Top Visual Mode Selector */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#16241F]/90 backdrop-blur-md p-1 rounded-xl border border-[#7FA894]/30 shadow-lg z-20 font-['IBM_Plex_Mono',monospace]">
        <button
          id="btn-mode-anatomical"
          onClick={() => setVisualMode('anatomical')}
          title="Realistic Anatomy"
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            visualMode === 'anatomical'
              ? 'bg-[#E8B04B] text-[#0B1613] shadow-xs'
              : 'text-[#7FA894] hover:text-[#F5F1E8]'
          }`}
        >
          Anatomy
        </button>
        <button
          id="btn-mode-cross-section"
          onClick={() => setVisualMode('crossSection')}
          title="Interactive Internal Cross-Section Slice"
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
            visualMode === 'crossSection'
              ? 'bg-[#E8B04B] text-[#0B1613] shadow-xs'
              : 'text-[#7FA894] hover:text-[#F5F1E8]'
          }`}
        >
          <Scissors className="w-3 h-3" />
          <span>Cross-Section</span>
        </button>
        <button
          id="btn-mode-vascular"
          onClick={() => setVisualMode('vascular')}
          title="Vascular Telemetry"
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            visualMode === 'vascular'
              ? 'bg-[#E8B04B] text-[#0B1613] shadow-xs'
              : 'text-[#7FA894] hover:text-[#F5F1E8]'
          }`}
        >
          Vascular
        </button>
        <button
          id="btn-mode-xray"
          onClick={() => setVisualMode('xray')}
          title="Subsurface X-Ray"
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            visualMode === 'xray'
              ? 'bg-[#E8B04B] text-[#0B1613] shadow-xs'
              : 'text-[#7FA894] hover:text-[#F5F1E8]'
          }`}
        >
          X-Ray
        </button>
      </div>

      {/* Slicing Controls Drawer (Visible when in Cross-Section Mode) */}
      {visualMode === 'crossSection' && (
        <div
          id="slice-control-toolbar"
          className="absolute top-12 right-2.5 flex flex-col gap-1.5 bg-[#16241F]/95 backdrop-blur-md p-2 rounded-xl border border-[#E8B04B]/50 shadow-xl z-20 text-[10px] font-['IBM_Plex_Mono',monospace]"
        >
          <div className="flex items-center justify-between gap-2 text-[#7FA894]">
            <span className="font-bold text-[#E8B04B]">Slice Plane</span>
            <div className="flex items-center gap-1">
              {(['coronal', 'sagittal', 'axial'] as SlicePlane[]).map((plane) => (
                <button
                  key={plane}
                  id={`btn-slice-${plane}`}
                  onClick={() => setSlicePlane(plane)}
                  className={`px-1.5 py-0.5 rounded uppercase text-[9px] cursor-pointer transition-colors ${
                    slicePlane === plane
                      ? 'bg-[#E8B04B] text-[#0B1613] font-bold'
                      : 'text-[#7FA894] hover:text-[#F5F1E8] bg-[#0B1613]'
                  }`}
                >
                  {plane[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#7FA894]">
            <span>Depth:</span>
            <input
              id="slider-slice-depth"
              type="range"
              min="-0.6"
              max="0.6"
              step="0.02"
              value={sliceOffset}
              onChange={(e) => setSliceOffset(parseFloat(e.target.value))}
              className="w-20 accent-[#E8B04B] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Dynamic Biometric Heatmap Indicator & HUD */}
      <div
        id="biometric-heatmap-hud"
        className="absolute bottom-11 left-2.5 right-2.5 flex items-center justify-between gap-2 bg-[#16241F]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#7FA894]/30 text-[10px] font-['IBM_Plex_Mono',monospace] shadow-lg z-20 pointer-events-auto"
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                heatmapActive ? 'bg-[#ef4444] animate-pulse' : 'bg-[#7FA894]'
              }`}
            />
            <span className="font-bold text-[#F5F1E8]">Biometric Heatmap</span>
          </div>

          <div className="flex items-center gap-1 text-[9px] shrink-0">
            <span
              title="Pectorals Strain (High)"
              className="px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 font-bold"
            >
              Pec: {currentBiometricData.pectorals ?? 85}
            </span>
            <span
              title="Quadriceps Fatigue (Moderate)"
              className="px-1.5 py-0.5 rounded bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/40 font-bold"
            >
              Quads: {currentBiometricData.quadriceps ?? 40}
            </span>
            <span
              title="Biceps Strain (Recovered)"
              className="px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 font-bold"
            >
              Biceps: {currentBiometricData.biceps ?? 10}
            </span>
            <span
              title="Abs Strain (Baseline)"
              className="px-1.5 py-0.5 rounded bg-[#7FA894]/20 text-[#7FA894] border border-[#7FA894]/40 font-bold"
            >
              Abs: {currentBiometricData.abs ?? 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {heatmapActive ? (
            <button
              id="btn-reset-heatmap"
              onClick={() => resetHeatmap()}
              title="Restore original anatomical mesh colors"
              className="px-2 py-0.5 rounded text-[9px] font-bold text-[#7FA894] hover:text-[#F5F1E8] hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-[#7FA894]/30"
            >
              Reset
            </button>
          ) : (
            <button
              id="btn-apply-heatmap"
              onClick={() => applyBiometricHeatmap(currentBiometricData)}
              title="Recolor anatomical meshes by strain score"
              className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8B04B] text-[#0B1613] hover:bg-[#d69e38] cursor-pointer transition-colors shadow-xs"
            >
              Apply Heatmap
            </button>
          )}
        </div>
      </div>

      {/* Bottom Floating Hotspots Bar */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {organPinsMap[activeOrgan]?.map((pin, i) => (
            <button
              key={pin.name}
              id={`pin-chip-${i}`}
              onClick={() => setSelectedPin(selectedPin?.name === pin.name ? null : pin)}
              onMouseEnter={() => setHoveredPin(pin)}
              onMouseLeave={() => setHoveredPin(null)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-all border font-['IBM_Plex_Mono',monospace] cursor-pointer ${
                selectedPin?.name === pin.name
                  ? 'bg-[#E8B04B] text-[#0B1613] border-[#E8B04B] shadow-sm'
                  : 'bg-[#16241F]/80 hover:bg-[#16241F] text-[#7FA894] hover:text-[#F5F1E8] border-[#7FA894]/25'
              }`}
            >
              {pin.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-[#16241F]/90 backdrop-blur-md px-2 py-1 rounded-xl border border-[#7FA894]/30 text-[11px] text-[#7FA894] shrink-0 font-['IBM_Plex_Mono',monospace]">
          <button
            id="btn-zoom-in"
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
            title="Zoom In"
            className="p-1 hover:text-[#E8B04B] cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-zoom-out"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            title="Zoom Out"
            className="p-1 hover:text-[#E8B04B] cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-toggle-organ-rot"
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? 'Pause Orbit' : 'Auto Orbit'}
            className={`p-1 font-semibold cursor-pointer ${
              isRotating ? 'text-[#E8B04B]' : 'text-[#7FA894] hover:text-[#F5F1E8]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Anatomical Hotspot Detail Popover */}
      {(selectedPin || hoveredPin) && (
        <div
          id="pin-detail-card"
          className="absolute top-12 left-3 max-w-[260px] bg-[#16241F]/95 backdrop-blur-md p-3 rounded-2xl border border-[#E8B04B]/50 shadow-2xl z-30 animate-in fade-in zoom-in-95 pointer-events-auto"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-bold text-[#E8B04B] font-['IBM_Plex_Mono',monospace]">
              {(selectedPin || hoveredPin)?.name}
            </span>
            {selectedPin && (
              <button
                onClick={() => setSelectedPin(null)}
                className="text-[10px] text-[#7FA894] hover:text-[#F5F1E8] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#F5F1E8]/90 leading-snug font-['IBM_Plex_Sans',sans-serif]">
            {(selectedPin || hoveredPin)?.desc}
          </p>
        </div>
      )}
    </div>
  );
};
