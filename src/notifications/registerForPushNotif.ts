/** Request push permission and return Expo push token; used to store in profiles. */
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

/** Returns Expo push token or undefined if not device / permission denied. Requires EXPO_PUBLIC_EXPO_PROJECT_ID. */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    console.log('[push-register] start', {
        platform: Platform.OS,
        isDevice: Device.isDevice,
        deviceName: Device.deviceName,
        modelName: Device.modelName,
    });

    if(!Device.isDevice){
        console.warn('[push-register] must use physical device for Push Notifications');
        return undefined;
    }

    const { status : existing } = await Notifications.getPermissionsAsync();
    console.log('[push-register] existing permission status:', existing);
    let finalStatus = existing;

    if(existing !== 'granted'){
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('[push-register] requested permission status:', status);
        finalStatus = status;
    }

    if(finalStatus !== 'granted'){
        console.warn('[push-register] permission not granted; final status:', finalStatus);
        alert('Failed to get push token for push notification!');
        return undefined;
    }

    //sends POST request to https://exp.host/--/api/v2/push/getExpoPushToken to get push token for user's specific device
    const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID!,
    });
    console.log('[push-register] got token for this device:', pushToken.data);
    return pushToken.data;
}