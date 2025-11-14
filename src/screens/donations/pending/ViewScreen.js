import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Modal,
    ActivityIndicator,
    Alert,
    TouchableWithoutFeedback,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { ListItem } from 'react-native-elements';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import LoadingModal from '../../../../components/LoadingModal';

const ViewScreen = ({ route, navigation }) => {
    const data = route.params.data;
    const id = route.params.id;

    const [driver, setDriver] = useState('');
    const [driverName, setDriverName] = useState('');
    const [pickupDate, setPickupDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);

    // date picker statesr
    const [dateOpen, setDateOpen] = useState(false);

    const acceptDonation = async () => {
        setLoading(true);

        const current = doc(db, 'pending', id);
        const currentSnap = await getDoc(current);
        const currentDonation = currentSnap.data();

        // copy donation over to accepted database
        await setDoc(doc(db, 'accepted', id), currentDonation);

        // delete donation from donationsForms database
        await deleteDoc(doc(db, 'pending', id));

        setLoading(false);

        // automatically navigate back to list view
        navigation.navigate('List', {
            refresh: true,
        });
    };

    const deleteDonation = async () => {
        /**
         * If we want to have another database to store deleted
         * donations for recovery purposes
         */
        // await setDoc(doc(db, 'deletedDonations', id), {});
        await deleteDoc(doc(db, 'pending', id));

        // automatically navigate back to list view
        navigation.navigate('List', {
            refresh: true,
        });
    };

    const getData = async () => {
        setLoading(true);

        const donationRef = doc(db, 'pending', id);
        const donationSnap = await getDoc(donationRef);
        const donation = donationSnap.data();

        if (donation.pickup === undefined) {
            setDriver('');
            setDriverName('Unassigned');
            setPickupDate(null);
        } else {
            if (donation.pickup.driver === undefined) {
                setDriver('');
                setDriverName('Unassigned');
            } else {
                setDriver(donation.pickup.driver);
                setDriverName(donation.pickup.driverName);
            }

            if (donation.pickup.date === undefined) {
                setPickupDate(null);
            } else {
                setPickupDate(donation.pickup.date.toDate());
            }
        }

        setTimeout(() => {
            setLoading(false);
        }, 500);
    };

    const handleDateConfirm = async (date) => {
        setPickupDate(date);

        const donationRef = doc(db, 'pending', id);

        await updateDoc(donationRef, {
            'pickup.date': date,
        });

        setDateOpen(false);
    };

    useEffect(() => {
        navigation.addListener('focus', () => {
            getData();
        });
    }, [navigation]);

    useEffect(() => {
        getData();
    }, []);

    return (
        <>
            <LoadingModal visible={loading} />
            <Modal
                visible={mapOpen}
                transparent
                animationType='fade'
                onRequestClose={() => setMapOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    onPressOut={() => setMapOpen(false)}
                >
                    <TouchableWithoutFeedback>
                        <MapView
                            style={styles.mapView}
                            initialRegion={{
                                latitude: data.client.address.lat,
                                longitude: data.client.address.lng,
                                latitudeDelta: 0.04,
                                longitudeDelta: 0.04,
                            }}
                        >
                            <Marker
                                coordinate={{
                                    latitude: data.client.address.lat,
                                    longitude: data.client.address.lng,
                                }}
                                title={
                                    data.client.type === 'org'
                                        ? data.org.name
                                        : `${data.indiv.name.first} ${
                                              data.indiv.name.last1
                                          }${
                                              data.indiv.name.last2 === null
                                                  ? ''
                                                  : ` ${data.indiv.name.last2}`
                                          }`
                                }
                            />
                        </MapView>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
            <ScrollView>
                <ListItem topDivider bottomDivider>
                    <Icon name='calendar' size={25} />
                    <ListItem.Content>
                        <ListItem.Title>Date created</ListItem.Title>
                        <ListItem.Subtitle>
                            {data.dateCreated.toDate().toLocaleString('en-US')}
                        </ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <ListItem bottomDivider>
                    <Icon name='certificate' size={25} />
                    <ListItem.Content>
                        <ListItem.Title>Certificate required?</ListItem.Title>
                        <ListItem.Subtitle>
                            {data.donation.taxDeduction ? 'Yes' : 'No'}
                        </ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <ListItem
                    bottomDivider
                    onPress={() => {
                        navigation.push('AssignDriver', {
                            id,
                            driver,
                        });
                    }}
                >
                    <Icon name='truck' size={25} />
                    <ListItem.Content>
                        <ListItem.Title
                            style={{
                                color: driver === '' ? '#df0b37' : 'black',
                            }}
                        >
                            Driver
                        </ListItem.Title>
                        <ListItem.Subtitle>{driverName}</ListItem.Subtitle>
                    </ListItem.Content>
                    <ListItem.Chevron />
                </ListItem>
                <ListItem
                    bottomDivider
                    style={{ marginBottom: 32 }}
                    onPress={() => {
                        setDateOpen(true);
                    }}
                >
                    <Icon name='calendar-today' size={25} />
                    <ListItem.Content>
                        <ListItem.Title
                            style={{
                                color:
                                    pickupDate === null ? '#df0b37' : 'black',
                            }}
                        >
                            Pickup date
                        </ListItem.Title>
                        <ListItem.Subtitle>
                            {pickupDate === null
                                ? 'Unassigned'
                                : pickupDate.toLocaleDateString('en-US')}
                        </ListItem.Subtitle>
                    </ListItem.Content>
                    <ListItem.Chevron />
                </ListItem>
                <ListItem topDivider bottomDivider>
                    <ListItem.Content>
                        <ListItem.Title>Type</ListItem.Title>
                        <ListItem.Subtitle>
                            {data.client.type === 'indiv'
                                ? 'Individual'
                                : 'Organization'}
                        </ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <ListItem bottomDivider>
                    <ListItem.Content>
                        <ListItem.Title>
                            {`Name of ${
                                data.client.type === 'indiv'
                                    ? 'Individual'
                                    : 'Organization'
                            }`}
                        </ListItem.Title>
                        <ListItem.Subtitle>
                            {data.client.type === 'org'
                                ? data.org.name
                                : `${data.indiv.name.first} ${
                                      data.indiv.name.last1
                                  }${
                                      data.indiv.name.last2 === null
                                          ? ''
                                          : ` ${data.indiv.name.last2}`
                                  }`}
                        </ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <ListItem
                    bottomDivider
                    onPress={() => {
                        setMapOpen(true);
                    }}
                >
                    <ListItem.Content>
                        <ListItem.Title>Address</ListItem.Title>
                        <ListItem.Subtitle>
                            {data.client.address.formatted}
                        </ListItem.Subtitle>
                    </ListItem.Content>
                    <ListItem.Chevron />
                </ListItem>

                <ListItem
                    topDivider
                    bottomDivider
                    style={{ marginTop: 32, marginBottom: 32 }}
                    onPress={() => {
                        Alert.alert(
                            'Confirm',
                            'Are you sure you want to delete this donation? This cannot be undone.',
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => {},
                                    style: 'cancel',
                                },
                                {
                                    text: 'Delete',
                                    onPress: () => {
                                        deleteDonation();
                                    },
                                },
                            ]
                        );
                    }}
                >
                    <Icon name='delete' color='#df0b37' size={25} />
                    <ListItem.Content>
                        <ListItem.Title style={{ color: '#df0b37' }}>
                            Delete
                        </ListItem.Title>
                    </ListItem.Content>
                </ListItem>
            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={() => {
                        Alert.alert(
                            'Confirm',
                            'Are you sure you want to send this donation?',
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => {},
                                    style: 'cancel',
                                },
                                {
                                    text: 'Send',
                                    onPress: () => {
                                        acceptDonation();
                                    },
                                },
                            ]
                        );
                    }}
                    style={
                        loading || driver === '' || pickupDate === null
                            ? styles.disabledButton
                            : styles.acceptButton
                    }
                    disabled={loading || driver === '' || pickupDate === null}
                >
                    {!loading ? (
                        <Text style={styles.acceptButtonText}>
                            Send to driver
                        </Text>
                    ) : (
                        <ActivityIndicator color='white' />
                    )}
                </TouchableOpacity>
            </View>
            <DateTimePicker
                isVisible={dateOpen}
                mode='date'
                minimumDate={new Date()}
                onConfirm={handleDateConfirm}
                onCancel={() => setDateOpen(false)}
                isDarkModeEnabled={false}
            />
        </>
    );
};

export default ViewScreen;

const styles = StyleSheet.create({
    container: {
        height: '100%',
    },
    buttonsContainer: {
        width: '100%',
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    button: {
        backgroundColor: '#0c4484',
        width: '40%',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 52, 52, 0.3)',
    },
    modalView: {
        width: '90%',
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
    mapView: {
        width: '80%',
        height: '60%',
        borderRadius: 10,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    acceptButton: {
        backgroundColor: '#0074cb',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: 'rgba(0, 116, 203, 0.2)',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButtonText: {
        color: 'white',
        fontSize: 20,
    },
});
