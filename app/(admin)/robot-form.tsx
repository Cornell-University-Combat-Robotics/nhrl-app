import { useBuilders } from '@/src/hooks/useBuilders';
import { useCreateRobot, useRobot, useUpdateRobot } from '@/src/hooks/useRobots';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RobotFormScreen() {
  const params = useLocalSearchParams();
  const robotId = params.id ? parseInt(params.id as string) : null;
  const isEditing = !!robotId;

  const { data: robot, isLoading: loadingRobot } = useRobot(robotId!);
  const { data: builders, isLoading: loadingBuilders } = useBuilders();
  const createRobot = useCreateRobot();
  const updateRobot = useUpdateRobot();

  const [robotName, setRobotName] = useState('');
  const [builderId, setBuilderId] = useState('');
  const [weightClass, setWeightClass] = useState<'3lb' | '12lb'>('3lb');
  const [weapon, setWeapon] = useState<'drum' | 'vertical spinner' | 'horizontal spinner'>('drum');
  const [drive, setDrive] = useState<'walker' | '2 wheel' | '4 wheel'>('2 wheel');
  const [topSpeed, setTopSpeed] = useState('');
  const [weaponSpeed, setWeaponSpeed] = useState('');
  const [showBuilderPicker, setShowBuilderPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [showWeaponPicker, setShowWeaponPicker] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  useEffect(() => {
    if (robot) {
      setRobotName(robot.robot_name || '');
      setBuilderId(robot.builder_id?.toString() || '');
      setWeightClass(robot.weight_class || '3lb');
      setWeapon(robot.weapon || 'drum');
      setDrive(robot.drive || '2 wheel');
      setTopSpeed(robot.top_speed?.toString() || '');
      setWeaponSpeed(robot.weapon_speed?.toString() || '');
    }
  }, [robot]);

  const handleSubmit = async () => {
    if (!robotName || !builderId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const robotData = {
      robot_name: robotName,
      builder_id: parseInt(builderId),
      weight_class: weightClass,
      weapon: weapon,
      drive: drive,
      top_speed: topSpeed ? parseInt(topSpeed) : undefined,
      weapon_speed: weaponSpeed ? parseInt(weaponSpeed) : undefined,
    };

    try {
      if (isEditing) {
        await updateRobot.mutateAsync({ robotId: robotId!, robot: robotData });
        Alert.alert('Success', 'Robot updated successfully');
      } else {
        await createRobot.mutateAsync(robotData);
        Alert.alert('Success', 'Robot created successfully');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save robot');
    }
  };

  if (loadingRobot || loadingBuilders) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Robot Name *</Text>
        <TextInput
          style={styles.input}
          value={robotName}
          onChangeText={setRobotName}
          placeholder="Enter robot name"
        />

        <Text style={styles.label}>Builder *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowBuilderPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {builderId
              ? builders?.find((b: any) => b.builder_id.toString() === builderId)?.builder_name || 'Select a builder'
              : 'Select a builder'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Weight Class *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowWeightPicker(true)}
        >
          <Text style={styles.pickerButtonText}>{weightClass}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Weapon *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowWeaponPicker(true)}
        >
          <Text style={styles.pickerButtonText}>{weapon}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Drive *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowDrivePicker(true)}
        >
          <Text style={styles.pickerButtonText}>{drive}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Top Speed (mph)</Text>
        <TextInput
          style={styles.input}
          value={topSpeed}
          onChangeText={setTopSpeed}
          placeholder="Enter top speed"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Weapon Speed (rpm)</Text>
        <TextInput
          style={styles.input}
          value={weaponSpeed}
          onChangeText={setWeaponSpeed}
          placeholder="Enter weapon speed"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={createRobot.isPending || updateRobot.isPending}
        >
          <Text style={styles.submitButtonText}>
            {createRobot.isPending || updateRobot.isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Robot'
              : 'Create Robot'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Builder Picker Modal */}
      <Modal visible={showBuilderPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Builder</Text>
            <ScrollView>
              {builders?.map((builder: any) => (
                <TouchableOpacity
                  key={builder.builder_id}
                  style={styles.modalOption}
                  onPress={() => {
                    setBuilderId(builder.builder_id.toString());
                    setShowBuilderPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{builder.builder_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowBuilderPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Weight Class Picker Modal */}
      <Modal visible={showWeightPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Weight Class</Text>
            {(['3lb', '12lb'] as const).map((wc) => (
              <TouchableOpacity
                key={wc}
                style={styles.modalOption}
                onPress={() => {
                  setWeightClass(wc);
                  setShowWeightPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{wc}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowWeightPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Weapon Picker Modal */}
      <Modal visible={showWeaponPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Weapon</Text>
            {(['drum', 'vertical spinner', 'horizontal spinner'] as const).map((w) => (
              <TouchableOpacity
                key={w}
                style={styles.modalOption}
                onPress={() => {
                  setWeapon(w);
                  setShowWeaponPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{w}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowWeaponPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Drive Picker Modal */}
      <Modal visible={showDrivePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Drive</Text>
            {(['walker', '2 wheel', '4 wheel'] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.modalOption}
                onPress={() => {
                  setDrive(d);
                  setShowDrivePicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{d}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDrivePicker(false)}
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
});
