import React, { useState, useEffect, useRef } from 'react';
import { Platform, LogBox, StyleSheet, View, Image } from 'react-native';

// Firebase
import { onAuthStateChanged } from 'firebase/auth';
import {
    getDoc,
    doc,
    getDocs,
    collection,
    query,
    where,
} from 'firebase/firestore';
import { auth, db } from './src/firebase/config';

// Navigation
import { NavigationContainer } from '@react-navigation/native';
import LoginHomeScreen from './src/screens/login/LoginHomeScreen';
import HomeScreen from './src/screens/HomeScreen';

// Redux
import store from './src/redux/store';
import { setUser, setDrivers } from './src/redux/userSlice';
import { Provider } from 'react-redux';
import { useDispatch } from 'react-redux';

// Imports for notifications
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

LogBox.ignoreLogs([`Setting a timer for a long period`]);
LogBox.ignoreLogs([`AsyncStorage has been extracted from react-native core`]);

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

function App() {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);

    const notificationListener = useRef();
    const responseListener = useRef();

    const dispatch = useDispatch();

    async function registerForPushNotificationsAsync() {
        let token;

        if (Device.isDevice) {
            const { status: existingStatus } =
                await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } =
                    await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Failed to get push token for push notification!');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log(token);
            setExpoPushToken(token);
        } else {
            alert('Must use physical device for Push Notifications.');
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    }

    useEffect(() => {
        registerForPushNotificationsAsync().then((token) =>
            setExpoPushToken(token)
        );

        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                setNotification(notification);
            });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    console.log(response);
                }
            );

        return () => {
            Notifications.removeNotificationSubscription(
                notificationListener.current
            );
            Notifications.removeNotificationSubscription(
                responseListener.current
            );
        };
    }, []);

    const saveDrivers = async () => {
        let tempDrivers = [];

        const users = collection(db, 'users');
        const userQuery = query(users, where('type', '==', 'driver'));

        try {
            console.log('[Auth] Loading driver list from Firestore');
            const querySnapshot = await getDocs(userQuery);
            querySnapshot.forEach((doc) => {
                tempDrivers.push({ uid: doc.id, data: doc.data() });
            });
            console.log('[Auth] Loaded driver list', {
                driverCount: tempDrivers.length,
            });
            dispatch(setDrivers(tempDrivers));
        } catch (error) {
            console.error(
                '[Auth] Failed to load drivers collection "users"',
                error
            );
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setLoading(true);
                console.log('[Auth] Auth state change detected', {
                    uid: user.uid,
                });
                getDoc(doc(db, 'users', user.uid))
                    .then((userSnap) => {
                        const userData = userSnap.data();
                        console.log('[Auth] User profile loaded', {
                            uid: user.uid,
                            type: userData?.type,
                        });
                        if (
                            userData.type === 'admin' ||
                            userData.type === 'warehouse'
                        ) {
                            console.log(
                                '[Auth] User requires driver list preload'
                            );
                            saveDrivers();
                        }
                        dispatch(setUser([user.uid, userData]));
                        setLoggedIn(true);
                    })
                    .catch((error) => {
                        console.error(
                            '[Auth] Failed to read user document "users"',
                            {
                                uid: user.uid,
                            },
                            error
                        );
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                setLoggedIn(false);
            }
        });
        return unsubscribe;
    }, [auth]);

    if (loading) {
        return (
            <View style={styles.container}>
                <Image
                    style={styles.logo}
                    source={require('./assets/bdalogo.png')}
                />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {loggedIn ? <HomeScreen /> : <LoginHomeScreen />}
        </NavigationContainer>
    );
}

export default function AppWrapper() {
    return (
        <Provider store={store}>
            <App />
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 170,
        height: 175,
    },
});
