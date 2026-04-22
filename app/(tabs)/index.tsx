import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import HomePage from './home';
import RobotsAllScreen from './robots_all';

export default function Index() {
  const [curPage, setCurPage] = useState(0);
  const numPages = 2;

  return (
    <LinearGradient
      colors={['#842D2D', '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0, 0.40]} //black by 40% down
      style={styles.container}
    >
      <PagerView
        style={styles.container}
        initialPage={0}
        onPageSelected={(e) => setCurPage(e.nativeEvent.position)}
      >
        <View key="home" style={{ paddingHorizontal: 20 }}>
          <HomePage />
        </View>
        <View key="robots_all" style={{ paddingHorizontal: 20 }}>
          <RobotsAllScreen />
        </View>
      </PagerView>

      <View style={styles.dotContainer}>
        {[...Array(numPages)].map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              { backgroundColor: idx === curPage ? '#FFFFFF' : '#939393' },
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, //fill up all space in parent
    paddingVertical: 45,
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
    backgroundColor: 'transparent',
  },
  dot: {
    borderRadius: 50,
    width: 10,
    height: 10,
  },
});
