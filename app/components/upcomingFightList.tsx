import { supabase } from '@/src/supabaseClient';
import { log } from '@/src/utils/log';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRobotPhotoURL } from './helper-fxns';
import IndivFightCard from './indiv-fight-card';

const SCREEN_HEIGHT = Dimensions.get("window").height;

async function getUpcomingFights() {
    const { data, error } = await supabase
        .from('fights')
        .select('fight_id, robot_name, opponent_name, cage, fight_time')
        .order('fight_time', { ascending: true });
    if (error || !data) {
        console.error('Error fetching fights:', error);
        return [];
    } else {
        log('info', 'Fetched fights 1');
        return data; //array of fights (allow for multiple)
    }
}

export default function UpcomingFightList() {
    const [fights, setFights] = useState<any[]>([]);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [renderList, setRenderList] = useState(false);
    const [showListOpener, setShowListOpener] = useState(false);

    const slideAnim = useRef(new Animated.Value(-50)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const toggleList = useCallback(() => {
        const opening = !renderList;

        if (opening) {
            setRenderList(true);

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 450,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -10,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start(() => {
                setRenderList(false);
            });
        }
    }, [renderList]);

    useEffect(() => {
        getUpcomingFights().then(f => {
            setFights(f);

            const urls = f.map(fight =>
                getRobotPhotoURL(fight?.robot_name || "")
            );

            setPhotoUrls(urls);
        });
    }, []);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        if (!renderList) {
            timer = setTimeout(() => setShowListOpener(true), 100);
        } else {
            setShowListOpener(false);
        }

        return () => clearTimeout(timer);
    }, [renderList]);

    const upcomingFights = fights?.slice(1) ?? [];
    const upcomingPhotos = photoUrls?.slice(1) ?? [];

    return (
        <>
            <TouchableOpacity
                onPress={() => { toggleList() }}
                activeOpacity={0.8}
            >
                <IndivFightCard props={{ title: fights?.[0]?.robot_name, photoUrl: upcomingPhotos[0], fstText: `Opponent: ${fights?.[0]?.opponent_name}`, sndText: `Live at: ${fights?.[0]?.fight_time}`, innerBox: `Cage: ${fights?.[0]?.cage}` }} />
                {showListOpener &&
                    <View style={styles.listOpener}></View>
                }
            </TouchableOpacity>
            {renderList && (
                <Animated.View
                    style={{
                        opacity: opacityAnim,
                        transform: [{ translateY: slideAnim }],
                        paddingBottom: 80
                    }}
                >
                    <ScrollView>
                        {upcomingFights.slice(1).map((item, index) => (
                            <IndivFightCard key={index} props={{ title: `vs ${item?.opponent_name}`, photoUrl: upcomingPhotos[index + 1], fstText: `Opponent: ${item?.opponent_name}`, sndText: `Live at: ${item?.fight_time}`, innerBox: `Cage: ${item?.cage}` }} />
                        ))}
                    </ScrollView>
                </Animated.View>
            )}
        </>
    );

}

const styles = StyleSheet.create({
    dropdown: {
        maxHeight: SCREEN_HEIGHT * 0.5,
        overflow: 'hidden',   // clips content cleanly
    },
    listOpener: {
        height: 10,
        backgroundColor: "#333",
        borderRadius: 5,
        marginTop: 5,
        alignSelf: "center",
        width: 40
    },
    card: {
        borderRadius: 10,
        backgroundColor: '#2C2C2C',
        height: 150,
        marginBottom: 10,
        paddingHorizontal: 5,
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
        flex: 1,               // take up remaining vertical space
        justifyContent: 'center', // center vertically (main axis)
        alignItems: 'flex-start'  // keep text left-aligned horizontally
    },
    ourRobotText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#ffffff'
    },
    cage: {
        backgroundColor: "#1C1C1C",
        borderRadius: 5,
        margin: 15,
        width: '20%',
        height: 50, //of parent comp
        justifyContent: 'center',
        alignItems: 'center'
    },
    cageText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold'
    },
    text: {
        color: "#A5A5A5",
        fontSize: 15,
        marginLeft: 10,
        marginBottom: 10
    },
    photo: {
        marginLeft: 10,
        width: 50,
        height: 50,
        borderRadius: 100,
        borderColor: '#ffffff',
        borderWidth: 1
    },
    ourRobot: {
        flexDirection: 'row',
        alignItems: 'center'
    }
})