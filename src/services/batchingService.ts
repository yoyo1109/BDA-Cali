/**
 * Smart Batching Service
 *
 * Groups pickups by ZIP code with color coding and chronological sorting
 */

export interface BatchedPickup {
  id: string;
  batchColor: string;
  batchZipCode: string;
  batchSize: number;
  batchIndex: number;
  [key: string]: any;
}

// Distinct color palette for up to 10 ZIP code groups
const BATCH_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
];

/**
 * Extract ZIP code from address string
 */
export function extractZipCode(address: string): string {
  if (!address) return 'unknown';

  // Match 5-digit ZIP code pattern (US)
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : 'unknown';
}

/**
 * Group pickups by ZIP code
 */
function groupByZipCode(pickups: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};

  pickups.forEach(pickup => {
    const zip = extractZipCode(pickup.location?.address || pickup.client?.address?.formatted || '');

    if (!groups[zip]) {
      groups[zip] = [];
    }

    groups[zip].push(pickup);
  });

  return groups;
}

/**
 * Assign colors to ZIP code groups
 */
function assignBatchColors(zipGroups: Record<string, any[]>): Record<string, string> {
  const zipCodes = Object.keys(zipGroups).sort(); // Sort for consistency
  const colorMap: Record<string, string> = {};

  zipCodes.forEach((zip, index) => {
    colorMap[zip] = BATCH_COLORS[index % BATCH_COLORS.length];
  });

  return colorMap;
}

/**
 * Sort pickups chronologically by scheduled time
 */
function sortPickupsByTime(pickups: any[]): any[] {
  return [...pickups].sort((a, b) => {
    // Try multiple date field paths
    const dateA = a.pickup?.scheduledDate || a.scheduledDate || a.createdAt;
    const dateB = b.pickup?.scheduledDate || b.scheduledDate || b.createdAt;

    // Convert Firestore Timestamp to Date if needed
    const timeA = dateA?.toDate ? dateA.toDate() : new Date(dateA || 0);
    const timeB = dateB?.toDate ? dateB.toDate() : new Date(dateB || 0);

    return timeA.getTime() - timeB.getTime();
  });
}

/**
 * Main batching function
 *
 * Groups pickups by ZIP code, assigns colors, and sorts chronologically
 */
export function batchPickups(pickups: any[]): BatchedPickup[] {
  if (!pickups || pickups.length === 0) {
    return [];
  }

  // Step 1: Group by ZIP code
  const zipGroups = groupByZipCode(pickups);

  // Step 2: Assign colors to ZIP groups
  const colorMap = assignBatchColors(zipGroups);

  // Step 3: Create batched pickups with metadata
  const batchedPickups: BatchedPickup[] = [];

  Object.keys(zipGroups).forEach(zip => {
    const groupPickups = sortPickupsByTime(zipGroups[zip]);

    groupPickups.forEach((pickup, index) => {
      batchedPickups.push({
        ...pickup,
        batchColor: colorMap[zip],
        batchZipCode: zip,
        batchSize: groupPickups.length,
        batchIndex: index + 1, // 1-indexed for display
      });
    });
  });

  // Step 4: Final sort - chronological order across all groups
  return sortPickupsByTime(batchedPickups);
}

/**
 * Get batch summary statistics
 */
export function getBatchSummary(batchedPickups: BatchedPickup[]): {
  totalPickups: number;
  totalBatches: number;
  batchBreakdown: Array<{
    zipCode: string;
    color: string;
    count: number;
  }>;
} {
  const zipCounts: Record<string, { color: string; count: number }> = {};

  batchedPickups.forEach(pickup => {
    const zip = pickup.batchZipCode;

    if (!zipCounts[zip]) {
      zipCounts[zip] = {
        color: pickup.batchColor,
        count: 0,
      };
    }

    zipCounts[zip].count++;
  });

  const batchBreakdown = Object.keys(zipCounts)
    .sort()
    .map(zip => ({
      zipCode: zip,
      color: zipCounts[zip].color,
      count: zipCounts[zip].count,
    }));

  return {
    totalPickups: batchedPickups.length,
    totalBatches: batchBreakdown.length,
    batchBreakdown,
  };
}

/**
 * Format time for display
 */
export function formatPickupTime(pickup: any): string {
  const date = pickup.pickup?.scheduledDate || pickup.scheduledDate || pickup.createdAt;

  if (!date) return 'Time TBD';

  const dateObj = date?.toDate ? date.toDate() : new Date(date);

  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${ampm}`;
}
