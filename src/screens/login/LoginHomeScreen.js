import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './LoginScreen';
import ResetPasswordScreen from './ResetPasswordScreen';

const Stack = createNativeStackNavigator();

const LoginHomeScreen = () => {
    return (
        <Stack.Navigator initialRouteName='Login'>
            <Stack.Screen
                name='Login'
                component={LoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name='ResetPassword'
                component={ResetPasswordScreen}
                options={{ title: 'Change Password' }}
            />
        </Stack.Navigator>
    );
};

export default LoginHomeScreen;

const styles = StyleSheet.create({});
