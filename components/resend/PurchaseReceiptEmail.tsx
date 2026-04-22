import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

type ReceiptItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string | null;
};

type PurchaseReceiptEmailProps = {
  orderId: string;
  customerEmail: string;
  purchasedOn?: Date | string | null;
  restaurant?: {
    name: string;
    contact?: string | null;
    email?: string | null;
    street?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  items: ReceiptItem[];
  taxAmount: number;
  deliveryFee: number;
  couponCode?: string | null;
  couponDiscountAmount?: number;
  couponDiscountPercentage?: number;
  total: number;
};

const formatMoney = (amount: number) => `$${(Number(amount) || 0).toFixed(2)}`;

const receiptCardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '24px',
  backgroundColor: '#ffffff',
} as const;

const labelStyle = {
  margin: '0 0 6px',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#6b7280',
} as const;

const valueStyle = {
  margin: 0,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#111827',
  fontWeight: 600,
} as const;

export default function PurchaseReceiptEmail({
  orderId,
  customerEmail,
  purchasedOn,
  restaurant,
  items,
  taxAmount,
  deliveryFee,
  couponCode,
  couponDiscountAmount = 0,
  couponDiscountPercentage = 0,
  total,
}: PurchaseReceiptEmailProps) {
  const purchasedDate = purchasedOn
    ? new Date(purchasedOn).toLocaleDateString()
    : new Date().toLocaleDateString();

  const itemsTotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  const restaurantAddress = [
    restaurant?.street,
    restaurant?.postalCode,
    restaurant?.city,
    restaurant?.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Html>
      <Head />
      <Preview>Your purchase receipt for order {orderId}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f7f7f8',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Container
          style={{ width: '100%', maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}
        >
          <Section style={{ ...receiptCardStyle, padding: '28px' }}>
            <Heading
              style={{ margin: '0 0 18px', fontSize: '34px', lineHeight: '40px', color: '#111827' }}
            >
              Purchase Receipt
            </Heading>

            <Row>
              <Column>
                <Text style={labelStyle}>Order ID</Text>
                <Text style={valueStyle}>{orderId}</Text>
              </Column>
              <Column>
                <Text style={labelStyle}>Purchased On</Text>
                <Text style={valueStyle}>{purchasedDate}</Text>
              </Column>
            </Row>

            {restaurant?.name ? (
              <Section
                style={{
                  marginTop: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  backgroundColor: '#fafafa',
                }}
              >
                <Text style={{ margin: '0 0 6px', fontSize: '13px', color: '#6b7280' }}>
                  Restaurant
                </Text>
                <Text style={{ margin: 0, fontSize: '16px', lineHeight: '24px', color: '#111827' }}>
                  {restaurant.name}
                </Text>
                {restaurantAddress ? (
                  <Text style={{ margin: '4px 0 0', fontSize: '13px', color: '#4b5563' }}>
                    {restaurantAddress}
                  </Text>
                ) : null}
                {restaurant.contact ? (
                  <Text style={{ margin: '4px 0 0', fontSize: '13px', color: '#4b5563' }}>
                    Contact: {restaurant.contact}
                  </Text>
                ) : null}
                {restaurant.email ? (
                  <Text style={{ margin: '4px 0 0', fontSize: '13px', color: '#4b5563' }}>
                    Email: {restaurant.email}
                  </Text>
                ) : null}
              </Section>
            ) : null}

            <Hr style={{ borderColor: '#e5e7eb', margin: '22px 0' }} />

            <Section style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px' }}>
              {items.map((item, index) => {
                const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

                return (
                  <Section
                    key={`${item.name}-${index}`}
                    style={{ paddingBottom: index === items.length - 1 ? 0 : 16 }}
                  >
                    <Row>
                      <Column style={{ width: '72px', verticalAlign: 'top' }}>
                        {item.image ? (
                          <Img
                            src={item.image}
                            alt={item.name}
                            width='56'
                            height='56'
                            style={{
                              borderRadius: '12px',
                              objectFit: 'cover',
                              border: '1px solid #e5e7eb',
                            }}
                          />
                        ) : (
                          <Section
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '12px',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                            }}
                          />
                        )}
                      </Column>

                      <Column style={{ verticalAlign: 'top' }}>
                        <Text
                          style={{
                            margin: '0 0 4px',
                            fontSize: '16px',
                            lineHeight: '24px',
                            fontWeight: 700,
                            color: '#111827',
                          }}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            lineHeight: '20px',
                            color: '#6b7280',
                          }}
                        >
                          {item.size} x {item.quantity}
                        </Text>
                      </Column>

                      <Column align='right' style={{ verticalAlign: 'top' }}>
                        <Text
                          style={{
                            margin: 0,
                            fontSize: '16px',
                            lineHeight: '24px',
                            fontWeight: 700,
                            color: '#111827',
                          }}
                        >
                          {formatMoney(lineTotal)}
                        </Text>
                      </Column>
                    </Row>

                    {index < items.length - 1 ? (
                      <Hr style={{ borderColor: '#ececec', margin: '16px 0 0' }} />
                    ) : null}
                  </Section>
                );
              })}

              <Section style={{ marginTop: '16px' }}>
                <Row>
                  <Column style={{ width: '70%' }}>
                    <Text
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '22px',
                        color: '#4b5563',
                        textAlign: 'left',
                      }}
                    >
                      Items:
                    </Text>
                  </Column>
                  <Column align='right' style={{ width: '30%' }}>
                    <Text
                      style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: '#111827' }}
                    >
                      {formatMoney(itemsTotal)}
                    </Text>
                  </Column>
                </Row>
                <Row>
                  <Column style={{ width: '70%' }}>
                    <Text
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '22px',
                        color: '#4b5563',
                        textAlign: 'left',
                      }}
                    >
                      Tax:
                    </Text>
                  </Column>
                  <Column align='right' style={{ width: '30%' }}>
                    <Text
                      style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: '#111827' }}
                    >
                      {formatMoney(taxAmount)}
                    </Text>
                  </Column>
                </Row>
                <Row>
                  <Column style={{ width: '70%' }}>
                    <Text
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '22px',
                        color: '#4b5563',
                        textAlign: 'left',
                      }}
                    >
                      Delivery Fee:
                    </Text>
                  </Column>
                  <Column align='right' style={{ width: '30%' }}>
                    <Text
                      style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: '#111827' }}
                    >
                      {formatMoney(deliveryFee)}
                    </Text>
                  </Column>
                </Row>
                {couponDiscountAmount > 0 ? (
                  <Row>
                    <Column style={{ width: '70%' }}>
                      <Text
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: '22px',
                          color: '#4b5563',
                          textAlign: 'left',
                        }}
                      >
                        Coupon{couponCode ? ` (${couponCode})` : ''}
                        {couponDiscountPercentage > 0 ? ` (${couponDiscountPercentage}%)` : ''}:
                      </Text>
                    </Column>
                    <Column align='right' style={{ width: '30%' }}>
                      <Text
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: '22px',
                          color: '#16a34a',
                        }}
                      >
                        -{formatMoney(couponDiscountAmount)}
                      </Text>
                    </Column>
                  </Row>
                ) : null}
                <Hr style={{ borderColor: '#e5e7eb', margin: '8px 0' }} />
                <Row>
                  <Column style={{ width: '70%' }}>
                    <Text
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        lineHeight: '24px',
                        fontWeight: 700,
                        color: '#111827',
                        textAlign: 'left',
                      }}
                    >
                      Total:
                    </Text>
                  </Column>
                  <Column align='right' style={{ width: '30%' }}>
                    <Text
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        lineHeight: '24px',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      {formatMoney(total)}
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            <Text
              style={{ margin: '16px 0 0', fontSize: '12px', lineHeight: '18px', color: '#6b7280' }}
            >
              Customer email: {customerEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
