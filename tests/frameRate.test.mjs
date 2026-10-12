import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Compile the dependency-free policy with the project's compiler so the tests
// also work on supported Node versions without native TypeScript support.
const source = readFileSync(new URL('../src/utils/frameRate.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { FrameRateSampler, AdaptiveQualityPolicy } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

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

test('requires warmup and five sustained slow seconds before stepping down', () => {
  const policy = new AdaptiveQualityPolicy();
  policy.reset(0);
  for (let now = 1000; now < 13000; now += 1000) assert.equal(policy.sample(25, now, 'HIGH', false), null);
  assert.equal(policy.sample(25, 13000, 'HIGH', false), 'MEDIUM');
  for (let now = 14000; now < 33000; now += 1000) assert.equal(policy.sample(25, now, 'MEDIUM', false), null);
  assert.equal(policy.sample(25, 33000, 'MEDIUM', false), 'LOW');
  assert.equal(policy.sample(25, 34000, 'LOW', false), null);
});

test('manual choices never adapt, and fast frames break a slow streak', () => {
  const policy = new AdaptiveQualityPolicy();
  policy.reset(0);
  for (let now = 1000; now < 30000; now += 1000) assert.equal(policy.sample(20, now, 'HIGH', true), null);
  for (let now = 30000; now < 34000; now += 1000) assert.equal(policy.sample(20, now, 'HIGH', false), null);
  assert.equal(policy.sample(60, 34000, 'HIGH', false), null);
  for (let now = 35000; now < 40000; now += 1000) assert.equal(policy.sample(20, now, 'HIGH', false), null);
  assert.equal(policy.sample(20, 40000, 'HIGH', false), 'MEDIUM');
});

test('pauses and invalid measurements cannot trigger a reduction', () => {
  const policy = new AdaptiveQualityPolicy();
  policy.reset(0);
  for (let now = 8000; now < 12000; now += 1000) policy.sample(20, now, 'HIGH', false);
  assert.equal(policy.sample(20, 60000, 'HIGH', false), null);
  assert.equal(policy.sample(NaN, 61000, 'HIGH', false), null);
  assert.equal(policy.sample(0, 62000, 'HIGH', false), null);
  assert.equal(policy.sample(Infinity, 63000, 'HIGH', false), null);
});
