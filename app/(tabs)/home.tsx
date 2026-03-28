import { ScrollView, StyleSheet, Text, View } from "react-native";
import TrackedRobots from "../components/trackedRobots";
import UpcomingFightCard from "../components/upcomingFightCard";

export default function HomePage() {
    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.topNav}>
                    <TrackedRobots />
                </View>
                <View>
                    <Text style={{ color: "#A5A5A5", fontSize: 16, marginBottom: 10 }}>UPCOMING</Text>
                    <UpcomingFightCard />
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#1E1E1E"
    },
    topNav: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    }
});