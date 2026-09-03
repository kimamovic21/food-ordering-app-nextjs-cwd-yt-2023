export type OrderPhaseDurationOffsetKey =
  'waitingForKitchen' | 'kitchenPreparation' | 'deliveryTravel' | 'confirmationWait';

export type OrderPhaseDurationOffsets = Partial<
  Record<
    | OrderPhaseDurationOffsetKey
    | 'failedDeliveryWait'
    | 'readyWithoutCourierWait'
    | 'courierAssignmentWait'
    | 'totalOrderTime',
    number
  >
>;
