import { StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { ListItem } from 'react-native-elements';
import { useSelector } from 'react-redux';

const SettingsScreen = ({ navigation }) => {
    const data = useSelector((state) => state.user.data);

    const handleSignout = () => {
        signOut(auth)
            .then(() => {
                // sign-out successful
            })
            .catch((error) => console.error(error.message));
    };

    return (
        <View>
            <ListItem
                onPress={() => {
                    navigation.push('EditAccountList');
                }}
                topDivider
                bottomDivider
            >
                <Icon name={'account-edit'} size={20} />
                <ListItem.Content>
                    <ListItem.Title>My Account</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron />
            </ListItem>
            {data.type === 'admin' ? (
                <ListItem
                    onPress={() => {
                        navigation.push('ManageAccountsList');
                    }}
                    bottomDivider
                >
                    <Icon name={'account-multiple'} size={20} />
                    <ListItem.Content>
                        <ListItem.Title>Admin Accounts</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Chevron />
                </ListItem>
            ) : null}
            {data.type === 'admin' ? (
                <ListItem
                    onPress={() => {
                        navigation.push('CreateAccount');
                    }}
                    bottomDivider
                >
                    <Icon name={'account-plus'} size={20} />
                    <ListItem.Content>
                        <ListItem.Title>Create Account</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Chevron />
                </ListItem>
            ) : null}
            <ListItem onPress={handleSignout} bottomDivider>
                <Icon name={'logout'} size={20} color={'red'} />
                <ListItem.Content>
                    <ListItem.Title style={{ color: 'red' }}>
                        Sign out
                    </ListItem.Title>
                </ListItem.Content>
            </ListItem>
        </View>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({});
