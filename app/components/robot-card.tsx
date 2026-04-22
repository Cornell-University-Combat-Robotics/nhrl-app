import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EliminatedLabel, SubteamLabel } from './helper-fxns';

export default function RobotCard({ robot, subteamColor }: { robot: any, subteamColor: string }) {
    const router = useRouter();

    return (
        <>
            <TouchableOpacity style={styles.card}
                onPress={() => router.push({ pathname: "/(tabs)/indiv-robot", params: { id: robot.robot_id } })}
            >
                <View style={styles.cardRow}>
                    <Image
                        source={{ uri: robot?.photoUrl }}
                        style={styles.photo}
                    />
                    <View style={styles.cardColumn}>
                        <Text style={styles.ourRobotText}>
                            {robot?.robot_name}
                        </Text>
                        <View style={styles.labelContainer}>
                            <SubteamLabel subteam={robot?.subteam} subteamColor={subteamColor} />
                            {robot?.is_eliminated === true && <EliminatedLabel />}
                        </View>
                        <Text style={styles.upcomingHeader}>
                            Upcoming Opponent: {robot?.opponent_name}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        backgroundColor: '#2C2C2C',
        height: 130,
        marginBottom: 15
    },
    cardRow: {
        flexDirection: 'row',
        flex: 1,
        gap: 15,
        justifyContent: 'flex-start', //space out the text and image to left & right
        alignItems: 'center' //vertically center the text and image
    },
    cardColumn: {
        flexDirection: 'column',
        gap: 12,
        justifyContent: 'center', //vertical
        alignItems: 'flex-start' //horizontal
    },
    ourRobotText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff'
    },
    upcomingHeader: {
        color: "#A5A5A5",
        fontSize: 16
    },
    photo: {
        marginLeft: 20,
        width: 70,
        height: 70,
        borderRadius: 100,
        borderColor: '#ffffff',
        borderWidth: 0.5
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 5
    }
})