import React, { useRef, useState } from 'react';
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
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';

import { app, db } from '../../../firebase/config';
import LoadingModal from '../../../../components/LoadingModal';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import {
  DonationCategory,
  PickupCompleteScreenProps,
  PickupFormValues,
} from '../../../types/pickup.types';

const PickupCompleteScreen: React.FC<PickupCompleteScreenProps> = ({
  route,
  navigation,
}) => {
  const { id, data } = route.params;

  // State
  const [image, setImage] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signatureVisible, setSignatureVisible] = useState(false);

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
      console.error('[PickupComplete] Permission error:', error);
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
      console.error('[PickupComplete] Camera error:', error);
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
      console.error('[PickupComplete] Upload error:', error);
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
    setSignatureVisible(false);
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setLoading(true);

    try {
      const uuid = uuidv4();
      const path = `${FileSystem.cacheDirectory}${uuid}.png`;
      const base64Data = signatureBase64.split('data:image/png;base64,')[1];

      await FileSystem.writeAsStringAsync(path, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.getInfoAsync(path);
      setSignature(path);
    } catch (error) {
      console.error('[PickupComplete] Signature save error:', error);
      Alert.alert('Error', 'Failed to save signature');
    } finally {
      setLoading(false);
    }
  };

  const uploadImagesToStorage = async () => {
    const storage = getStorage(app);

    // Upload receipt image
    if (image) {
      const receiptId = `receipts/${uuidv4()}`;
      const receiptRef = ref(storage, receiptId);
      const receiptBlob = await fetch(image).then((r) => r.blob());
      await uploadBytes(receiptRef, receiptBlob);
      data.pickup.receiptImage = receiptId;
    }

    // Upload signature image
    if (signature) {
      const signatureId = `signatures/${signature.split('/').pop()}`;
      const signatureRef = ref(storage, signatureId);
      const signatureBlob = await fetch(signature).then((r) => r.blob());
      await uploadBytes(signatureRef, signatureBlob);
      data.pickup.signatureImage = signatureId;
    }
  };

  const handleSubmit = async (values: PickupFormValues) => {
    setLoading(true);

    try {
      // Update pickup data with form values
      data.pickup.weight = parseFloat(values.weight);
      data.pickup.category = values.category as DonationCategory;

      if (values.hasReceipt === 'no' && values.noReceiptReason) {
        data.pickup.noReceiptReason = values.noReceiptReason;
      }

      if (values.hasSignature === 'no' && values.noSignatureReason) {
        data.pickup.noSignatureReason = values.noSignatureReason;
      }

      // Upload images to Firebase Storage
      await uploadImagesToStorage();

      // Move document from 'accepted' to 'pickedup' collection
      const pickedUpRef = doc(db, 'pickedup', id);
      await setDoc(pickedUpRef, data);
      await deleteDoc(doc(db, 'accepted', id));

      Alert.alert('Success', 'Pickup completed successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('List', { refresh: true }),
        },
      ]);
    } catch (error) {
      console.error('[PickupComplete] Submit error:', error);
      Alert.alert('Error', 'Failed to complete pickup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (values: PickupFormValues) => {
    const errors: Partial<Record<keyof PickupFormValues, string>> = {};

    // Weight validation
    if (!values.weight || values.weight.trim() === '') {
      errors.weight = 'Weight is required';
    } else if (isNaN(parseFloat(values.weight)) || parseFloat(values.weight) <= 0) {
      errors.weight = 'Weight must be a positive number';
    }

    // Category validation
    if (!values.category || values.category === '') {
      errors.category = 'Category is required';
    }

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
      const errorMessages = Object.values(errors).join('\n• ');
      Alert.alert('Missing Information', `• ${errorMessages}`);
    }

    return errors;
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
          weight: '',
          category: '',
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

              {/* Weight & Category Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Pickup Details</Text>

                {/* Weight Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Weight (lbs) <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.weight && styles.inputError]}
                    placeholder="Enter weight in pounds"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="decimal-pad"
                    value={values.weight}
                    onChangeText={handleChange('weight')}
                    onBlur={handleBlur('weight')}
                  />
                </View>

                {/* Category Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Category <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
                    <Picker
                      selectedValue={values.category}
                      onValueChange={(value) => setFieldValue('category', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select a category" value="" />
                      <Picker.Item label="Produce" value={DonationCategory.PRODUCE} />
                      <Picker.Item label="Dairy" value={DonationCategory.DAIRY} />
                      <Picker.Item label="Bakery" value={DonationCategory.BAKERY} />
                      <Picker.Item label="Canned Goods" value={DonationCategory.CANNED_GOODS} />
                      <Picker.Item label="Dry Goods" value={DonationCategory.DRY_GOODS} />
                      <Picker.Item label="Meat" value={DonationCategory.MEAT} />
                      <Picker.Item label="Frozen" value={DonationCategory.FROZEN} />
                      <Picker.Item label="Mixed" value={DonationCategory.MIXED} />
                      <Picker.Item label="Other" value={DonationCategory.OTHER} />
                    </Picker>
                  </View>
                </View>
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
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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

export default PickupCompleteScreen;
