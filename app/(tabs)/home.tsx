import { Image, StyleSheet, Text, View } from "react-native";
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
                <Text style={styles.upcomingHeader}>HIGHLIGHTED FIGHT</Text>  {/* TODO delete this!!! */}
                <HighlightedFight />

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
        color: "#A5A5A5", fontSize: 16, marginBottom: 10
    }
});