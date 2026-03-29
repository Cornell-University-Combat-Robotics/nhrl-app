import { supabase } from "@/src/supabaseClient";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Checkbox, Portal } from "react-native-paper";

async function getRobots() {
    const { data, error } = await supabase
        .from('robots')
        .select('robot_name, subteam')

    if (error || !data) {
        console.error('Error fetching tracked robots:', error);
        return [];
    } else {
        console.log('Fetched tracked robots:', data);
        return data;
    }
}

//TODO: encapsulate this -- currently in both trackedRobots & upcomingFightCard
async function getRobotPhotoURL(name: string) {
    const refinedName = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const baseUrlHead = "https://brettzone.nhrl.io/brettZone/getBotPic.php?bot=";
    const baseUrlTail = "&amp;thumb=1";
    const url = baseUrlHead + encodeURIComponent(refinedName) + baseUrlTail;
    return url;
}

export default function TrackedRobots() {
    const [isVisible, setVisibility] = useState(false);
    const [robots, setRobots] = useState<any[]>([]); //note: if you don't use a state here, react will not trigger a re-render when u populate the array
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [checked, setChecked] = useState<Record<number, boolean>>({});

    const onClose = () => {
        setVisibility(false);
    }

    const toggleChecked = (id: number) => {
        setChecked(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    useEffect(() => {
        getRobots().then(r => setRobots(r));
        robots.map((r, i) => {
            getRobotPhotoURL(r.robot_name).then(url => setPhotoUrls(prev => [...prev, url]));
            setChecked(prev => ({
                ...prev,
                [i]: false
            }))
        })
    }, []);

    return (
        <>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    setVisibility(!isVisible)
                    console.log("pressed tracking button")
                }}
            >
                <Text style={styles.text}>Tracked Robots</Text>
            </TouchableOpacity>
            {isVisible && <TrackedPopUp onClose={onClose} robots={robots} photoUrls={photoUrls} checked={checked} toggleChecked={toggleChecked} />}
        </>
    );
}

//Portal: it’s no longer inside your screen layout, it renders at the top level
function TrackedPopUp({
    onClose,
    robots,
    photoUrls,
    checked,
    toggleChecked
}: {
    onClose: () => void,
    robots: any[],
    photoUrls: string[],
    checked: Record<number, boolean>,
    toggleChecked: (id: number) => void
}) {
    //note that states here get destroyed every time pop up closes, so should keep states in parent TrackedRobots instead
    return (
        <>
            <Portal>
                <View style={styles.popup}>
                    <Text style={styles.popupTitle}>
                        Tracked Robots
                    </Text>

                    {robots.map((r, i) => (
                        <View key={i} style={styles.row}>
                            <Image
                                source={{ uri: photoUrls[i] }}
                                style={styles.photo}
                            />
                            <View style={{ marginLeft: 20, flex: 1 }}>
                                <Text style={styles.robotName}>{r.robot_name}</Text>
                                <Text style={styles.subteamName}>{r.subteam}</Text>
                            </View>

                            <Checkbox
                                status={checked[i] ? 'checked' : 'unchecked'}
                                onPress={() => toggleChecked(i)}
                            />

                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => onClose()}
                        style={{ backgroundColor: "#444444" }}
                    >
                        <Text style={styles.popupTitle}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    popup: {
        backgroundColor: "#2C2C2C",
        position: "absolute",
        top: 175,
        bottom: 175,
        left: 20,
        right: 20
    },
    button: {
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        margin: 10,
        width: 150,
        height: 40
    },
    text: {
        color: "#000000",
        fontSize: 16,
        fontWeight: "bold"
    },
    popupTitle: {
        fontSize: 18,
        color: "#FFFFFF",
        fontWeight: "bold",
        margin: 10,
        alignSelf: "center"
    },
    robotName: {
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "bold",
        margin: 2
    },
    subteamName: {
        fontSize: 16,
        color: "#A5A5A5",
        margin: 2
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 30,
        marginVertical: 5
    },
    photo: {
        marginLeft: 10,
        width: 50,
        height: 50,
        borderRadius: 100,
        borderColor: '#ffffff',
        borderWidth: 1
    }
});