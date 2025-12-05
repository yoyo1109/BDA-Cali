import { DonationCategory } from './pickup.types';

// Packaging types
export type PackagingType = 'Boxes' | 'Bags' | 'Pallets';

// Packaging detail for a single type
export interface PackagingDetail {
  type: PackagingType;
  quantity: string;     // User input (string for TextInput) - count of packages
  unitPrice: string;    // User input (string for TextInput) - price per unit in $
}

// UI model for item editing
export interface PickupItem {
  id: string;
  category: DonationCategory | '';
  packaging: PackagingDetail[]; // Array of packaging types
  totalWeight: string;          // Manual weight input in lbs (string for TextInput)
  totalValue: string;           // Calculated/editable total value in $ (string for TextInput)
}

// Firestore model for saved data
export interface PickupItemData {
  category: DonationCategory;
  packaging: {
    type: PackagingType;
    quantity: number;   // Count of packages
    unitPrice: number;  // Price per unit in $
  }[];
  totalWeight: number;  // Weight in lbs
  totalValue: number;   // Total estimated value in $
}
