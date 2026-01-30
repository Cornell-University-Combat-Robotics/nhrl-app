import { useFights } from '@/src/hooks/useFights';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

export default function FightsPage() {
  const { data: fights, isLoading, error } = useFights();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // The query will refetch automatically, this is just for the pull-to-refresh animation
    setTimeout(() => setRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ffd33d" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading fights</Text>
        <Text style={styles.errorSubText}>{error?.message || 'Unknown error'}</Text>
      </View>
    );
  }

  if (!fights || fights.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No fights scheduled</Text>
      </View>
    );
  }

  const renderFightCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.robotName}>{item.robot_name || item.robots?.robot_name || 'Unknown Robot'}</Text>
        <Text style={[styles.badge, {
          color: item.is_win === 'true' ? 'green' : 
           item.is_win === 'false' ? 'red' : 
           'yellow'
        }]}>
          {
            item.is_win === null || item.is_win === undefined || item.is_win === 'N/A'
              ? 'Upcoming'
              : item.is_win === 'true'
          ? '✓ Win'
          : '✗ Loss'
          }
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>Opponent:</Text>
          <Text style={styles.value}>{item.opponent_name}</Text>
        </View>

        {item.cage && (
          <View style={styles.row}>
            <Text style={styles.label}>Cage:</Text>
            <Text style={styles.value}>{item.cage}</Text>
          </View>
        )}

        {item.fight_time && (
          <View style={styles.row}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{item.fight_time}</Text>
          </View>
        )}

        {item.fight_duration && (
          <View style={styles.row}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>{item.fight_duration}s</Text>
          </View>
        )}

        {item.outcome_type && (
          <View style={styles.row}>
            <Text style={styles.label}>Outcome:</Text>
            <Text style={styles.value}>{item.outcome_type}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={fights}
        keyExtractor={(item) => `${item.fight_id}`}
        renderItem={renderFightCard}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25292e',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#1d1f23',
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0008ff',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  robotName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  badge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#3d3d3d',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 8,
    fontWeight: '600',
  },
  errorSubText: {
    fontSize: 13,
    color: '#a0a0a0',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: '500',
  },
});
