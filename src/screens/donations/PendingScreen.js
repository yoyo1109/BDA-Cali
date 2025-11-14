import { StyleSheet } from 'react-native';
import React from 'react';
import ViewScreen from './pending/ViewScreen';
import ListScreen from './pending/ListScreen';
import AssignDriverScreen from './pending/AssignDriverScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const PendingScreen = ({ navigation }) => {
    return (
        <Stack.Navigator initialRouteName='List'>
            <Stack.Screen
                name='List'
                component={ListScreen}
                options={{ title: 'Pending' }}
            />
            <Stack.Screen
                name='View'
                component={ViewScreen}
                options={{
                    title: 'Donation Info',
                }}
            />
            <Stack.Screen
                name='AssignDriver'
                component={AssignDriverScreen}
                options={{ title: 'Assign Driver' }}
            />
        </Stack.Navigator>
    );
};

export default PendingScreen;

const styles = StyleSheet.create({});
