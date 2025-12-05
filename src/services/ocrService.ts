import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase/config';

const functions = getFunctions(app);
const storage = getStorage(app);
const auth = getAuth(app);

export interface OCRResult {
  success: boolean;
  items: Array<{
    id: string;
    category: string;
    packaging: Array<{
      type: string;
      quantity: string;
      unitPrice: string;
    }>;
    totalWeight: string;
    totalValue: string;
    confidence?: number;
    rawText?: string;
  }>;
  overallConfidence: number;
  rawText: string;
  itemCount: number;
}

/**
 * Upload receipt image to Firebase Storage for OCR processing
 * @param imageUri - Local file URI from camera/gallery
 * @param userId - Current user ID
 * @returns Firebase Storage download URL
 */
export async function uploadReceiptForOCR(imageUri: string, userId: string): Promise<string> {
  try {
    console.log('[OCRService] Uploading receipt for OCR...');
    const timestamp = Date.now();
    const fileName = `receipts/temp/${userId}/${timestamp}.jpg`;
    const storageRef = ref(storage, fileName);

    // iOS Fix: Use XMLHttpRequest instead of fetch for blob creation
    // fetch().blob() is broken on iOS React Native
    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Failed to load image: ${xhr.status}`));
        }
      };
      xhr.onerror = function() {
        reject(new Error('Network error while loading image'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', imageUri, true);
      xhr.send(null);
    });

    console.log('[OCRService] Blob created, size:', blob.size, 'type:', blob.type);

    // Ensure blob has correct MIME type (iOS fix)
    const typedBlob = blob.type ? blob : new Blob([blob], { type: 'image/jpeg' });

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, typedBlob, {
        contentType: 'image/jpeg',
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`[OCRService] Upload progress: ${progress.toFixed(0)}%`);
        },
        (error) => {
          console.error('[OCRService] Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[OCRService] Receipt uploaded:', downloadURL);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('[OCRService] Receipt upload error:', error);
    throw new Error('Failed to upload receipt image');
  }
}

/**
 * Process receipt image with OCR via Cloud Function
 * @param receiptImageUrl - Firebase Storage download URL
 * @returns Parsed pickup items from receipt
 */
export async function processReceiptOCR(receiptImageUrl: string): Promise<OCRResult> {
  try {
    console.log('[OCRService] Calling Cloud Function...');

    // Call the Cloud Function
    const processReceipt = httpsCallable<
      { receiptImageUrl: string },
      OCRResult
    >(functions, 'processReceiptOCR');

    const result = await processReceipt({ receiptImageUrl });

    console.log('[OCRService] OCR completed:', result.data.itemCount, 'items found');
    return result.data;
  } catch (error: any) {
    console.error('[OCRService] OCR processing error:', error);

    // Handle specific Firebase error codes
    if (error.code === 'unauthenticated') {
      throw new Error('You must be logged in to scan receipts');
    } else if (error.code === 'failed-precondition') {
      throw new Error(error.message || 'No text detected in receipt. Please ensure the image is clear and well-lit.');
    } else if (error.code === 'resource-exhausted') {
      throw new Error('OCR service temporarily unavailable. Please try again later.');
    } else if (error.code === 'invalid-argument') {
      throw new Error('Invalid receipt image. Please try again.');
    }

    throw new Error('Failed to process receipt. Please try manual entry.');
  }
}

/**
 * Complete OCR workflow: Upload + Process
 * @param imageUri - Local file URI from camera/gallery
 * @param userId - Current user ID
 * @returns Parsed pickup items from receipt
 */
export async function scanReceipt(imageUri: string, userId: string): Promise<OCRResult> {
  console.log('[OCRService] ===== STARTING RECEIPT SCAN =====');

  // Step 1: Upload image to Firebase Storage
  const receiptUrl = await uploadReceiptForOCR(imageUri, userId);

  // Step 2: Process with OCR Cloud Function
  const result = await processReceiptOCR(receiptUrl);

  console.log('[OCRService] ===== RECEIPT SCAN COMPLETED =====');
  return result;
}
