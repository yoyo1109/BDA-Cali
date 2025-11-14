import { StyleSheet, Text, View, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import LoadingModal from '../../../../components/LoadingModal';
import { ListItem } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ViewScreen = ({ route, navigation }) => {
    const data = route.params.data;
    const id = route.params.id;
    const pickupDate = data.pickup.date.toDate().toLocaleDateString('en-US');

    const [loading, setLoading] = useState(false);

    const moveBack = async () => {
        setLoading(true);

        const current = doc(db, 'accepted', id);
        const currentSnap = await getDoc(current);
        const currentDonation = currentSnap.data();

        await setDoc(doc(db, 'pending', id), currentDonation);
        await deleteDoc(doc(db, 'accepted', id));

        setLoading(false);
        navigation.navigate('List', {
            refresh: true,
        });
    };

    return (
        <View>
            <LoadingModal visible={loading} />
            <ScrollView style={{ height: '100%' }}>
                <ListItem topDivider bottomDivider>
                    <Icon name='truck' size={25} />
                    <ListItem.Content>
                        <ListItem.Title>Driver</ListItem.Title>
                        <ListItem.Subtitle>
                            {data.pickup.driverName}
                        </ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <ListItem bottomDivider>
                    <Icon name='calendar-today' size={25} />
                    <ListItem.Content>
                        <ListItem.Title>Pickup date</ListItem.Title>
                        <ListItem.Subtitle>{pickupDate}</ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <ListItem
                    topDivider
                    bottomDivider
                    style={{ marginTop: 32 }}
                    onPress={() => {
                        Alert.alert(
                            'Confirm',
                            'Are you sure you want to move this donation back to pending?',
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => {},
                                    style: 'cancel',
                                },
                                {
                                    text: 'Move',
                                    onPress: () => {
                                        moveBack();
                                    },
                                },
                            ]
                        );
                    }}
                >
                    <Icon name='arrow-left' size={25} color='#0074cb' />
                    <ListItem.Content>
                        <ListItem.Title style={{ color: '#0074cb' }}>
                            Move back to pending
                        </ListItem.Title>
                    </ListItem.Content>
                </ListItem>
                <Text
                    style={{
                        paddingTop: 32,
                        textAlign: 'center',
                        marginHorizontal: 32,
                        color: '#626b79',
                    }}
                >
                    To make changes, move the donation back to pending first.
                </Text>
            </ScrollView>
        </View>
    );
};

export default ViewScreen;

const styles = StyleSheet.create({});
