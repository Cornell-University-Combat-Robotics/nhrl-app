import { useAuth } from '@/src/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import AboutScreen from './about';
import FightsPage from './fights';
import HomePage from './home';
import Index from './index';
import RobotsAllScreen from './robots_all';

/**
 * Tab navigator layout for the main app.
 * Three tabs: Home, About, Fights. Dark theme with yellow active tint.
 * Header shows Login (unauthenticated) or Admin (admin users) button.
 */
export default function TabLayout() {
  const { session, isAdmin } = useAuth();

  /*
   
         * Conditionally renders header-right button:
         * Login if no session, Admin if user is admin, otherwise nothing.

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
  */
  return (
    <>
      <SwipeNavBar />
    </>
  );
}

function SwipeNavBar() {
  const [curPage, setCurPage] = useState(0); //inital page = 0
  const numPages = 2;

  return (
    <>
      <LinearGradient
        colors={['#842D2D', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.40]}  //black by 40% down
        style={styles.container}
      >
          <PagerView
            style={styles.container}
            initialPage={0}
            onPageSelected={(e) => setCurPage(e.nativeEvent.position)}
          >
            <View key="home" style={{paddingHorizontal: 20}}>
              <HomePage />
            </View>
            <View key="robots_all" style={{paddingHorizontal: 20}}>
              <RobotsAllScreen />
            </View>
          </PagerView>

          <View style={styles.dotContainer}>
            {[...Array(numPages)].map((_, idx) => {
              return (
                <View key={idx} style={[styles.dot, { backgroundColor: idx === curPage ? '#FFFFFF' : '#939393' }]}>
                </View>
              )
            })}
          </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, //fill up all space in parent
    paddingVertical: 45
  },
  dotContainer: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent'
  },
  dot: {
    borderRadius: 50,
    width: 10,
    height: 10
  }
});