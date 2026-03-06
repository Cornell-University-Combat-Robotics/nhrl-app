import { editFightNotifBroadcast } from '@/src/notifications/sendPushNotif';
import { supabase } from '@/src/supabaseClient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NotificationFormScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendNotif = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }
    setIsSending(true);
    try {
      await editFightNotifBroadcast(title.trim(), message.trim(), supabase);
      Alert.alert('Success', 'Notification sent to all users with push tokens.');
      setTitle('');
      setMessage('');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
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
});
