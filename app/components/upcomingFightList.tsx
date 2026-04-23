import { supabase } from '@/src/supabaseClient';
import { log } from '@/src/utils/log';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRobotPhotoURL } from './helper-fxns';

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

//TODO: add supabse realtime, doesnt respond to db updates rn
export function UpcomingFightList1() {
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
            log('info', 'Fetched fights:');

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

    //account for the soonest fight already being in the highlighted fight section, so show fights from index 1 onward
    const upcomingFights = fights?.slice(1) ?? [];
    const upcomingPhotos = photoUrls?.slice(1) ?? [];

    return (
        <>
            <TouchableOpacity onPress={() => { toggleList() }}>
                {/* show the second soonest fight as preview (if it exists) */}
                <IndivFightCard 
                    fight={upcomingFights[0]} 
                    photoUrl={upcomingPhotos[0]} />
                {showListOpener &&
                    <View style={styles.listOpener}></View>
                }
            </TouchableOpacity>
            
            {/* show the remaining fights after toggle (if it exists) */}
            {renderList &&
                <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
                    <ScrollView>
                    {upcomingFights.slice(1).map((fight, i) => (
                        <IndivFightCard
                            key={fight.fight_id ?? i}
                            fight={fight}
                            photoUrl={upcomingPhotos[i + 1]}
                        />
                    ))}                    
                    </ScrollView>
                </Animated.View>
            }
        </>
    );
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
        <View>
            {/* Preview card */}
            <TouchableOpacity activeOpacity={0.8} onPress={toggleList}>
                <IndivFightCard
                    fight={upcomingFights[0]}
                    photoUrl={upcomingPhotos[0]}
                />
                {showListOpener && <View style={styles.listOpener} />}
            </TouchableOpacity>

            {/* Expandable list */}
            {renderList && (
                <Animated.View
                    style={[
                        styles.dropdown,
                        {
                            opacity: opacityAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <FlatList
                        data={upcomingFights.slice(1)}
                        keyExtractor={(item, i) =>
                            item.fight_id ?? i.toString()
                        }
                        renderItem={({ item, index }) => (
                            <IndivFightCard
                                fight={item}
                                photoUrl={upcomingPhotos[index + 1]}
                            />
                        )}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                    />
                </Animated.View>
            )}
        </View>
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
    dropdown: {
        maxHeight: SCREEN_HEIGHT * 0.5, // 🔥 THIS is what makes it scroll properly
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