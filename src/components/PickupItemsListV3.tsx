import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PickupItem, PackagingDetail, PackagingType } from '../types/pickupItem.types';
import { DonationCategory } from '../types/pickup.types';

interface PickupItemsListProps {
  items: PickupItem[];
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, field: keyof PickupItem, value: any) => void;
  errors: any;
}

const PACKAGING_TYPES: PackagingType[] = ['Boxes', 'Bags', 'Pallets'];

const CATEGORY_OPTIONS = [
  { label: '🥗 Produce', value: 'produce' },
  { label: '🥛 Dairy', value: 'dairy' },
  { label: '🍞 Bakery', value: 'bakery' },
  { label: '🥫 Canned Goods', value: 'canned_goods' },
  { label: '🌾 Dry Goods', value: 'dry_goods' },
  { label: '🥩 Meat', value: 'meat' },
  { label: '🧊 Frozen', value: 'frozen' },
  { label: '🍱 Mixed', value: 'mixed' },
  { label: '📦 Other', value: 'other' },
];

const PickupItemsListV3: React.FC<PickupItemsListProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  errors,
}) => {
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const getCategoryLabel = (value: string) => {
    const option = CATEGORY_OPTIONS.find((opt) => opt.value === value);
    return option ? option.label : 'Select category...';
  };

  const handleCategorySelect = (itemId: string, value: string) => {
    onUpdateItem(itemId, 'category', value);
    setCategoryModalVisible(false);
    setSelectedItemId(null);
  };

  const handlePackagingToggle = (itemId: string, type: PackagingType) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const existingIndex = item.packaging.findIndex((pkg) => pkg.type === type);

    if (existingIndex >= 0) {
      // Remove packaging type
      console.log('[PickupItemsListV3] Removing packaging:', type);
      const updatedPackaging = item.packaging.filter((_, idx) => idx !== existingIndex);
      onUpdateItem(itemId, 'packaging', updatedPackaging);
      // Recalculate total value after removal
      calculateTotalValue(itemId, updatedPackaging);
    } else {
      // Add packaging type
      console.log('[PickupItemsListV3] Adding packaging:', type);
      const newPackaging: PackagingDetail = {
        type,
        quantity: '',
        unitPrice: '',
      };
      const updatedPackaging = [...item.packaging, newPackaging];
      onUpdateItem(itemId, 'packaging', updatedPackaging);
    }
  };

  const handleRemovePackaging = (itemId: string, packageIndex: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    console.log('[PickupItemsListV3] Removing packaging at index:', packageIndex);
    const updatedPackaging = item.packaging.filter((_, idx) => idx !== packageIndex);
    onUpdateItem(itemId, 'packaging', updatedPackaging);
    // Recalculate total value after removal
    calculateTotalValue(itemId, updatedPackaging);
  };

  const handlePackagingFieldChange = (
    itemId: string,
    packageIndex: number,
    field: 'quantity' | 'unitPrice',
    value: string
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    console.log(`[PickupItemsListV3] Field change: ${field} = "${value}" for package ${packageIndex}`);

    const updatedPackaging = [...item.packaging];
    updatedPackaging[packageIndex] = {
      ...updatedPackaging[packageIndex],
      [field]: value,
    };

    console.log('[PickupItemsListV3] Updated packaging:', JSON.stringify(updatedPackaging));

    // Only update packaging - parent will auto-calculate totalValue
    onUpdateItem(itemId, 'packaging', updatedPackaging);
  };

  const calculateTotalValue = (itemId: string, packaging: PackagingDetail[]) => {
    // No longer needed - parent component auto-calculates when packaging changes
    // Just update the packaging, parent handles totalValue
  };

  const handleTotalWeightChange = (itemId: string, value: string) => {
    onUpdateItem(itemId, 'totalWeight', value);
  };

  const handleTotalValueChange = (itemId: string, value: string) => {
    onUpdateItem(itemId, 'totalValue', value);
  };

  const isPackagingSelected = (item: PickupItem, type: PackagingType): boolean => {
    return item.packaging.some((pkg) => pkg.type === type);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Items <Text style={styles.required}>*</Text>
      </Text>

      {items.map((item, index) => (
        <View key={item.id} style={styles.itemCard}>
          {/* Item Header */}
          <View style={styles.itemHeader}>
            <Text style={styles.itemLabel}>Item {index + 1}</Text>
            {items.length > 1 && (
              <TouchableOpacity
                onPress={() => onRemoveItem(item.id)}
                style={styles.removeItemButton}
                activeOpacity={0.7}
              >
                <Icon name="close-circle" size={24} color="#df0b37" />
              </TouchableOpacity>
            )}
          </View>

          {/* Confidence Badge (OCR) */}
          {item.confidence !== undefined && (
            <View style={[
              styles.confidenceBadge,
              item.confidence >= 0.85 ? styles.confidenceBadgeHigh :
              item.confidence >= 0.75 ? styles.confidenceBadgeMedium :
              styles.confidenceBadgeLow
            ]}>
              <Icon
                name={
                  item.confidence >= 0.85 ? "check-circle" :
                  item.confidence >= 0.75 ? "alert-circle" :
                  "alert"
                }
                size={16}
                color={
                  item.confidence >= 0.85 ? "#22C55E" :
                  item.confidence >= 0.75 ? "#F59E0B" :
                  "#EF4444"
                }
              />
              <Text style={[
                styles.confidenceText,
                item.confidence >= 0.85 ? styles.confidenceTextHigh :
                item.confidence >= 0.75 ? styles.confidenceTextMedium :
                styles.confidenceTextLow
              ]}>
                OCR: {(item.confidence * 100).toFixed(0)}% confidence
                {item.confidence < 0.75 && ' - Please verify'}
              </Text>
            </View>
          )}

          {/* Category Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Category</Text>
            <TouchableOpacity
              style={[
                styles.categoryInput,
                errors[`item_${item.id}_category`] && styles.inputError,
              ]}
              onPress={() => {
                setSelectedItemId(item.id);
                setCategoryModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryText,
                !item.category && styles.placeholderText
              ]}>
                {getCategoryLabel(item.category)}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Packaging Types */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Packaging Types</Text>
            <View style={styles.packagingChipsRow}>
              {PACKAGING_TYPES.map((type) => {
                const isSelected = isPackagingSelected(item, type);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.packagingChip,
                      isSelected && styles.packagingChipSelected,
                    ]}
                    onPress={() => handlePackagingToggle(item.id, type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.packagingChipText,
                      isSelected && styles.packagingChipTextSelected,
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Packaging Details - Quantity and Unit Price */}
          {item.packaging.length > 0 && (
            <View style={styles.packagingDetailsContainer}>
              {item.packaging.map((pkg, pkgIndex) => (
                <View key={pkgIndex} style={styles.packagingDetailRow}>
                  <View style={styles.packagingDetailHeader}>
                    <Text style={styles.packagingTypeName}>{pkg.type}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemovePackaging(item.id, pkgIndex)}
                      style={styles.removePackagingButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="trash-can-outline" size={20} color="#df0b37" />
                    </TouchableOpacity>
                  </View>

                  {/* Two-Column Layout: Quantity and Unit Price */}
                  <View style={styles.twoColumnRow}>
                    <View style={styles.columnInput}>
                      <Text style={styles.inputLabel}>Quantity</Text>
                      <TextInput
                        style={[
                          styles.input,
                          errors[`item_${item.id}_pkg_${pkgIndex}_quantity`] && styles.inputError,
                        ]}
                        value={pkg.quantity}
                        onChangeText={(value) => {
                          console.log('🔵 QUANTITY INPUT CHANGED:', value);
                          handlePackagingFieldChange(item.id, pkgIndex, 'quantity', value);
                        }}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>

                    <View style={styles.columnInput}>
                      <Text style={styles.inputLabel}>Unit Value ($)</Text>
                      <View style={styles.priceInputWrapper}>
                        <Text style={styles.dollarSign}>$</Text>
                        <TextInput
                          style={[
                            styles.input,
                            styles.priceInput,
                            errors[`item_${item.id}_pkg_${pkgIndex}_unitPrice`] && styles.inputError,
                          ]}
                          value={pkg.unitPrice}
                          onChangeText={(value) => {
                            console.log('🟢 UNIT PRICE INPUT CHANGED:', value);
                            handlePackagingFieldChange(item.id, pkgIndex, 'unitPrice', value);
                          }}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor="#999"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Totals Section */}
          <View style={styles.totalsSection}>
            {/* Total Weight Input */}
            <View style={styles.totalFieldContainer}>
              <Text style={styles.totalFieldLabel}>
                Total Weight <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.totalWeightInputWrapper}>
                <TextInput
                  style={[
                    styles.totalWeightInput,
                    errors[`item_${item.id}_totalWeight`] && styles.inputError,
                  ]}
                  value={item.totalWeight}
                  onChangeText={(value) => handleTotalWeightChange(item.id, value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
                <Text style={styles.weightUnit}>lbs</Text>
              </View>
            </View>

            {/* Total Est. Value Input */}
            <View style={styles.totalFieldContainer}>
              <View style={styles.totalValueHeader}>
                <Icon name="cash-multiple" size={20} color="#22C55E" />
                <Text style={styles.totalValueLabel}>
                  Total Est. Value ($) <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.totalValueInputWrapper}>
                <Text style={styles.dollarSignLarge}>$</Text>
                <TextInput
                  style={[
                    styles.totalValueInput,
                    errors[`item_${item.id}_totalValue`] && styles.inputError,
                  ]}
                  value={item.totalValue}
                  onChangeText={(value) => handleTotalValueChange(item.id, value)}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#999"
                />
              </View>
              <Text style={styles.autoCalcNote}>Auto-calculated (editable)</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Add Item Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAddItem} activeOpacity={0.7}>
        <Icon name="plus-circle" size={24} color="#4285F4" />
        <Text style={styles.addButtonText}>Add Another Item</Text>
      </TouchableOpacity>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {CATEGORY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    if (selectedItemId) {
                      handleCategorySelect(selectedItemId, option.value);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                  <Icon name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2B45',
    marginBottom: 16,
  },
  required: {
    color: '#df0b37',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B45',
  },
  removeItemButton: {
    padding: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B45',
    marginBottom: 8,
  },
  categoryInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: 8,
    padding: 16,
    minHeight: 48,
  },
  categoryText: {
    fontSize: 16,
    color: '#1A2B45',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#999',
    fontWeight: '400',
  },
  packagingChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  packagingChip: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packagingChipSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#2563EB',
  },
  packagingChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
  },
  packagingChipTextSelected: {
    color: '#FFFFFF',
  },
  packagingDetailsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  packagingDetailRow: {
    backgroundColor: '#F5F6F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  packagingDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packagingTypeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B45',
  },
  removePackagingButton: {
    padding: 4,
    backgroundColor: '#FFE5E5',
    borderRadius: 6,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B45',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceInputWrapper: {
    position: 'relative',
  },
  priceInput: {
    paddingLeft: 24,
  },
  dollarSign: {
    position: 'absolute',
    left: 12,
    top: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B45',
    zIndex: 1,
  },
  totalsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    gap: 16,
  },
  totalFieldContainer: {
    marginBottom: 8,
  },
  totalFieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B45',
    marginBottom: 8,
  },
  totalWeightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  totalWeightInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#F38020',
    paddingVertical: 16,
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F38020',
    marginLeft: 8,
  },
  totalValueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  totalValueLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  totalValueInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  dollarSignLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    marginRight: 8,
  },
  totalValueInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    paddingVertical: 16,
  },
  autoCalcNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285F4',
  },
  inputError: {
    borderColor: '#df0b37',
    borderWidth: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2B45',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1A2B45',
  },
  // Confidence Badge Styles
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
  },
  confidenceBadgeHigh: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  confidenceBadgeMedium: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  confidenceBadgeLow: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  confidenceTextHigh: {
    color: '#22C55E',
  },
  confidenceTextMedium: {
    color: '#F59E0B',
  },
  confidenceTextLow: {
    color: '#EF4444',
  },
});

export default PickupItemsListV3;
