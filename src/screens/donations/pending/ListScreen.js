import {
    StyleSheet,
    View,
    ScrollView,
    RefreshControl,
    Modal,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Text, Chip, ListItem, Button, CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ListScreen = ({ route, navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [donations, setDonations] = useState([]);
    const [dateFilter, setDateFilter] = useState('newest');
    const [tempDateFilter, setTempDateFilter] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tempStatusFilter, setTempStatusFilter] = useState('all');
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const filterTranslations = {
        all: 'All',
        ready: 'Ready',
        notready: 'Not ready',
        newest: 'Newest',
        oldest: 'Oldest',
    };

    // grab all documents in donationForms collection from firebase
    const getPendingDonations = async () => {
        setRefreshing(true);

        let forms = [];
        let q;
        const donations = collection(db, 'pending');

        if (dateFilter === 'newest') {
            q = query(donations, orderBy('dateCreated', 'desc'));
        } else if (dateFilter === 'oldest') {
            q = query(donations, orderBy('dateCreated', 'asc'));
        }

        try {
            console.log('[Pending] Fetching "pending" donations', {
                dateFilter,
                statusFilter,
            });
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const ready =
                    data.pickup === undefined
                        ? false
                        : !(
                              data.pickup.driver === undefined ||
                              data.pickup.date === undefined
                          );
                if (statusFilter === 'all') {
                    forms.push({ id: doc.id, data: data });
                } else if (statusFilter === 'ready') {
                    if (ready) {
                        forms.push({ id: doc.id, data: data });
                    }
                } else if (statusFilter === 'notready') {
                    if (!ready) {
                        forms.push({ id: doc.id, data: data });
                    }
                }
            });
            setDonations(forms);
            console.log('[Pending] Loaded "pending" donations', {
                count: forms.length,
            });
        } catch (error) {
            console.error(
                '[Pending] Failed to read collection "pending"',
                {
                    dateFilter,
                    statusFilter,
                },
                error
            );
        }

        setRefreshing(false);
    };

    useEffect(() => {
        if (route.params !== undefined && route.params.refresh) {
            getPendingDonations();
        }
    }, [route.params]);

    useEffect(() => {
        getPendingDonations();
    }, [refreshKey]);

    return (
        <>
            <Modal
                visible={filterModalVisible}
                animationType='fade'
                transparent
            >
                <View style={styles.filterContainer}>
                    <View style={styles.filterBox}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Icon
                                name='close'
                                color='#626b79'
                                size={20}
                                onPress={() => {
                                    setTempDateFilter(dateFilter);
                                    setTempStatusFilter(statusFilter);
                                    setFilterModalVisible(false);
                                }}
                            />
                        </View>
                        <View>
                            <Text style={styles.filterHeading}>Date created</Text>
                            <CheckBox
                                title='Newest'
                                checked={tempDateFilter === 'newest'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempDateFilter('newest')}
                            />
                            <CheckBox
                                title='Oldest'
                                checked={tempDateFilter === 'oldest'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempDateFilter('oldest')}
                            />
                        </View>
                        <View
                            style={{
                                borderBottomColor: 'rgba(0, 0, 0, 0.15)',
                                borderBottomWidth: 1,
                                marginVertical: 20,
                            }}
                        />
                        <View>
                            <Text style={styles.filterHeading}>Estado</Text>
                            <CheckBox
                                title='Listo'
                                checked={tempStatusFilter === 'ready'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempStatusFilter('ready')}
                            />
                            <CheckBox
                                title='No Listo'
                                checked={tempStatusFilter === 'notready'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempStatusFilter('notready')}
                            />
                            <CheckBox
                                title='Todos'
                                checked={tempStatusFilter === 'all'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempStatusFilter('all')}
                            />
                        </View>
                        <View
                            style={{
                                borderBottomColor: 'rgba(0, 0, 0, 0.15)',
                                borderBottomWidth: 1,
                                marginVertical: 20,
                            }}
                        />
                        <View
                            style={{
                                alignItems: 'center',
                                marginBottom: 20,
                            }}
                        >
                            <Button
                                title='Filtrar'
                                onPress={() => {
                                    setStatusFilter(tempStatusFilter);
                                    setDateFilter(tempDateFilter);
                                    setFilterModalVisible(false);
                                    setRefreshKey((oldKey) => oldKey + 1);
                                }}
                                containerStyle={{ width: '92%' }}
                            />
                        </View>
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
                        title={filterTranslations[dateFilter]}
                        icon={{
                            name: 'calendar',
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
                        onPress={() => setFilterModalVisible(true)}
                    />
                    <Chip
                        title={filterTranslations[statusFilter]}
                        icon={{
                            name: 'view-list',
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
                        onPress={() => setFilterModalVisible(true)}
                    />
                </View>
            </View>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={getPendingDonations}
                    />
                }
            >
                {donations.length === 0 && !refreshing && (
                    <View style={styles.noDonations}>
                        <Text
                            style={{
                                fontWeight: '400',
                                fontSize: 24,
                                color: '#626b79',
                            }}
                        >
                            No new donations.
                        </Text>
                    </View>
                )}
                <View style={styles.donations}>
                    {donations.map((pd, idx) => {
                        const data = pd.data;
                        const id = pd.id;
                        const ready =
                            data.pickup === undefined
                                ? false
                                : !(
                                      data.pickup.driver === undefined ||
                                      data.pickup.date === undefined
                                  );
                        return (
                            <ListItem
                                key={id}
                                onPress={() => {
                                    navigation.push('View', {
                                        id: id,
                                        data: data,
                                    });
                                }}
                                bottomDivider
                            >
                                {ready ? (
                                    <Icon
                                        name='check-circle'
                                        size={30}
                                        color='green'
                                    />
                                ) : (
                                    <Icon
                                        name='clock'
                                        size={30}
                                        color='#dbdbdb'
                                    />
                                )}
                                <ListItem.Content>
                                    <ListItem.Title>
                                        {data.org !== undefined
                                            ? data.org.name
                                            : data.indiv.name.first +
                                              ' ' +
                                              data.indiv.name.last1 +
                                              (data.indiv.name.last2 === null
                                                  ? ''
                                                  : ` ${data.indiv.name.last2}`)}
                                    </ListItem.Title>
                                    <ListItem.Subtitle
                                        style={{ color: '#626b79' }}
                                    >
                                        {`Created: ${data.dateCreated
                                            .toDate()
                                            .toLocaleDateString('en-US')}`}
                                    </ListItem.Subtitle>
                                    <ListItem.Subtitle
                                        style={{ paddingTop: 5, width: '100%' }}
                                    >
                                        {data.client.address.formatted}
                                    </ListItem.Subtitle>
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

export default ListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 10,
        marginTop: 20,
    },
    filterContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 52, 52, 0.8)',
    },
    filterBox: {
        justifyContent: 'center',
        padding: 20,
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
    filterHeading: {
        marginLeft: 10,
        marginBottom: 5,
        fontSize: 18,
    },
    cardText: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    donations: {
        width: '100%',
    },
    noDonations: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionSheetButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 15,
        backgroundColor: 'white',
        padding: 15,
        margin: 15,
    },
    listItem: {
        width: '100%',
        flexDirection: 'column',
    },
    chips: {
        flex: 1,
        flexDirection: 'row',
    },
});
