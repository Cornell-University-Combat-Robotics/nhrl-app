import { supabase } from "@/src/supabaseClient";
import { Text, View, StyleSheet } from "react-native";

export const subteamColors: Record<string, string> = {
    "sportsman": "#0B539450",
    "kinetic": "#19743450",
    "marketing": "#FF980050",
    "autonomous": "#C7AF4E50",
    "infinity": "0C8CA250"
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
    const {data, error} = await supabase
        .from("robots")
        .select("robot_id, robot_name, subteam, is_eliminated, upcoming_opponent, vintage, weapon, weight_class") 
        //TODO: need to connect robot table to update upcoming opponent

    if(error || !data) {
        console.error("Error fetching robots:", error);
        return [];
    } else {
        console.log("Fetched robots:", data);
        return data;
    }
}

export async function getRobotFromId(id: number) {
    const {data, error} = await supabase
        .from("robots")
        .select("robot_id, robot_name, subteam, is_eliminated, upcoming_opponent, vintage, weapon, weight_class") 
        .eq("robot_id", id)
        .maybeSingle();

    if(error || !data) {
        console.error("Error fetching robot:", error);
        return null;
    } else {
        console.log("Fetched robot:", data);
        return data;
    }
}

export function SubteamLabel({subteam, subteamColor}:{subteam: string, subteamColor: string}){
    return (
        <>
            <View style={[styles.label, {backgroundColor: subteamColor, borderColor: subteamColor}]}>
                <Text style={styles.labelText}>{subteam}</Text>
            </View>
        </>
    );
}

export function EliminatedLabel(){
    return (
        <>
            <View style={[styles.label, {backgroundColor: "#B6262650", borderColor: "#B6262650"}]}>
                <Text style={styles.labelText}>eliminated</Text>
            </View>
        </>
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