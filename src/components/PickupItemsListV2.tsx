import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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

const PickupItemsListV2: React.FC<PickupItemsListProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  errors,
}) => {
  const previousItemCount = useRef(items.length);

  useEffect(() => {
    console.log('[PickupItemsListV2] Items changed:', items.length, 'items');
    items.forEach((item, idx) => {
      console.log(`  Item ${idx + 1}:`, {
        category: item.category || '(empty)',
        packaging: item.packaging.length,
        totalPrice: item.totalPrice,
      });
    });
    previousItemCount.current = items.length;
  }, [items]);

  const handleAddPackaging = (itemId: string, type: PackagingType) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Check if this packaging type already exists
    const exists = item.packaging.some((pkg) => pkg.type === type);
    if (exists) return;

    // Add new packaging
    const newPackaging: PackagingDetail = {
      type,
      quantity: '',
      pricePerUnit: '',
      subtotal: 0,
    };

    onUpdateItem(itemId, 'packaging', [...item.packaging, newPackaging]);
  };

  const handleRemovePackaging = (itemId: string, packageIndex: number) => {
    console.log('[PickupItemsListV2] Removing packaging at index:', packageIndex, 'from item:', itemId);
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      console.log('[PickupItemsListV2] Item not found:', itemId);
      return;
    }

    console.log('[PickupItemsListV2] Current packaging:', item.packaging.length);
    const updatedPackaging = item.packaging.filter((_, idx) => idx !== packageIndex);
    console.log('[PickupItemsListV2] Updated packaging:', updatedPackaging.length);

    onUpdateItem(itemId, 'packaging', updatedPackaging);

    // Recalculate total
    calculateItemTotal(itemId, updatedPackaging);
  };

  const handlePackagingChange = (
    itemId: string,
    packageIndex: number,
    field: 'quantity' | 'pricePerUnit',
    value: string
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const updatedPackaging = [...item.packaging];
    updatedPackaging[packageIndex] = {
      ...updatedPackaging[packageIndex],
      [field]: value,
    };

    // Calculate subtotal for this package
    const quantity = field === 'quantity' ? parseFloat(value) : parseFloat(updatedPackaging[packageIndex].quantity);
    const price = field === 'pricePerUnit' ? parseFloat(value) : parseFloat(updatedPackaging[packageIndex].pricePerUnit);
    updatedPackaging[packageIndex].subtotal = (isNaN(quantity) || isNaN(price)) ? 0 : quantity * price;

    onUpdateItem(itemId, 'packaging', updatedPackaging);

    // Recalculate item total
    calculateItemTotal(itemId, updatedPackaging);
  };

  const calculateItemTotal = (itemId: string, packaging: PackagingDetail[]) => {
    const total = packaging.reduce((sum, pkg) => sum + pkg.subtotal, 0);
    onUpdateItem(itemId, 'totalPrice', total);
  };

  const getAvailablePackaging = (item: PickupItem): PackagingType[] => {
    const usedTypes = item.packaging.map((pkg) => pkg.type);
    return PACKAGING_TYPES.filter((type) => !usedTypes.includes(type));
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
                style={styles.removeButton}
              >
                <Icon name="close-circle" size={24} color="#df0b37" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Picker */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Category:</Text>
            <View
              style={[
                styles.pickerContainer,
                errors[`item_${item.id}_category`] && styles.inputError,
              ]}
            >
              <Picker
                selectedValue={item.category}
                onValueChange={(value) => onUpdateItem(item.id, 'category', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select category..." value="" />
                {CATEGORY_OPTIONS.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Packaging Section */}
          <View style={styles.packagingSection}>
            <Text style={styles.fieldLabel}>Packaging Types:</Text>

            {/* Existing Packaging */}
            {item.packaging.map((pkg, pkgIndex) => (
              <View key={pkgIndex} style={styles.packageRow}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageType}>{pkg.type}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemovePackaging(item.id, pkgIndex)}
                    style={styles.removePackageButton}
                    activeOpacity={0.7}
                  >
                    <Icon name="close-circle" size={20} color="#df0b37" />
                  </TouchableOpacity>
                </View>

                <View style={styles.packageInputs}>
                  <View style={styles.packageField}>
                    <Text style={styles.packageFieldLabel}>Quantity:</Text>
                    <TextInput
                      style={[
                        styles.packageInput,
                        errors[`item_${item.id}_pkg_${pkgIndex}_quantity`] && styles.inputError,
                      ]}
                      value={pkg.quantity}
                      onChangeText={(value) =>
                        handlePackagingChange(item.id, pkgIndex, 'quantity', value)
                      }
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>

                  <Text style={styles.multiplication}>×</Text>

                  <View style={styles.packageField}>
                    <Text style={styles.packageFieldLabel}>Price/Unit:</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={[
                          styles.packageInput,
                          { paddingLeft: 8 },
                          errors[`item_${item.id}_pkg_${pkgIndex}_price`] && styles.inputError,
                        ]}
                        value={pkg.pricePerUnit}
                        onChangeText={(value) =>
                          handlePackagingChange(item.id, pkgIndex, 'pricePerUnit', value)
                        }
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                      />
                    </View>
                  </View>

                  <Text style={styles.equals}>=</Text>

                  <View style={styles.subtotalContainer}>
                    <Text style={styles.subtotalLabel}>Subtotal:</Text>
                    <Text style={styles.subtotalValue}>
                      ${pkg.subtotal.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Add Packaging Buttons */}
            {getAvailablePackaging(item).length > 0 && (
              <View style={styles.addPackagingContainer}>
                <Text style={styles.addPackagingLabel}>Add:</Text>
                <View style={styles.packagingChips}>
                  {getAvailablePackaging(item).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.packagingChip}
                      onPress={() => handleAddPackaging(item.id, type)}
                    >
                      <Icon name="plus-circle-outline" size={16} color="#4285F4" />
                      <Text style={styles.packagingChipText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {item.packaging.length === 0 && (
              <Text style={styles.noPackagingText}>
                No packaging types selected. Tap a button above to add.
              </Text>
            )}

            {errors[`item_${item.id}_packaging`] && (
              <Text style={styles.errorText}>{errors[`item_${item.id}_packaging`]}</Text>
            )}
          </View>

          {/* Item Total */}
          <View style={styles.itemTotalRow}>
            <Text style={styles.itemTotalLabel}>Item Total:</Text>
            <Text style={styles.itemTotalValue}>${item.totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      ))}

      {/* Add Item Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAddItem}>
        <Icon name="plus-circle" size={24} color="#4285F4" />
        <Text style={styles.addButtonText}>Add Another Item</Text>
      </TouchableOpacity>
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
    marginBottom: 12,
  },
  required: {
    color: '#df0b37',
  },
  itemCard: {
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B45',
  },
  removeButton: {
    padding: 4,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B45',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4285F4',
    minHeight: 48,
  },
  picker: {
    height: 48,
    color: '#1A2B45',
    fontSize: 16,
  },
  packagingSection: {
    marginBottom: 16,
  },
  packageRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2B45',
  },
  removePackageButton: {
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  packageField: {
    flex: 1,
    minWidth: 100,
  },
  packageFieldLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  packageInput: {
    backgroundColor: '#F5F6F8',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B45',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B45',
    paddingLeft: 8,
  },
  multiplication: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 8,
  },
  equals: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 8,
  },
  subtotalContainer: {
    flex: 1,
    minWidth: 100,
  },
  subtotalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  addPackagingContainer: {
    marginTop: 8,
  },
  addPackagingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  packagingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packagingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  packagingChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4285F4',
  },
  noPackagingText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
  },
  itemTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B45',
  },
  itemTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F38020',
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
  errorText: {
    fontSize: 12,
    color: '#df0b37',
    marginTop: 4,
  },
});

export default PickupItemsListV2;
