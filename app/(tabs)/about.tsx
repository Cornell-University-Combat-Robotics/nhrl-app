import { Text, View, StyleSheet, Button } from 'react-native';
import addRobot from '../../src/addRobot.ts';
import retrieveRobot from '../../src/retrieveRobot.ts';
import { useState } from 'react';
import { QueryClient } from '@tanstack/react-query';
import useRetrieveRobot from '@/src/hooks/useRetrieveRobot.js';
import useAddRobot from '@/src/hooks/useAddRobot.js';


export default function AboutScreen() {
  //must call hooks at top level, not inside handlers

  /* Hook subscribes AboutScreen component to query data
  Whenever the query data changes, React re-renders component. */
  const { data: robotData, isPending, isError, error  } = useRetrieveRobot();
  const addRobotMutation = useAddRobot();

  //auto updates!
  const robotName = robotData?.robot_name || "Nothing yet";

  const handleRobotAdd = () => {
    //pass in single object into mutationFn
    addRobotMutation.mutate("Beater")
  }

  if(isPending){
    console.log("Adding robot data...")
  }
  if(isError){
    console.log("Error in adding robot data: ", error.message)
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.text}>About screen</Text>
      </View>

      <Button
        onPress={ handleRobotAdd }
        title={addRobotMutation.isPending? "Adding..." : "Add robots!"}
        disabled={addRobotMutation.isPending}
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
