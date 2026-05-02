import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/supabaseClient";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Checkbox, Portal } from "react-native-paper";
import { getRobotPhotoURL } from "./helper-fxns";
import { CRC_ROBOTS } from "@/src/db/robots.ts"

async function getRobots() {
    const { data, error } = await supabase
        .from('robots')
        .select('robot_id, robot_name, subteam')
        .in('robot_name', CRC_ROBOTS)

    if (error || !data) {
        console.error('Error fetching tracked robots:', error);
        return [];
    } else {
        return data;
    }
}

/** Returns set of robot_ids the given profile currently tracks. */
async function getTrackedRobotIds(profileId: string): Promise<number[]> {
    const { data, error } = await supabase
        .from('profile_tracked_robots')
        .select('robot_id')
        .eq('profile_id', profileId);
    if (error || !data) {
        console.error('Error fetching tracked robot ids:', error);
        return [];
    }
    return data.map((r: { robot_id: number }) => r.robot_id);
}

export default function TrackedRobots({
    checked,
    setChecked,
    toggleChecked,
    robots,
    setRobots,
}: {
    checked: Record<number, boolean>,
    toggleChecked: (robotId: number) => void,
    setChecked: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
    robots: any[],
    setRobots: React.Dispatch<React.SetStateAction<any[]>>,
}) {
    const [isVisible, setVisibility] = useState(false);
    const { user } = useAuth();

    const onClose = () => setVisibility(false);

    const countChecked = () => Object.values(checked).filter(Boolean).length;

    useEffect(() => {
        getRobots().then(setRobots);
    }, []);

    //hydrate `checked` from DB whenever user changes (or on initial sign-in)
    useEffect(() => {
        if (!user) {
            setChecked({});
            return;
        }
        getTrackedRobotIds(user.id).then(ids => {
            const next: Record<number, boolean> = {};
            for (const id of ids) next[id] = true;
            setChecked(next);
        });
    }, [user?.id]);

    return (
        <>
            <TrackedButton setVisibility={setVisibility} robots={robots} checked={checked} numChecked={countChecked()} />
            {isVisible &&
                <TrackedPopUp onClose={onClose} robots={robots} checked={checked} toggleChecked={toggleChecked} countChecked={countChecked} />
            }
        </>
    );
}

function TrackedButton({
    setVisibility,
    robots,
    checked,
    numChecked,
}: {
    setVisibility: React.Dispatch<React.SetStateAction<boolean>>,
    robots: any[],
    checked: Record<number, boolean>,
    numChecked: number,
}) {
    //to track number of photos in button, and to help render the "+N" when >2 robots selected
    const overTwo = numChecked > 2;
    const checkedRobots = robots.filter(r => checked[r.robot_id]);
    const renderedRobots = overTwo ? checkedRobots.slice(0, 2) : checkedRobots;

    return (
        <>
            <TouchableOpacity
                style={styles.button}
                onPress={() => setVisibility(v => !v)}
            >
                <Text style={styles.text}>Tracked Robots</Text>
                {numChecked == 0 ? (
                    <AntDesign name="plus" size={20} color="#000000" style={{ marginLeft: 5 }} />
                ) : (
                    <View style={styles.plusPhotoContainer}>
                        {renderedRobots.map((r) =>
                            <Image key={r.robot_id} source={{ uri: getRobotPhotoURL(r.robot_name) ?? "" }} style={styles.plusPhoto} />
                        )}
                        {overTwo &&
                            <Text style={[styles.plusPhoto, styles.plusText, { backgroundColor: '#BF2E2E', paddingLeft: 3, paddingTop: 2 }]}>+{numChecked - 2}</Text>
                        }
                    </View>
                )}
            </TouchableOpacity>
        </>
    );
}

//Portal: it’s no longer inside your screen layout, it renders at the top level
function TrackedPopUp({
    onClose,
    robots,
    checked,
    toggleChecked,
    countChecked
}: {
    onClose: () => void,
    robots: any[],
    checked: Record<number, boolean>,
    toggleChecked: (robotId: number) => void,
    countChecked: () => number
}) {
    //note that states here get destroyed every time pop up closes, so should keep states in parent TrackedRobots instead
    return (
        <>
            <Portal>
                <View style={styles.overlay} //makes everything outside pop up blurry 
                />
                <View style={styles.popup}>
                    <View style={styles.titleRow}>
                        <Text style={styles.popupTitle}>
                            Tracked Robots
                        </Text>
                        <View style={styles.checkedCount}>
                            <Text style={{ color: "#FFFFFF", fontSize: 16 }}>{countChecked()}</Text>
                        </View>
                    </View>

                    {robots.map((r) => (
                        <TouchableOpacity
                            key={r.robot_id}
                            style={styles.row}
                            onPress={() => toggleChecked(r.robot_id)}
                            activeOpacity={0.7}
                        >
                            <Image
                                source={{ uri: getRobotPhotoURL(r.robot_name) ?? "" }}
                                style={styles.photo}
                            />
                            <View style={styles.robotText}>
                                <Text style={styles.robotName}>{r.robot_name}</Text>
                                <Text style={styles.subteamName}>{r.subteam}</Text>
                            </View>

                            <Checkbox
                                status={checked[r.robot_id] ? 'checked' : 'unchecked'}
                            />

                        </TouchableOpacity>
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
    overlay: {
        ...StyleSheet.absoluteFillObject, //shorthand for: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    popup: {
        backgroundColor: "#2C2C2C",
        position: "absolute",
        top: 125,
        left: 20,
        right: 20,
        borderRadius: 10,
        overflow: 'hidden',  //forces children to respect border radius
    },
    button: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        color: "#000000",
        fontSize: 16,
        fontWeight: "bold"
    },
    popupTitle: {
        fontSize: 20,
        color: "#FFFFFF",
        fontWeight: "bold",
        marginVertical: 15,
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
        marginVertical: 5,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#444444",
    },
    photo: {
        marginLeft: 10,
        width: 50,
        height: 50,
        borderRadius: 100,
        borderColor: '#ffffff',
        borderWidth: 1
    },
    robotText: {
        marginLeft: 20,
        flex: 1
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 15
    },
    checkedCount: {
        borderRadius: 10,
        backgroundColor: "#842D2D",
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderColor: "#B21C1C"
    },
    plusPhoto: {
        width: 20,
        height: 20,
        borderRadius: 100,
        backgroundColor: '#4B4B4B',
        borderColor: '#FFFFFF',
        borderWidth: 1,
        marginLeft: -5
    },
    plusPhotoContainer: {
        marginLeft: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    plusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold'
    }
});