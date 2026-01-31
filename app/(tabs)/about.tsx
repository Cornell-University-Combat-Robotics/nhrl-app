import { useAuth } from '@/src/contexts/AuthContext';
import { useRobots } from '@/src/hooks/useRobots';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  const { data: robots, isLoading, error } = useRobots();
  const { session, user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About</Text>
        
        {session ? (
          <Text style={styles.text}>Welcome, {user?.email}!</Text>
        ) : (
          <Text style={styles.text}>Welcome! Please log in to access admin features.</Text>
        )}

        <Text style={styles.sectionTitle}>Robots Database</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>Error loading robots: {(error as Error).message}</Text>
        ) : robots && robots.length > 0 ? (
          robots.slice(0, 10).map((robot: any) => (
            <View key={robot.robot_id} style={styles.robotCard}>
              <Text style={styles.robotName}>{robot.robot_name}</Text>
              <Text style={styles.robotDetail}>Builder: {robot.builder_id}</Text>
              <Text style={styles.robotDetail}>Weight: {robot.weight_class}</Text>
              <Text style={styles.robotDetail}>Weapon: {robot.weapon}</Text>
              <Text style={styles.robotDetail}>Drive: {robot.drive}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No robots found in database.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: '#e62020',
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
  },
  robotCard: {
    backgroundColor: '#1a1d21',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  robotName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  robotDetail: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
});
