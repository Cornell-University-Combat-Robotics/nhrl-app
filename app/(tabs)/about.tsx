import { Text, View, StyleSheet, Button } from 'react-native';
import addRobot from '../../src/addRobot.ts';

export default function AboutScreen() {
  return (
    <>
      <View style={styles.container}>
        <Text style={styles.text}>About screen</Text>
      </View>

      <Button
        onPress={addRobot}
        title="Add robots!"
      /> 
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
