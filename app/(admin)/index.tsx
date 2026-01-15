import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import { Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminDashboard() {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Data</Text>
        
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(admin)/robots')}
        >
          <Text style={styles.cardTitle}>🤖 Robots</Text>
          <Text style={styles.cardDescription}>Manage robot entries</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(admin)/builders')}
        >
          <Text style={styles.cardTitle}>👷 Builders</Text>
          <Text style={styles.cardDescription}>Manage builder entries</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(admin)/fights')}
        >
          <Text style={styles.cardTitle}>⚔️ Fights</Text>
          <Text style={styles.cardDescription}>Manage fight records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(admin)/subteams')}
        >
          <Text style={styles.cardTitle}>👥 Subteams</Text>
          <Text style={styles.cardDescription}>Manage subteam entries</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button title="Sign Out" onPress={handleSignOut} color="#e62020" />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.backButtonText}>Back to App</Text>
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
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1a1d21',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#aaa',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
