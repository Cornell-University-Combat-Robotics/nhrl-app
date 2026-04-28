import { supabase } from "@/src/supabaseClient";
import { StyleSheet, Text, View } from "react-native";

export const subteamColors: Record<string, string> = {
    "sportsman": "#1f398d50",
    "kinetic": "#19743450",
    "marketing": "#FF980050",
    "autonomous": "#C7AF4E50",
    "infinity": "#5ECAD450"
}

export async function getUpcomingFights() {
    const { data, error } = await supabase
        .from('fights')
        .select('fight_id, robot_name, opponent_name, cage, fight_time')
        .is('is_win', null)
        .order('fight_time', { ascending: true });
    if (error || !data) {
        console.error('Error fetching fights:', error);
        return [];
    } else {
        console.log('info', 'Fetched fights 1');
        return data; //array of fights (allow for multiple)
    }
}

//TODO: encapsulate this -- currently in both trackedRobots & upcomingFightCard
export function getRobotPhotoURL(name: string) {
    if (!name) return null;
    const refinedName = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const baseUrlHead = "https://brettzone.nhrl.io/brettZone/getBotPic.php?bot=";
    const baseUrlTail = "&thumb=1";
    const url = baseUrlHead + encodeURIComponent(refinedName) + baseUrlTail;
    return url;
}

export async function getRobots() {
    const { data, error } = await supabase
        .from("robots")
        .select("robot_id, robot_name, subteam, is_eliminated, upcoming_opponent, vintage, weapon, weight_class")
    //TODO: need to connect robot table to update upcoming opponent

    if (error || !data) {
        console.error("Error fetching robots:", error);
        return [];
    } else {
        console.log("Fetched robots:", data);
        return data;
    }
}

export async function getRobotFromId(id: number) {
    const { data, error } = await supabase
        .from("robots")
        .select("robot_id, robot_name, subteam, is_eliminated, upcoming_opponent, vintage, weapon, weight_class")
        .eq("robot_id", id)
        .maybeSingle();

    if (error || !data) {
        console.error("Error fetching robot:", error);
        return null;
    } else {
        console.log("Fetched robot:", data);
        return data;
    }
}

export function SubteamLabel({ subteam, subteamColor }: { subteam: string, subteamColor: string }) {
    return (
        <View style={[styles.label, { backgroundColor: subteamColor, borderColor: subteamColor }]}>
            <Text style={styles.labelText}>{subteam}</Text>
        </View>
    );
}

export function EliminatedLabel() {
    return (

        <View style={[styles.label, { backgroundColor: "#B6262650", borderColor: "#B6262650" }]}>
            <Text style={styles.labelText}>eliminated</Text>
        </View>

    );
}

const styles = StyleSheet.create({
    label: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    labelText: {
        color: "#FFFFFF",
        fontSize: 15,
        opacity: 1
    },
});