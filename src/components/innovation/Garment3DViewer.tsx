"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { InnovationDesignSpec } from "@/lib/innovation/types";
import type { GarmentPart } from "@/lib/innovation/garment-parts";
import { cn } from "@/lib/utils";

type ViewAngle = "front" | "back" | "side";

interface Garment3DViewerProps {
  spec: InnovationDesignSpec;
  viewAngle?: ViewAngle;
  focusPart?: GarmentPart | null;
  onFocusPart?: (part: GarmentPart | null) => void;
  className?: string;
  dimmed?: boolean;
}

function hexColor(spec: InnovationDesignSpec): string {
  if (spec.colorHex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(spec.colorHex)) {
    return spec.colorHex;
  }
  const map: Record<string, string> = {
    black: "#1a1a1a",
    white: "#f4efe6",
    beige: "#d4c4a8",
    red: "#7a1f1f",
    navy: "#0c2340",
    green: "#1f5c45",
    gold: "#c8a45d",
  };
  return map[spec.colorKey] ?? "#1a1a1a";
}

function PartMesh({
  part,
  focusPart,
  onFocusPart,
  baseColor,
  accent,
  children,
  position,
  rotation,
}: {
  part: GarmentPart;
  focusPart?: GarmentPart | null;
  onFocusPart?: (part: GarmentPart | null) => void;
  baseColor: string;
  accent?: boolean;
  children: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const active = focusPart === part;
  const color = active ? "#c8a45d" : baseColor;

  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onFocusPart?.(active ? null : part);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
      <meshStandardMaterial
        color={color}
        roughness={accent ? 0.35 : 0.72}
        metalness={accent ? 0.55 : 0.08}
        emissive={active ? "#c8a45d" : "#000000"}
        emissiveIntensity={active ? 0.28 : 0}
      />
    </mesh>
  );
}

function DishdashaModel({
  color,
  focusPart,
  onFocusPart,
}: {
  color: string;
  focusPart?: GarmentPart | null;
  onFocusPart?: (part: GarmentPart | null) => void;
}) {
  const gold = "#c8a45d";
  return (
    <group position={[0, -0.15, 0]}>
      <PartMesh part="chest" focusPart={focusPart} onFocusPart={onFocusPart} baseColor={color} position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.38, 0.48, 0.7, 32]} />
      </PartMesh>
      <PartMesh part="waist" focusPart={focusPart} onFocusPart={onFocusPart} baseColor={color} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.48, 0.52, 0.55, 32]} />
      </PartMesh>
      <PartMesh part="hem" focusPart={focusPart} onFocusPart={onFocusPart} baseColor={color} position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.52, 0.58, 0.7, 32]} />
      </PartMesh>
      <PartMesh part="shoulder" focusPart={focusPart} onFocusPart={onFocusPart} baseColor={color} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.95, 0.18, 0.42]} />
      </PartMesh>
      <mesh position={[0, 1.12, 0.02]} castShadow>
        <torusGeometry args={[0.16, 0.035, 12, 24]} />
        <meshStandardMaterial color={gold} roughness={0.35} metalness={0.55} />
      </mesh>
      <PartMesh
        part="sleeve"
        focusPart={focusPart}
        onFocusPart={onFocusPart}
        baseColor={color}
        position={[-0.62, 0.55, 0]}
        rotation={[0, 0, 0.35]}
      >
        <cylinderGeometry args={[0.11, 0.13, 0.75, 16]} />
      </PartMesh>
      <PartMesh
        part="sleeve"
        focusPart={focusPart}
        onFocusPart={onFocusPart}
        baseColor={color}
        position={[0.62, 0.55, 0]}
        rotation={[0, 0, -0.35]}
      >
        <cylinderGeometry args={[0.11, 0.13, 0.75, 16]} />
      </PartMesh>
      <PartMesh
        part="embroidery"
        focusPart={focusPart}
        onFocusPart={onFocusPart}
        baseColor={gold}
        accent
        position={[0, 0.72, 0.39]}
      >
        <boxGeometry args={[0.42, 0.06, 0.02]} />
      </PartMesh>
    </group>
  );
}

function AbayaModel({
  color,
  focusPart,
  onFocusPart,
}: {
  color: string;
  focusPart?: GarmentPart | null;
  onFocusPart?: (part: GarmentPart | null) => void;
}) {
  const gold = "#c8a45d";
  return (
    <group position={[0, -0.1, 0]}>
      <PartMesh part="chest" focusPart={focusPart} onFocusPart={onFocusPart} baseColor={color} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.42, 0.55, 0.75, 36]} />
      </PartMesh>
      <PartMesh part="waist" focusPart={focusPart} onFocusPart={onFocusPart} baseColor={color} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 0.55, 36]} />
      </PartMesh>
      <PartMesh part="hem" focusPart={focusPart} onFocusPart={onFocusPart} baseColor={color} position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.62, 0.78, 0.85, 36]} />
      </PartMesh>
      <PartMesh part="shoulder" focusPart={focusPart} onFocusPart={onFocusPart} baseColor={color} position={[0, 1.02, 0]}>
        <boxGeometry args={[1.05, 0.16, 0.45]} />
      </PartMesh>
      <PartMesh
        part="sleeve"
        focusPart={focusPart}
        onFocusPart={onFocusPart}
        baseColor={color}
        position={[-0.7, 0.45, 0]}
        rotation={[0, 0, 0.55]}
      >
        <cylinderGeometry args={[0.16, 0.22, 0.9, 18]} />
      </PartMesh>
      <PartMesh
        part="sleeve"
        focusPart={focusPart}
        onFocusPart={onFocusPart}
        baseColor={color}
        position={[0.7, 0.45, 0]}
        rotation={[0, 0, -0.55]}
      >
        <cylinderGeometry args={[0.16, 0.22, 0.9, 18]} />
      </PartMesh>
      <PartMesh
        part="embroidery"
        focusPart={focusPart}
        onFocusPart={onFocusPart}
        baseColor={gold}
        accent
        position={[0, 0.78, 0.44]}
      >
        <boxGeometry args={[0.5, 0.05, 0.02]} />
      </PartMesh>
    </group>
  );
}

function Scene({
  spec,
  viewAngle,
  focusPart,
  onFocusPart,
}: {
  spec: InnovationDesignSpec;
  viewAngle: ViewAngle;
  focusPart?: GarmentPart | null;
  onFocusPart?: (part: GarmentPart | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const color = hexColor(spec);

  useFrame((_, dt) => {
    if (!group.current) return;
    const targetY =
      viewAngle === "back" ? Math.PI : viewAngle === "side" ? -Math.PI / 2.2 : 0;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 4, dt);
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <Environment preset="apartment" />
      <group ref={group}>
        {spec.category === "dishdasha" ? (
          <DishdashaModel color={color} focusPart={focusPart} onFocusPart={onFocusPart} />
        ) : (
          <AbayaModel color={color} focusPart={focusPart} onFocusPart={onFocusPart} />
        )}
      </group>
      <ContactShadows position={[0, -1.35, 0]} opacity={0.45} scale={8} blur={2.4} far={3} />
      <RoundedBox args={[3.2, 0.04, 3.2]} radius={0.04} position={[0, -1.38, 0]}>
        <meshStandardMaterial color="#e8e2d6" roughness={0.9} />
      </RoundedBox>
      <OrbitControls
        enablePan={false}
        minDistance={2.4}
        maxDistance={5.5}
        minPolarAngle={0.6}
        maxPolarAngle={1.45}
        target={[0, 0.2, 0]}
      />
    </>
  );
}

export function Garment3DViewer({
  spec,
  viewAngle = "front",
  focusPart,
  onFocusPart,
  className,
  dimmed,
}: Garment3DViewerProps) {
  const key = useMemo(
    () => `${spec.category}-${spec.colorKey}-${spec.colorHex ?? ""}`,
    [spec.category, spec.colorKey, spec.colorHex]
  );

  return (
    <div
      className={cn(
        "relative h-[380px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#eef2f6] to-[#dfe6ee]",
        dimmed && "opacity-70 grayscale-[0.15]",
        className
      )}
    >
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-navy/50">
            جاري تحميل المجسم ثلاثي الأبعاد...
          </div>
        }
      >
        <Canvas
          key={key}
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 0.6, 3.6], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene
            spec={spec}
            viewAngle={viewAngle}
            focusPart={focusPart}
            onFocusPart={onFocusPart}
          />
        </Canvas>
      </Suspense>
      <div className="pointer-events-none absolute bottom-2 inset-x-0 text-center text-[10px] text-navy/45">
        اسحب للتدوير · اضغط على جزء للتعديل · مجسم 3D تفاعلي (WebGL)
      </div>
    </div>
  );
}
