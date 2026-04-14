import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import crcSymbol from '../../assets/images/crc-symbol.png';
import RobotCard from "../components/robot-card";

export default function RobotsAllScreen() {
    const subteamColors = {
        "Sportsman": "#1A324850",
        "Kinetic": "#19743450",
        "Marketing": "#FF980050",
        "Autonomous": "#C7AF4E50",
        "Infinity": "0C8CA250"
    }

    return (
        <>
            <View style={styles.topNav}>
                <Image source={crcSymbol} style={{ width: 50, height: 50 }} />
                <Text style={styles.robotHeader}>Robots</Text>
            </View>
            <ScrollView>
                <RobotCard photoUrl={"https://brettzone.nhrl.io/brettZone/getBotPic.php?bot=capsize"} fight={{ robot_name: "Capsize", cage: 1, opponent_name: "Benny", fight_time: "10:00", is_win: "lose" }} subteam="Sportsman" subteamColor="#4CAF5050" />
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