import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatAppDateTime } from '@/libs/dateFormat';
import type { RestaurantReportSummary } from '@/libs/restaurantReports';

type RestaurantReportPdfDocumentProps = {
  restaurant: {
    name: string;
    street?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
    email?: string | null;
    contact?: string | null;
  };
  report: RestaurantReportSummary;
  generatedAt: Date;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111827',
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 6,
  },
  muted: {
    color: '#6B7280',
  },
  section: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  label: {
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: 700,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 6,
  },
  footer: {
    marginTop: 8,
    fontSize: 9,
    color: '#6B7280',
  },
});

const formatMoney = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;
const formatPercent = (value: number) => `${(Number(value) || 0).toFixed(2)}%`;

export default function RestaurantReportPdfDocument({
  restaurant,
  report,
  generatedAt,
}: RestaurantReportPdfDocumentProps) {
  const address = [restaurant.street, restaurant.postalCode, restaurant.city, restaurant.country]
    .filter(Boolean)
    .join(', ');

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Restaurant Report</Text>
          <Text style={styles.muted}>
            {restaurant.name} - {report.period} report - {report.label}
          </Text>
          <Text style={styles.muted}>Generated: {formatAppDateTime(generatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <Text>{restaurant.name}</Text>
          {address ? <Text style={styles.muted}>{address}</Text> : null}
          {restaurant.email ? <Text style={styles.muted}>Email: {restaurant.email}</Text> : null}
          {restaurant.contact ? (
            <Text style={styles.muted}>Contact: {restaurant.contact}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.grid}>
            <View style={styles.metric}>
              <Text style={styles.label}>Orders</Text>
              <Text style={styles.value}>{report.totalOrders}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.label}>Net Revenue</Text>
              <Text style={styles.value}>{formatMoney(report.netRevenue)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.label}>Average Order</Text>
              <Text style={styles.value}>{formatMoney(report.averageOrderValue)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.label}>Paid Orders</Text>
              <Text style={styles.value}>{report.paidOrders}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.label}>Completed</Text>
              <Text style={styles.value}>{report.completedOrders}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.label}>Canceled</Text>
              <Text style={styles.value}>{report.canceledOrders}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Money</Text>
          <View style={styles.row}>
            <Text>Total paid revenue</Text>
            <Text>{formatMoney(report.totalRevenue)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Net revenue</Text>
            <Text>{formatMoney(report.netRevenue)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Canceled value</Text>
            <Text>{formatMoney(report.canceledValue)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Tax</Text>
            <Text>{formatMoney(report.totalTax)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Delivery fees</Text>
            <Text>{formatMoney(report.deliveryFees)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Coupon discounts</Text>
            <Text>{formatMoney(report.couponDiscounts)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Loyalty discounts</Text>
            <Text>{formatMoney(report.loyaltyDiscounts)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rates</Text>
          <View style={styles.row}>
            <Text>Payment rate</Text>
            <Text>{formatPercent(report.paymentRate)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Completion rate</Text>
            <Text>{formatPercent(report.completionRate)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Cancellation rate</Text>
            <Text>{formatPercent(report.cancellationRate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Items</Text>
          {report.topItems.length > 0 ? (
            report.topItems.map((item) => (
              <View key={item.name} style={styles.row}>
                <Text>
                  {item.name} x {item.quantity}
                </Text>
                <Text>{formatMoney(item.revenue)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No items sold in this period.</Text>
          )}
        </View>

        <Text style={styles.footer}>Food Ordering App restaurant performance report</Text>
      </Page>
    </Document>
  );
}
