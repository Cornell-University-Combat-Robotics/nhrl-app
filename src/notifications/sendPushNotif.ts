export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
    const message = {
        to: expoPushToken, //target device, not shown to user
        title,
        body
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });

    if(!response.ok) {
        console.error('Failed to send push notification:', response.statusText);
    }

    const result = await response.json();
    return result
}
