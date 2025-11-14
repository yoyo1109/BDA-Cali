import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { ListItem } from 'react-native-elements';
import { useSelector } from 'react-redux';

const EditAccountListScreen = ({ navigation }) => {
    const data = useSelector((state) => state.user.data);

    const types = {
        admin: 'Administrator',
        warehouse: 'Warehouse',
        driver: 'Driver',
    };

    return (
        <View>
            <ListItem topDivider bottomDivider>
                <ListItem.Content>
                    <ListItem.Title>Name</ListItem.Title>
                    <ListItem.Subtitle right>
                        {data.name.first +
                            ' ' +
                            data.name.last1 +
                            (data.name.last2 !== null
                                ? ' ' + data.name.last2
                                : '')}
                    </ListItem.Subtitle>
                </ListItem.Content>
            </ListItem>
            <ListItem bottomDivider>
                <ListItem.Content>
                    <ListItem.Title>Account Type</ListItem.Title>
                    <ListItem.Subtitle right>
                        {types[data.type]}
                    </ListItem.Subtitle>
                </ListItem.Content>
            </ListItem>
            <ListItem
                onPress={() => {
                    navigation.push('ChangeEmail');
                }}
                bottomDivider
            >
                <ListItem.Content>
                    <ListItem.Title>Email</ListItem.Title>
                    <ListItem.Subtitle right>{data.email}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
            </ListItem>
            <ListItem
                onPress={() => {
                    navigation.push('ChangePassword');
                }}
                bottomDivider
            >
                <ListItem.Content>
                    <ListItem.Title>Change password</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron />
            </ListItem>
        </View>
    );
};

export default EditAccountListScreen;

const styles = StyleSheet.create({});
