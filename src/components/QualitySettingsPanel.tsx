'use client';

import { useEffect, useState } from 'react';
import {
  getDeviceConfig,
  overrideQualityTier,
  resetToAutoDetectedTier,
  getDebugInfo,
  CONFIG_UPDATED,
} from '@/utils/deviceConfig';
import { DeviceTier } from '@/utils/performanceDetector';
import './QualitySettingsPanel.css';

interface QualitySettingsPanelProps {
  isVisible?: boolean;
}

export default function QualitySettingsPanel({ isVisible = true }: QualitySettingsPanelProps) {
  const [config, setConfig] = useState<ReturnType<typeof getDeviceConfig> | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setConfig(getDeviceConfig());
      } catch {
        // Config not initialized yet
      }
    }, 0);

    const handleOpen = () => setIsExpanded(true);
    const handleConfig = () => setConfig(getDeviceConfig());
    window.addEventListener(CONFIG_UPDATED, handleConfig);
    window.addEventListener('open-quality-settings', handleOpen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-quality-settings', handleOpen);
      window.removeEventListener(CONFIG_UPDATED, handleConfig);
    };
  }, []);

  if (!isVisible || !config) return null;

  const handleTierChange = (tier: DeviceTier) => {
    overrideQualityTier(tier);
    setConfig(getDeviceConfig());

    // Reload page to apply new settings
    window.location.reload();
  };

  const handleReset = () => {
    resetToAutoDetectedTier();
    setConfig(getDeviceConfig());

    // Reload page
    window.location.reload();
  };

  const currentTier = config.tier;
  const isOverridden = config.userOverride !== null;

  return (
    <>
      {isExpanded && (
        <>
          <div className="quality-settings-overlay" onClick={() => setIsExpanded(false)}></div>
          <div className="quality-settings-content">
            <div className="settings-header">
              <h3>Graphics Quality</h3>
              <button
                className="settings-close"
                onClick={() => setIsExpanded(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Current Tier Display */}
            <div className="current-tier-display">
              <p className="tier-label">Current Tier</p>
              <div className={`tier-badge ${currentTier.toLowerCase()}`}>
                {currentTier}
                {isOverridden && <span className="override-indicator">●</span>}
              </div>
              {isOverridden && (
                <p className="override-note">Manual override active</p>
              )}
              {!isOverridden && <p className="override-note">Selected for your device</p>}
              <p className="override-note">Quality stays fixed until you change it.</p>
            </div>

            {/* Tier Selection Buttons */}
            <div className="tier-selection">
              <p className="selection-label">Select Quality Level</p>
              <div className="tier-buttons">
                <button
                  className={`tier-btn low ${currentTier === 'LOW' ? 'active' : ''}`}
                  onClick={() => handleTierChange('LOW')}
                >
                  <span className="tier-name">Low</span>
                  <span className="tier-desc">Mobile / Weak</span>
                </button>
                <button
                  className={`tier-btn medium ${currentTier === 'MEDIUM' ? 'active' : ''}`}
                  onClick={() => handleTierChange('MEDIUM')}
                >
                  <span className="tier-name">Medium</span>
                  <span className="tier-desc">Balanced</span>
                </button>
                <button
                  className={`tier-btn high ${currentTier === 'HIGH' ? 'active' : ''}`}
                  onClick={() => handleTierChange('HIGH')}
                >
                  <span className="tier-name">High</span>
                  <span className="tier-desc">Premium</span>
                </button>
              </div>
            </div>

            {/* Reset Button */}
            {isOverridden && (
              <button className="reset-btn" onClick={handleReset}>
                Reset to Device Default
              </button>
            )}

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat">
                <span className="stat-label">Live FPS:</span>
                <span className="stat-value" data-testid="live-fps">{config.liveFPS === null ? 'Paused' : Math.round(config.liveFPS)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">CPU Cores:</span>
                <span className="stat-value">{config.metrics.cpuCores}</span>
              </div>
              <div className="stat">
                <span className="stat-label">RAM:</span>
                <span className="stat-value">{config.metrics.ramGB}GB</span>
              </div>
              <div className="stat">
                <span className="stat-label">GPU:</span>
                <span className="stat-value capitalize">{config.metrics.gpuTier}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Pixel Ratio:</span>
                <span className="stat-value">{config.metrics.pixelRatio}x</span>
              </div>
            </div>

            {/* Debug Info Toggle */}
            <button
              className="debug-toggle"
              onClick={() => setDebugVisible(!debugVisible)}
            >
              {debugVisible ? '▼' : '▶'} Debug Info
            </button>

            {debugVisible && (
              <pre className="debug-info">
                {getDebugInfo()}
              </pre>
            )}
          </div>
        </>
      )}
    </>
  );
}
