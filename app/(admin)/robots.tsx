import { useDeleteRobot, useRobots } from '@/src/hooks/useRobots';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RobotsScreen() {
  const { data: robots, isLoading, error } = useRobots();
  const deleteRobot = useDeleteRobot();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const handleDelete = (robotId: number, robotName: string) => {
    setDeleteTarget({ id: robotId, name: robotName });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRobot.mutateAsync(deleteTarget.id);
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      Alert.alert('Success', 'Robot deleted successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete robot');
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
        <Text style={styles.errorText}>Error loading robots: {(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(admin)/robot-form')}
      >
        <Text style={styles.addButtonText}>+ Add New Robot</Text>
      </TouchableOpacity>

      {robots && robots.length > 0 ? (
        robots.map((robot: any) => (
          <View key={robot.robot_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.robotName}>{robot.robot_name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/robot-form?id=${robot.robot_id}`)}
                >
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(robot.robot_id, robot.robot_name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.detail}>Builder: {robot.builders?.builder_name || 'N/A'}</Text>
            <Text style={styles.detail}>Weight Class: {robot.weight_class}</Text>
            <Text style={styles.detail}>Weapon: {robot.weapon}</Text>
            <Text style={styles.detail}>Drive: {robot.drive}</Text>
            {robot.top_speed && <Text style={styles.detail}>Top Speed: {robot.top_speed} mph</Text>}
            {robot.weapon_speed && <Text style={styles.detail}>Weapon Speed: {robot.weapon_speed} rpm</Text>}
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No robots found. Add your first robot!</Text>
      )}

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Robot</Text>
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
                disabled={deleteRobot.isPending}
              >
                <Text style={styles.deleteButtonModalText}>
                  {deleteRobot.isPending ? 'Deleting...' : 'Delete'}
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
  robotName: {
    fontSize: 20,
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
