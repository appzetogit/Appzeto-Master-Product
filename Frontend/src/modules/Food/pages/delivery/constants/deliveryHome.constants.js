export const PICKUP_REACHED_THRESHOLD_METERS = 120;
export const DROP_REACHED_THRESHOLD_METERS = 90;
export const ROUTE_OFF_TRACK_THRESHOLD_METERS = 40;

/** Min time between PATCH /availability (location) when online */
export const DELIVERY_LOCATION_SEND_INTERVAL_MS = 20_000;
export const DELIVERY_LOCATION_FALLBACK_INTERVAL_MS = 20_000;
/** Only PATCH before interval if rider moved at least this far (reduces API spam from GPS jitter) */
export const DELIVERY_LOCATION_MIN_MOVE_METERS = 50;

/** Zones polygon API — was effectively polled on every GPS tick via useEffect deps */
export const NEARBY_ZONES_FETCH_INTERVAL_MS = 120_000;

/** Background poll for discover / assigned orders when idle */
export const DELIVERY_ASSIGNED_ORDERS_POLL_MS = 90_000;

/** getOrderDetails sanity check while order sheet open */
export const DELIVERY_ORDER_VERIFY_POLL_MS = 60_000;
export const BILL_UPLOAD_TIMEOUT_MS = 45_000;

export const DELIVERY_ACTIVE_ORDER_KEY = "deliveryActiveOrder";
export const NEW_ORDER_COUNTDOWN_SECONDS = 300;

