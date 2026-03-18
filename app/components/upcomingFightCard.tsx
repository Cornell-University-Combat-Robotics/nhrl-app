import { supabase } from '@/src/supabaseClient';
import { log } from '@/src/utils/log';
import { useState } from 'react';

async function getUpcomingFights() {
    const { data, error } = await supabase
        .from('fights')
        .select('robot_name, opponent_name, cage, fight_time');

    if (error || !data) {
        console.error('Error fetching fights:', error);
        return [];
    } else {
        log('info', 'Fetched fights 1');
        return data; //array of fights (allow for multiple)
    }
}

async function getRobotPhotoURL(name: string) {
    const baseUrlHead = "https://brettzone.nhrl.io/brettZone/getBotPic.php?bot=";
    const baseUrlTail = "&amp;thumb=1";
    const url = baseUrlHead + encodeURIComponent(name) + baseUrlTail;
    return url;
}


export default function UpcomingFightCard() {
    const [fights, setFights] = useState<any[]>([]);
    getUpcomingFights().then(f => {
        setFights(f);
        log('info', 'Fetched fights:');
    });

    return (
        <>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 10,
        backgroundColor: '#25292e',
    },
    ourRobot: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    cage: {
        
    }

})