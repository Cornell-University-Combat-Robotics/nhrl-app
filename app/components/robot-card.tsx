import { Image, StyleSheet, Text, View } from 'react-native';

export default function RobotCard({ photoUrl, fight, subteam, subteamColor }: { photoUrl: string, fight: any, subteam: string, subteamColor: string }) {
    return (
        <>
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <Image
                        source={{ uri: photoUrl }}
                        style={styles.photo}
                    />
                    <View style={styles.cardColumn}>
                        <Text style={styles.ourRobotText}>
                            {fight?.robot_name}
                        </Text>
                        <View style={styles.labelContainer}>
                            <SubteamLabel subteam={subteam} subteamColor={subteamColor} />
                            {fight?.is_win === 'lose' && <EliminatedLabel />}
                        </View>
                        <Text style={styles.upcomingHeader}>
                            Upcoming Opponent: {fight?.opponent_name}
                        </Text>
                    </View>
                </View>
            </View>
        </>
    );
}

function SubteamLabel({subteam, subteamColor}:{subteam: string, subteamColor: string}){
    return (
        <>
            <View style={[styles.label, {backgroundColor: subteamColor, borderColor: subteamColor}]}>
                <Text style={styles.labelText}>{subteam}</Text>
            </View>
        </>
    );
}

function EliminatedLabel(){
    return (
        <>
            <View style={[styles.label, {backgroundColor: "#B6262650", borderColor: "#B6262650"}]}>
                <Text style={styles.labelText}>Eliminated</Text>
            </View>
        </>
    );
}


const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        backgroundColor: '#2C2C2C',
        height: 130,
        zIndex: 2,
        position: 'relative'
        //manually flexDirection = column
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
    label: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    labelText: {
        color: "#FFFFFF",
        fontSize: 15,
        opacity: 1
    },
    photo: {
        marginLeft: 20,
        width: 70,
        height: 70,
        borderRadius: 100
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 5
    }
})