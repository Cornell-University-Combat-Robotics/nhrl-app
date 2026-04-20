import { supabase } from '@/src/supabaseClient';
import { log } from '@/src/utils/log';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getRobotPhotoURL } from './helper-fxns';

// TODO - consider moving getUpcomingFights() to helper-fxns bc used in multiple files
async function getUpcomingFights() {
    const { data, error } = await supabase
        .from('fights')
        .select('fight_id, robot_name, opponent_name, cage, fight_time');

    if (error || !data) {
        console.error('Error fetching fights:', error);
        return [];
    } else {
        log('info', 'Fetched fights 1');
        return data;
    }
}

export default function HighlightedFightFunction() {
    const [fight, setFight] = useState<any>(null);

    useEffect(() => {
        getUpcomingFights().then(f => {
            const nextFight = f?.[0] ?? null;
            setFight(nextFight);
        });
    }, []);

    const ourBotPhotoUrl = getRobotPhotoURL(fight?.robot_name || "");
    const oppBotPhotoUrl = getRobotPhotoURL(fight?.opponent_name || "");

    return (
        <>
        <HighlightedFightCard 
            fight={fight} 
            ourBotPhotoUrl={ourBotPhotoUrl} 
            oppBotPhotoUrl={oppBotPhotoUrl} />
        </>
    );
}

/**
 * isDelayed() returns if the upcoming fight has been delayed based on the current time and the scheduled fight time.
 * @param timeStr - Scheduled fight time in 24-hour format
 */
const isDelayed = (timeStr: { split: (arg0: string) => [any, any]; }) => {
      if (!timeStr) return false;

      const toMinutes = (t: { split: any; }) => {
        const [h, m] = t.split(':');
        return parseInt(h) * 60 + parseInt(m);
      }

      const now = new Date();
      const currMinutes = now.getHours() * 60 + now.getMinutes();

      const matchMinutes = toMinutes(timeStr);

    return true ? currMinutes > matchMinutes : false;
};

/**
 * formatTime() is a helper function that formats the scheduled fight time from 24-hour format to 12-hour format with AM/PM.
 * @param timeStr - Scheduled fight time in 24-hour format
 */
const formatTime = (timeStr: { split: (arg0: string) => [any, any]; }) => {
    if (!timeStr) return '';

    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);

    const dayIndicate = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;

    return `${h}:${minute} ${dayIndicate}`;
};

/**
 *  HighlightedFightCard is a component that displays  details of the upcoming fight.
 * @param fight - Contains details about the upcoming fight such as robot names, fight time, and cage number.
 * @param ourBotPhotoUrl - URL of the photo for CRC robot
 * @param oppBotPhotoUrl - URL of the photo for opponent robot
 */
function HighlightedFightCard({fight, ourBotPhotoUrl, oppBotPhotoUrl}: {fight: any, ourBotPhotoUrl: string, oppBotPhotoUrl: string}) {
    return (

        <View style={styles.card}>

            {/* TOP ROW - If delayed, status banner will be displayed */}
            {isDelayed(fight?.fight_time) && (
                <View style={styles.topRow}>
                    <View style={styles.statusBanner}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="access-time" size={18} color="white" />
                            <Text style={styles.statusText}>Delayed</Text>
                        </View>
                    </View>
                </View>
            )}
    
            {/* BOTTOM ROW - Upcoming fight details */}
            <View style={styles.bottomRow}>

                {/* Column 1 - Our Bot */}
                <View style={styles.column}>
                    <Image 
                        source={{uri: ourBotPhotoUrl}} 
                        style={styles.photo} 
                    />
                    <Text style={styles.robotText}>
                        {fight?.robot_name}
                    </Text>
                </View>

                {/* Column 2 - Time and Cage Location */}
                <View style={styles.column}>
                    <Text style={styles.timeText}> {formatTime(fight?.fight_time)} </Text>
                    <Text style={styles.text}>Cage {fight?.cage}</Text>
                </View>

                {/* Column 3 - Our Opponent */}
                <View style={styles.column}>
                    <Image
                        source={{uri: oppBotPhotoUrl}}
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
        marginBottom: 10,
        zIndex: 2,
        position: 'relative',
        paddingVertical: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 35,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    column: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'      
    },
    statusBanner: {
        backgroundColor: "#4B4B4B",
        borderRadius: 5,
        width: '92%',
        height: 35,
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
    }
})