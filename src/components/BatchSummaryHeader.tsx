import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getBatchSummary, BatchedPickup } from '../services/batchingService';

interface BatchSummaryHeaderProps {
  pickups: BatchedPickup[];
}

export const BatchSummaryHeader: React.FC<BatchSummaryHeaderProps> = ({ pickups }) => {
  if (!pickups || pickups.length === 0) {
    return null;
  }

  const summary = getBatchSummary(pickups);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Today's Route: {summary.totalPickups} {summary.totalPickups === 1 ? 'Pickup' : 'Pickups'} in {summary.totalBatches} {summary.totalBatches === 1 ? 'Area' : 'Areas'}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {summary.batchBreakdown.map((batch) => (
          <View key={batch.zipCode} style={styles.batchChip}>
            <View
              style={[styles.colorDot, { backgroundColor: batch.color }]}
            />
            <Text style={styles.batchText}>
              ZIP {batch.zipCode}: {batch.count}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: 16,
  },
  batchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  batchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
