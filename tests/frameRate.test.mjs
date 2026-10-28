import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Compile the frame sampler with the project's compiler so the tests
// also work on supported Node versions without native TypeScript support.
const source = readFileSync(new URL('../src/utils/frameRate.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { FrameRateSampler } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('measures completed frames at 60 and 30 FPS', () => {
  for (const expected of [60, 30]) {
    const sampler = new FrameRateSampler();
    let measured = null;
    for (let i = 0; i <= expected + 1; i++) measured = sampler.frame(i * 1000 / expected) ?? measured;
    assert.ok(Math.abs(measured - expected) < 0.01);
  }
});

test('discards hidden-tab pauses and resets on scene changes', () => {
  const sampler = new FrameRateSampler();
  sampler.frame(0);
  sampler.frame(16);
  assert.equal(sampler.frame(10000), null);
  assert.equal(sampler.frame(10016), null);
  sampler.reset();
  assert.equal(sampler.frame(20000), null);
});
