/**
 * Hook to access device configuration and quality presets
 * Use this in Three.js components to adapt rendering based on detected tier
 */

import { useEffect, useState } from 'react';
import {
  getDeviceConfig,
  getActiveTier,
  getActivePreset,
  isLowTier,
  isMediumTier,
  isHighTier,
  DeviceConfigStore,
  QUALITY_UPDATED,
} from '@/utils/deviceConfig';
import { QualityPreset } from '@/utils/qualityPresets';
import { DeviceTier } from '@/utils/performanceDetector';

export interface UseDeviceConfigReturn {
  tier: DeviceTier;
  preset: QualityPreset;
  isLow: boolean;
  isMedium: boolean;
  isHigh: boolean;
  config: DeviceConfigStore;
}

/**
 * Hook to get device configuration
 * Returns tier, preset, and helper flags
 */
export function useDeviceConfig(): UseDeviceConfigReturn | null {
  const [data, setData] = useState<UseDeviceConfigReturn | null>(null);

  useEffect(() => {
    // Use a callback approach to avoid cascading renders
    const update = () => {
      try {
        const config = getDeviceConfig();
        setData({
          tier: getActiveTier(),
          preset: getActivePreset(),
          isLow: isLowTier(),
          isMedium: isMediumTier(),
          isHigh: isHighTier(),
          config,
        });
      } catch {
        // Config not ready yet
        setData(null);
      }
    };
    const timer = setTimeout(update, 0);
    window.addEventListener(QUALITY_UPDATED, update);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(QUALITY_UPDATED, update);
    };
  }, []);

  return data;
}

/**
 * Hook to get only the quality tier
 */
export function useQualityTier(): DeviceTier | null {
  const config = useDeviceConfig();
  return config?.tier || null;
}

/**
 * Hook to get only the quality preset
 */
export function useQualityPreset(): QualityPreset | null {
  const config = useDeviceConfig();
  return config?.preset || null;
}

/**
 * Hook to check if current tier is LOW
 */
export function useIsLowTier(): boolean {
  const config = useDeviceConfig();
  return config?.isLow || false;
}

/**
 * Hook to check if current tier is MEDIUM
 */
export function useIsMediumTier(): boolean {
  const config = useDeviceConfig();
  return config?.isMedium || false;
}

/**
 * Hook to check if current tier is HIGH
 */
export function useIsHighTier(): boolean {
  const config = useDeviceConfig();
  return config?.isHigh || false;
}
