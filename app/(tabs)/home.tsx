import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import crcSymbol from '../../assets/images/crc-symbol.png';
import TrackedRobots from "../components/trackedRobots";
import UpcomingFightList from "../components/upcomingFightList";

export default function HomePage() {
    const [checked, setChecked] = useState<Record<number, boolean>>({});
    const [robots, setRobots] = useState<any[]>([]);

    const toggleChecked = (id: number) => {
        setChecked(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const checkedNames = robots
        .map((r, i) => (checked[i] ? r.robot_name : null))
        .filter(Boolean) as string[];

    return (
        <>
            <View style={styles.topNav}>
                <Image source={crcSymbol} style={{ width: 50, height: 50 }} />
                <TrackedRobots
                    checked={checked}
                    setChecked={setChecked}
                    toggleChecked={toggleChecked}
                    robots={robots}
                    setRobots={setRobots}
                />
            </View>
            <View>
                <Text style={styles.upcomingHeader}>UPCOMING</Text>
                <UpcomingFightList checkedNames={checkedNames} />
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