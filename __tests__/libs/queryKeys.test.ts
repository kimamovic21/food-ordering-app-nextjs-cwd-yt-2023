import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/libs/queryKeys';

describe('queryKeys', () => {
  it('keeps notification keys grouped for broad invalidation', () => {
    expect(queryKeys.notifications.all).toEqual(['notifications']);
    expect(queryKeys.notifications.list()).toEqual(['notifications', 'list']);
  });

  it('keeps message keys grouped for broad invalidation', () => {
    expect(queryKeys.messages.all).toEqual(['messages']);
    expect(queryKeys.messages.summary()).toEqual(['messages', 'summary']);
  });
});
