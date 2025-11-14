import { StyleSheet, Text, View } from 'react-native';
import SettingsListScreen from './SettingsListScreen';
import ManageAccountsListScreen from './admin/ManageAccountsListScreen';
import ManageAccountsViewScreen from './admin/ManageAccountsViewScreen';
import CreateAccountScreen from './admin/CreateAccountScreen';
import LanguageScreen from './LanguageScreen';
import EditAccountListScreen from './editAccount/EditAccountListScreen';
import ChangePasswordScreen from './editAccount/ChangePasswordScreen';
import ChangeEmailScreen from './editAccount/ChangeEmailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

const Stack = createNativeStackNavigator();

const SettingsScreen = () => {
    return (
        <Stack.Navigator initialRouteName='SettingsList'>
            <Stack.Screen
                name='SettingsList'
                component={SettingsListScreen}
                options={{ title: 'Settings' }}
            />
            <Stack.Screen
                name='EditAccountList'
                component={EditAccountListScreen}
                options={{ title: 'My Account' }}
            />
            <Stack.Screen
                name='ChangeEmail'
                component={ChangeEmailScreen}
                options={{ title: 'Change Email' }}
            />
            <Stack.Screen
                name='ChangePassword'
                component={ChangePasswordScreen}
                options={{ title: 'Change Password' }}
            />
            <Stack.Screen
                name='ManageAccountsList'
                component={ManageAccountsListScreen}
                options={{ title: 'Admin Accounts' }}
            />
            <Stack.Screen
                name='ManageAccountsView'
                component={ManageAccountsViewScreen}
                options={{ title: 'Edit Account' }}
            />
            <Stack.Screen
                name='CreateAccount'
                component={CreateAccountScreen}
                options={{ title: 'Create Account' }}
            />
            <Stack.Screen
                name='Language'
                component={LanguageScreen}
                options={{ title: 'Language' }}
            />
        </Stack.Navigator>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({});
