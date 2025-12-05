import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/config';
import {
    getDocs,
    query,
    collection,
    where,
    Timestamp,
} from 'firebase/firestore';
import { ListItem } from 'react-native-elements';
import { useSelector } from 'react-redux';
import { batchPickups, formatPickupTime } from '../../../services/batchingService';
import { BatchIndicator } from '../../../components/BatchIndicator';
import { BatchSummaryHeader } from '../../../components/BatchSummaryHeader';

const ListScreen = ({ route, navigation }) => {
    const id = useSelector((state) => state.user.id);

    const [refreshing, setRefreshing] = useState(false);
    const [pickups, setPickups] = useState([]);
    const [batchedPickups, setBatchedPickups] = useState([]);

    const getAssignedPickups = async () => {
        setRefreshing(true);
        let tempPickups = [];
        let q;

        let today = new Date();
        let start = new Date(today.setHours(0, 0, 0, 0));
        let end = new Date(today.setHours(23, 59, 59, 999));
        let dateStart = Timestamp.fromDate(start);
        let dateEnd = Timestamp.fromDate(end);

        const accepted = collection(db, 'accepted');
        q = query(
            accepted,
            where('pickup.driver', '==', id),
            where('pickup.date', '>=', dateStart),
            where('pickup.date', '<=', dateEnd)
        );

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                tempPickups.push({ id: doc.id, ...doc.data() });
            });
            setPickups(tempPickups);

            // Apply smart batching
            const batched = batchPickups(tempPickups);
            setBatchedPickups(batched);
        } catch (error) {
            console.error(error.message);
        }
        setRefreshing(false);
    };

    const formatName = (indiv) => {
        return `${indiv.name.first} ${indiv.name.last1}${
            indiv.name.last2 !== null ? ` ${indiv.name.last2}` : ''
        }`;
    };

    useEffect(() => {
        if (route.params !== undefined && route.params.refresh) {
            getAssignedPickups();
        }
    }, [route.params]);

    useEffect(() => {
        getAssignedPickups();
    }, []);

    return (
        <View style={styles.container}>
            {/* Batch Summary Header */}
            {batchedPickups.length > 0 && (
                <BatchSummaryHeader pickups={batchedPickups} />
            )}

            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={getAssignedPickups}
                    />
                }
            >
                {batchedPickups.length === 0 && (
                    <View style={styles.noPickups}>
                        <Text
                            style={{
                                fontWeight: '400',
                                fontSize: 24,
                                color: '#626b79',
                            }}
                        >
                            Sin nuevas recogidas.
                        </Text>
                    </View>
                )}
                {batchedPickups.map((pickup, idx) => {
                    const id = pickup.id;
                    const name =
                        pickup.indiv !== undefined
                            ? formatName(pickup.indiv)
                            : pickup.org?.name;
                    const address = pickup.client?.address || pickup.location?.address;
                    const pickupTime = formatPickupTime(pickup);

                    return (
                        <ListItem
                            key={id}
                            onPress={() => {
                                // NEW V2: Multi-item screen with pricing
                                navigation.push('PickupCompleteV2', {
                                    id,
                                    data: pickup,
                                });
                            }}
                            topDivider={idx === 0}
                            bottomDivider
                            containerStyle={[
                                styles.listItem,
                                { borderLeftColor: pickup.batchColor, borderLeftWidth: 6 }
                            ]}
                        >
                            <ListItem.Content>
                                {/* Batch Indicator with Time */}
                                <View style={styles.headerRow}>
                                    <BatchIndicator
                                        color={pickup.batchColor}
                                        zipCode={pickup.batchZipCode}
                                        index={pickup.batchIndex}
                                        total={pickup.batchSize}
                                        size="small"
                                    />
                                    <Text style={styles.timeText}>{pickupTime}</Text>
                                </View>

                                {/* Donor Name */}
                                <ListItem.Title style={styles.titleText}>
                                    {name}
                                </ListItem.Title>

                                {/* Address */}
                                <ListItem.Subtitle style={styles.addressText}>
                                    {address?.formatted || 'Address not available'}
                                </ListItem.Subtitle>
                            </ListItem.Content>
                            <ListItem.Chevron />
                        </ListItem>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default ListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    noPickups: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItem: {
        backgroundColor: '#fff',
        paddingVertical: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    titleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: '#666',
    },
});
