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

  it('keeps profile keys grouped for broad invalidation', () => {
    expect(queryKeys.profile.all).toEqual(['profile']);
    expect(queryKeys.profile.detail()).toEqual(['profile', 'detail']);
  });

  it('keeps sound setting keys grouped for broad invalidation', () => {
    expect(queryKeys.soundSettings.all).toEqual(['sound-settings']);
    expect(queryKeys.soundSettings.messages()).toEqual(['sound-settings', 'messages']);
    expect(queryKeys.soundSettings.notifications()).toEqual(['sound-settings', 'notifications']);
  });
});
