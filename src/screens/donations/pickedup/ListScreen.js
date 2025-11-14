import {
    StyleSheet,
    View,
    ScrollView,
    RefreshControl,
    Modal,
    TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/config';
import {
    collection,
    getDocs,
    orderBy,
    query,
    Timestamp,
    where,
} from 'firebase/firestore';
import { Text, Chip, ListItem, Button, CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { useSelector } from 'react-redux';

const ListScreen = ({ route, navigation }) => {
    const drivers = useSelector((state) => state.user.drivers);
    const [refreshing, setRefreshing] = useState(false);
    const [donations, setDonations] = useState([]);

    // driver filter states
    const [driverFilter, setDriverFilter] = useState(null);
    const [driverFilterName, setDriverFilterName] = useState('');
    const [driverModal, setDriverModal] = useState(false);

    // date filter states
    const [dateFilter, setDateFilter] = useState(new Date());
    const [dateModal, setDateModal] = useState(false);
    const [dateSelectOpen, setDateSelectOpen] = useState(false);
    const [formattedDate, setFormattedDate] = useState(
        new Date().toLocaleDateString('en-US')
    );

    // grab all documents in donationForms collection from firebase
    const getPickedupDonations = async (id = null, date = null) => {
        setRefreshing(true);
        let forms = [];
        let q, dateStart, dateEnd;
        let specificDateQuery = false;
        const donations = collection(db, 'pickedup');

        if (date !== null) {
            specificDateQuery = true;
            date = date === null ? new Date() : date;
            let start = new Date(date.setHours(0, 0, 0, 0));
            let end = new Date(date.setHours(23, 59, 59, 999));
            dateStart = Timestamp.fromDate(start);
            dateEnd = Timestamp.fromDate(end);
        }

        if (id === null && !specificDateQuery) {
            q = query(donations, orderBy('pickup.date'));
        } else if (id !== null && !specificDateQuery) {
            q = query(
                donations,
                orderBy('pickup.date'),
                where('pickup.driver', '==', id)
            );
        } else if (id === null && specificDateQuery) {
            q = query(
                donations,
                orderBy('pickup.date'),
                where('pickup.date', '>=', dateStart),
                where('pickup.date', '<=', dateEnd)
            );
        } else {
            q = query(
                donations,
                orderBy('pickup.date'),
                where('pickup.driver', '==', id),
                where('pickup.date', '>=', dateStart),
                where('pickup.date', '<=', dateEnd)
            );
        }

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                forms.push({
                    id: doc.id,
                    data: data,
                });
            });
            setDonations(forms);
        } catch (error) {
            console.error(error);
        }

        setRefreshing(false);
    };

    useEffect(() => {
        if (route.params !== undefined && route.params.refresh) {
            getPickedupDonations(driverFilter, dateFilter);
        }
    }, [route.params]);

    useEffect(() => {
        getPickedupDonations(driverFilter, dateFilter);
    }, []);

    const SelectDriverModal = () => {
        return (
            <Modal visible={driverModal}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Icon
                                name='close'
                                color='#626b79'
                                size={30}
                                onPress={() => {
                                    setDriverModal(false);
                                }}
                            />
                        </View>
                        <Text
                            style={{
                                fontSize: 24,
                                fontWeight: '500',
                                marginBottom: 24,
                            }}
                        >
                            Select a driver
                        </Text>
                        {drivers.length === 0 ? (
                            <Text>No drivers available.</Text>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#0074cb',
                                        borderRadius: 5,
                                        marginBottom: 24,
                                    }}
                                    onPress={() => {
                                        setDriverFilter(null);
                                        setDriverModal(false);
                                        getPickedupDonations(null, dateFilter);
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 18,
                                            color: 'white',
                                            margin: 10,
                                        }}
                                    >
                                        Show all drivers
                                    </Text>
                                </TouchableOpacity>
                                <ScrollView>
                                    {drivers.map((driver, idx) => {
                                        const data = driver.data;
                                        const id = driver.uid;
                                        const name = `${data.name.first} ${
                                            data.name.last1
                                        }${
                                            data.name.last2 === null
                                                ? ''
                                                : ` ${data.name.last2}`
                                        }`;
                                        const plate = data.plate;

                                        return (
                                            <ListItem
                                                topDivider={idx === 0}
                                                bottomDivider
                                                key={id}
                                                onPress={() => {
                                                    setDriverFilter(id);
                                                    setDriverFilterName(name);
                                                    getPickedupDonations(
                                                        id,
                                                        dateFilter
                                                    );
                                                    setDriverModal(false);
                                                }}
                                            >
                                                <ListItem.Content>
                                                    <ListItem.Title>
                                                        {`${plate} (${name})`}
                                                    </ListItem.Title>
                                                </ListItem.Content>
                                            </ListItem>
                                        );
                                    })}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    const DatePickerModal = () => {
        return (
            <Modal visible={dateModal}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Icon
                                name='close'
                                color='#626b79'
                                size={30}
                                onPress={() => {
                                    setDateModal(false);
                                }}
                            />
                        </View>
                        <Text
                            style={{
                                fontSize: 24,
                                fontWeight: '500',
                                marginBottom: 24,
                            }}
                        >
                            Pickup date
                        </Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#0074cb',
                                borderRadius: 5,
                                marginBottom: 24,
                            }}
                            onPress={() => {
                                setDateFilter(null);
                                setDateModal(false);
                                getPickedupDonations(driverFilter, null);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 18,
                                    color: 'white',
                                    margin: 10,
                                }}
                            >
                                Show all dates
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#6bb7fb',
                                borderRadius: 5,
                                marginBottom: 24,
                            }}
                            onPress={() => {
                                setDateModal(false);
                                setDateSelectOpen(true);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 18,
                                    color: 'white',
                                    margin: 10,
                                }}
                            >
                                Select specific date
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <>
            <SelectDriverModal />
            <DatePickerModal />
            <DateTimePicker
                isVisible={dateSelectOpen}
                mode='date'
                onConfirm={(date) => {
                    setDateSelectOpen(false);
                    setDateFilter(date);
                    setFormattedDate(date.toLocaleDateString('en-US'));
                    getPickedupDonations(driverFilter, date);
                }}
                onCancel={() => setDateSelectOpen(false)}
                isDarkModeEnabled={false}
            />
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
                        title={
                            driverFilter === null
                                ? 'All drivers'
                                : driverFilterName
                        }
                        icon={{
                            name: 'truck',
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
                        onPress={() => setDriverModal(true)}
                    />
                    <Chip
                        title={
                            dateFilter === null ? 'All dates' : formattedDate
                        }
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
                        onPress={() => setDateModal(true)}
                    />
                </View>
            </View>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() =>
                            getPickedupDonations(driverFilter, dateFilter)
                        }
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
                                textAlign: 'center',
                                width: '80%',
                            }}
                        >
                            {driverFilter === null && dateFilter === null
                                ? 'No donations have been picked up.'
                                : driverFilter === null && dateFilter !== null
                                ? `No donations were picked up on ${formattedDate}.`
                                : driverFilter !== null && dateFilter === null
                                ? `${driverFilterName} has no picked up donations.`
                                : `${driverFilterName} has no picked up donations on ${formattedDate}.`}
                        </Text>
                    </View>
                )}
                <View style={styles.donations}>
                    {donations.map((pd, idx) => {
                        const data = pd.data;
                        const id = pd.id;
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
                                    <ListItem.Content
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            width: '100%',
                                            marginTop: 10,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                width: '50%',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Icon name='truck' size={25} />
                                            <View style={{ paddingLeft: 10 }}>
                                                <Text
                                                    style={{
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Driver:
                                                </Text>
                                                <Text
                                                    style={{ color: '#626b79' }}
                                                >
                                                    {`${data.pickup.driverPlate}\n(${data.pickup.driverName})`}
                                                </Text>
                                            </View>
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                width: '50%',
                                                alignItems: 'center',
                                                marginLeft: 12,
                                            }}
                                        >
                                            <Icon name='calendar' size={25} />
                                            <View style={{ paddingLeft: 10 }}>
                                                <Text
                                                    style={{
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Date:
                                                </Text>
                                                <Text
                                                    style={{ color: '#626b79' }}
                                                >
                                                    {data.pickup.date
                                                        .toDate()
                                                        .toLocaleDateString(
                                                            'en-US'
                                                        )}
                                                </Text>
                                            </View>
                                        </View>
                                    </ListItem.Content>
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 48,
        marginBottom: 32,
        marginHorizontal: 32,
    },
    modalBox: {
        width: '100%',
        height: '100%',
    },
});
