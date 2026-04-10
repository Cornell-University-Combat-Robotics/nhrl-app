import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View, Image } from "react-native";
import TrackedRobots from "../components/trackedRobots";
import UpcomingFightCard from "../components/upcomingFightCard";
import crcSymbol from '../../assets/images/crc-symbol.png';   

export default function HomePage() {
    return (
        <LinearGradient
            colors={['#842D2D', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            locations={[0, 0.40]}  //black by 40% down
            style={styles.container}
        >
            <ScrollView style={{paddingTop: 50}}>
                <View style={styles.topNav}>
                    <Image source={crcSymbol} style={{width: 50, height: 50}}/>
                    <TrackedRobots />
                </View>
                <View>
                    <Text style={{ color: "#A5A5A5", fontSize: 16, marginBottom: 10 }}>UPCOMING</Text>
                    <UpcomingFightCard />
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        ...StyleSheet.absoluteFillObject
    },
    topNav: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    }
});