import { supabase } from '@/src/supabaseClient';
import { log } from '@/src/utils/log';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
            <TouchableOpacity
                onPress={() => { toggleList() }}
            >
                <IndivFightCard fight={fights?.[0]} photoUrl={photoUrls[0]} />
                {showListOpener &&
                    <View style={styles.listOpener}></View>
                }
            </TouchableOpacity>
            {renderList &&
                <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
                    <ScrollView>
                        {fights
                            .filter((_, index) => index !== 0) //exclude first fight since it's already rendered above
                            .map((fight, index) => (
                                <IndivFightCard key={index} fight={fight} photoUrl={photoUrls[index + 1]} />
                            ))}
                    </ScrollView>
                </Animated.View>
            }
        </>
    );
}

function IndivFightCard({ fight, photoUrl }: { fight: any, photoUrl: string }) {
    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.ourRobot}>
                    <Image
                        source={{ uri: photoUrl }}
                        style={styles.photo}
                    />
                    <Text style={styles.ourRobotText}>
                        {fight?.robot_name}
                    </Text>
                </View>
                <View style={styles.cage}>
                    <Text style={styles.cageText}>{
                        `Cage ${fight?.cage}`
                    }</Text>
                </View>
            </View>
            <View style={styles.bottomRow}>
                <Text style={styles.text}>{
                    `Opponent Name: ${fight?.opponent_name}`
                }</Text>
                <Text style={styles.text}>{
                    `Live in: ${fight?.fight_time}`
                }</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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