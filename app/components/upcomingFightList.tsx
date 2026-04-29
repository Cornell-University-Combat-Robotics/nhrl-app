import { supabase } from '@/src/supabaseClient';
import { log } from '@/src/utils/log';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { getRobotPhotoURL } from './helper-fxns';
import IndivFightCard from './indiv-fight-card';

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function UpcomingFightList({upcomingFights, photoUrls}: {upcomingFights: any[], photoUrls: string[]}) {
    const [renderList, setRenderList] = useState(false);
    const hasUpcomingFights = upcomingFights.length > 0;

    const slideAnim = useRef(new Animated.Value(-50)).current; //ref instead of state so react doesn't re-render whenever value changes
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const [showListOpener, setShowListOpener] = useState(false);

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
        let timer: ReturnType<typeof setTimeout>;

        if (!renderList) {
            timer = setTimeout(() => setShowListOpener(true), 100);
        } else {
            setShowListOpener(false);
        }

        return () => clearTimeout(timer);
    }, [renderList]);


    return (
        <>
            {!hasUpcomingFights ? null : (
            <>
            <Text style={styles.upcomingHeader}>UPCOMING FIGHTS</Text>
            <TouchableOpacity
                onPress={() => { toggleList() }}
                activeOpacity={0.8}
            >
                <IndivFightCard props={{ title: upcomingFights?.[0]?.robot_name, photoUrl: photoUrls[0], fstText: `Opponent: ${upcomingFights?.[0]?.opponent_name}`, sndText: `Live at: ${upcomingFights?.[0]?.fight_time}`, innerBox: `Cage: ${upcomingFights?.[0]?.cage}` }} />
                {showListOpener &&
                    <View style={styles.listOpener} />
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
                            <IndivFightCard key={index} props={{ title: item?.robot_name, photoUrl: photoUrls[index + 1], fstText: `Opponent: ${item?.opponent_name}`, sndText: `Live at: ${item?.fight_time}`, innerBox: `Cage: ${item?.cage}` }} />
                        ))}
                    </ScrollView>
                </Animated.View>
            )}
            </>
            )}
        </>
    );

}


const styles = StyleSheet.create({
    upcomingHeader: {
        color: "#A5A5A5", 
        fontSize: 14, 
        marginTop: 35,
        marginBottom: 10
    },
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
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    bottomRow: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start'
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
        height: 50,
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
});