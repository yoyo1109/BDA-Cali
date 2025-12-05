import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PackagingSelectorProps {
  selected: string[];
  onToggle: (type: string) => void;
}

const PACKAGING_TYPES = ['Boxes', 'Bags', 'Pallets'];

const PackagingSelector: React.FC<PackagingSelectorProps> = ({
  selected,
  onToggle,
}) => {
  const isSelected = (type: string): boolean => {
    return selected.includes(type);
  };

  return (
    <View style={styles.container}>
      {PACKAGING_TYPES.map((type) => {
        const selectedState = isSelected(type);

        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.chip,
              selectedState ? styles.chipSelected : styles.chipDefault,
            ]}
            onPress={() => onToggle(type)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedState ? styles.chipTextSelected : styles.chipTextDefault,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDefault: {
    backgroundColor: '#D1D9E6',
  },
  chipSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chipText: {
    fontSize: 16,
  },
  chipTextDefault: {
    color: '#1A2B45',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#1A2B45',
    fontWeight: '700',
  },
});

export default PackagingSelector;
