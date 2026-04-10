import { useAuth } from '@/src/contexts/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import HomePage from './home';
import AboutScreen from './about';
import FightsPage from './fights';
import Index from './index';

/**
 * Tab navigator layout for the main app.
 * Three tabs: Home, About, Fights. Dark theme with yellow active tint.
 * Header shows Login (unauthenticated) or Admin (admin users) button.
 */
export default function TabLayout() {
  const { session, isAdmin } = useAuth();

  return (
    <>
    <SwipeNavBar/>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffd33d',
        headerStyle: {
          backgroundColor: '#25292e',
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#25292e',
        },
        /**
         * Conditionally renders header-right button:
         * Login if no session, Admin if user is admin, otherwise nothing.
         */
        headerRight: () => {
          if (!session) {
            return (
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                style={{ marginRight: 16 }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>Login</Text>
              </TouchableOpacity>
            );
          }
          if (isAdmin) {
            return (
              <TouchableOpacity
                onPress={() => router.push('/(admin)')}
                style={{ marginRight: 16 }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>Admin</Text>
              </TouchableOpacity>
            );
          }
          return null;
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="fights"
        options={{
          title: 'Fights',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flame' : 'flame-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
    </>
  );
}

function SwipeNavBar(){
  const [curPage, setCurPage] = useState(0); //inital page = 0

  return (
    <>
      <View style={styles.container}> 
        <PagerView 
          style={styles.container}
          initialPage={0}
          onPageSelected={(e) => setCurPage(e.nativeEvent.position)}
        > 
          <View key="home"> 
            <HomePage/>
          </View>
          <View key="about">
            <AboutScreen/>
          </View>
          <View key="fights">
            <FightsPage/>
          </View>
          <View key="index">
            <Index/>
          </View>
        </PagerView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1 //fill up all space in parent
  }
});