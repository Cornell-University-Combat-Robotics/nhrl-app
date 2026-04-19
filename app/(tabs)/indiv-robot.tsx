import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { EliminatedLabel, getRobotFromId, getRobotPhotoURL, subteamColors, SubteamLabel } from "../components/helper-fxns";

export default function IndivRobotScreen() {
    //cuz id passed in from router
    const { id } = useLocalSearchParams<{ id?: string }>();
    const robot_id = id ? Number(id) : null;
    const [robot, setRobot] = useState<any>(null);
    const [subteamColor, setSubteamColor] = useState<string>("");

    useEffect(() => {
        if (robot_id == null) return; 
        getRobotFromId(robot_id!).then(r => {
            setRobot(r);
            setSubteamColor(subteamColors[r?.subteam]);
        });
    },[robot_id]);

    return (
        <View style={styles.container}>
            <View>
                <View style={styles.headerContainer}>
                    <View>
                        <Text style={styles.robotTitle}>{robot?.robot_name}</Text>
                        <SubteamLabel subteam={robot?.subteam} subteamColor={subteamColor} />
                        {robot?.is_eliminated && <EliminatedLabel />}
                    </View>
                    <Image source={{ uri: getRobotPhotoURL(robot?.robot_name) }} style={styles.photo} />
                </View>
                <View style={styles.infoContainer}>
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoText, { fontWeight: "bold" }]}>Vintage</Text>
                        <Text style={styles.infoText}>{robot?.vintage}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoText, { fontWeight: "bold" }]}>Weapon Type</Text>
                        <Text style={styles.infoText}>{robot?.weapon}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={[styles.infoText, { fontWeight: "bold" }]}>Weight</Text>
                        <Text style={styles.infoText}>{robot?.weight_class}</Text>
                    </View>
                </View>
            </View>
            <ScrollView>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#1E1E1E",
        ...StyleSheet.absoluteFillObject
    },
    headerContainer: {
        flexDirection: "row",
        alignContent: "center",
        justifyContent: "center",
        gap: 15
    },
    robotTitle: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#FFFFFF",
        fontFamily: "Josefin Sans",
    },
    photo: {
        width: 100,
        height: 70,
        borderRadius: 20
    },
    infoContainer: {
        marginVertical: 20,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10
    },
    infoCol: {
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    infoText: {
        fontSize: 16,
        color: "#FFFFFF"
    }
});