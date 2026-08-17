import { buildMessageHref } from '@/libs/messages';

vi.mock('server-only', () => ({}));

describe('message helpers', () => {
  it('builds inbox query links so conversations open inside the messages page', () => {
    expect(
      buildMessageHref({
        userId: '64a000000000000000000001',
        name: 'John Courier',
        role: 'courier',
        href: '',
        title: 'John Courier',
        subtitle: 'Courier',
        contextType: 'order',
        orderId: '64a000000000000000000002',
      })
    ).toBe(
      '/messages?participantId=64a000000000000000000001&orderId=64a000000000000000000002&context=order'
    );
  });
});
