import { useDeleteSubteam, useSubteams } from '@/src/hooks/useSubteams';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SubteamsScreen() {
  const { data: subteams, isLoading, error } = useSubteams();
  const deleteSubteam = useDeleteSubteam();

  const handleDelete = (subteamId: number, subteamName: string) => {
    Alert.alert(
      'Delete Subteam',
      `Are you sure you want to delete ${subteamName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubteam.mutateAsync(subteamId);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
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
        <Text style={styles.errorText}>Error loading subteams: {(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(admin)/subteam-form')}
      >
        <Text style={styles.addButtonText}>+ Add New Subteam</Text>
      </TouchableOpacity>

      {subteams && subteams.length > 0 ? (
        subteams.map((subteam: any) => (
          <View key={subteam.subteam_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.subteamName}>{subteam.subteam_name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/subteam-form?id=${subteam.subteam_id}`)}
                >
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(subteam.subteam_id, subteam.subteam_name)}
                >
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No subteams found. Add your first subteam!</Text>
      )}
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
  },
  subteamName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textTransform: 'capitalize',
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
});
