import {
    StyleSheet,
    View,
    ScrollView,
    RefreshControl,
    Modal,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import { db } from '../../../firebase/config';
import React, { useState, useEffect, useRef } from 'react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { ListItem, Chip } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ManageAccountsListScreen = ({ route, navigation }) => {
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const [typeFilter, setTypeFilter] = useState(false);
    const [type, setType] = useState(null);

    const mounted = useRef(true);

    const types = {
        admin: 'Administrator',
        warehouse: 'Warehouse',
        driver: 'Driver',
    };

    const getUsers = async () => {
        setRefreshing(true);
        let tempUsers = [];

        const users = collection(db, 'users');
        const q = query(users, orderBy('type'));

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                tempUsers.push({ uid: doc.id, data: doc.data() });
            });
            setUsers(tempUsers);
        } catch (error) {
            console.error(error);
        }

        if (mounted.current) {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (route.params !== undefined && route.params.refresh) {
            getUsers();
        }
    }, [route.params]);

    useEffect(() => {
        getUsers();

        return () => {
            mounted.current = false;
        };
    }, []);

    return (
        <>
            <Modal
                visible={typeFilter}
                animationType='fade'
                transparent
                onRequestClose={() => setTypeFilter(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Icon
                                name='close'
                                color='#626b79'
                                size={20}
                                onPress={() => {
                                    setTypeFilter(false);
                                }}
                            />
                        </View>
                        <Text>Hello world!</Text>
                    </View>
                </View>
            </Modal>
            <View
                style={{
                    backgroundColor: 'white',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingRight: 10,
                    borderTopColor: 'rgba(0, 0, 0, 0.15)',
                    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        marginVertical: 10,
                    }}
                >
                    <Chip
                        title={type === null ? 'All types' : types[type]}
                        icon={{
                            name: 'account-circle',
                            type: 'material-community',
                            size: 20,
                            color: 'white',
                        }}
                        containerStyle={{
                            paddingLeft: 10,
                        }}
                        buttonStyle={{
                            backgroundColor: '#0074cb',
                        }}
                        onPress={() => {
                            setTypeFilter(true);
                        }}
                    />
                </View>
            </View>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={getUsers}
                    />
                }
            >
                <View>
                    {users.map((u, i) => {
                        return (
                            <ListItem
                                key={u.uid}
                                onPress={() => {
                                    navigation.navigate('ManageAccountsView', {
                                        id: u.uid,
                                        data: u.data,
                                    });
                                }}
                                bottomDivider
                            >
                                <ListItem.Content>
                                    <ListItem.Title>
                                        {u.data.name.first} {u.data.name.last1}
                                        {u.data.name.last2 !== null
                                            ? ' ' + u.data.name.last2
                                            : ''}
                                    </ListItem.Title>
                                    <Chip
                                        containerStyle={{ marginTop: 12 }}
                                        title={types[u.data.type]}
                                    />
                                </ListItem.Content>
                                <ListItem.Chevron />
                            </ListItem>
                        );
                    })}
                </View>
            </ScrollView>
        </>
    );
};

export default ManageAccountsListScreen;

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 52, 52, 0.3)',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});
