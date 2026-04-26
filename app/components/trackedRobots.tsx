import { supabase } from "@/src/supabaseClient";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Checkbox, Portal } from "react-native-paper";
import { getRobotPhotoURL } from "./helper-fxns";

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

export default function TrackedRobots({
    checked,
    setChecked,
    toggleChecked,
    robots,
    setRobots,
}: {
    checked: Record<number, boolean>,
    toggleChecked: (id: number) => void,
    setChecked: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
    robots: any[],
    setRobots: React.Dispatch<React.SetStateAction<any[]>>,
}) {
    const [isVisible, setVisibility] = useState(false);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);

    const onClose = () => {
        setVisibility(false);
    }


    const countChecked = () => {
        return Object.values(checked).filter(value => value == true).length;
    }

    useEffect(() => {
        getRobots().then(r => {
            setRobots(r);
            r.map((r, i) => {
                let url = getRobotPhotoURL(r.robot_name);
                setPhotoUrls(prev => [...prev, url!]);
                setChecked(prev => ({
                    ...prev,
                    [i]: false
                }))
            })
        }
        );

    }, []);

    return (
        <>
            <TrackedButton setVisibility={setVisibility} robots={robots} checked={checked} numChecked={countChecked()} photoUrls={photoUrls} />
            {isVisible &&
                <TrackedPopUp onClose={onClose} robots={robots} photoUrls={photoUrls} checked={checked} toggleChecked={toggleChecked} countChecked={countChecked} />
            }
        </>
    );
}

function TrackedButton({
    setVisibility,
    robots,
    checked,
    numChecked,
    photoUrls
}: {
    setVisibility: React.Dispatch<React.SetStateAction<boolean>>,
    robots: any[],
    checked: Record<number, boolean>,
    numChecked: number,
    photoUrls: string[]
}) {
    //to track number of photos in button, and to help render the "+2" when >2 robots selected
    const overTwo = numChecked > 2;
    const allChecked = robots.map((_, i) => i).filter(i => checked[i]);
    const renderedRobotIdxs = overTwo ? allChecked.slice(0, 2) : allChecked;

    return (
        <>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    setVisibility(v => !v)
                    console.log("pressed tracking button")
                }}
            >
                <Text style={styles.text}>Tracked Robots</Text>
                {numChecked == 0 ? (
                    <AntDesign name="plus" size={20} color="#000000" style={{ marginLeft: 5 }} />
                ) : (
                    <View style={styles.plusPhotoContainer}>
                        {renderedRobotIdxs.map((i, _) =>
                            checked[i] &&
                            <Image key={i} source={{ uri: photoUrls[i] }} style={styles.plusPhoto} />
                        )}
                        {overTwo &&
                            <Text style={[styles.plusPhoto, styles.plusText, { backgroundColor: '#BF2E2E', paddingLeft: 3, paddingTop: 2 }]}>+3</Text>
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
    photoUrls,
    checked,
    toggleChecked,
    countChecked
}: {
    onClose: () => void,
    robots: any[],
    photoUrls: string[],
    checked: Record<number, boolean>,
    toggleChecked: (id: number) => void,
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

                    {robots.map((r, i) => (
                        <View key={i} style={styles.row}>
                            <Image
                                source={{ uri: photoUrls[i] }}
                                style={styles.photo}
                            />
                            <View style={styles.robotText}>
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