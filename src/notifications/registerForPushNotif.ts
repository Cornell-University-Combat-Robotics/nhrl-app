import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

//customize how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    //object w/property called "handleNotification", returns object w/following properties
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
    }),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    if(!Device.isDevice){
        console.warn('Must use physical device for Push Notifications');
        return undefined;
    }

    const { status : existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if(existing !== 'granted'){
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if(finalStatus !== 'granted'){
        alert('Failed to get push token for push notification!');
        return undefined;
    }

    //sends POST request to https://exp.host/--/api/v2/push/getExpoPushToken to get push token for user's specific device
    const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID!,
    });
    return pushToken.data;
}