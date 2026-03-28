import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function TrackedRobots() {
    const handlePress = () => {
        console.log("Track Robots button pressed")
    };

    return (
        <>
            <TouchableOpacity
                style={styles.button}
                onPress={() => handlePress()}
            >
                <Text style={styles.text}>Tracked Robots</Text>
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        margin: 10,
        width: 150,
        height: 40
    },
    text: {
        color: "#000000",
        fontSize: 16,
        fontWeight: "bold"
    }
});