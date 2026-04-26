import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import crcSymbol from '../../assets/images/crc-symbol.png';
import { getRobotPhotoURL, getUpcomingFights } from "../components/helper-fxns";
import HighlightedFight from "../components/highlightedFight";
import TrackedRobots from "../components/trackedRobots";
import UpcomingFightList from "../components/upcomingFightList";
import { supabase } from "@/src/supabaseClient";

export default function HomePage() {
    const [checked, setChecked] = useState<Record<number, boolean>>({});
    const [robots, setRobots] = useState<any[]>([]);
    const [fights, setFights] = useState<any[]>([]);

    useEffect(() => {
        // Initial fetch
        getUpcomingFights().then(f => {
            setFights(f);
        });

        // Real-time subscription
        const channel = supabase
            .channel('fights-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fights' },
                () => {
                    getUpcomingFights().then(f => setFights(f));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const toggleChecked = (id: number) => {
        setChecked(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const checkedNames = robots
        .map((r, i) => (checked[i] ? r.robot_name : null))
        .filter(Boolean) as string[];


    //derive filtered fights + photo urls on each render
    const filteredFights = checkedNames.length
        ? fights.filter(fight => checkedNames.includes(fight.robot_name))
        : fights;
    const photoUrls = filteredFights.map(fight => getRobotPhotoURL(fight?.robot_name || "") ?? "");


    return (
        <ScrollView contentContainerStyle={styles.container}>
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

            <HighlightedFight fight={filteredFights?.[0] ?? null} />

            <UpcomingFightList upcomingFights={filteredFights?.slice(1) ?? []} photoUrls={photoUrls?.slice(1) ?? []} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 0
    },
    topNav: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
});