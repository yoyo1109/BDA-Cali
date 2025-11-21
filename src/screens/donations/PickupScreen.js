import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListScreen from './driver/ListScreen';
import ViewScreen from './driver/ViewScreen';
import PickupCompleteScreen from './driver/PickupCompleteScreen';

const Stack = createNativeStackNavigator();

const PickupScreen = () => {
    const currentDate = new Date().toLocaleDateString('en-US');

    return (
        <Stack.Navigator initialRouteName='List'>
            <Stack.Screen
                name='List'
                component={ListScreen}
                options={{ title: `Pickups (${currentDate})` }}
            />
            <Stack.Screen
                name='View'
                component={ViewScreen}
                options={{ title: 'Pickup Info' }}
            />
            <Stack.Screen
                name='PickupComplete'
                component={PickupCompleteScreen}
                options={{ title: 'Complete Pickup' }}
            />
        </Stack.Navigator>
    );
};

export default PickupScreen;

const styles = StyleSheet.create({});
