import {
  buildMessageHref,
  buildUnavailableMessageContact,
  dedupeMessageContacts,
} from '@/libs/messages';

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

  it('deduplicates quick contacts by existing user id', () => {
    const contacts = dedupeMessageContacts([
      {
        userId: 'user-1',
        name: 'Kerim Imamovic',
        role: 'user',
        href: '/messages?participantId=user-1&context=direct',
        title: 'Kerim Imamovic',
        subtitle: 'Direct chat',
        contextType: 'direct',
      },
      {
        userId: 'user-1',
        name: 'Kerim Imamovic',
        role: 'user',
        href: '/messages?participantId=user-1&orderId=order-1&context=order',
        title: 'Kerim Imamovic',
        subtitle: 'Older order chat',
        contextType: 'order',
        orderId: 'order-1',
      },
      {
        userId: 'user-2',
        name: 'Kerim Imamovic',
        role: 'user',
        href: '/messages?participantId=user-2&context=direct',
        title: 'Kerim Imamovic',
        subtitle: 'Different account with same display name',
        contextType: 'direct',
      },
    ]);

    expect(contacts).toHaveLength(2);
    expect(contacts.map((contact) => contact.userId)).toEqual(['user-1', 'user-2']);
  });

  it('builds a safe fallback contact for deleted conversation participants', () => {
    expect(
      buildUnavailableMessageContact({
        userId: 'deleted-user-1',
        contextType: 'order',
        orderId: 'order-1',
      })
    ).toMatchObject({
      userId: 'deleted-user-1',
      name: 'User not available',
      href: '/messages',
      subtitle: 'This account no longer exists.',
      contextType: 'order',
      orderId: 'order-1',
    });
  });
});
