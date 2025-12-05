import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BatchIndicatorProps {
  color: string;
  zipCode: string;
  index: number;
  total: number;
  size?: 'small' | 'medium' | 'large';
}

export const BatchIndicator: React.FC<BatchIndicatorProps> = ({
  color,
  zipCode,
  index,
  total,
  size = 'medium',
}) => {
  const sizeStyles = {
    small: { width: 8, height: 8, marginRight: 6 },
    medium: { width: 12, height: 12, marginRight: 8 },
    large: { width: 16, height: 16, marginRight: 10 },
  };

  const textSizes = {
    small: { zip: 10, count: 9 },
    medium: { zip: 12, count: 11 },
    large: { zip: 14, count: 12 },
  };

  return (
    <View style={styles.container}>
      {/* Color dot indicator */}
      <View
        style={[
          styles.dot,
          sizeStyles[size],
          { backgroundColor: color }
        ]}
      />

      {/* ZIP code label */}
      <Text style={[styles.zipText, { fontSize: textSizes[size].zip }]}>
        ZIP {zipCode}
      </Text>

      {/* Batch count */}
      {total > 1 && (
        <Text style={[styles.countText, { fontSize: textSizes[size].count }]}>
          ({index}/{total})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dot: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  zipText: {
    fontWeight: '600',
    color: '#666',
    marginRight: 6,
  },
  countText: {
    color: '#999',
    fontWeight: '500',
  },
});
