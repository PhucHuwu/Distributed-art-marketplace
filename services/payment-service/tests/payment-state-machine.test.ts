import test from 'node:test';
import assert from 'node:assert/strict';
import { PaymentStatus } from '@prisma/client';
import { __testOnly__assertTransition } from '../src/services/payment.service';

test('allows INITIATED -> PROCESSING transition', () => {
  assert.doesNotThrow(() => {
    __testOnly__assertTransition(PaymentStatus.INITIATED, PaymentStatus.PROCESSING);
  });
});

test('allows PROCESSING -> SUCCESS transition', () => {
  assert.doesNotThrow(() => {
    __testOnly__assertTransition(PaymentStatus.PROCESSING, PaymentStatus.SUCCESS);
  });
});

test('rejects invalid transition INITIATED -> SUCCESS', () => {
  assert.throws(() => {
    __testOnly__assertTransition(PaymentStatus.INITIATED, PaymentStatus.SUCCESS);
  });
});
