import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Float, RoundedBox, Html } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useRobotStore } from '../store/useRobotStore';
import { motion } from 'motion/react';

function RobotModel() {
  const meshRef = useRef<THREE.Group>(null);
  const pose = useRobotStore((s) => s.state.pose);
  const followCamera = useRobotStore((s) => s.followCamera);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      // Smooth interpolation for the digital twin
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, pose.x, 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, pose.y, 0.1);
      // Corrected rotation logic - facing X+ at yaw 0
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, pose.yaw, 0.1);

      if (followCamera) {
        const offset = new THREE.Vector3(
          -Math.cos(meshRef.current.rotation.y) * 12, 
          10, 
          -Math.sin(meshRef.current.rotation.y) * 12
        );
        const targetPos = meshRef.current.position.clone().add(offset);
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(meshRef.current.position);
      }
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.1}>
        {/* Rotate entire visual group to face X+ (forward) at rotation.y = 0 */}
        <group rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[1.2, 0.4, 1.8]} radius={0.1} smoothness={4} position={[0, 0.4, 0]}>
            <meshStandardMaterial color="#ffffff" metalness={0.7} roughness={0.1} />
          </RoundedBox>
          
          <mesh position={[0, 0.41, 0]}>
            <boxGeometry args={[0.8, 0.4, 1]} />
            <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Scientific Instrument Box (White) */}
          <mesh position={[0, 0.8, -0.4]}>
            <boxGeometry args={[0.6, 0.2, 0.5]} />
            <meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.2} />
          </mesh>

          {/* Laser Scanner / Lidar (Red) */}
          <mesh position={[0, 0.95, -0.4]}>
            <cylinderGeometry args={[0.08, 0.08, 0.15, 32]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
          </mesh>

          {/* Camera Mast (White/Red accents) - Responsive to Servo Angle */}
          <group position={[0, 0.6, 0.6]} rotation={[0, (useRobotStore.getState().state.sensors.servoAngle - 90) * (Math.PI / 180), 0]}>
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[0.08, 0.8, 0.08]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <boxGeometry args={[0.3, 0.15, 0.15]} />
              <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0, 0.8, 0.08]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial color="#333" emissive="#ff0000" emissiveIntensity={1} />
            </mesh>
            
            {/* Ultrasonic Sensor visualization (HC-SR04) */}
            <group position={[0, 0.8, 0.1]}>
               <mesh rotation={[Math.PI/2, 0, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.05, 16]} />
                  <meshStandardMaterial color="#444" />
               </mesh>
               <mesh rotation={[Math.PI/2, 0, 0]} position={[0.08, 0, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.05, 16]} />
                  <meshStandardMaterial color="#444" />
               </mesh>
               <mesh rotation={[Math.PI/2, 0, 0]} position={[-0.08, 0, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.05, 16]} />
                  <meshStandardMaterial color="#444" />
               </mesh>
            </group>
          </group>
          
          {/* Wheels - Technical Metallic White/Red trim */}
          {[
            [0.75, 0.2, 0.7], [-0.75, 0.2, 0.7],
            [0.85, 0.2, 0], [-0.85, 0.2, 0],
            [0.75, 0.2, -0.7], [-0.75, 0.2, -0.7]
          ].map((pos, i) => (
            <group key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
                <meshStandardMaterial color="#333" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.11, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[0, -0.11, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
                <meshStandardMaterial color="#ef4444" />
              </mesh>
            </group>
          ))}

          {/* Antennae */}
          <mesh position={[0.4, 0.7, -0.7]}>
            <cylinderGeometry args={[0.01, 0.01, 0.8, 8]} />
            <meshStandardMaterial color="#ccc" />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function TargetMarker() {
  const target = useRobotStore((s) => s.target);
  if (!target) return null;

  return (
    <group position={[target.x, 0.01, target.y]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.15, 32]} />
        <meshBasicMaterial color="#00f2ff" />
      </mesh>
      <pointLight color="#00f2ff" intensity={1} distance={3} />
      
      <Html center distanceFactor={10} position={[0, 1, 0]}>
        <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-400 px-2 py-1 rounded text-[8px] text-cyan-400 font-mono whitespace-nowrap uppercase tracking-tighter">
          TARGET: {target.x.toFixed(1)}, {target.y.toFixed(1)}
        </div>
      </Html>
    </group>
  );
}

function RobotPath() {
  const path = useRobotStore((s) => s.path);
  
  const lineGeometry = useMemo(() => {
    if (!path || path.length < 2) return null;
    return new THREE.BufferGeometry().setFromPoints(path);
  }, [path]);

  if (!lineGeometry) return null;

  return (
    <group>
      <primitive object={new THREE.Line(lineGeometry, 
        new THREE.LineBasicMaterial({ color: '#00f2ff', transparent: true, opacity: 0.8 })
      )} />
      {/* Thicker glow effect using multiple lines or just the one with transparency */}
      <primitive object={new THREE.Line(lineGeometry, 
        new THREE.LineBasicMaterial({ color: '#00ccff', transparent: true, opacity: 0.3, linewidth: 3 } as any)
      )} />
    </group>
  );
}

function InteractionPlane() {
  const setTarget = useRobotStore((s) => s.setTarget);
  const addLog = useRobotStore((s) => s.addLog);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    setTarget({ x: point.x, y: point.z });
    addLog(`NAV: SET TARGET TO [${point.x.toFixed(2)}, ${point.z.toFixed(2)}]`);
  };

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onClick={handleClick}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0.0} />
    </mesh>
  );
}

export default function RobotScene() {
  return (
    <div className="w-full h-full relative group bg-black">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [10, 10, 10], fov: 45 }}>
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={50} />
        
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <pointLight position={[-10, 5, -10]} color="#00f2ff" intensity={1} />

        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={10}
          fadeDistance={60}
          fadeStrength={15}
          sectionThickness={3}
          sectionColor="#00f2ff"
          cellColor="#083344"
          cellThickness={1.5}
        />
        <Grid
          infiniteGrid
          cellSize={0.2}
          sectionSize={1}
          fadeDistance={30}
          fadeStrength={10}
          sectionThickness={1}
          sectionColor="#083344"
          cellColor="#020617"
          cellThickness={0.5}
          position={[0, -0.01, 0]}
        />
        
        {/* Origin Axis Helper */}
        <group scale={2}>
          <mesh position={[0.5, 0.02, 0]}>
            <boxGeometry args={[1, 0.01, 0.01]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[0.01, 1, 0.01]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <mesh position={[0, 0.02, 0.5]}>
            <boxGeometry args={[0.01, 0.01, 1]} />
            <meshBasicMaterial color="#0000ff" />
          </mesh>
        </group>

        <RobotModel />
        <RobotPath />
        <TargetMarker />
        <InteractionPlane />

        <fog attach="fog" args={['#020617', 10, 60]} />
      </Canvas>

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 pointer-events-none flex flex-col gap-1 shadow-2xl">
        <div className="text-[10px] text-cyan-400 font-bold font-mono uppercase tracking-[0.2em]">
          Digital Twin v2.0.0
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[8px] text-white/40 font-mono uppercase">Neural Pathfinding Active</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={() => useRobotStore.getState().setFollowCamera(!useRobotStore.getState().followCamera)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all backdrop-blur-xl text-[10px] font-bold uppercase tracking-widest
            ${useRobotStore((s) => s.followCamera) 
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.2)]' 
              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${useRobotStore((s) => s.followCamera) ? 'bg-cyan-400 animate-pulse' : 'bg-white/20'}`} />
          {useRobotStore((s) => s.followCamera) ? 'Camera Follow: ON' : 'Camera Follow: OFF'}
        </button>
      </div>

      <div className="absolute bottom-4 right-4 text-[9px] text-white/20 font-mono uppercase bg-black/20 px-2 py-1 rounded">
        Click floor to set target
      </div>
    </div>
  );
}
