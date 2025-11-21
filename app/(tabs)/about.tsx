import { Text, View, StyleSheet, Button } from 'react-native';
import addRobot from '../../src/addRobot.ts';
import retrieveRobot from '../../src/retrieveRobot.ts';
import { useState } from 'react';


export default function AboutScreen() {

  const [robotName, setRobotName] = useState("");

  const handleRetrieveData = async () => {
    const data = await retrieveRobot();
    if(data){
      setRobotName(data.robot_name)
    }
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.text}>About screen</Text>
      </View>

      <Button
      //must await async function, o/w may not complete!!
        onPress={
          async() => {
            await addRobot(); //waits to complete
          }
        }
        title="Add robots!"
      /> 

      <Button
        onPress={ handleRetrieveData }
        title="Retrieve robots!"
      /> 

      <Text>{robotName}</Text>
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
