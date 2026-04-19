import { supabase } from '@/src/supabaseClient';
import { log } from '@/src/utils/log';
import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { getRobotPhotoURL } from './helper-fxns';

async function getUpcomingFights() {
    const { data, error } = await supabase
        .from('fights')
        .select('fight_id, robot_name, opponent_name, cage, fight_time');

    if (error || !data) {
        console.error('Error fetching fights:', error);
        return [];
    } else {
        log('info', 'Fetched fights 1');
        return data; //array of fights (allow for multiple)
    }
}

//TODO: add supabse realtime, doesnt respond to db updates rn
export default function UpcomingFightList() {
    const [fights, setFights] = useState<any[]>([]);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [renderList, setRenderList] = useState(false);
    const slideAnim = useRef(new Animated.Value(-50)).current; //ref instead of state so react doesn't re-render whenever value changes
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const [showListOpener, setShowListOpener] = useState(false);

    const toggleList = useCallback(() => {
        const opening = !renderList;

        if (opening) {
            // mount, and THEN animate in
            setRenderList(true);
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 450, useNativeDriver: true })
            ]).start();
        } else {
            // animate out, then set closed
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: -10, duration: 300, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true })
            ]).start(() => {
                setRenderList(false); // unmount after animation
            });
        }
    }, [renderList]); //only rerender when mount & when renderList changes

    useEffect(() => {
        getUpcomingFights().then(f => {
            setFights(f); //does NOT update state var immediately, React SCHEDULES a re-render for later
            log('info', 'Fetched fights:');

            //make lower case + remove all non-alphanumeric
            f.map(fight => {
                let url = getRobotPhotoURL(fight?.robot_name || "");
                setPhotoUrls(prev => [...prev, url]);
            });
        });
    }, []); //only run once on component mount

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        if (!renderList) {
            //delay in showing listOpener after list closes
            timer = setTimeout(() => {
                setShowListOpener(true);
            }, 100);
        } else {
            //hide immediately when list opens
            setShowListOpener(false);
        }

        return () => clearTimeout(timer);
    }, [renderList]);

    return (
        <>
        <HighlightedFightCard fight={fights?.[0]} photoUrl={photoUrls[0]} />
        </>
    );
}

const isDelayed = (timeStr: { split: (arg0: string) => [any, any]; }) => {
      if (!timeStr) return false;

      const toMinutes = (t: { split: any; }) => {
        const [h, m] = t.split(':');
        return parseInt(h) * 60 + parseInt(m);
      }

      const now = new Date();
      const currMinutes = now.getHours() * 60 + now.getMinutes();

      const matchMinutes = toMinutes(timeStr);

    return currMinutes > matchMinutes ? "DELAYED" : "ON TIME";
};

const formatTime = (timeStr: { split: (arg0: string) => [any, any]; }) => {
    if (!timeStr) return '';

    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);

    const dayIndicate = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;

    return `${h}:${minute} ${dayIndicate}`;
};

function HighlightedFightCard({ fight, photoUrl }: { fight: any, photoUrl: string }) {
    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                {/* TODO - add support for not delayed case */}
                {isDelayed(fight?.fight_time) == "DELAYED" && ( 
                <View style={styles.statusBanner}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="access-time" size={18} color="white" />
                        <Text style={styles.statusText}>{isDelayed(fight?.fight_time)}</Text>
                    </View>
                </View>
                )}
            </View>



            <View style={styles.bottomRow}>
                {/* column 1 - our bot in fight */}
                <View style={styles.column}>
                    <Image
                        source={{ uri: photoUrl }}
                        style={styles.photo}
                    />
                    <Text style={styles.robotText}>
                        {fight?.robot_name}
                    </Text>
                </View>


                {/* column 2 - time */}
                <View style={styles.column}>
                    <Text style={styles.timeText}>
                        {formatTime(fight?.fight_time)}
                    </Text>

                    <Text style={styles.text}>
                        Cage {fight?.cage}
                    </Text>

                </View>

                {/* column 3 - our opponent in fight */}
                {/* TODO - get opponent photo URL */}
                <View style={styles.column}>
                    <Image
                        source={{ uri: photoUrl }}
                        style={styles.photo}
                    />
                    <Text style={styles.robotText}>
                        {fight?.opponent_name}
                    </Text>
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        backgroundColor: '#2C2C2C',
        height: 220,
        marginBottom: 10,
        zIndex: 2,
        position: 'relative'
        //manually flexDirection = column
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between', //space out the text and image to left & right
        alignItems: 'center' //vertically center the text and image
    },
    bottomRow: {
        flexDirection: 'row'
    },
    column: {
        flex: 1,
        alignItems: 'center'        
    },
    statusBanner: {
        backgroundColor: "#4B4B4B",
        borderRadius: 5,
        margin: 15,
        width: '92%',
        height: 35, //of parent comp
        justifyContent: 'center',
        alignItems: 'center'

    },
    statusText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#ffffff'
    },
    robotText: {
        fontSize: 18,
        textAlign: 'center',
        fontWeight: 'bold',
        marginTop: 10,
        marginLeft: 10,
        color: '#ffffff'
    },
    timeText: {
        fontSize: 30,
        textAlign: 'center',
        fontWeight: 'bold',
        marginTop: 40,
        marginLeft: 10,
        color: '#ffffff'
    },
    text: {
        color: "#A5A5A5",
        fontSize: 16,
        marginTop: 10,
        marginLeft: 10,
        marginBottom: 10
    },
    photo: {
        marginLeft: 10,
        width: 80,
        height: 80,
        borderRadius: 100,
        borderColor: '#ffffff',
        borderWidth: 0
    },
    ourRobot: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    listOpener: {
        backgroundColor: "#3A3A3A",
        height: 165,
        borderRadius: 15,
        left: 20,
        right: 20,
        position: 'absolute',
        zIndex: 1
    }
})