import { useDeleteFight, useFights } from '@/src/hooks/useFights';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FightsScreen() {
  const { data: fights, isLoading, error } = useFights();
  const deleteFight = useDeleteFight();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

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

  if (isLoading) {
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
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(admin)/fight-form')}
      >
        <Text style={styles.addButtonText}>+ Add New Fight</Text>
      </TouchableOpacity>

      {fights && fights.length > 0 ? (
        fights.map((fight: any) => (
          <View key={fight.fight_id} style={styles.card}>
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
              Result: {fight.is_win ? '✅ Win' : '❌ Loss'} ({fight.outcome_type})
            </Text>
            {fight.cage && <Text style={styles.detail}>Cage: {fight.cage}</Text>}
            {fight.fight_time && (
              <Text style={styles.detail}>
                Fight Time: {fight.fight_time}
              </Text>
            )}
            {fight.fight_duration && (
              <Text style={styles.detail}>Duration: {fight.fight_duration}s</Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No fights found. Add your first fight!</Text>
      )}

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
    </ScrollView>
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
