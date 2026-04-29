import { CRC_ROBOTS, type CRCRobotName } from '@/src/db/robots';
import { editFightNotifBroadcast, sendCustomBroadcast } from '@/src/notifications/sendPushNotif';
import { supabase } from '@/src/supabaseClient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * Audience for a custom admin notification:
 * - 'ALL': send to every user with a push token (uses `sendCustomBroadcast`).
 * - <robot name>: send only to users tracking that robot (uses `editFightNotifBroadcast`).
 */
type Audience = 'ALL' | CRCRobotName;

const AUDIENCE_OPTIONS: Audience[] = ['ALL', ...CRC_ROBOTS];

export default function NotificationFormScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Audience>('ALL');
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  /**
   * Resolve `robot_id` from `robot_name`, case-insensitively (so 'Jormangandr' vs
   * 'jormangandr' match). Returns null if no match — almost always means the name
   * in `CRC_ROBOTS` does not match `robots.robot_name` in DB (e.g. spelling drift).
   *
   * Used when audience is a specific CRC robot, because `editFightNotifBroadcast`
   * filters trackers by `robot_id`.
   */
  const resolveRobotId = async (robotName: string): Promise<number | null> => {
    const { data, error } = await supabase
      .from('robots')
      .select('robot_id, robot_name')
      .ilike('robot_name', robotName)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('[notif-form] resolveRobotId error:', error);
      return null;
    }
    if (!data) {
      console.warn(`[notif-form] no robot matched name="${robotName}"`);
      return null;
    }
    if (data.robot_name !== robotName) {
      console.warn(
        `[notif-form] CRC_ROBOTS name "${robotName}" matched DB name "${data.robot_name}" (case-insensitive). Consider updating CRC_ROBOTS for an exact match.`,
      );
    }
    return (data.robot_id as number | undefined) ?? null;
  };

  const handleSendNotif = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }
    setIsSending(true);
    try {
      //prefix body with audience tag, e.g. "All: msg" or "Huey: msg"
      const prefix = audience === 'ALL' ? 'All' : audience;
      const body = `${prefix}: ${message.trim()}`;

      if (audience === 'ALL') {
        await sendCustomBroadcast(title.trim(), body, supabase);
      } else {
        const robotId = await resolveRobotId(audience);
        if (robotId == null) {
          Alert.alert('Error', `Could not find robot "${audience}" in DB.`);
          return;
        }
        await editFightNotifBroadcast(title.trim(), body, robotId, supabase);
      }

      Alert.alert(
        'Success',
        audience === 'ALL'
          ? 'Notification sent to all users with push tokens.'
          : `Notification sent to users tracking ${audience}.`,
      );
      setTitle('');
      setMessage('');
      setAudience('ALL');
      router.back();
    } catch (error) {
      console.error('[notif-form] send error:', error);
      Alert.alert('Error', 'Failed to send notification.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Audience *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowAudiencePicker(true)}
          disabled={isSending}
        >
          <Text style={styles.pickerButtonText}>{audience}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter notification title"
          placeholderTextColor="#888"
          editable={!isSending}
        />
        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter notification body"
          placeholderTextColor="#888"
          multiline
          numberOfLines={4}
          editable={!isSending}
        />

        <TouchableOpacity
          style={[styles.submitButton, isSending && styles.submitButtonDisabled]}
          onPress={handleSendNotif}
          disabled={isSending}
        >
          <Text style={styles.submitButtonText}>
            {isSending ? 'Sending...' : 'Send Notification'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAudiencePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Audience</Text>
            <ScrollView>
              {AUDIENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalOption}
                  onPress={() => {
                    setAudience(opt);
                    setShowAudiencePicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAudiencePicker(false)}
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
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
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
  submitButtonDisabled: {
    opacity: 0.6,
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
