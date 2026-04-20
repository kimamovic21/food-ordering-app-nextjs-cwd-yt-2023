import { calculateDeliveryFee } from '@/libs/deliveryFeeCalculator';

export async function POST(request: Request) {
  try {
    const { latitude, longitude, baseDeliveryFee } = await request.json();

    // Validate input
    if (latitude === undefined || longitude === undefined) {
      return Response.json(
        { error: 'Missing coordinates: latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return Response.json({ error: 'Invalid coordinates: must be numbers' }, { status: 400 });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return Response.json(
        { error: 'Invalid coordinates: latitude must be -90 to 90, longitude -180 to 180' },
        { status: 400 }
      );
    }

    // Calculate fee with optional custom base fee
    const feeBreakdown = await calculateDeliveryFee({ latitude, longitude }, baseDeliveryFee || 5);

    return Response.json(feeBreakdown, { status: 200 });
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return Response.json({ error: 'Failed to calculate delivery fee' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const latitude = parseFloat(url.searchParams.get('latitude') || '');
    const longitude = parseFloat(url.searchParams.get('longitude') || '');
    const baseDeliveryFee = parseFloat(url.searchParams.get('baseDeliveryFee') || '5');

    // Validate input
    if (isNaN(latitude) || isNaN(longitude)) {
      return Response.json(
        { error: 'Missing or invalid coordinates in query parameters' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return Response.json({ error: 'Invalid coordinates range' }, { status: 400 });
    }

    // Calculate fee
    const feeBreakdown = await calculateDeliveryFee({ latitude, longitude }, baseDeliveryFee);

    return Response.json(feeBreakdown, { status: 200 });
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return Response.json({ error: 'Failed to calculate delivery fee' }, { status: 500 });
  }
}
