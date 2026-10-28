import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Load the real store and presets without requiring native TypeScript support.
function compileModule(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  for (const [specifier, url] of Object.entries(imports)) {
    outputText = outputText.replaceAll(`from '${specifier}'`, `from '${url}'`);
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}

const require = createRequire(import.meta.url);
const presetsURL = compileModule('../src/utils/qualityPresets.ts', {
  three: pathToFileURL(require.resolve('three')).href,
});
const {
  initializeDeviceConfig, getDeviceConfig, reportSceneFPS,
  overrideQualityTier, resetToAutoDetectedTier, QUALITY_UPDATED,
} = await import(compileModule('../src/utils/deviceConfig.ts', { './qualityPresets': presetsURL }));

function setup(t, detectedTier) {
  const saved = new Map();
  const globals = {
    window: new EventTarget(),
    document: { hidden: false },
    localStorage: {
      getItem: key => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
      removeItem: key => saved.delete(key),
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    });
  }
  const clock = { now: 0 };
  t.mock.method(performance, 'now', () => clock.now);
  const metrics = {
    cpuCores: 4, ramGB: 4, pixelRatio: 1, gpuInfo: 'Test GPU', gpuTier: 'medium',
    cpuScore: 50, memoryScore: 70, gpuScore: 65, combinedScore: 0.63,
    detectedTier, isMobile: false, timestamp: 0,
  };
  const initial = initializeDeviceConfig(metrics);
  return { clock, metrics, initial, saved };
}

for (const tier of ['LOW', 'MEDIUM', 'HIGH']) {
  test(`${tier} stays fixed through two minutes of slow frames and a visibility pause`, t => {
    const { clock, initial } = setup(t, tier);
    let qualityChanges = 0;
    window.addEventListener(QUALITY_UPDATED, () => qualityChanges++);
    for (clock.now = 1000; clock.now <= 120000; clock.now += 1000) {
      document.hidden = clock.now >= 40000 && clock.now <= 60000;
      reportSceneFPS('hero', 10);
      reportSceneFPS('model', 15);
      assert.equal(getDeviceConfig().tier, tier);
      assert.equal(getDeviceConfig().preset, initial.preset);
    }
    assert.equal(qualityChanges, 0);
    assert.equal(getDeviceConfig().liveFPS, 10);
  });
}

test('manual quality persists across initialization and reset restores the device default', t => {
  const { clock, metrics, saved } = setup(t, 'MEDIUM');
  overrideQualityTier('HIGH');
  assert.equal(saved.get('__QUALITY_OVERRIDE__'), 'HIGH');
  assert.equal(initializeDeviceConfig(metrics).tier, 'HIGH');
  for (clock.now = 1000; clock.now <= 60000; clock.now += 1000) reportSceneFPS('hero', 5);
  assert.equal(getDeviceConfig().tier, 'HIGH');
  assert.equal(getDeviceConfig().userOverride, 'HIGH');
  resetToAutoDetectedTier();
  assert.equal(getDeviceConfig().tier, 'MEDIUM');
  assert.equal(getDeviceConfig().userOverride, null);
  assert.equal(saved.has('__QUALITY_OVERRIDE__'), false);
});

test('FPS display uses visible recent scenes and pauses without changing quality', t => {
  const { clock } = setup(t, 'MEDIUM');
  reportSceneFPS('hero', 60);
  reportSceneFPS('model', 20);
  assert.equal(getDeviceConfig().liveFPS, 20);
  reportSceneFPS('model', null);
  assert.equal(getDeviceConfig().liveFPS, 60);
  clock.now = 3000;
  reportSceneFPS('model', 30);
  assert.equal(getDeviceConfig().liveFPS, 30);
  document.hidden = true;
  reportSceneFPS('model', null);
  assert.equal(getDeviceConfig().liveFPS, null);
  assert.equal(getDeviceConfig().tier, 'MEDIUM');
});
