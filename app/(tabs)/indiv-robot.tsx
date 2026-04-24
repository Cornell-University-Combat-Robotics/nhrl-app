import { getFightsByRobotId } from "@/src/db/fights";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { compareFightsByFightTimeAsc } from "../components/fights-section-helper";
import { EliminatedLabel, getRobotFromId, getRobotPhotoURL, subteamColors, SubteamLabel } from "../components/helper-fxns";
import IndivFightCard from "../components/indiv-fight-card";

export default function IndivRobotScreen() {
    const router = useRouter();
    //cuz id passed in from router
    const { id } = useLocalSearchParams<{ id?: string }>();
    const robot_id = id ? Number(id) : null;
    const [robot, setRobot] = useState<any>(null);
    const [subteamColor, setSubteamColor] = useState<string>("");
    const [isUpcoming, setIsUpcoming] = useState<boolean>(true);
    const [fights, setFights] = useState<any[]>([]);
    const [photoUrl, setPhotoUrl] = useState<string | null>("");

    useEffect(() => {
        if (robot_id == null) return;
        getRobotFromId(robot_id!).then(r => {
            setRobot(r);
            setPhotoUrl(getRobotPhotoURL(r?.robot_name));
            setSubteamColor(subteamColors[r?.subteam]);
        });
        getFightsByRobotId(robot_id!).then(f => {
            setFights(f);
        });
    }, [robot_id]);

    const visibleFights = fights
        .filter(f => isUpcoming ? f?.is_win === null : f?.is_win !== null)
        .sort(compareFightsByFightTimeAsc);

    return (
        <View style={styles.container}>
            <View>
                <View style={styles.headerContainer}>
                    <View style={{ alignItems: "flex-start", gap: 5 }}>
                        <Text style={styles.robotTitle}>{robot?.robot_name}</Text>
                        <SubteamLabel subteam={robot?.subteam} subteamColor={subteamColor} />
                        {robot?.is_eliminated && <EliminatedLabel />}
                    </View>
                    <Image source={{ uri: photoUrl! }} style={styles.photo} />
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
                <View style={styles.upcomingPastRow}>
                    <TouchableOpacity style={[styles.upcomingPastButton, isUpcoming ? { borderBottomColor: "#FFFFFF" } : { borderBottomColor: "#676767" }]} onPress={() => setIsUpcoming(true)}>
                        <Text style={[{ fontSize: 16 }, isUpcoming ? { fontWeight: "bold", color: "#FFFFFF" } : { color: "#676767" }]}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.upcomingPastButton, isUpcoming ? { borderBottomColor: "#676767" } : { borderBottomColor: "#FFFFFF" }]} onPress={() => setIsUpcoming(false)}>
                        <Text style={[{ fontSize: 16 }, isUpcoming ? { color: "#676767" } : { fontWeight: "bold", color: "#FFFFFF" }]}>Past</Text>
                    </TouchableOpacity>
                </View>
                {visibleFights.length === 0 ? (
                    <Text style={styles.noFightsText}>no fights currently</Text>
                ) : (
                    visibleFights.map((f, idx) =>
                        <IndivFightCard key={idx} props={{ title: `vs ${f?.opponent_name}`, photoUrl: photoUrl!, fstText: `Weapon: we dont have this info`, sndText: isUpcoming ? `Live at: ${f?.fight_time}` : `Fought at: ${f?.fight_time}`, innerBox: isUpcoming ? `Cage: ${f?.cage}` : f?.is_win === "win" ? `Win` : `Loss` }} />)
                )}
            </ScrollView>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
            >
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#1E1E1E",
        ...StyleSheet.absoluteFillObject,
        paddingHorizontal: 30,
        paddingBottom: 50,
        paddingTop: 70
    },
    headerContainer: {
        flexDirection: "row",
        alignContent: "center",
        justifyContent: "space-between"
    },
    robotTitle: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 5
    },
    photo: {
        width: 150,
        height: 100,
        borderRadius: 20,
        borderColor: "#FFFFFF",
        borderWidth: 1,
    },
    infoContainer: {
        marginVertical: 20,
        flexDirection: "row",
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
    },
    upcomingPastRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
    },
    upcomingPastButton: {
        flex: 1,
        paddingHorizontal: 50, //TODO this is hardcoded, bad
        paddingVertical: 10,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 2
    },
    noFightsText: {
        color: "#A5A5A5",
        textAlign: "center",
        fontSize: 16,
        marginTop: 16
    },
    backButton: {
        width: "100%",
        borderRadius: 15,
        backgroundColor: "#FFFFFF",
        paddingVertical: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    backButtonText: {
        fontSize: 16,
        color: "#000000",
        fontWeight: "bold"
    }
});