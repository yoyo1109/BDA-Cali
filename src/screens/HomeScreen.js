import { StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PendingScreen from './donations/PendingScreen';
import AcceptedScreen from './donations/AcceptedScreen';
import SettingsScreen from './settings/SettingsScreen';
import PickupScreen from './donations/PickupScreen';
import PickedupScreen from './donations/PickedupScreen';
import { useSelector } from 'react-redux';

const Tab = createBottomTabNavigator();

const HomeScreen = () => {
    const data = useSelector((state) => state.user.data);

    return (
        <Tab.Navigator
            initialRouteName={data.type === 'driver' ? 'Pickups' : 'Pending'}
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Pickups') {
                        iconName = focused ? 'truck' : 'truck-outline';
                    } else if (route.name === 'Pending') {
                        iconName = focused
                            ? 'account-clock'
                            : 'account-clock-outline';
                    } else if (route.name === 'Active Pickups') {
                        iconName = focused ? 'truck' : 'truck-outline';
                    } else if (route.name === 'Picked Up') {
                        iconName = focused
                            ? 'truck-check'
                            : 'truck-check-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'cog' : 'cog-outline';
                    }
                    return <Icon name={iconName} size={size} color={color} />;
                },
                headerShown: false,
            })}
        >
            {data.type === 'driver' ? (
                <Tab.Screen name='Pickups' component={PickupScreen} />
            ) : (
                <>
                    <Tab.Screen name='Pending' component={PendingScreen} />
                    <Tab.Screen
                        name='Active Pickups'
                        component={AcceptedScreen}
                    />
                    <Tab.Screen name='Picked Up' component={PickedupScreen} />
                </>
            )}
            <Tab.Screen name='Settings' component={SettingsScreen} />
        </Tab.Navigator>
    );
};

export default HomeScreen;
