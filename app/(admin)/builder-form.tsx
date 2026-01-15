import { useBuilder, useCreateBuilder, useUpdateBuilder } from '@/src/hooks/useBuilders';
import { useSubteams } from '@/src/hooks/useSubteams';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BuilderFormScreen() {
  const params = useLocalSearchParams();
  const builderId = params.id ? parseInt(params.id as string) : null;
  const isEditing = !!builderId;

  const { data: builder, isLoading: loadingBuilder } = useBuilder(builderId!);
  const { data: subteams, isLoading: loadingSubteams } = useSubteams();
  const createBuilder = useCreateBuilder();
  const updateBuilder = useUpdateBuilder();

  const [builderName, setBuilderName] = useState('');
  const [subteamId, setSubteamId] = useState('');
  const [showSubteamPicker, setShowSubteamPicker] = useState(false);

  useEffect(() => {
    if (builder) {
      setBuilderName(builder.builder_name || '');
      setSubteamId(builder.subteam_id?.toString() || '');
    }
  }, [builder]);

  const handleSubmit = async () => {
    if (!builderName || !subteamId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const builderData = {
      builder_name: builderName,
      subteam_id: parseInt(subteamId),
    };

    try {
      if (isEditing) {
        await updateBuilder.mutateAsync({ builderId: builderId!, builder: builderData });
        Alert.alert('Success', 'Builder updated successfully');
      } else {
        await createBuilder.mutateAsync(builderData);
        Alert.alert('Success', 'Builder created successfully');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save builder');
    }
  };

  if (loadingBuilder || loadingSubteams) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Builder Name *</Text>
        <TextInput
          style={styles.input}
          value={builderName}
          onChangeText={setBuilderName}
          placeholder="Enter builder name"
        />

        <Text style={styles.label}>Subteam *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowSubteamPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {subteamId
              ? subteams?.find((s: any) => s.subteam_id.toString() === subteamId)?.subteam_name || 'Select a subteam'
              : 'Select a subteam'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={createBuilder.isPending || updateBuilder.isPending}
        >
          <Text style={styles.submitButtonText}>
            {createBuilder.isPending || updateBuilder.isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Builder'
              : 'Create Builder'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSubteamPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Subteam</Text>
            <ScrollView>
              {subteams?.map((subteam: any) => (
                <TouchableOpacity
                  key={subteam.subteam_id}
                  style={styles.modalOption}
                  onPress={() => {
                    setSubteamId(subteam.subteam_id.toString());
                    setShowSubteamPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{subteam.subteam_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
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
