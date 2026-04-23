import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import crcSymbol from '../../assets/images/crc-symbol.png';
import HighlightedFight from "../components/highlightedFight";
import TrackedRobots from "../components/trackedRobots";
import UpcomingFightList from "../components/upcomingFightList";


export default function HomePage() {
    return (
        <>
            <View style={styles.topNav}>
                <Image source={crcSymbol} style={{ width: 50, height: 50 }} />
                <TrackedRobots />
            </View>

            <View>
                <HighlightedFight />

                {/* Livestream Button */}
                <TouchableOpacity
                    style={styles.liveButton}
                    onPress={() => Linking.openURL("https://brettzone.nhrl.io/brettZone/liveCompanion.php")}
                >
                    <Text style={styles.liveButtonText}>Watch Livestream ↗ </Text>
                </TouchableOpacity>

                <Text style={styles.upcomingHeader}>UPCOMING</Text>
                <UpcomingFightList />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    topNav: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
    upcomingHeader: {
        color: "#A5A5A5", 
        fontSize: 14, 
        marginTop: 35,
        marginBottom: 10
    },
        liveButton: {
        backgroundColor: "#B21C1C",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10
    },
    liveButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16
    }
});