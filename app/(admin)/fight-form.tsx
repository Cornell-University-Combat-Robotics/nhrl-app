import { useCreateFight, useFight, useUpdateFight } from '@/src/hooks/useFights';
import { useRobots } from '@/src/hooks/useRobots';
import { updateFightNotifBroadcast } from '@/src/notifications/sendPushNotif';
import { supabase } from '@/src/supabaseClient';
import { formatTimeForDisplay } from '@/src/utils/timeHelpers';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FightFormScreen() {
  const params = useLocalSearchParams();
  const fightId = params.id ? parseInt(params.id as string) : null;
  const isEditing = !!fightId;

  const { data: fight, isLoading: loadingFight } = useFight(fightId!);
  const { data: robots, isLoading: loadingRobots } = useRobots();
  const createFight = useCreateFight();
  const updateFight = useUpdateFight();

  const [robotId, setRobotId] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [cage, setCage] = useState('');
  const [fightTime, setFightTime] = useState('');
  const [isWin, setIsWin] = useState<'win' | 'lose' | 'N/A'>('N/A');
  const [fightDuration, setFightDuration] = useState('');
  const [outcomeType, setOutcomeType] = useState<'KO' | 'Judges Decision' | 'Tapout' | 'N/A'>('N/A');
  const [showRobotPicker, setShowRobotPicker] = useState(false);
  const [showOutcomePicker, setShowOutcomePicker] = useState(false);
  const [showIsWinPicker, setShowIsWinPicker] = useState(false);

  useEffect(() => {
    if (fight) {
      setRobotId(fight.robot_id?.toString() || '');
      setOpponentName(fight.opponent_name || '');
      setCage(fight.cage?.toString() || '');
      setFightTime(formatTimeForDisplay(fight.fight_time));
      const winVal = fight.is_win;
      if (winVal === 'win') {
        setIsWin('win');
      } else if (winVal === 'lose') {
        setIsWin('lose');
      } else {
        setIsWin('N/A');
      }
      setFightDuration(fight.fight_duration?.toString() || '');
      setOutcomeType(fight.outcome_type || 'KO');
    }
  }, [fight]);

  const handleSubmit = async () => {
    if (!robotId || !opponentName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const fightData = {
      robot_id: parseInt(robotId),
      robot_name: robots?.find((r: any) => r.robot_id.toString() === robotId)?.robot_name || '',
      opponent_name: opponentName,
      cage: cage ? parseInt(cage) : undefined,
      fight_time: fightTime || undefined,
      is_win: isWin === 'N/A' ? null : isWin,
      fight_duration: fightDuration ? parseInt(fightDuration) : undefined,
      outcome_type: outcomeType,
    };
    //TOOD: im worried that our manually added fights may not sync up with scraper (create duplicate fights)
    try {
      if (isEditing) {
        const isWinUpdate = fight?.is_win == null && fightData.is_win != null;
        await updateFight.mutateAsync({ fightId: fightId!, fight: fightData, isWinUpdate });
        if (isWinUpdate) {
          updateFightNotifBroadcast(fightData, supabase, { isWinUpdate: true });
        } else {
          updateFightNotifBroadcast(fightData, supabase, { isWinUpdate: false });
        }

        Alert.alert('Success', 'Fight updated successfully');
      } else {
        await createFight.mutateAsync(fightData);
        Alert.alert('Success', 'Fight created successfully');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save fight');
    }
  };

  if (loadingFight || loadingRobots) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Robot *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowRobotPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {robotId
              ? robots?.find((r: any) => r.robot_id.toString() === robotId)?.robot_name || 'Select a robot'
              : 'Select a robot'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Opponent Name *</Text>
        <TextInput
          style={styles.input}
          value={opponentName}
          onChangeText={setOpponentName}
          placeholder="Enter opponent name"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Cage</Text>
        <TextInput
          style={styles.input}
          value={cage}
          onChangeText={setCage}
          placeholder="Enter cage number"
          placeholderTextColor="#888"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Fight Time</Text>
        <TextInput
          style={styles.input}
          value={fightTime}
          onChangeText={setFightTime}
          placeholder="HH:MM"
          placeholderTextColor="#888"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Win?</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowIsWinPicker(true)}
          >
            <Text style={styles.pickerButtonText}>{isWin}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Outcome Type *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowOutcomePicker(true)}
        >
          <Text style={styles.pickerButtonText}>{outcomeType}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Fight Duration (seconds)</Text>
        <TextInput
          style={styles.input}
          value={fightDuration}
          onChangeText={setFightDuration}
          placeholder="Enter duration in seconds"
          placeholderTextColor="#888"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={createFight.isPending || updateFight.isPending}
        >
          <Text style={styles.submitButtonText}>
            {createFight.isPending || updateFight.isPending
              ? 'Saving...'
              : isEditing
                ? 'Update Fight'
                : 'Create Fight'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showRobotPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Robot</Text>
            <ScrollView>
              {robots?.map((robot: any) => (
                <TouchableOpacity
                  key={robot.robot_id}
                  style={styles.modalOption}
                  onPress={() => {
                    setRobotId(robot.robot_id.toString());
                    setShowRobotPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{robot.robot_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRobotPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showOutcomePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Outcome Type</Text>
            {(['N/A', 'KO', 'Judges Decision', 'Tapout'] as const).map((outcome) => (
              <TouchableOpacity
                key={outcome}
                style={styles.modalOption}
                onPress={() => {
                  setOutcomeType(outcome);
                  setShowOutcomePicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{outcome}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowOutcomePicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showIsWinPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Win Status</Text>
            {(['N/A', 'win', 'lose'] as const).map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.modalOption}
                onPress={() => {
                  setIsWin(val);
                  setShowIsWinPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{val}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowIsWinPicker(false)}
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
