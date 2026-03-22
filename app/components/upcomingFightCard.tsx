import { supabase } from '@/src/supabaseClient';
import { log } from '@/src/utils/log';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

async function getRobotPhotoURL(name: string) {
    const refinedName = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const baseUrlHead = "https://brettzone.nhrl.io/brettZone/getBotPic.php?bot=";
    const baseUrlTail = "&amp;thumb=1";
    const url = baseUrlHead + encodeURIComponent(refinedName) + baseUrlTail;
    return url;
}

//TODO: add supabse realtime
export default function UpcomingFightCard() {
    const [fights, setFights] = useState<any[]>([]);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [renderList, setRenderList] = useState(false);

    useEffect(() => {
        getUpcomingFights().then(f => {
            setFights(f);
            log('info', 'Fetched fights:');
        });
        //make lower case + remove all non-alphanumeric
        fights?.map(fight =>
            getRobotPhotoURL(fight?.robot_name || "").then(url => {
                setPhotoUrls(prev => [...prev, url]);
                log('info', 'Fetched photo URL: ' + url);
            })
        );
    }, []); //only run once on component mount

    return (
        <>
            <TouchableOpacity
                onPress={() => { setRenderList(!renderList) }}
            >
                <IndivFightCard fight={fights?.[0]} photoUrl={photoUrls[0]}/>
                {!renderList && 
                    <View style={styles.listOpener}></View>
                }
            </TouchableOpacity>
            {renderList && (
                <ScrollView>
                    {fights
                    .filter((_, index) => index !== 0) //exclude first fight since it's already rendered above
                    .map((fight, index) => (
                        <IndivFightCard key={fight.id} fight={fight} photoUrl={photoUrls[index]}/>
                    ))}
                </ScrollView>
            )}
        </>
    );
}

function IndivFightCard({fight, photoUrl}: { fight: any, photoUrl: string }) {
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