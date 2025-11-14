import React, { useState, useEffect, useRef } from 'react';
import { Platform, LogBox, StyleSheet, View, Image } from 'react-native';

// Supabase
import supabase from './src/supabase/client';

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
        try {
            const { data, error } = await supabase
                .from('staff_profiles')
                .select('*')
                .eq('role', 'driver');
            if (error) {
                throw error;
            }
            const tempDrivers = data.map((profile) => ({
                uid: profile.id,
                data: profile,
            }));
            dispatch(setDrivers(tempDrivers));
        } catch (error) {
            console.error(`[saveDrivers] ${error.message}`);
        }
    };

    const hydrateUserSession = async (session) => {
        if (!session?.user) {
            dispatch(setUser([null, null]));
            dispatch(setDrivers([]));
            setLoggedIn(false);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('staff_profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) {
                throw error;
            }

            // If no profile exists, sign out the user
            if (!data) {
                console.error('[hydrateUserSession] No staff profile found for user');
                await supabase.auth.signOut();
                dispatch(setUser([null, null]));
                dispatch(setDrivers([]));
                setLoggedIn(false);
                setLoading(false);
                return;
            }

            if (['admin', 'warehouse'].includes(data.role)) {
                await saveDrivers();
            } else {
                dispatch(setDrivers([]));
            }
            dispatch(setUser([session.user.id, data]));
            setLoggedIn(true);
        } catch (error) {
            console.error('[hydrateUserSession]', error.message);
            setLoggedIn(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let authSubscription;

        const initSession = async () => {
            setLoading(true);
            const {
                data: { session },
            } = await supabase.auth.getSession();
            await hydrateUserSession(session);
        };

        initSession();

        authSubscription = supabase.auth.onAuthStateChange(
            (_event, session) => {
                hydrateUserSession(session);
            }
        );

        return () => {
            authSubscription?.data?.subscription?.unsubscribe();
        };
    }, []);

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
