import React, { useRef, useState, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import { Formik } from 'formik';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SignatureScreen from 'react-native-signature-canvas';
import openMap from 'react-native-open-maps';
import { v4 as uuidv4 } from 'uuid';
import { deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { app, db } from '../../../firebase/config';
import LoadingModal from '../../../../components/LoadingModal';
import PickupItemsListV3 from '../../../components/PickupItemsListV3';
import { AccessInfoCard } from '../../../components/pickup';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import {
  DonationCategory,
  PickupCompleteScreenProps,
  PickupItemData,
} from '../../../types/pickup.types';
import { PickupItem } from '../../../types/pickupItem.types';

interface PickupFormValues {
  hasReceipt: 'yes' | 'no';
  noReceiptReason: string;
  hasSignature: 'yes' | 'no';
  noSignatureReason: string;
}

const PickupCompleteScreenV2: React.FC<PickupCompleteScreenProps> = ({
  route,
  navigation,
}) => {
  const { id, data } = route.params;

  // State
  const [items, setItems] = useState<PickupItem[]>([
    {
      id: uuidv4(),
      category: '',
      packaging: [],
      totalWeight: '',
      totalValue: ''
    },
  ]);
  const [image, setImage] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoadingInternal] = useState(false);
  const [signatureVisible, setSignatureVisible] = useState(false);

  // Wrapper to track loading state changes
  const setLoading = (value: boolean) => {
    console.log(`[PickupCompleteV2] 🔴 setLoading called with: ${value}`);
    console.log('[PickupCompleteV2] Stack trace:', new Error().stack);
    setLoadingInternal(value);
  };

  // Track loading state changes
  useEffect(() => {
    console.log(`[PickupCompleteV2] 🟡 Loading state changed to: ${loading}`);
  }, [loading]);

  // Track signature modal visibility
  useEffect(() => {
    console.log(`[PickupCompleteV2] 🟢 Signature modal visibility changed to: ${signatureVisible}`);
  }, [signatureVisible]);

  // Refs
  const signatureRef = useRef<any>();

  // Helper functions
  const formatDonorName = (): string => {
    if (data.indiv) {
      const { first, last1, last2 } = data.indiv.name;
      return `${first} ${last1}${last2 ? ` ${last2}` : ''}`;
    }
    return data.org?.name || 'Unknown Donor';
  };

  const requestPermission = async (type: 'camera' | 'cameraroll') => {
    if (Platform.OS === 'web') return true;

    try {
      const { status } =
        type === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          `Please allow ${type === 'camera' ? 'camera' : 'photo library'} permissions.`
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('[PickupCompleteV2] Permission error:', error);
      return false;
    }
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[PickupCompleteV2] Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUploadPhoto = async () => {
    const hasPermission = await requestPermission('cameraroll');
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[PickupCompleteV2] Upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const handleOpenSignaturePad = () => {
    setSignatureVisible(true);
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
  };

  const handleSignatureCancel = () => {
    setSignatureVisible(false);
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  };

  const handleSignatureClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleSignatureConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleSignatureOK = async (signatureBase64: string) => {
    console.log('[PickupCompleteV2] ===== SIGNATURE SUBMIT STARTED =====');
    console.log('[PickupCompleteV2] Signature base64 length:', signatureBase64?.length);

    // Close signature modal first
    setSignatureVisible(false);
    console.log('[PickupCompleteV2] Signature modal closed');

    // Lock orientation back to portrait
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    console.log('[PickupCompleteV2] Orientation locked to portrait');

    try {
      const uuid = uuidv4();
      const path = `${FileSystem.cacheDirectory}${uuid}.png`;
      console.log('[PickupCompleteV2] Generated file path:', path);

      const base64Data = signatureBase64.split('data:image/png;base64,')[1];
      console.log('[PickupCompleteV2] Extracted base64 data, length:', base64Data?.length);

      await FileSystem.writeAsStringAsync(path, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('[PickupCompleteV2] File written successfully');

      await FileSystem.getInfoAsync(path);
      console.log('[PickupCompleteV2] File info retrieved');

      setSignature(path);
      console.log('[PickupCompleteV2] Signature state updated to:', path);
      console.log('[PickupCompleteV2] ===== SIGNATURE SUBMIT COMPLETED =====');
    } catch (error) {
      console.error('[PickupCompleteV2] Signature save error:', error);
      Alert.alert('Error', 'Failed to save signature');
    }
  };

  /**
   * Generate a digital receipt from item data
   * Used when donor doesn't have a physical receipt
   */
  const generateDigitalReceipt = (pickupItems: PickupItemData[], totalWeight: number, totalValue: number) => {
    const receiptDate = new Date().toISOString();
    const donorName = formatDonorName();

    return {
      type: 'digital',
      generatedAt: receiptDate,
      donorName,
      donorAddress: data.client.address.formatted,
      items: pickupItems.map((item) => ({
        category: item.category,
        packaging: item.packaging,
        weight: item.totalWeight,
        value: item.totalValue,
      })),
      totalWeight,
      totalValue,
      currency: 'COP',
      notes: 'Auto-generated receipt - original not available',
    };
  };

  /**
   * Upload receipt image to Firebase Storage
   * Returns the download URL
   */
  const uploadReceiptImage = async (imageUri: string, pickupId: string): Promise<string> => {
    try {
      console.log('[PickupCompleteV2] Uploading receipt image...');
      console.log('[PickupCompleteV2] Image URI:', imageUri);

      const storage = getStorage(app);
      const fileExtension = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `receipts/${pickupId}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      console.log('[PickupCompleteV2] Storage path:', fileName);

      // For React Native, we need to create a blob differently
      const response = await fetch(imageUri);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();

      console.log('[PickupCompleteV2] Blob created, size:', blob.size, 'type:', blob.type);

      // Upload to Firebase Storage using resumable upload
      console.log('[PickupCompleteV2] Starting upload...');

      return new Promise<string>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress monitoring
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[PickupCompleteV2] Upload progress: ${progress.toFixed(0)}%`);
          },
          (error) => {
            // Error handling
            console.error('[PickupCompleteV2] Upload error:', error);
            reject(error);
          },
          async () => {
            // Success - get download URL
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('[PickupCompleteV2] Receipt uploaded successfully:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error: any) {
      console.error('[PickupCompleteV2] Receipt upload error:', error);
      console.error('[PickupCompleteV2] Error details:', error.message, error.code);
      throw new Error(`Failed to upload receipt image: ${error.message}`);
    }
  };

  /**
   * Upload signature image to Firebase Storage
   * Returns the download URL
   */
  const uploadSignatureImage = async (signatureUri: string, pickupId: string): Promise<string> => {
    try {
      console.log('[PickupCompleteV2] Uploading signature image...');
      console.log('[PickupCompleteV2] Signature URI:', signatureUri);

      const storage = getStorage(app);
      const fileName = `signatures/${pickupId}.png`;
      const storageRef = ref(storage, fileName);

      console.log('[PickupCompleteV2] Storage path:', fileName);

      // Convert signature to blob
      const response = await fetch(signatureUri);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Failed to fetch signature: ${response.statusText}`);
      }

      const blob = await response.blob();

      console.log('[PickupCompleteV2] Blob created, size:', blob.size, 'type:', blob.type);

      // Upload to Firebase Storage using resumable upload
      console.log('[PickupCompleteV2] Starting upload...');

      return new Promise<string>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress monitoring
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[PickupCompleteV2] Upload progress: ${progress.toFixed(0)}%`);
          },
          (error) => {
            // Error handling
            console.error('[PickupCompleteV2] Upload error:', error);
            reject(error);
          },
          async () => {
            // Success - get download URL
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('[PickupCompleteV2] Signature uploaded successfully:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error: any) {
      console.error('[PickupCompleteV2] Signature upload error:', error);
      console.error('[PickupCompleteV2] Error details:', error.message, error.code);
      throw new Error(`Failed to upload signature image: ${error.message}`);
    }
  };

  /**
   * Main function to complete the pickup
   * Handles data gathering, image uploads, and Firestore transaction
   */
  const handleSubmit = async (values: PickupFormValues) => {
    setLoading(true);
    console.log('[PickupCompleteV2] ===== START COMPLETE PICKUP =====');

    try {
      // ========================================
      // STEP 1: GATHER DATA - Convert items to proper format
      // ========================================
      console.log('[PickupCompleteV2] Step 1: Gathering item data...');

      const pickupItems: PickupItemData[] = items.map((item) => {
        const packagingData = item.packaging.map((pkg) => ({
          type: pkg.type,
          quantity: parseFloat(pkg.quantity) || 0,
          unitPrice: parseFloat(pkg.unitPrice) || 0,
        }));

        const totalWeight = parseFloat(item.totalWeight) || 0;
        const totalValue = parseFloat(item.totalValue) || 0;

        return {
          category: item.category as DonationCategory,
          packaging: packagingData,
          totalWeight,
          totalValue,
        };
      });

      // Calculate totals for entire pickup
      const totalWeight = pickupItems.reduce((sum, item) => sum + item.totalWeight, 0);
      const totalValue = pickupItems.reduce((sum, item) => sum + item.totalValue, 0);

      console.log(`[PickupCompleteV2] Total items: ${pickupItems.length}`);
      console.log(`[PickupCompleteV2] Total weight: ${totalWeight} lbs`);
      console.log(`[PickupCompleteV2] Total value: $${totalValue}`);

      // ========================================
      // STEP 2: HANDLE RECEIPT
      // ========================================
      console.log('[PickupCompleteV2] Step 2: Handling receipt...');

      let receiptUrl: string | null = null;
      let isDigitalReceipt = false;
      let digitalReceipt = null;

      if (values.hasReceipt === 'yes' && image) {
        // SCENARIO A: Has physical receipt - upload photo
        console.log('[PickupCompleteV2] Uploading physical receipt photo...');
        receiptUrl = await uploadReceiptImage(image, id);
        isDigitalReceipt = false;
      } else if (values.hasReceipt === 'no') {
        // SCENARIO B: No receipt - generate digital receipt
        console.log('[PickupCompleteV2] Generating digital receipt...');
        digitalReceipt = generateDigitalReceipt(pickupItems, totalWeight, totalValue);
        isDigitalReceipt = true;
        receiptUrl = null;
      }

      // ========================================
      // STEP 3: HANDLE SIGNATURE
      // ========================================
      console.log('[PickupCompleteV2] Step 3: Handling signature...');

      let signatureUrl: string | null = null;

      if (values.hasSignature === 'yes' && signature) {
        console.log('[PickupCompleteV2] Uploading signature image...');
        signatureUrl = await uploadSignatureImage(signature, id);
      }

      // ========================================
      // STEP 4: DATABASE TRANSACTION
      // ========================================
      console.log('[PickupCompleteV2] Step 4: Updating Firestore...');

      // Build the pickup data object
      const pickupData = {
        items: pickupItems,
        totalWeight,
        totalValue,
        currency: 'COP',
        receiptUrl,
        isDigitalReceipt,
        digitalReceipt: isDigitalReceipt ? digitalReceipt : null,
        signatureUrl,
        hasSignature: values.hasSignature === 'yes',
        noSignatureReason: values.hasSignature === 'no' ? values.noSignatureReason : null,
        hasReceipt: values.hasReceipt === 'yes',
        noReceiptReason: values.hasReceipt === 'no' ? values.noReceiptReason : null,
        category: pickupItems.length === 1 ? pickupItems[0].category : DonationCategory.MIXED,
        completedAt: new Date().toISOString(),
        driverNotes: '', // Can be extended in future
      };

      // Create the complete pickup document
      const completedPickupData = {
        ...data,
        status: 'pickedup',
        pickupData,
        timestamp: serverTimestamp(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[PickupCompleteV2] Creating document in pickedup collection...');
      const pickedUpRef = doc(db, 'pickedup', id);
      await setDoc(pickedUpRef, completedPickupData);

      console.log('[PickupCompleteV2] Deleting document from accepted collection...');
      await deleteDoc(doc(db, 'accepted', id));

      console.log('[PickupCompleteV2] ===== PICKUP COMPLETED SUCCESSFULLY =====');

      // Show success message
      Alert.alert(
        'Success',
        'Pickup completed successfully!\n\n' +
        `Items: ${pickupItems.length}\n` +
        `Total Weight: ${totalWeight} lbs\n` +
        `Total Value: $${totalValue.toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('List', { refresh: true }),
          },
        ]
      );
    } catch (error: any) {
      console.error('[PickupCompleteV2] Submit error:', error);

      // ========================================
      // STEP 5: ERROR HANDLING
      // ========================================
      let errorMessage = 'Failed to complete pickup. Please try again.';

      if (error.message?.includes('network') || error.code === 'unavailable') {
        errorMessage =
          'Network error. Please check your internet connection.\n\n' +
          'Your data has been saved locally and will sync when connection is restored.';

        // TODO: Implement offline queue for retry
        // queueForOfflineSync(pickupData);
      } else if (error.message?.includes('upload')) {
        errorMessage =
          'Failed to upload images. Please try again.\n\n' +
          'Make sure you have a stable internet connection.';
      } else if (error.code === 'permission-denied') {
        errorMessage =
          'Permission denied. Please check your account permissions.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (values: PickupFormValues) => {
    const errors: any = {};

    // Validate items
    let hasItemErrors = false;
    items.forEach((item) => {
      // Validate category
      if (!item.category || item.category === '') {
        errors[`item_${item.id}_category`] = 'Category is required';
        hasItemErrors = true;
      }

      // Validate packaging - must have at least one packaging type
      if (!item.packaging || item.packaging.length === 0) {
        errors[`item_${item.id}_packaging`] = 'At least one packaging type is required';
        hasItemErrors = true;
      } else {
        // Validate each packaging detail (quantity and unit price)
        item.packaging.forEach((pkg, pkgIndex) => {
          if (!pkg.quantity || pkg.quantity.trim() === '') {
            errors[`item_${item.id}_pkg_${pkgIndex}_quantity`] = 'Quantity is required';
            hasItemErrors = true;
          } else if (isNaN(parseFloat(pkg.quantity)) || parseFloat(pkg.quantity) <= 0) {
            errors[`item_${item.id}_pkg_${pkgIndex}_quantity`] = 'Quantity must be positive';
            hasItemErrors = true;
          }

          if (!pkg.unitPrice || pkg.unitPrice.trim() === '') {
            errors[`item_${item.id}_pkg_${pkgIndex}_unitPrice`] = 'Unit price is required';
            hasItemErrors = true;
          } else if (isNaN(parseFloat(pkg.unitPrice)) || parseFloat(pkg.unitPrice) < 0) {
            errors[`item_${item.id}_pkg_${pkgIndex}_unitPrice`] = 'Unit price must be non-negative';
            hasItemErrors = true;
          }
        });
      }

      // Validate total weight
      if (!item.totalWeight || item.totalWeight.trim() === '') {
        errors[`item_${item.id}_totalWeight`] = 'Total weight is required';
        hasItemErrors = true;
      } else if (isNaN(parseFloat(item.totalWeight)) || parseFloat(item.totalWeight) <= 0) {
        errors[`item_${item.id}_totalWeight`] = 'Total weight must be positive';
        hasItemErrors = true;
      }

      // Validate total value
      if (!item.totalValue || item.totalValue.trim() === '') {
        errors[`item_${item.id}_totalValue`] = 'Total value is required';
        hasItemErrors = true;
      } else if (isNaN(parseFloat(item.totalValue)) || parseFloat(item.totalValue) < 0) {
        errors[`item_${item.id}_totalValue`] = 'Total value must be non-negative';
        hasItemErrors = true;
      }
    });

    // Receipt validation
    if (values.hasReceipt === 'yes' && !image) {
      errors.hasReceipt = 'Receipt photo is required';
    }

    if (values.hasReceipt === 'no' && !values.noReceiptReason.trim()) {
      errors.noReceiptReason = 'Please explain why there is no receipt';
    }

    // Signature validation
    if (values.hasSignature === 'no' && !values.noSignatureReason.trim()) {
      errors.noSignatureReason = 'Please explain why there is no signature';
    }

    // Show alert if there are errors
    if (Object.keys(errors).length > 0) {
      const errorMessages = [];

      if (hasItemErrors) {
        errorMessages.push('Please complete all item fields (category, packaging quantities & prices, total weight & value)');
      }

      if (errors.hasReceipt) errorMessages.push(errors.hasReceipt);
      if (errors.noReceiptReason) errorMessages.push(errors.noReceiptReason);
      if (errors.noSignatureReason) errorMessages.push(errors.noSignatureReason);

      Alert.alert('Missing Information', `• ${errorMessages.join('\n• ')}`);
    }

    return errors;
  };

  // Item management functions
  const handleAddItem = () => {
    console.log('[PickupCompleteV2] Adding new item. Current items:', items.length);
    const newItem: PickupItem = {
      id: uuidv4(),
      category: '',
      packaging: [],
      totalWeight: '',
      totalValue: ''
    };
    const updatedItems = [...items, newItem];
    console.log('[PickupCompleteV2] New state after add:', updatedItems.length, 'items');
    setItems(updatedItems);
  };

  const handleRemoveItem = (itemId: string) => {
    if (items.length > 1) {
      console.log('[PickupCompleteV2] Removing item:', itemId);
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const handleUpdateItem = (itemId: string, field: keyof PickupItem, value: any) => {
    console.log(`[PickupCompleteV2] Updating item ${itemId}, field: ${field}, value:`, typeof value === 'object' ? JSON.stringify(value) : value);

    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) => {
        if (item.id === itemId) {
          // Special handling for packaging updates - also recalculate totalValue
          if (field === 'packaging' && Array.isArray(value)) {
            const packaging = value;
            const totalValue = packaging.reduce((sum, pkg) => {
              const qty = parseFloat(pkg.quantity) || 0;
              const price = parseFloat(pkg.unitPrice) || 0;
              return sum + (qty * price);
            }, 0);

            console.log(`[PickupCompleteV2] Auto-calculating totalValue: ${totalValue.toFixed(2)}`);

            return {
              ...item,
              packaging: value,
              totalValue: totalValue.toFixed(2),
            };
          }

          return { ...item, [field]: value };
        }
        return item;
      });

      console.log('[PickupCompleteV2] Updated items state:', JSON.stringify(updatedItems));
      return updatedItems;
    });
  };


  return (
    <View style={styles.container}>
      <LoadingModal visible={loading} />

      {/* Signature Modal */}
      <Modal visible={signatureVisible} supportedOrientations={['portrait', 'landscape']}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignatureOK}
          webStyle={`
            .m-signature-pad--footer {
              display: none;
              margin: 0px;
            }
          `}
        />
        <View style={styles.signatureModalFooter}>
          <TouchableOpacity style={styles.signatureCancelButton} onPress={handleSignatureCancel}>
            <Icon name="arrow-left" size={20} color={COLORS.white} />
            <Text style={styles.signatureButtonText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.signatureActionButtons}>
            <TouchableOpacity style={styles.signatureClearButton} onPress={handleSignatureClear}>
              <Text style={styles.signatureButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signatureConfirmButton} onPress={handleSignatureConfirm}>
              <Text style={styles.signatureButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Formik<PickupFormValues>
        initialValues={{
          hasReceipt: 'yes',
          noReceiptReason: '',
          hasSignature: 'yes',
          noSignatureReason: '',
        }}
        validate={validateForm}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={(values) => {
          Alert.alert(
            'Confirm Pickup',
            'Are you sure you want to mark this pickup as complete?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Confirm', onPress: () => handleSubmit(values) },
            ]
          );
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, setFieldValue }) => (
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Navigation Card */}
              <TouchableOpacity
                style={styles.navigationCard}
                onPress={() => openMap({ end: data.client.address.formatted })}
                activeOpacity={0.7}
              >
                <View style={styles.navigationIconRow}>
                  <Icon name="map-marker" color={COLORS.brightBlue} size={32} />
                  <Text style={styles.navigationTitle}>Navigate</Text>
                </View>
                <View style={styles.navigationInfo}>
                  <Text style={styles.donorName}>{formatDonorName()}</Text>
                  <Text style={styles.donorAddress}>{data.client.address.formatted}</Text>
                </View>
              </TouchableOpacity>

              {/* Access Information */}
              <View style={{ marginHorizontal: SPACING.md }}>
                <AccessInfoCard
                  dockCode={data.pickup?.dockCode}
                  loadingTips={data.pickup?.loadingTips}
                />
              </View>

              {/* Items Section */}
              <View style={styles.sectionCard}>
                <PickupItemsListV3
                  items={items}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onUpdateItem={handleUpdateItem}
                  errors={errors}
                />
              </View>

              {/* Receipt Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  Receipt <Text style={styles.required}>*</Text>
                </Text>

                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => {
                      setFieldValue('hasReceipt', 'yes');
                      setFieldValue('noReceiptReason', '');
                    }}
                  >
                    <Icon
                      name={values.hasReceipt === 'yes' ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={values.hasReceipt === 'yes' ? COLORS.brightBlue : COLORS.gray}
                    />
                    <Text style={styles.radioLabel}>Donor has receipt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => {
                      setFieldValue('hasReceipt', 'no');
                      setImage(null);
                    }}
                  >
                    <Icon
                      name={values.hasReceipt === 'no' ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={values.hasReceipt === 'no' ? COLORS.brightBlue : COLORS.gray}
                    />
                    <Text style={styles.radioLabel}>No receipt available</Text>
                  </TouchableOpacity>
                </View>

                {values.hasReceipt === 'yes' ? (
                  <View style={styles.photoSection}>
                    {image && (
                      <Image source={{ uri: image }} style={styles.photoPreview} resizeMode="contain" />
                    )}
                    <View style={styles.photoButtons}>
                      <TouchableOpacity
                        style={[styles.photoButton, errors.hasReceipt && styles.buttonError]}
                        onPress={handleTakePhoto}
                      >
                        <Icon name="camera" size={20} color={COLORS.white} />
                        <Text style={styles.photoButtonText}>Capture</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.photoButton, errors.hasReceipt && styles.buttonError]}
                        onPress={handleUploadPhoto}
                      >
                        <Icon name="image" size={20} color={COLORS.white} />
                        <Text style={styles.photoButtonText}>Upload</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.reasonSection}>
                    <Text style={styles.reasonLabel}>
                      Why is there no receipt? <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.textArea, errors.noReceiptReason && styles.inputError]}
                      placeholder="e.g., Donor unavailable, receipt lost, etc."
                      placeholderTextColor={COLORS.gray}
                      multiline
                      numberOfLines={3}
                      value={values.noReceiptReason}
                      onChangeText={handleChange('noReceiptReason')}
                      onBlur={handleBlur('noReceiptReason')}
                    />
                  </View>
                )}
              </View>

              {/* Signature Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Donor Signature</Text>

                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => {
                      setFieldValue('hasSignature', 'yes');
                      setFieldValue('noSignatureReason', '');
                    }}
                  >
                    <Icon
                      name={values.hasSignature === 'yes' ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={values.hasSignature === 'yes' ? COLORS.brightBlue : COLORS.gray}
                    />
                    <Text style={styles.radioLabel}>Get signature</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => {
                      setFieldValue('hasSignature', 'no');
                      setSignature(null);
                    }}
                  >
                    <Icon
                      name={values.hasSignature === 'no' ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={values.hasSignature === 'no' ? COLORS.brightBlue : COLORS.gray}
                    />
                    <Text style={styles.radioLabel}>Donor unavailable</Text>
                  </TouchableOpacity>
                </View>

                {values.hasSignature === 'yes' ? (
                  <View style={styles.signatureSection}>
                    {signature && (
                      <TouchableOpacity
                        style={styles.signaturePreview}
                        onPress={handleOpenSignaturePad}
                      >
                        <Image source={{ uri: signature }} style={styles.signatureImage} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.signatureButton}
                      onPress={handleOpenSignaturePad}
                    >
                      <Icon name="draw" size={20} color={COLORS.white} />
                      <Text style={styles.signatureButtonMainText}>
                        {signature ? 'Update Signature' : 'Open Signature Pad'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.reasonSection}>
                    <Text style={styles.reasonLabel}>
                      Why is there no signature? <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.textArea, errors.noSignatureReason && styles.inputError]}
                      placeholder="e.g., Donor not present, left items outside, etc."
                      placeholderTextColor={COLORS.gray}
                      multiline
                      numberOfLines={3}
                      value={values.noSignatureReason}
                      onChangeText={handleChange('noSignatureReason')}
                      onBlur={handleBlur('noSignatureReason')}
                    />
                  </View>
                )}
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => handleSubmit()}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Icon name="check-circle" size={24} color={COLORS.white} />
              <Text style={styles.submitButtonText}>COMPLETE PICKUP</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  navigationCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.brightBlue,
    ...SHADOWS.card,
  },
  navigationIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  navigationTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.brightBlue,
    marginLeft: SPACING.sm,
  },
  navigationInfo: {
    alignItems: 'center',
  },
  donorName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  donorAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.card,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginBottom: SPACING.md,
  },
  required: {
    color: COLORS.error,
  },
  radioGroup: {
    marginBottom: SPACING.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  radioLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    marginLeft: SPACING.sm,
  },
  photoSection: {
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.brightBlue,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xs,
    ...SHADOWS.button,
  },
  photoButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  buttonError: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  reasonSection: {
    marginTop: SPACING.sm,
  },
  reasonLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: SPACING.sm,
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  signatureSection: {
    alignItems: 'center',
  },
  signaturePreview: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.brightBlue,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signatureButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.brightBlue,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
  signatureButtonMainText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  signatureModalFooter: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  signatureCancelButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  signatureActionButtons: {
    flexDirection: 'row',
  },
  signatureClearButton: {
    backgroundColor: COLORS.gray,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  signatureConfirmButton: {
    backgroundColor: COLORS.brightBlue,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  signatureButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.orange,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginLeft: SPACING.sm,
    letterSpacing: 0.5,
  },
});

export default PickupCompleteScreenV2;
