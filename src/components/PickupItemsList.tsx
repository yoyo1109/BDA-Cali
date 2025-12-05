import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DonationCategory } from '../types/pickup.types';
import { PickupItem } from '../types/pickupItem.types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface PickupItemsListProps {
  items: PickupItem[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof PickupItem, value: string) => void;
  errors?: { [key: string]: string };
}

const PickupItemsList: React.FC<PickupItemsListProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  errors = {},
}) => {
  const weightInputRefs = useRef<{ [key: string]: TextInput | null }>({});
  const previousItemCount = useRef(items.length);

  // Debug: Log items whenever they change
  useEffect(() => {
    console.log('[PickupItemsList] Items changed:', items.length, 'items');
    items.forEach((item, idx) => {
      console.log(`  Item ${idx + 1}:`, {
        category: item.category || '(empty)',
        weight: item.weight || '(empty)',
        price: item.pricePerPound || '(empty)',
      });
    });

    // Auto-focus on new item's weight field
    if (items.length > previousItemCount.current) {
      const newItem = items[items.length - 1];
      setTimeout(() => {
        weightInputRefs.current[newItem.id]?.focus();
      }, 100);
    }
    previousItemCount.current = items.length;
  }, [items]);
  const calculateTotal = (item: PickupItem): string => {
    const weight = parseFloat(item.weight) || 0;
    const price = parseFloat(item.pricePerPound) || 0;
    const total = weight * price;
    return total > 0 ? `$${total.toFixed(2)}` : '$0.00';
  };

  const calculateGrandTotal = (): string => {
    const total = items.reduce((sum, item) => {
      const weight = parseFloat(item.weight) || 0;
      const price = parseFloat(item.pricePerPound) || 0;
      return sum + (weight * price);
    }, 0);
    return `$${total.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          Pickup Items <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddItem}>
          <Icon name="plus-circle" size={24} color={COLORS.brightBlue} />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {items.map((item, index) => (
        <View key={item.id} style={styles.itemCard}>
          {/* Item Header */}
          <View style={styles.itemHeader}>
            <Text style={styles.itemNumber}>Item {index + 1}</Text>
            {items.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveItem(item.id)}
              >
                <Icon name="close-circle" size={20} color={COLORS.error} />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Picker - Enhanced for iOS visibility */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.pickerContainer,
                errors[`item_${item.id}_category`] && styles.inputError,
              ]}
            >
              <Picker
                selectedValue={item.category}
                onValueChange={(value) => {
                  console.log(`[PickupItemsList] Category updated for item ${index + 1}:`, value);
                  onUpdateItem(item.id, 'category', value as string);
                }}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select a category..." value="" color={COLORS.gray} />
                <Picker.Item label="🥗 Produce" value={DonationCategory.PRODUCE} />
                <Picker.Item label="🥛 Dairy" value={DonationCategory.DAIRY} />
                <Picker.Item label="🍞 Bakery" value={DonationCategory.BAKERY} />
                <Picker.Item label="🥫 Canned Goods" value={DonationCategory.CANNED_GOODS} />
                <Picker.Item label="🌾 Dry Goods" value={DonationCategory.DRY_GOODS} />
                <Picker.Item label="🥩 Meat" value={DonationCategory.MEAT} />
                <Picker.Item label="❄️ Frozen" value={DonationCategory.FROZEN} />
                <Picker.Item label="🍱 Mixed" value={DonationCategory.MIXED} />
                <Picker.Item label="📦 Other" value={DonationCategory.OTHER} />
              </Picker>
            </View>
          </View>

          {/* Weight and Price in a Row */}
          <View style={styles.row}>
            {/* Weight Input */}
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Weight (lbs) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                ref={(ref) => (weightInputRefs.current[item.id] = ref)}
                style={[
                  styles.input,
                  errors[`item_${item.id}_weight`] && styles.inputError,
                ]}
                placeholder="0.0"
                placeholderTextColor={COLORS.gray}
                keyboardType="decimal-pad"
                value={item.weight}
                onChangeText={(value) => {
                  console.log(`[PickupItemsList] Weight updated for item ${index + 1}:`, value);
                  onUpdateItem(item.id, 'weight', value);
                }}
              />
            </View>

            {/* Price Per Pound */}
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Price/lb <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={[
                    styles.priceInput,
                    errors[`item_${item.id}_price`] && styles.inputError,
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="decimal-pad"
                  value={item.pricePerPound}
                  onChangeText={(value) => {
                    console.log(`[PickupItemsList] Price updated for item ${index + 1}:`, value);
                    onUpdateItem(item.id, 'pricePerPound', value);
                  }}
                />
              </View>
            </View>
          </View>

          {/* Item Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Item Total:</Text>
            <Text style={styles.totalValue}>{calculateTotal(item)}</Text>
          </View>
        </View>
      ))}

      {/* Grand Total */}
      {items.length > 1 && (
        <View style={styles.grandTotalCard}>
          <Text style={styles.grandTotalLabel}>Total Value:</Text>
          <Text style={styles.grandTotalValue}>{calculateGrandTotal()}</Text>
        </View>
      )}

      {/* Helper Text */}
      <Text style={styles.helperText}>
        Add all items from this pickup location. Each item should have a category, weight, and
        price per pound.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.darkBlue,
  },
  required: {
    color: COLORS.error,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.brightBlue,
  },
  addButtonText: {
    color: COLORS.brightBlue,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.darkBlue,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: SPACING.sm,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.brightBlue,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    // Enhanced styling for iOS visibility
    minHeight: 50,
    justifyContent: 'center',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    color: COLORS.black,
  },
  pickerItem: {
    fontSize: FONT_SIZES.md,
    height: 150,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    paddingLeft: SPACING.md,
  },
  dollarSign: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginRight: SPACING.xs,
  },
  priceInput: {
    flex: 1,
    padding: SPACING.md,
    paddingLeft: 0,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  totalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.brightBlue,
  },
  grandTotalCard: {
    backgroundColor: COLORS.orange,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  grandTotalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  grandTotalValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default PickupItemsList;
