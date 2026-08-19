# Application Description

This document describes what the app does from the point of view of each role and how the major business rules work.

## Short Summary

The project is a food ordering platform where customers browse restaurants and menu items, place orders through Stripe Checkout, track delivery, confirm receipt, review restaurants/couriers, report problems, and message approved contacts. Restaurant admins manage their restaurant, menu, orders, couriers, support tickets, and statistics. Couriers manage availability, delivery tasks, live location sharing, delivery PIN handoff, and delivery history. Super admin manages global platform data and elevated user actions.

## User Roles

### Customer

Customers are normal users who order food.

They can:

- Register, verify email when credentials verification is enabled, and sign in with credentials or Google OAuth.
- Edit profile details such as name, phone, delivery address, and avatar.
- Browse restaurants and menu items.
- Filter, search, sort, and paginate public restaurant/menu views.
- Add menu items to cart when they are available.
- Use coupons and loyalty discounts when eligible.
- See and apply the best available public coupon for the current restaurant cart.
- Checkout through Stripe.
- View order history and order details.
- Reorder a previous order after current menu item prices and availability are rechecked.
- Quickly order again from restaurant details or favorite restaurant cards based on the latest previous order from that restaurant.
- Track order progress and live courier location when delivery starts.
- See a visual order progress stepper for placed, kitchen, transport, and delivered stages.
- See delivery PIN on active delivery orders.
- Confirm final delivery after courier handoff.
- Cancel unpaid orders while they are still in `placed` status.
- Favorite restaurants and menu items.
- Review restaurants and couriers after completed paid orders.
- Report a problem for an order.
- Use approved message threads.
- Request a notification when a restaurant is closed, paused, closing soon, or too busy to accept checkout.

Important customer rules:

- Customers cannot order from their own restaurant.
- Customers cannot checkout again while they already have a paid active order that is not completed or canceled.
- Customers cannot add unavailable menu items to cart or checkout with them.
- Customers cannot checkout from restaurants that are closed, paused, outside delivery radius, blocked by date, inside the final 60 minutes before closing, or at active kitchen capacity.
- Customers can only message contacts allowed by their order flow.

## Admin / Restaurant Owner

Admins usually represent restaurant owners. An admin can own one restaurant and manage its operational workflow.

They can:

- Create, edit, and delete their restaurant.
- Upload restaurant images.
- Configure restaurant location, working hours, blocked dates, tax, courier fee, staff count, preparation estimate, delivery estimate, and active order limit.
- Create, edit, delete, and search menu items.
- Mark menu items as available or unavailable.
- Use the AI menu description helper when creating or editing menu items.
- Create and manage restaurant coupons.
- View restaurant orders.
- View late active-order alerts and open the order queue for lifecycle-stage monitoring.
- See warnings when a ready order has waited too long without a courier.
- Move paid orders from `placed` to `processing` to `ready`.
- Assign available couriers to ready orders with optional notes visible only to the courier.
- View customer delivery location.
- View order time breakdown and estimated timing.
- View daily, weekly, and monthly restaurant reports at `/admin-dashboard/restaurant-reports`.
- Download a PDF report when the selected period has order activity.
- Finalize delivery when a courier has recorded handoff but the customer does not confirm.
- Verify failed-delivery cancellation requests when a courier reports that the customer was unavailable after extended transport time.
- View restaurant review feedback.
- Manage restaurant support tickets.
- Message approved users and couriers.
- Receive notifications for orders, cancellations, paid orders, delivery updates, and support tickets.

Important admin rules:

- Admins cannot update unpaid order status.
- Admins cannot mark an order as delivered. The courier must do that with the delivery PIN.
- Admins can finalize completion only after the order is in `delivered` status.
- Admins can cancel a transported order only after the assigned courier requests failed-delivery verification.
- Restaurant support tickets are scoped to the admin's restaurant.
- Active order limit blocks checkout when the restaurant has too many paid active kitchen orders.
- Late-order alerts warn admins when an active paid order has not reached transportation after the configured threshold.

## Super Admin

Super admin is an admin account whose email matches `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` in the UI and optionally `SUPER_ADMIN_EMAIL` on the server.

Super admin can:

- Manage global categories.
- Manage users.
- Grant and remove admin roles.
- Grant and remove courier roles.
- View global statistics.
- View courier management screens.
- Receive and manage app-support tickets.
- Access elevated admin views protected from normal restaurant admins.
- Verify failed-delivery cancellation for any restaurant order when restaurant ownership does not resolve the issue.

Important super admin rules:

- Super admin actions must stay role-protected.
- App-support tickets should route to super admin rather than a restaurant owner.
- Server-side checks should use `SUPER_ADMIN_EMAIL` where available, with `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` for UI checks.

## Courier

Couriers deliver orders assigned by restaurant admins.

They can:

- View courier dashboard pages.
- Toggle availability.
- Receive assigned delivery notifications.
- View active delivery details.
- Share live location.
- Simulate/manual update location in development/testing flows.
- View delivery map and customer address.
- View estimated delivery time summaries for active and completed deliveries.
- Enter the customer's delivery PIN to record handoff.
- Request failed-delivery cancellation after at least 30 minutes in transport when the customer is unavailable.
- View completed delivery history.
- View courier reviews and ratings.
- Report delivery problems.
- Message approved admins.

Important courier rules:

- Couriers can only mark assigned orders as delivered.
- Courier handoff requires the customer-visible delivery PIN.
- Courier delivery does not immediately complete the order. Customer or restaurant admin confirmation completes it.
- Couriers cannot take multiple active orders when `takenOrder` is already set.
- Failed-delivery cancellation requests keep the courier assigned until restaurant owner or super admin verification.
- Courier-only assignment notes can include pickup or handoff details from the restaurant.

## Restaurant And Menu Logic

Restaurants store:

- owner
- address and coordinates
- contact details
- image gallery
- working hours
- blocked dates
- tax percentage
- courier fee
- average preparation minutes
- average delivery minutes
- active order limit
- total employees

Menu items store:

- restaurant/admin ownership
- name, category, description, image
- prices by size
- availability state

Availability logic:

- Admins can mark a menu item unavailable when ingredients are missing or the item is temporarily sold out.
- Public menu cards show availability badges.
- Unavailable items cannot be added to cart.
- Checkout validates availability again on the server.

Busy restaurant logic:

- Each restaurant has `activeOrderLimit`.
- Checkout counts paid active kitchen orders in `placed`, `processing`, and `ready`.
- When the count reaches the limit, checkout is blocked before Stripe session creation.
- Cart shows a warning and disables checkout when the restaurant detail API reports `isBusy`.
- Checkout also blocks restaurants that are paused, closed by working hours, inside the final 60 minutes before closing, blocked for a date, or outside the configured delivery radius.
- When a restaurant is closed by schedule, the cart can show the next available opening time.
- Customers can request a back-online notification from restaurant details or cart warning states. Waiting requests are marked notified once the restaurant can accept orders again.

Order safety automation:

- Unpaid `placed` orders are automatically canceled after 30 minutes when viewed through order APIs.
- `ready` orders without a courier are warned after 15 minutes and automatically canceled after 60 minutes.
- Automatic cancellations mark the order as unpaid, store a system cancellation reason, notify the customer and restaurant admins, and write an audit log entry.
- Development-only order time simulation can add minutes for timeline phases, failed-delivery testing, and ready-without-courier auto-cancel testing without editing MongoDB timestamps.

## Coupon And Reorder Logic

Coupons:

- Customers can enter a coupon manually.
- Cart can suggest the best public coupon for the current restaurant subtotal.
- Best-coupon suggestions respect date windows, minimum order amount, active status, usage limits, first-order-only rules, and per-customer limits.
- Checkout revalidates the submitted coupon server-side before creating a Stripe session.

Reorder:

- Customers can reorder from `/my-orders` and `/my-orders/[id]`.
- Customers can quick reorder the latest previous order from a restaurant on `/restaurants/[id]` and `/favorite-restaurants`.
- Reorder rebuilds the cart from current `menu_items` data instead of trusting the old order snapshot.
- Deleted, unavailable, invalid, cross-restaurant, or price-mismatched items are blocked or refreshed before checkout.
- Reorder replaces the current cart and sends the customer back to `/cart`.

## Cart And Checkout Logic

The cart is client-side state managed by `CartContext`.

Checkout server rules:

- User must be authenticated.
- Delivery details must be present.
- Cart must contain valid items.
- Cart must contain items from one restaurant only.
- Restaurant must exist.
- Restaurant must currently accept orders based on schedule, the 60-minute-before-closing cutoff, pause state, blocked dates, delivery radius, and active order limit.
- User cannot order from their own restaurant.
- Previous delivered orders must be confirmed before starting another checkout.
- Any paid active order must be completed or canceled before the customer can start another checkout.
- Menu items must still be available.
- Coupon must belong to the restaurant and satisfy date/minimum rules.
- Best coupon suggestions are only UI help until the customer applies them and checkout validates them.
- Loyalty discount is recalculated server-side.
- Restaurant active kitchen capacity must not be full.
- Order is created as unpaid before redirecting to Stripe.
- Stripe webhook later marks payment complete.

## Order Status Logic

Order statuses:

- `placed`: order exists, waiting for payment or restaurant action.
- `processing`: kitchen started preparing it.
- `ready`: kitchen finished; order is ready for courier assignment.
- `transportation`: courier is assigned and delivery is in progress.
- `delivered`: courier entered delivery PIN and recorded handoff.
- `completed`: customer or admin confirmed final delivery.
- `canceled`: unpaid order was canceled before preparation, or a failed delivery was verified by the restaurant owner or super admin.

Timeline fields are stored on the order so the UI can show exact phase durations:

- `processingAt`
- `readyAt`
- `transportationAt`
- `courierDeliveredAt`
- `customerConfirmedDeliveryAt`
- `adminConfirmedDeliveryAt`
- `completedAt`
- `canceledAt`
- `failedDeliveryRequestedAt`
- `failedDeliveryVerifiedAt`

Operational order monitoring:

- `/api/orders/queue` returns active paid orders grouped by lifecycle phase.
- `/admin-dashboard/orders` shows a late-order alert when an active paid order has stayed before transportation for too long.
- The alert links admins to `/admin-dashboard/order-queue` for the full operational view.

## Delivery Confirmation Logic

Delivery is intentionally double-verified.

Flow:

1. Admin marks paid order as ready.
2. Admin assigns a courier.
3. Order becomes `transportation`.
4. Customer sees delivery PIN.
5. Courier arrives and asks for PIN.
6. Courier enters PIN and marks order as `delivered`.
7. Customer confirms receipt and order becomes `completed`.
8. If customer does not confirm, restaurant admin can finalize it.

This prevents a courier from fully completing an order alone.

Failed delivery flow:

1. Courier starts delivery and order is in `transportation`.
2. If the customer is unavailable after at least 30 minutes, courier requests failed-delivery cancellation.
3. Order stays in `transportation` while the request waits for verification.
4. Restaurant owner or super admin verifies the cancellation.
5. Order becomes `canceled`, payment flags are marked unpaid for the app simulation, and the courier is released from `takenOrder`.

Canceled failed deliveries do not count as courier earnings because courier earnings are calculated from completed orders only.

Courier history and performance:

- Completed delivery history includes earnings, delivery-time summaries, ratings, and reliability metrics.
- Courier dashboard metrics can summarize completed deliveries, declined assignments, average delivery minutes, late deliveries, ratings, and earnings without tracking total route mileage.

## Support Ticket Logic

Support tickets are created when users or couriers report a problem.

Ticket targets:

- `restaurant_support`: visible to the restaurant owner for the related restaurant.
- `app_support`: visible to super admin.

Ticket statuses:

- `open`
- `in_review`
- `resolved`

Admins can:

- view tickets
- filter by status
- add response notes
- mark in review
- resolve
- open the related order

## Messaging Logic

The app has an approved internal messaging system.

Rules:

- No customer-to-customer chat.
- Customers can message only approved order contacts.
- Couriers can message admins.
- Admins have broader staff/customer messaging access.
- Messages support delivery/seen state, editing, and per-user hiding/deletion behavior.
- Server-sent events and polling keep unread state fresh.

## Notifications Logic

Notifications are stored per recipient and surfaced in the header/notification center.

Notification examples:

- order placed
- order paid
- order status changed
- courier assigned
- delivery awaiting confirmation
- order completed
- order canceled
- support ticket created
- late active order warning
- phase-specific ETA updates

Notification routing depends on role and metadata. For example, a support ticket notification routes an admin to `/admin-dashboard/support-tickets`, and a failed-delivery review notification routes the restaurant admin to `/admin-dashboard/orders/[id]`.

## Realtime Logic

The app uses server-sent events for lightweight live updates without extra npm packages, service accounts, or new environment variables.

Realtime routes:

- `/api/messages/stream`: pushes message events to the signed-in participant.
- `/api/notifications/stream`: pushes notification events to the signed-in recipient.

SSE events are treated as refresh signals only. MongoDB and the existing JSON APIs remain the source of truth, so notifications, messages, order details, admin order lists, order queue, and courier delivery screens keep polling as a fallback when a stream drops or a serverless instance cannot share in-memory events.

Global message and notification unread state is cached with TanStack Query. SSE handlers invalidate the matching query keys, then the existing API routes reload the latest data.

## Review And Loyalty Logic

Reviews:

- Customers can review restaurants after completed paid orders.
- Customers can review couriers after completed paid delivery orders.
- Review pages aggregate public feedback and ratings.

Loyalty:

- Completed orders count toward loyalty status.
- Loyalty discount is recalculated server-side during checkout.
- The discount applies to the food subtotal according to the loyalty tier.
- `/loyalty` shows recent completed order history and recent loyalty/coupon savings.

## Admin Statistics

Statistics pages summarize operational data for admins and super admin.

Examples:

- order totals
- completed/unsuccessful orders
- user counts
- restaurant statistics
- restaurant owner reports at `/admin-dashboard/restaurant-reports` with daily, weekly, and monthly order, revenue, rate, discount, tax, fee, and top-item summaries

Restaurant report rules:

- Reports are generated from existing order data for the selected period.
- Empty periods show zeros for money, counts, and percentages.
- PDF download is disabled for empty periods because there is no traffic to export.

## External Services

- Stripe: checkout sessions, payment links, webhook payment confirmation.
- Cloudinary: uploaded user, restaurant, and menu images.
- Resend + React Email: verification, reset, and receipt emails.
- Google OAuth: social login through NextAuth.
- OpenAI: server-side menu description generation.
- Upstash Redis: short-lived rate-limit counters for sensitive auth, checkout, support, and AI routes.
- Leaflet: map rendering and courier tracking UI.
- TanStack Query: client-side server-data cache for global message and notification unread state.
- Sentry: error monitoring, tracing, and privacy-masked Session Replay across browser, server, and edge runtimes.

## Date Handling

- MongoDB stores timestamp fields as `Date` values.
- API routes should return ISO date strings or raw date fields, not UI-formatted strings.
- UI, receipt email, and PDF receipt date formatting should go through `libs/dateFormat.ts`.
- Main user-facing date format is `dd/MM/yyyy`; date-time format is `dd/MM/yyyy HH:mm`.

## Is This Good Practice?

Yes. Keeping `ARCHITECTURE.md` and `DESCRIPTION.md` is a good practice for this kind of project because:

- new contributors understand the system faster
- AI tools have better project context
- business rules are less likely to be accidentally removed
- diagrams explain workflows better than code alone
- the README can stay shorter while detailed docs live separately
