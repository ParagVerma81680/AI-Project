import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useCart } from '../context/CartContext'

// ── Supermarket 3D Layout Coordinates ─────────────────────────────────────
const AISLE_COORDS = {
  ENTRANCE: { x: 0,   y: 0, z: 32, label: 'Main Entrance', color: 0x10b981 },
  A1:       { x: -14, y: 0, z: 18, label: 'Aisle A1 · Dairy & Cold Storage', color: 0x38bdf8, icon: '🥛' },
  A2:       { x: 14,  y: 0, z: 18, label: 'Aisle A2 · Artisan Bakery', color: 0xfb923c, icon: '🥖' },
  B1:       { x: -14, y: 0, z: 6,  label: 'Aisle B1 · Beverages & Juices', color: 0x34d399, icon: '🥤' },
  B2:       { x: 14,  y: 0, z: 6,  label: 'Aisle B2 · Snacks & Sweets', color: 0xf43f5e, icon: '🍿' },
  C1:       { x: -14, y: 0, z: -6, label: 'Aisle C1 · Fresh Fruits Market', color: 0xeab308, icon: '🍎' },
  C2:       { x: 14,  y: 0, z: -6, label: 'Aisle C2 · Fresh Vegetables', color: 0x22c55e, icon: '🥦' },
  D1:       { x: -14, y: 0, z: -18, label: 'Aisle D1 · Personal Care', color: 0xa855f7, icon: '🧴' },
  EXIT:     { x: 0,   y: 0, z: -32, label: 'Checkout Registers & Exit', color: 0xf97316 },
}

// Corridor pathfinding nodes ensuring cart walks in aisles, never through shelves
function buildWalkablePath(stops) {
  if (!stops || stops.length === 0) return []
  const points = []
  
  // Always begin at entrance
  points.push(new THREE.Vector3(AISLE_COORDS.ENTRANCE.x, 0.4, AISLE_COORDS.ENTRANCE.z))
  
  stops.forEach((stopKey) => {
    const key = stopKey.toUpperCase()
    const target = AISLE_COORDS[key]
    if (!target) return
    
    if (key === 'ENTRANCE' || key === 'EXIT') {
      points.push(new THREE.Vector3(target.x, 0.4, target.z))
    } else {
      // Step 1: Move to central corridor junction at target's Z
      points.push(new THREE.Vector3(0, 0.4, target.z))
      // Step 2: Step into the shelf aisle
      points.push(new THREE.Vector3(target.x, 0.4, target.z))
      // Step 3: Step back into central corridor
      points.push(new THREE.Vector3(0, 0.4, target.z))
    }
  })
  
  // Finish at exit
  points.push(new THREE.Vector3(AISLE_COORDS.EXIT.x, 0.4, AISLE_COORDS.EXIT.z))
  return points
}

export default function Supermarket3D({
  route = [],
  activeAisle = null,
  onAisleSelect = null,
  onProductClick = null,
  cartItems = [],
  highlightProduct = null
}) {
  const mountRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [navProgress, setNavProgress] = useState(0) // 0 to 1
  const [currentWaypoint, setCurrentWaypoint] = useState('ENTRANCE')
  const [cameraMode, setCameraMode] = useState('isometric') // 'isometric' | 'topdown' | 'entrance'
  const [cinematicActive, setCinematicActive] = useState(true)
  const [selectedShelfInfo, setSelectedShelfInfo] = useState(null)

  const { addToCart } = useCart()

  // References for Three.js state
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const cartMeshRef = useRef(null)
  const routeLineRef = useRef(null)
  const waypointsMeshesRef = useRef([])
  const pathCurveRef = useRef(null)
  const animFrameRef = useRef(null)
  const isDraggingRef = useRef(false)
  const previousMousePositionRef = useRef({ x: 0, y: 0 })
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0))

  // Normalized route
  const normalizedRoute = route.map(r => r.toUpperCase()).filter(r => AISLE_COORDS[r])

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 800
    const height = container.clientHeight || 550

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a) // Deep slate futuristic
    scene.fog = new THREE.FogExp2(0x0f172a, 0.012)
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500)
    camera.position.set(0, 75, 80) // High aerial start for cinematic
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xfff8ed, 1.4)
    mainLight.position.set(30, 60, 40)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 1024
    mainLight.shadow.mapSize.height = 1024
    mainLight.shadow.camera.near = 10
    mainLight.shadow.camera.far = 150
    mainLight.shadow.camera.left = -40
    mainLight.shadow.camera.right = 40
    mainLight.shadow.camera.top = 40
    mainLight.shadow.camera.bottom = -40
    scene.add(mainLight)

    // Colored accent point lights for supermarket realism
    const blueAisleLight = new THREE.PointLight(0x38bdf8, 2, 35)
    blueAisleLight.position.set(-15, 8, 15)
    scene.add(blueAisleLight)

    const warmBakeryLight = new THREE.PointLight(0xfb923c, 2.5, 35)
    warmBakeryLight.position.set(15, 8, 15)
    scene.add(warmBakeryLight)

    const greenProduceLight = new THREE.PointLight(0x22c55e, 2, 35)
    greenProduceLight.position.set(15, 8, -10)
    scene.add(greenProduceLight)

    // 5. Supermarket Floor (Reflective grid marble)
    const floorGeo = new THREE.PlaneGeometry(64, 80)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.15,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Floor Grid Tile overlay
    const gridHelper = new THREE.GridHelper(64, 32, 0x334155, 0x1e293b)
    gridHelper.position.y = 0.02
    scene.add(gridHelper)

    // Store Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x09101d, roughness: 0.5 })
    
    // Back Wall (Z = -40)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(64, 10, 1), wallMat)
    backWall.position.set(0, 5, -40)
    scene.add(backWall)

    // Left Wall (X = -32)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 80), wallMat)
    leftWall.position.set(-32, 5, 0)
    scene.add(leftWall)

    // Right Wall (X = 32)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 80), wallMat)
    rightWall.position.set(32, 5, 0)
    scene.add(rightWall)

    // Front Wall with Entrance Opening
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(24, 10, 1), wallMat)
    frontWallLeft.position.set(-20, 5, 40)
    scene.add(frontWallLeft)

    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(24, 10, 1), wallMat)
    frontWallRight.position.set(20, 5, 40)
    scene.add(frontWallRight)

    // Glass entrance arch
    const archMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.4 })
    const arch = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 1.2), archMat)
    arch.position.set(0, 9, 40)
    scene.add(arch)

    // 6. Checkout Counters (Front Exit area)
    const checkoutMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })

    ;[-10, 0, 10].forEach((cx, idx) => {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 8), checkoutMat)
      counter.position.set(cx, 1.1, -28)
      counter.castShadow = true
      counter.receiveShadow = true
      scene.add(counter)

      const belt = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 6), beltMat)
      belt.position.set(cx, 2.25, -28)
      scene.add(belt)

      // POS Monitor
      const posMonitor = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.2), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }))
      posMonitor.position.set(cx + 1.2, 3.2, -26)
      scene.add(posMonitor)
    })

    // 7. Multi-Tier Shelves for Aisles
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.3, roughness: 0.4 })
    const shelfGroup = new THREE.Group()

    Object.entries(AISLE_COORDS).forEach(([aisleKey, info]) => {
      if (aisleKey === 'ENTRANCE' || aisleKey === 'EXIT') return

      const aisleContainer = new THREE.Group()
      aisleContainer.position.set(info.x, 0, info.z)

      // Main Gondola Rack
      const rackWidth = 14
      const rackDepth = 4.5
      const rackHeight = 5.5

      const rack = new THREE.Mesh(new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth), shelfMaterial)
      rack.position.y = rackHeight / 2
      rack.castShadow = true
      rack.receiveShadow = true
      rack.userData = { aisleKey, info }
      aisleContainer.add(rack)

      // Shelves horizontal tiers
      for (let t = 1; t <= 3; t++) {
        const tier = new THREE.Mesh(
          new THREE.BoxGeometry(rackWidth + 0.4, 0.15, rackDepth + 0.6),
          new THREE.MeshStandardMaterial({ color: 0x64748b })
        )
        tier.position.y = t * 1.5
        aisleContainer.add(tier)

        // Add 3D product boxes along the shelf
        const numBoxes = 6
        for (let b = 0; b < numBoxes; b++) {
          const bx = -5 + b * 2
          const boxMat = new THREE.MeshStandardMaterial({
            color: info.color,
            roughness: 0.3,
            metalness: 0.1
          })
          const prodBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), boxMat)
          prodBox.position.set(bx, tier.position.y + 0.45, 1.6)
          prodBox.castShadow = true
          aisleContainer.add(prodBox)

          // Other side of the aisle
          const prodBoxBack = prodBox.clone()
          prodBoxBack.position.z = -1.6
          aisleContainer.add(prodBoxBack)
        }
      }

      // Overhead Aisle Banner (Glowing neon sign)
      const bannerGeo = new THREE.BoxGeometry(7, 1.4, 0.3)
      const bannerMat = new THREE.MeshStandardMaterial({
        color: info.color,
        emissive: info.color,
        emissiveIntensity: 0.5,
        roughness: 0.2
      })
      const banner = new THREE.Mesh(bannerGeo, bannerMat)
      banner.position.set(0, rackHeight + 1.8, 0)
      aisleContainer.add(banner)

      shelfGroup.add(aisleContainer)
    })
    scene.add(shelfGroup)

    // 8. 3D Shopping Cart Mesh
    const cartGroup = new THREE.Group()
    // Cart basket
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.7,
      roughness: 0.3,
      wireframe: true
    })
    const basket = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 2.4), basketMat)
    basket.position.y = 1.6
    cartGroup.add(basket)

    // Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xef4444 })
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8), handleMat)
    handle.rotation.z = Math.PI / 2
    handle.position.set(0, 2.2, 1.3)
    cartGroup.add(handle)

    // 4 Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a })
    const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12)
    ;[
      [-0.8, -0.9], [0.8, -0.9],
      [-0.8, 0.9],  [0.8, 0.9]
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(wx, 0.25, wz)
      cartGroup.add(wheel)
    })

    // Pulsing Beacon on Cart
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    )
    beacon.position.set(0, 2.5, 0)
    cartGroup.add(beacon)

    cartGroup.position.set(AISLE_COORDS.ENTRANCE.x, 0, AISLE_COORDS.ENTRANCE.z)
    scene.add(cartGroup)
    cartMeshRef.current = cartGroup

    // 9. Interactive Raycaster for Clicking Shelves
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onPointerDown = (e) => {
      isDraggingRef.current = true
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return
      const deltaX = e.clientX - previousMousePositionRef.current.x
      const deltaY = e.clientY - previousMousePositionRef.current.y
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY }

      // Orbit camera rotation
      const cam = cameraRef.current
      if (cam) {
        const speed = 0.005
        const currentRadius = Math.sqrt(cam.position.x ** 2 + cam.position.z ** 2)
        const angle = Math.atan2(cam.position.z, cam.position.x) - deltaX * speed
        cam.position.x = currentRadius * Math.cos(angle)
        cam.position.z = currentRadius * Math.sin(angle)
        cam.position.y = Math.max(15, Math.min(85, cam.position.y + deltaY * 0.15))
        cam.lookAt(cameraTargetRef.current)
      }
    }

    const onPointerUp = () => {
      isDraggingRef.current = false
    }

    const onWheel = (e) => {
      const cam = cameraRef.current
      if (cam) {
        cam.position.multiplyScalar(e.deltaY > 0 ? 1.05 : 0.95)
        cam.lookAt(cameraTargetRef.current)
      }
    }

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, cameraRef.current)
      const intersects = raycaster.intersectObjects(shelfGroup.children, true)
      if (intersects.length > 0) {
        let parent = intersects[0].object
        while (parent && !parent.userData?.aisleKey) {
          parent = parent.parent
        }
        if (parent && parent.userData?.aisleKey) {
          const key = parent.userData.aisleKey
          const info = parent.userData.info
          setSelectedShelfInfo({ key, ...info })
          if (onAisleSelect) onAisleSelect(key)
        }
      }
    }

    const dom = renderer.domElement
    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    dom.addEventListener('wheel', onWheel, { passive: true })
    dom.addEventListener('click', onClick)

    // 10. Animation Loop
    let introStep = 0
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      // Cinematic Introduction Camera Animation
      if (cinematicActive) {
        introStep += 0.008
        if (introStep < 1) {
          camera.position.x = 40 * Math.sin(introStep * Math.PI)
          camera.position.y = 75 - introStep * 35
          camera.position.z = 80 - introStep * 35
          camera.lookAt(0, 2, 0)
        } else {
          setCinematicActive(false)
          // Lock to default isometric
          camera.position.set(0, 38, 48)
          camera.lookAt(0, 0, 0)
        }
      }

      // Rotate beacon on shopping cart
      if (beacon) {
        beacon.rotation.y += 0.05
      }

      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      dom.removeEventListener('wheel', onWheel)
      dom.removeEventListener('click', onClick)
      renderer.dispose()
    }
  }, [])

  // ── Build and Update 3D Path Route Line ──────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Remove old route line
    if (routeLineRef.current) {
      scene.remove(routeLineRef.current)
      routeLineRef.current = null
    }

    // Remove old waypoints
    waypointsMeshesRef.current.forEach(m => scene.remove(m))
    waypointsMeshesRef.current = []

    if (normalizedRoute.length === 0) return

    const pathPoints = buildWalkablePath(normalizedRoute)
    if (pathPoints.length < 2) return

    // Create smooth CatmullRom curve through corridor points
    const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.2)
    pathCurveRef.current = curve

    const curvePoints = curve.getPoints(120)
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints)
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      linewidth: 4,
    })
    const routeLine = new THREE.Line(lineGeo, lineMat)
    scene.add(routeLine)
    routeLineRef.current = routeLine

    // Add glowing destination cylinder pillars for each stop
    normalizedRoute.forEach((stopKey, idx) => {
      const coord = AISLE_COORDS[stopKey]
      if (!coord) return

      const pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 16)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: coord.color,
        emissive: coord.color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6
      })
      const pillar = new THREE.Mesh(pillarGeo, pillarMat)
      pillar.position.set(coord.x, 3, coord.z)
      scene.add(pillar)
      waypointsMeshesRef.current.push(pillar)
    })
  }, [normalizedRoute])

  // ── Animated Cart Navigation Along 3D Curve ─────────────────────────────
  useEffect(() => {
    let timer = null
    if (isPlaying && pathCurveRef.current) {
      timer = setInterval(() => {
        setNavProgress(prev => {
          if (prev >= 1) {
            setIsPlaying(false)
            return 1
          }
          const next = prev + 0.008
          // Update cart 3D position
          if (cartMeshRef.current && pathCurveRef.current) {
            const pos = pathCurveRef.current.getPointAt(Math.min(next, 1))
            cartMeshRef.current.position.copy(pos)

            // Make cart face direction of movement
            const tangent = pathCurveRef.current.getTangentAt(Math.min(next, 1))
            const angle = Math.atan2(tangent.x, tangent.z)
            cartMeshRef.current.rotation.y = angle
          }
          return next
        })
      }, 50)
    }
    return () => clearInterval(timer)
  }, [isPlaying])

  // ── Switch Camera Views ──────────────────────────────────────────────────
  const setCameraView = (mode) => {
    setCameraMode(mode)
    const cam = cameraRef.current
    if (!cam) return

    if (mode === 'topdown') {
      cam.position.set(0, 85, 0.1)
      cam.lookAt(0, 0, 0)
    } else if (mode === 'entrance') {
      cam.position.set(0, 8, 48)
      cam.lookAt(0, 2, 0)
    } else {
      // Isometric Default
      cam.position.set(0, 38, 48)
      cam.lookAt(0, 0, 0)
    }
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-[540px] sm:h-[620px] cursor-grab active:cursor-grabbing" />

      {/* ── Top Floating Overlay HUD ───────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700 shadow-lg pointer-events-auto">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            3D Supermarket Digital Twin
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
            Sector 14 Hub
          </span>
        </div>

        {/* Camera Views Switcher & Skip Intro */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {cinematicActive && (
            <button
              onClick={() => setCinematicActive(false)}
              className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-black shadow-md transition-all flex items-center gap-1"
            >
              <span>⏭️</span>
              <span>Skip Intro Flythrough</span>
            </button>
          )}

          <div className="bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700 flex items-center gap-1 text-xs">
            <button
              onClick={() => setCameraView('isometric')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                cameraMode === 'isometric' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              📐 Isometric
            </button>
            <button
              onClick={() => setCameraView('topdown')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                cameraMode === 'topdown' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ Top-Down
            </button>
            <button
              onClick={() => setCameraView('entrance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                cameraMode === 'entrance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              🚪 Entrance
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation Controls Bar ─────────────────────── */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (navProgress >= 1) {
                setNavProgress(0)
                if (cartMeshRef.current && pathCurveRef.current) {
                  cartMeshRef.current.position.copy(pathCurveRef.current.getPointAt(0))
                }
              }
              setIsPlaying(!isPlaying)
            }}
            disabled={normalizedRoute.length === 0}
            className={`px-4 py-2 rounded-xl font-black text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              isPlaying ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <span>{isPlaying ? '⏸️ Pause' : '🛒 Animate 3D Cart'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false)
              setNavProgress(0)
              if (cartMeshRef.current && pathCurveRef.current) {
                cartMeshRef.current.position.copy(pathCurveRef.current.getPointAt(0))
              }
            }}
            disabled={normalizedRoute.length === 0}
            className="px-3 py-2 rounded-xl font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            Reset
          </button>

          {/* Navigation Progress Bar */}
          {normalizedRoute.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">Progress:</span>
              <div className="w-24 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-emerald-400 transition-all duration-100"
                  style={{ width: `${Math.round(navProgress * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                {Math.round(navProgress * 100)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span>💡 Tip: Click any shelf in 3D to inspect stock & products. Drag to rotate camera.</span>
        </div>
      </div>

      {/* ── Selected Shelf Glass Popup ──────────────────────────── */}
      {selectedShelfInfo && (
        <div className="absolute top-16 right-4 max-w-xs w-full bg-slate-900/95 backdrop-blur-lg border-2 border-slate-700 rounded-3xl p-5 shadow-2xl text-white animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedShelfInfo.icon || '🏬'}</span>
              <div>
                <h4 className="font-black text-sm text-white">AISLE {selectedShelfInfo.key}</h4>
                <p className="text-[11px] text-slate-400">{selectedShelfInfo.label}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedShelfInfo(null)}
              className="text-slate-400 hover:text-white font-bold text-sm w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            Located in main retail floor. High availability fresh stocks replenished every morning at 6:00 AM.
          </p>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (onAisleSelect) onAisleSelect(selectedShelfInfo.key)
                setSelectedShelfInfo(null)
              }}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-center shadow-xs transition-colors"
            >
              Add to Route Planner ➔
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
