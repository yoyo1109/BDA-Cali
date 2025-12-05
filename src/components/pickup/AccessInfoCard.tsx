import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AccessInfoCardProps {
  dockCode?: string;
  loadingTips?: string;
}

const AccessInfoCard: React.FC<AccessInfoCardProps> = ({
  dockCode,
  loadingTips,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Access Notes</Text>

      {dockCode && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Dock Code:</Text>
          <Text style={styles.value}>{dockCode}</Text>
        </View>
      )}

      {loadingTips && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Loading Tips:</Text>
          <Text style={styles.value}>{loadingTips}</Text>
        </View>
      )}

      {!dockCode && !loadingTips && (
        <Text style={styles.value}>No access notes provided</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A2B45',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B8C4',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#B0B8C4',
    lineHeight: 20,
  },
});

export default AccessInfoCard;
