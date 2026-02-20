import { useCron, useUpdateCron } from '@/src/hooks/useCRON';
import { useDeleteFight, useFights } from '@/src/hooks/useFights';
import { useRealtimeFights } from '@/src/hooks/useRealtimeFights';
import { formatTimeForDisplay, parseCompetitionDate } from '@/src/utils/timeHelpers';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FightsScreen() {
  const { data: fights, isLoading, error, refetch } = useFights();
  useRealtimeFights();
  const { data: cron, isLoading: loadingCron } = useCron();
  const deleteFight = useDeleteFight();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const updateCron = useUpdateCron();

  // Re-fetch fights when screen comes into focus (e.g. after editing/creating a fight)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleDelete = (fightId: number, fightName: string) => {
    setDeleteTarget({ id: fightId, name: fightName });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFight.mutateAsync(deleteTarget.id);
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      Alert.alert('Success', 'Fight deleted successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete fight');
    }
  };

  const handleCron = async () => {
    try {
      console.log('handleCron', cron);
      const cur_schedule = cron?.[0].cron_schedule;
      await updateCron.mutateAsync(cur_schedule);
      console.log('successfully updated cron', cron);
    } catch (err: any) {
      Alert.alert('Error', `Failed to update season: ${err.message || 'Unknown error'}`);
    }
  }

  const sections = useMemo(() => {
    if (!fights) return [];

    const grouped = fights.reduce((acc: any, fight: any) => {
      const comp = (fight.competition || 'unspecified').toLowerCase();
      if (!acc[comp]) {
        acc[comp] = [];
      }
      acc[comp].push(fight);
      return acc;
    }, {});

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === 'unspecified') return 1;
      if (b === 'unspecified') return -1;
      
      const dateA = parseCompetitionDate(a);
      const dateB = parseCompetitionDate(b);
      return dateB.getTime() - dateA.getTime();
    });

    return sortedKeys.map(key => ({
      title: key,
      data: grouped[key]
    }));
  }, [fights]);

  if (isLoading || loadingCron) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error loading fights: {(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item: any) => `${item.fight_id}`}
        ListHeaderComponent={() => (
          <>
            <TouchableOpacity
              style={styles.cronButton}
              onPress={() => handleCron()}
            >
              <Text style={styles.cronButtonText}>{cron?.[0]?.cron_schedule === '* * * * *' ? 'Deactivate Season' : 'Activate Season'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(admin)/fight-form')}
            >
              <Text style={styles.addButtonText}>+ Add New Fight</Text>
            </TouchableOpacity>
          </>
        )}
        renderSectionHeader={({ section: { title } }: { section: { title: string } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        renderItem={({ item: fight }: { item: any }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.fightTitle}>
                {fight.robots?.robot_name || 'Unknown'} vs {fight.opponent_name}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/fight-form?id=${fight.fight_id}`)}
                >
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(fight.fight_id, `${fight.robots?.robot_name || 'Unknown'} vs ${fight.opponent_name}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.detail}>
              Result: {fight.is_win === 'win' ? '✅ Win' : (fight.is_win === 'lose' ? '❌ Loss' : 'N/A')} {fight.outcome_type !== 'N/A' ? `(${fight.outcome_type})` : ''}
            </Text>
            {fight.cage && <Text style={styles.detail}>Cage: {fight.cage}</Text>}
            {fight.fight_time && (
              <Text style={styles.detail}>
                Fight Time: {formatTimeForDisplay(fight.fight_time)}
              </Text>
            )}
            {fight.fight_duration && (
              <Text style={styles.detail}>Duration: {fight.fight_duration}s</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No fights found. Add your first fight!</Text>
        }
        stickySectionHeadersEnabled={false}
      />

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Fight</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete {deleteTarget?.name}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeleteTarget(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButtonModal]}
                onPress={confirmDelete}
                disabled={deleteFight.isPending}
              >
                <Text style={styles.deleteButtonModalText}>
                  {deleteFight.isPending ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25292e',
  },
  cronButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cronButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#25292e',
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#1a1d21',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    color: '#4CAF50',
    fontSize: 14,
  },
  deleteButton: {
    color: '#e62020',
    fontSize: 14,
  },
  detail: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  errorText: {
    color: '#e62020',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1d21',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonModal: {
    backgroundColor: '#e62020',
  },
  deleteButtonModalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
