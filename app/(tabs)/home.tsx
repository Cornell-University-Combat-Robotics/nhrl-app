import { useEffect, useState } from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import crcSymbol from '../../assets/images/crc-symbol.png';
import HighlightedFight from "../components/highlightedFight";
import TrackedRobots from "../components/trackedRobots";
import UpcomingFightList from "../components/upcomingFightList";
import { getRobotPhotoURL, getUpcomingFights } from "../components/helper-fxns";
import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/supabaseClient";
import { router } from "expo-router";

export default function HomePage() {
    //`checked` is keyed by robot_id (true = currently tracked by signed-in user)
    const [checked, setChecked] = useState<Record<number, boolean>>({});
    const [robots, setRobots] = useState<any[]>([]);
    const [fights, setFights] = useState<any[]>([]);
    const { isAdmin, user } = useAuth();

    useEffect(() => {
        getUpcomingFights().then(f => {
            setFights(f);
        });
    }, []);

    /**
     * Toggle tracking for a robot. Optimistic UI update + persist to
     * `profile_tracked_robots` so push notifications can target this user.
     */
    const toggleChecked = async (robotId: number) => {
        if (!user) return;
        const wasChecked = !!checked[robotId];
        setChecked(prev => ({ ...prev, [robotId]: !wasChecked }));

        if (wasChecked) {
            const { error } = await supabase
                .from('profile_tracked_robots')
                .delete()
                .eq('profile_id', user.id)
                .eq('robot_id', robotId);
            if (error) {
                console.error('Error untracking robot:', error);
                setChecked(prev => ({ ...prev, [robotId]: true }));
            }
        } else {
            const { error } = await supabase
                .from('profile_tracked_robots')
                .upsert({ profile_id: user.id, robot_id: robotId }, { onConflict: 'profile_id,robot_id' });
            if (error) {
                console.error('Error tracking robot:', error);
                setChecked(prev => ({ ...prev, [robotId]: false }));
            }
        }
    };

    const checkedNames = robots
        .filter(r => checked[r.robot_id])
        .map(r => r.robot_name) as string[];

    //derive filtered fights + photo urls on each render; render none if no robots tracked
    const filteredFights = checkedNames.length
        ? fights.filter(fight => checkedNames.includes(fight.robot_name))
        : [];
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

            {isAdmin && (
                <TouchableOpacity
                    style={styles.adminButton}
                    onPress={() => router.push('/(admin)')}
                >
                    <Text style={styles.adminButtonText}>Go to Admin Dashboard</Text>
                </TouchableOpacity>
            )}

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
    adminButton: {
        backgroundColor: "#8C2F39",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 20,
        alignItems: "center",
    },
    adminButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
});