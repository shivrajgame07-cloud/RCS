import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Stars, Float, RoundedBox } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useRobotStore } from '../store/useRobotStore';

function RobotModel() {
  const meshRef = useRef<THREE.Group>(null);
  const pose = useRobotStore((s) => s.state.pose);

  useFrame((state) => {
    if (meshRef.current) {
      // Smooth interpolation for the digital twin
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, pose.x, 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, pose.y, 0.1);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, -pose.yaw, 0.1);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Robot Chassis */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <RoundedBox args={[1, 0.5, 1.2]} radius={0.1} smoothness={4}>
          <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} emissive="#1d4ed8" emissiveIntensity={0.5} />
        </RoundedBox>
        
        {/* Wheels */}
        <mesh position={[0.6, -0.2, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-0.6, -0.2, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.6, -0.2, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-0.6, -0.2, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        {/* Lidar/Sensor Head */}
        <mesh position={[0, 0.4, 0.3]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={2} />
        </mesh>
      </Float>
    </group>
  );
}

function RobotPath() {
  const points = useMemo(() => [
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(2, 0.05, 1),
    new THREE.Vector3(4, 0.05, -1),
    new THREE.Vector3(6, 0.05, 3),
    new THREE.Vector3(8, 0.05, 2),
  ], []);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial attach="material" color="#8b5cf6" linewidth={10} transition-all />
    </line>
  );
}

export default function RobotScene() {
  return (
    <div className="w-full h-full relative group">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
        <OrbitControls makeDefault />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={5}
          fadeDistance={50}
          fadeStrength={5}
          sectionThickness={1.5}
          sectionColor="#3b82f6"
          cellColor="#1e293b"
        />

        <RobotModel />
        <RobotPath />

        {/* Floating dust particles for atmosphere */}
        <fog attach="fog" args={['#020617', 5, 40]} />
      </Canvas>

      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-2 text-[10px] text-blue-400 font-mono pointer-events-none uppercase tracking-widest">
        Digital Twin Simulation v1.0.4
      </div>
    </div>
  );
}
