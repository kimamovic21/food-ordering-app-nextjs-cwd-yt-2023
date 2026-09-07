import { getOrderDelayNotice } from '@/libs/orderDelay';

describe('order delay notice', () => {
  it('does not warn while an active order is inside estimate plus grace time', () => {
    const notice = getOrderDelayNotice({
      createdAt: '2026-09-07T10:00:00.000Z',
      orderStatus: 'processing',
      estimatedTotalMinutes: 45,
      now: new Date('2026-09-07T10:49:00.000Z'),
    });

    expect(notice).toBeNull();
  });

  it('warns when an active order exceeds the estimate and grace time', () => {
    const notice = getOrderDelayNotice({
      createdAt: '2026-09-07T10:00:00.000Z',
      orderStatus: 'transportation',
      estimatedTotalMinutes: 45,
      now: new Date('2026-09-07T11:00:00.000Z'),
    });

    expect(notice).toEqual(
      expect.objectContaining({
        delayedByMinutes: 15,
        elapsedMinutes: 60,
        expectedMinutes: 45,
      })
    );
  });

  it('uses development duration offsets when calculating a delay', () => {
    const notice = getOrderDelayNotice({
      createdAt: '2026-09-07T10:00:00.000Z',
      orderStatus: 'ready',
      estimatedTotalMinutes: 45,
      now: new Date('2026-09-07T10:20:00.000Z'),
      durationOffsetMinutes: 40,
    });

    expect(notice?.elapsedMinutes).toBe(60);
  });

  it('does not warn for completed or canceled orders', () => {
    expect(
      getOrderDelayNotice({
        createdAt: '2026-09-07T10:00:00.000Z',
        orderStatus: 'completed',
        estimatedTotalMinutes: 20,
        now: new Date('2026-09-07T11:00:00.000Z'),
      })
    ).toBeNull();

    expect(
      getOrderDelayNotice({
        createdAt: '2026-09-07T10:00:00.000Z',
        orderStatus: 'canceled',
        estimatedTotalMinutes: 20,
        now: new Date('2026-09-07T11:00:00.000Z'),
      })
    ).toBeNull();
  });
});
