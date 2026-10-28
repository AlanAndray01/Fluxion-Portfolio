/**
 * Quality Presets Configuration
 * Defines rendering parameters for each device tier
 * Selected at initialization and kept fixed unless the user changes quality.
 */

import * as THREE from 'three';
import { DeviceTier } from './performanceDetector';

export interface QualityPreset {
  // Rendering
  pixelRatio: number;
  antialias: boolean;
  
  // Shadows
  shadowsEnabled: boolean;
  shadowMapType: 'PCFShadowMap' | 'PCFSoftShadowMap' | 'VSMShadowMap';
  
  // Geometry
  sphereSegments: number; // geometry segments for spheres
  bubbleCount: number; // Number of bubbles
  
  // Typography
  textCurveSegments: number;
  textBevelSegments: number;

  // Interactivity
  mouseMultiplier: number;
  textRotationMultiplier: number;
  
  // Materials
  materialType: 'MeshBasicMaterial' | 'MeshStandardMaterial' | 'MeshPhysicalMaterial';
  materialProps: {
    roughness?: number;
    metalness?: number;
    clearcoat?: number;
  };
  
  // Lighting
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  pointLightCount: number;
  
  // Animations
  gsapAnimationsEnabled: boolean;
  gsapScrubValue: number; // Seconds for scroll animations to catch up; lower is more responsive.
  particleEffectsEnabled: boolean;
  
  // Environment
  roomEnvironmentQuality: number; // 0-1, lower = simpler
  
  // Mobile-specific
  mobileOptimizations: boolean;
  reduceDrawCalls: boolean;
  
  // Debug info
  name: string;
}

/**
 * LOW Quality Preset
 * For old phones, weak laptops, very low-end devices
 * Focus: Stability over visuals
 */
export const qualityPresets: Record<DeviceTier, QualityPreset> = {
  LOW: {
    pixelRatio: 1,
    antialias: false,
    shadowsEnabled: false,
    shadowMapType: 'PCFShadowMap',
    sphereSegments: 16, // Very low poly
    bubbleCount: 100, // Fewer bubbles
    materialType: 'MeshBasicMaterial',
    materialProps: {
      roughness: 0.5,
      metalness: 0,
    },
    ambientLightIntensity: 0.8,
    directionalLightIntensity: 0.6,
    pointLightCount: 0,
    gsapAnimationsEnabled: true, // Basic animations only
    gsapScrubValue: 2.0, // Heavier scrub = less responsive but smoother
    particleEffectsEnabled: false,
    textCurveSegments: 4,
    textBevelSegments: 1,
    mouseMultiplier: 2,
    textRotationMultiplier: 0.5,
    roomEnvironmentQuality: 0,
    mobileOptimizations: true,
    reduceDrawCalls: true,
    name: 'LOW - Mobile/Weak Device',
  },

  MEDIUM: {
    pixelRatio: 1.5,
    antialias: true,
    shadowsEnabled: true,
    shadowMapType: 'PCFSoftShadowMap',
    sphereSegments: 32, // Medium poly
    bubbleCount: 200,
    materialType: 'MeshStandardMaterial',
    materialProps: {
      roughness: 0.7,
      metalness: 0.34,
    },
    ambientLightIntensity: 0.64,
    directionalLightIntensity: 0.9,
    pointLightCount: 1,
    gsapAnimationsEnabled: true,
    gsapScrubValue: 1.2, // Moderate scrub
    particleEffectsEnabled: false,
    textCurveSegments: 8,
    textBevelSegments: 3,
    mouseMultiplier: 4,
    textRotationMultiplier: 0.35,
    roomEnvironmentQuality: 0.04,
    mobileOptimizations: true,
    reduceDrawCalls: false,
    name: 'MEDIUM - Balanced',
  },

  HIGH: {
    pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 2,
    antialias: true,
    shadowsEnabled: true,
    shadowMapType: 'PCFSoftShadowMap',
    sphereSegments: 64, // High poly (default)
    bubbleCount: 350,
    materialType: 'MeshPhysicalMaterial',
    materialProps: {
      roughness: 0.7,
      metalness: 0.34,
      clearcoat: 0.48,
    },
    ambientLightIntensity: 0.64,
    directionalLightIntensity: 1.1,
    pointLightCount: 2,
    gsapAnimationsEnabled: true,
    gsapScrubValue: 0.6, // Responsive scrub
    particleEffectsEnabled: true,
    textCurveSegments: 12,
    textBevelSegments: 8,
    mouseMultiplier: 5,
    textRotationMultiplier: 0.25,
    roomEnvironmentQuality: 0.04,
    mobileOptimizations: false,
    reduceDrawCalls: false,
    name: 'HIGH - Premium',
  },
};

/**
 * Get preset for detected tier
 */
export function getQualityPreset(tier: DeviceTier): QualityPreset {
  return qualityPresets[tier];
}

/**
 * Get preset name for UI display
 */
export function getPresetName(tier: DeviceTier): string {
  return qualityPresets[tier].name;
}

/**
 * Create THREE material based on preset
 * This ensures materials are created according to device tier
 */
export function createMaterialForTier(
  tier: DeviceTier,
  color: string = '#91c8e4',
  emissive: string = '#000000'
): THREE.Material {
  const preset = getQualityPreset(tier);

  if (preset.materialType === 'MeshBasicMaterial') {
    const material = new THREE.MeshBasicMaterial({
      color,
    });
    return material;
  } else if (preset.materialType === 'MeshStandardMaterial') {
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive,
      roughness: preset.materialProps.roughness || 0.7,
      metalness: preset.materialProps.metalness || 0.34,
    });
    return material;
  } else {
    // MeshPhysicalMaterial (HIGH tier)
    const material = new THREE.MeshPhysicalMaterial({
      color,
      emissive,
      roughness: preset.materialProps.roughness || 0.7,
      metalness: preset.materialProps.metalness || 0.34,
      clearcoat: preset.materialProps.clearcoat || 0.48,
      clearcoatRoughness: 0.2,
    });
    return material;
  }
}
