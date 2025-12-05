import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface WeightInputRowProps {
  weight: string;
  onWeightChange: (weight: string) => void;
  onCameraPress: () => void;
  placeholder?: string;
  unit?: string;
}

const WeightInputRow: React.FC<WeightInputRowProps> = ({
  weight,
  onWeightChange,
  onCameraPress,
  placeholder = 'Enter weight',
  unit = 'lbs',
}) => {
  return (
    <View style={styles.container}>
      {/* Circular Camera Button */}
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={onCameraPress}
        activeOpacity={0.7}
      >
        <Icon name="camera" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Weight Input Card */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={onWeightChange}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          keyboardType="decimal-pad"
          maxLength={10}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  cameraButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inputCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: '#1A2B45',
    padding: 0,
  },
  unit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B45',
    marginLeft: 8,
  },
});

export default WeightInputRow;
