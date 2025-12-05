import { Timestamp } from 'firebase/firestore';

export interface Name {
  first: string;
  last1: string;
  last2: string | null;
}

export interface Individual {
  name: Name;
}

export interface Organization {
  name: string;
}

export interface Address {
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Client {
  address: Address;
}

export interface PickupItemData {
  category: DonationCategory;
  weight: number;
  pricePerPound: number;
  totalPrice: number;
}

export interface PickupInfo {
  driver: string;
  driverName?: string;
  date: Timestamp;
  receiptImage?: string;
  signatureImage?: string;
  noReceiptReason?: string;
  noSignatureReason?: string;
  // Legacy single-item fields (for backward compatibility)
  weight?: number;
  category?: DonationCategory;
  // New multi-item fields
  items?: PickupItemData[];
  totalValue?: number;
}

export interface DonationData {
  client: Client;
  indiv?: Individual;
  org?: Organization;
  pickup: PickupInfo;
}

export interface PickupDocument {
  id: string;
  data: DonationData;
}

export enum DonationCategory {
  PRODUCE = 'produce',
  DAIRY = 'dairy',
  BAKERY = 'bakery',
  CANNED_GOODS = 'canned_goods',
  DRY_GOODS = 'dry_goods',
  MEAT = 'meat',
  FROZEN = 'frozen',
  MIXED = 'mixed',
  OTHER = 'other',
}

export interface PickupFormValues {
  hasReceipt: 'yes' | 'no';
  noReceiptReason: string;
  hasSignature: 'yes' | 'no';
  noSignatureReason: string;
  weight: string;
  category: DonationCategory | '';
}

export interface PickupCompleteScreenProps {
  route: {
    params: {
      id: string;
      data: DonationData;
    };
  };
  navigation: any;
}
