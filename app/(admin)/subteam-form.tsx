import { useCreateSubteam, useSubteam, useUpdateSubteam } from '@/src/hooks/useSubteams';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SubteamFormScreen() {
  const params = useLocalSearchParams();
  const subteamId = params.id ? parseInt(params.id as string) : null;
  const isEditing = !!subteamId;

  const { data: subteam, isLoading: loadingSubteam } = useSubteam(subteamId!);
  const createSubteam = useCreateSubteam();
  const updateSubteam = useUpdateSubteam();

  const [subteamName, setSubteamName] = useState<'sportsman' | 'kinetic' | 'marketing' | 'autonomous'>('sportsman');
  const [showSubteamPicker, setShowSubteamPicker] = useState(false);

  useEffect(() => {
    if (subteam) {
      setSubteamName(subteam.subteam_name || 'sportsman');
    }
  }, [subteam]);

  const handleSubmit = async () => {
    const subteamData = {
      subteam_name: subteamName,
    };

    try {
      if (isEditing) {
        await updateSubteam.mutateAsync({ subteamId: subteamId!, subteam: subteamData });
        Alert.alert('Success', 'Subteam updated successfully');
      } else {
        await createSubteam.mutateAsync(subteamData);
        Alert.alert('Success', 'Subteam created successfully');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save subteam');
    }
  };

  if (loadingSubteam) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Subteam Name *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowSubteamPicker(true)}
        >
          <Text style={styles.pickerButtonText}>{subteamName}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={createSubteam.isPending || updateSubteam.isPending}
        >
          <Text style={styles.submitButtonText}>
            {createSubteam.isPending || updateSubteam.isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Subteam'
              : 'Create Subteam'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSubteamPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Subteam</Text>
            {(['sportsman', 'kinetic', 'marketing', 'autonomous'] as const).map((name) => (
              <TouchableOpacity
                key={name}
                style={styles.modalOption}
                onPress={() => {
                  setSubteamName(name);
                  setShowSubteamPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSubteamPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  form: {
    padding: 16,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  pickerButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#000',
    textTransform: 'capitalize',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1d21',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#fff',
    textTransform: 'capitalize',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e62020',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
