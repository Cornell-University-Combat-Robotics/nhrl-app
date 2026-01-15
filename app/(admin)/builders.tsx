import { useBuilders, useDeleteBuilder } from '@/src/hooks/useBuilders';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BuildersScreen() {
  const { data: builders, isLoading, error } = useBuilders();
  const deleteBuilder = useDeleteBuilder();

  const handleDelete = (builderId: number, builderName: string) => {
    Alert.alert(
      'Delete Builder',
      `Are you sure you want to delete ${builderName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBuilder.mutateAsync(builderId);
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
        <Text style={styles.errorText}>Error loading builders: {(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(admin)/builder-form')}
      >
        <Text style={styles.addButtonText}>+ Add New Builder</Text>
      </TouchableOpacity>

      {builders && builders.length > 0 ? (
        builders.map((builder: any) => (
          <View key={builder.builder_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.builderName}>{builder.builder_name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/builder-form?id=${builder.builder_id}`)}
                >
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(builder.builder_id, builder.builder_name)}
                >
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.detail}>
              Subteam: {builder.subteams?.subteam_name || 'N/A'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No builders found. Add your first builder!</Text>
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
    marginBottom: 8,
  },
  builderName: {
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
});
