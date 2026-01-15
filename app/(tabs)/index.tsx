import { useAuth } from '@/src/contexts/AuthContext';
import { useFights } from '@/src/hooks/useFights';
import { useRobots } from '@/src/hooks/useRobots';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/** Home page */ 
export default function Index() {
  const { session, isAdmin, user, refreshAdminStatus } = useAuth();
  const { data: robots, isLoading: robotsLoading } = useRobots();
  const { data: fights, isLoading: fightsLoading } = useFights();
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleRefresh = async () => {
    setRefreshing(true);
    setDebugInfo('Checking admin status...');
    console.log('Manual refresh triggered');
    
    // Also try to query the profiles table directly to see what's happening
    const { supabase } = await import('@/src/supabaseClient');
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('Direct profile query:', { data, error, userId: user.id });
      setDebugInfo(`Query result: ${error ? `Error: ${error.message}` : `Role: ${data?.role || 'not found'}`}`);
    }
    
    await refreshAdminStatus();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to CRC's Competition App!</Text>
        
        {session ? (
          <View style={styles.authSection}>
            <Text style={styles.text}>Logged in as: {user?.email}</Text>
            <Text style={styles.text}>User ID: {user?.id?.substring(0, 8)}...</Text>
            <Text style={styles.text}>Admin Status: {isAdmin ? '✅ Admin' : '❌ User'}</Text>
            {debugInfo ? (
              <Text style={styles.debugText}>{debugInfo}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <Text style={styles.refreshButtonText}>
                {refreshing ? 'Refreshing...' : '🔄 Refresh Admin Status'}
              </Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={styles.adminButton}
                onPress={() => router.push('/(admin)')}
              >
                <Text style={styles.adminButtonText}>Go to Admin Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.authSection}>
            <Text style={styles.text}>Please log in to access admin features</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Database Stats</Text>
          
          {robotsLoading || fightsLoading ? (
            <ActivityIndicator size="small" color="#fff" style={styles.loader} />
          ) : (
            <>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{robots?.length || 0}</Text>
                <Text style={styles.statLabel}>Robots</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{fights?.length || 0}</Text>
                <Text style={styles.statLabel}>Fights</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.aboutButton}
          onPress={() => router.push('/(tabs)/about')}
        >
          <Text style={styles.aboutButtonText}>View About Page</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e62020ff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  authSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#e62020',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  loader: {
    marginTop: 8,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  aboutButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  aboutButtonText: {
    color: '#e62020',
    fontSize: 16,
    fontWeight: '600',
  },
});
