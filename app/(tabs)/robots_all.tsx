import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import crcSymbol from '../../assets/images/crc-symbol.png';
import { getRobotPhotoURL, getRobots, subteamColors } from "../components/helper-fxns";
import RobotCard from "../components/robot-card";

//TODO: might wanna move to to hooks


export default function RobotsAllScreen() {
    const [robots, setRobots] = useState<any[]>([]);

    useEffect(() => {
        getRobots().then(r => setRobots(r));
    }, []); //runs once on mount

    return (
        <>
            <View style={styles.topNav}>
                <Image source={crcSymbol} style={{ width: 50, height: 50 }} />
                <Text style={styles.robotHeader}>Robots</Text>
            </View>
            <ScrollView>
                {robots
                    .sort((a, b) => a.robot_name.localeCompare(b.robot_name)) //sort alphabetically
                    .sort((a, b) => a.is_eliminated ? 1 : b.is_eliminated ? -1 : 0) //sort by is_eliminated 
                    .map((r, i) =>
                        <RobotCard
                            key={i}
                            robot={{
                                photoUrl: getRobotPhotoURL(r.robot_name),
                                robot_name: r.robot_name,
                                opponent_name: r.upcoming_opponent,
                                is_eliminated: r.is_eliminated,
                                subteam: r.subteam,
                            }}
                            subteamColor={subteamColors[r.subteam]}
                        />
                    )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        ...StyleSheet.absoluteFillObject
    },
    topNav: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 20
    },
    robotHeader: {
        fontSize: 30,
        marginLeft: 15,
        color: "#FFFFFF",
        fontWeight: "bold",
    }
});