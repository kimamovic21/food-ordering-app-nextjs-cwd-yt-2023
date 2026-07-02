import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatAppDate } from '@/libs/dateFormat';

type ReceiptItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type ReceiptRestaurant = {
  name: string;
  contact?: string | null;
  email?: string | null;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

type PurchaseReceiptPdfDocumentProps = {
  orderId: string;
  customerEmail: string;
  purchasedOn?: Date | string | null;
  restaurant?: ReceiptRestaurant | null;
  items: ReceiptItem[];
  taxAmount: number;
  deliveryFee: number;
  couponCode?: string | null;
  couponDiscountAmount?: number;
  couponDiscountPercentage?: number;
  specialInstructions?: string | null;
  total: number;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 32,
    fontSize: 11,
    color: '#111827',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  metaLabel: {
    color: '#6B7280',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 600,
  },
  section: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    color: '#374151',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  itemSub: {
    color: '#6B7280',
    fontSize: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#374151',
  },
  totalValue: {
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  grandTotalText: {
    fontSize: 12,
    fontWeight: 700,
  },
  footer: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 10,
  },
});

const formatMoney = (amount: number) => `$${(Number(amount) || 0).toFixed(2)}`;

export default function PurchaseReceiptPdfDocument({
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
  specialInstructions,
  total,
}: PurchaseReceiptPdfDocumentProps) {
  const purchasedDate = formatAppDate(purchasedOn || new Date());

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
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Purchase Receipt</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.metaLabel}>Order ID</Text>
              <Text style={styles.metaValue}>{orderId}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Purchased On</Text>
              <Text style={styles.metaValue}>{purchasedDate}</Text>
            </View>
          </View>
        </View>

        {restaurant?.name ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Restaurant</Text>
            <Text style={styles.metaValue}>{restaurant.name}</Text>
            {restaurantAddress ? <Text style={styles.itemSub}>{restaurantAddress}</Text> : null}
            {restaurant.contact ? (
              <Text style={styles.itemSub}>Contact: {restaurant.contact}</Text>
            ) : null}
            {restaurant.email ? (
              <Text style={styles.itemSub}>Email: {restaurant.email}</Text>
            ) : null}
          </View>
        ) : null}

        {specialInstructions ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <Text style={styles.itemSub}>{specialInstructions}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => {
            const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);

            return (
              <View key={`${item.name}-${index}`}>
                <View style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>
                      {item.size} x {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.metaValue}>{formatMoney(lineTotal)}</Text>
                </View>
                {index < items.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            );
          })}

          <View style={styles.divider} />
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Items:</Text>
            <Text style={styles.totalValue}>{formatMoney(itemsTotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>{formatMoney(taxAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Delivery Fee:</Text>
            <Text style={styles.totalValue}>{formatMoney(deliveryFee)}</Text>
          </View>
          {couponDiscountAmount > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>
                Coupon{couponCode ? ` (${couponCode})` : ''}
                {couponDiscountPercentage > 0 ? ` (${couponDiscountPercentage}%)` : ''}:
              </Text>
              <Text style={styles.totalValue}>-{formatMoney(couponDiscountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalText}>Total:</Text>
            <Text style={styles.grandTotalText}>{formatMoney(total)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Customer email: {customerEmail}</Text>
      </Page>
    </Document>
  );
}
