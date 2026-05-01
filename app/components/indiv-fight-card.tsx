import { Image, StyleSheet, Text, View } from 'react-native';

export type FightCardProps = {
    title: string;
    photoUrl: string;
    // fstText: string;
    sndText: string;
    innerBox: string;
}

export default function IndivFightCard({ props }: { props: FightCardProps }) {
    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.ourRobot}>
                    <Image
                        source={{ uri: props?.photoUrl }}
                        style={styles.photo}
                    />
                    <Text style={styles.ourRobotText}>
                        {props?.title}
                    </Text>
                </View>
                <View style={styles.cage}>
                    <Text style={styles.cageText}>
                        {props?.innerBox}
                    </Text>
                </View>
            </View>
            <View style={styles.bottomRow}>
                {/* <Text style={styles.text}>
                    {props?.fstText}
                </Text> */}
                <Text style={styles.text}>
                    {props?.sndText}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        backgroundColor: '#2C2C2C',
        height: 120,
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
        // flex: 1,               // take up remaining vertical space
        // justifyContent: 'center', // center vertically (main axis)
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