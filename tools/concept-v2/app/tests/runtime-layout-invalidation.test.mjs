import assert from 'node:assert/strict';
import test from 'node:test';
import {notifyLayoutInvalidated,subscribeLayoutInvalidation} from '../src/runtime/layout-invalidation.mjs';

test('layout invalidation notifies current consumers and the disposer is isolated and idempotent',()=>{
 const events=[];
 const removeFirst=subscribeLayoutInvalidation(()=>events.push('first'));
 const removeSecond=subscribeLayoutInvalidation(()=>events.push('second'));
 notifyLayoutInvalidated();
 assert.deepEqual(events,['first','second']);
 removeFirst();
 removeFirst();
 notifyLayoutInvalidated();
 assert.deepEqual(events,['first','second','second']);
 removeSecond();
 notifyLayoutInvalidated();
 assert.deepEqual(events,['first','second','second']);
});
