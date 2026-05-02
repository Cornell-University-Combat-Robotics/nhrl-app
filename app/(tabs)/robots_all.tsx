import { supabase } from "@/src/supabaseClient";
import { log } from '@/src/utils/log';
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import crcSymbol from '../../assets/images/crc-symbol.png';
import { getRobotPhotoURL, getRobots, getUpcomingFights, subteamColors } from "../components/helper-fxns";
import RobotCard from "../components/robot-card";

//TODO: might wanna move to to hooks
export default function RobotsAllScreen() {
    const [robots, setRobots] = useState<any[]>([]);
    //NOT same order as robots!!
    const [upcomingOpponents, setUpcomingOpponents] = useState<any[]>();

    useEffect(() => {
        getRobots().then(r => setRobots(r));
        getUpcomingFights().then((arr) => {
            const seen = new Set();
            const distinct = [];

            for (const fight of arr) {
                if (!seen.has(fight.robot_name)) {
                    seen.add(fight.robot_name);
                    distinct.push(fight);
                }
            }

            // just first upcoming fight per robot
            setUpcomingOpponents(distinct);
        });

        log('info', 'upcoming opponents: ', { upcomingOpponents })
        const channel = supabase
            .channel('robots-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'robots' },
                (payload) => {
                    console.log('robots changed:', payload);
                    getRobots().then(r => setRobots(r));
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fights' },
                (payload) => {
                    console.log('fights changed:', payload);
                    getUpcomingFights().then((arr) => {
                        const seen = new Set();
                        const distinct = [];

                        for (const fight of arr) {
                            if (!seen.has(fight.robot_name)) {
                                seen.add(fight.robot_name);
                                distinct.push(fight);
                            }
                        }

                        // just first upcoming fight per robot
                        setUpcomingOpponents(distinct);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <>
            <View style={styles.topNav}>
                <Image source={crcSymbol} style={{ width: 50, height: 50 }} />
                <Text style={styles.robotHeader}>Robots</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
                {robots
                    .sort((a, b) => a.robot_name.localeCompare(b.robot_name)) //sort alphabetically
                    .sort((a, b) => a.is_eliminated ? 1 : b.is_eliminated ? -1 : 0) //sort by is_eliminated 
                    .map((r, i) =>
                        <RobotCard
                            key={i}
                            robot={{
                                robot_id: r.robot_id,
                                photoUrl: getRobotPhotoURL(r.robot_name),
                                robot_name: r.robot_name,
                                opponent_name: upcomingOpponents?.find((up) => up.robot_name === r.robot_name)?.opponent_name ?? "TBD", //ehh, O(n) but we only have 5 robots so...
                                is_eliminated: r.is_eliminated,
                                subteam: r.subteam,
                            }}
                            subteamColor={subteamColors[r.subteam]}
                        />
                    )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    topNav: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 20
    },
    robotHeader: {
        fontSize: 30,
        marginLeft: 15,
        color: "#FFFFFF",
        fontWeight: "bold",
    }
});