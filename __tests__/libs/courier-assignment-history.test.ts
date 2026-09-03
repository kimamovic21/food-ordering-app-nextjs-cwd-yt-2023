import { addCourierAssignmentHistoryEntry } from '@/libs/courierAssignmentHistory';

const objectId = (value: string) => ({
  toString: () => value,
});

const createOrder = (overrides: Record<string, unknown> = {}) =>
  ({
    courierAssignmentHistory: [],
    ...overrides,
  }) as any;

describe('courier assignment history', () => {
  it('records finalized courier assignment attempts', () => {
    const order = createOrder();
    const assignedAt = new Date('2026-08-01T10:00:00.000Z');
    const respondedAt = new Date('2026-08-01T10:04:00.000Z');

    addCourierAssignmentHistoryEntry(order, {
      courierId: objectId('courier-1'),
      status: 'accepted',
      assignedAt,
      respondedAt,
    });

    expect(order.courierAssignmentHistory).toHaveLength(1);
    expect(order.courierAssignmentHistory[0].courierId.toString()).toBe('courier-1');
    expect(order.courierAssignmentHistory[0]).toEqual(
      expect.objectContaining({
        status: 'accepted',
        assignedAt,
        respondedAt,
      })
    );
  });

  it('does not duplicate the same finalized attempt', () => {
    const assignedAt = new Date('2026-08-01T10:00:00.000Z');
    const respondedAt = new Date('2026-08-01T10:04:00.000Z');
    const order = createOrder();

    addCourierAssignmentHistoryEntry(order, {
      courierId: objectId('courier-1'),
      status: 'declined',
      assignedAt,
      respondedAt,
    });
    addCourierAssignmentHistoryEntry(order, {
      courierId: objectId('courier-1'),
      status: 'declined',
      assignedAt,
      respondedAt,
    });

    expect(order.courierAssignmentHistory).toHaveLength(1);
  });

  it('keeps the latest final status for the same assignment attempt', () => {
    const assignedAt = new Date('2026-08-01T10:00:00.000Z');
    const order = createOrder();

    addCourierAssignmentHistoryEntry(order, {
      courierId: objectId('courier-1'),
      status: 'accepted',
      assignedAt,
      respondedAt: new Date('2026-08-01T10:02:00.000Z'),
    });
    addCourierAssignmentHistoryEntry(order, {
      courierId: objectId('courier-1'),
      status: 'declined',
      assignedAt,
      respondedAt: new Date('2026-08-01T10:06:00.000Z'),
    });

    expect(order.courierAssignmentHistory).toHaveLength(1);
    expect(order.courierAssignmentHistory[0]).toEqual(
      expect.objectContaining({
        status: 'declined',
        respondedAt: new Date('2026-08-01T10:06:00.000Z'),
      })
    );
  });

  it('ignores missing courier ids', () => {
    const order = createOrder();

    addCourierAssignmentHistoryEntry(order, {
      courierId: null,
      status: 'expired',
      assignedAt: new Date(),
      respondedAt: new Date(),
    });

    expect(order.courierAssignmentHistory).toEqual([]);
  });
});
