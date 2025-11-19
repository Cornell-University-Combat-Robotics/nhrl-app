import { Text, View, StyleSheet } from "react-native";
import { Link } from 'expo-router';

/** Home page */ 
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to CRC's very own competition app!</Text>
      <Link href="/about" style={styles.button}>
        Go to About screen
      </Link>
      {/* Fetch database test and display here */}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e62020ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});
