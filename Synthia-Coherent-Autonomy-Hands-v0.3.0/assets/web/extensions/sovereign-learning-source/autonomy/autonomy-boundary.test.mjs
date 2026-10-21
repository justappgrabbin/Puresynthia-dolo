import test from 'node:test';
import assert from 'node:assert/strict';
import { ProtectedSettings } from './ProtectedSettings.mjs';
import { ApprovalGovernor } from './ApprovalGovernor.mjs';
import { ArbitraryCodeSandbox } from './ArbitraryCodeSandbox.mjs';
import { ReversibleChangeLedger } from './ReversibleChangeLedger.mjs';

test('settings require owner capability and remain outside self-editing', () => {
  const settings = new ProtectedSettings();
  assert.throws(() => settings.update({ autonomy: { mode: 'full' } }), /OWNER_CAPABILITY/);
  assert.throws(() => settings.assertSelfEditAllowed('autonomy.mode'), /PROTECTED_SETTINGS/);
  settings.update({ autonomy: { ...settings.read().autonomy, mode: 'bounded' } }, settings.ownerCapability());
  assert.equal(settings.read().autonomy.mode, 'bounded');
});

test('72-hour governor accepts only qualified non-protected changes', () => {
  let time = 0;
  const settings = new ProtectedSettings();
  const governor = new ApprovalGovernor({ settings, now: () => time });
  governor.submit({ id: 'good', confidence: .95, resonance: .9, risk: 'low' });
  governor.submit({ id: 'protected', confidence: 1, resonance: 1, risk: 'critical', touchesProtectedSettings: true });
  time = 72 * 60 * 60 * 1000;
  const decisions = governor.governExpired();
  assert.equal(decisions.find(x => x.id === 'good').status, 'governor-approved');
  assert.equal(decisions.find(x => x.id === 'protected').status, 'governor-rejected');
});

test('arbitrary code is staged but cannot execute in the organism realm', async () => {
  const sandbox = new ArbitraryCodeSandbox();
  const staged = sandbox.stage({ code: 'globalThis.compromised = true' });
  const result = await sandbox.run(staged.id);
  assert.equal(result.status, 'sandbox-runner-required');
  assert.equal(globalThis.compromised, undefined);
});

test('back reverses the last accepted change', async () => {
  let value = 0;
  const ledger = new ReversibleChangeLedger();
  await ledger.apply({ id: 'increment', apply: () => ++value, revert: () => --value });
  assert.equal(value, 1);
  await ledger.back();
  assert.equal(value, 0);
});

