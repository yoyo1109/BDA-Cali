import {
    StyleSheet,
    Text,
    View,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
} from 'react-native';
import React, { useState } from 'react';
import { getAuth, updateEmail } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../../../firebase/config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ChangeEmailScreen = ({ route, navigation }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [modalText, setModalText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const update = () => {
        setIsLoading(true);
        updateEmail(auth.currentUser, email)
            .then(() => {
                set(ref(db, 'users/' + auth.currentUser.uid), {
                    email: email,
                });
                setEmail('');
                setSuccess(true);
                setIsLoading(false);
            })
            .catch((error) => {
                setIsLoading(false);
                setSuccess(false);
                if (error.code === 'auth/requires-recent-login') {
                    // we need a screen to show when the user needs to renew their credentials
                    // promptForCredentials();
                    setModalText('You must sign in again.');
                } else {
                    setModalText(error.code);
                }
                setModalVisible(true);
                setTimeout(() => {
                    setModalVisible(false);
                }, 3000);
            });
    };

    const handleButton = () => {
        if (email === '') return null;

        Alert.alert(
            'Confirm',
            'Are you sure you want to change your email to ' + email + '?',
            [
                {
                    text: 'Cancel',
                    onPress: () => {},
                    style: 'cancel',
                },
                {
                    text: 'Update',
                    onPress: () => {
                        update();
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Modal
                animationType='fade'
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Icon
                            name='alert-circle-outline'
                            size={30}
                            color={'#FF6961'}
                        />
                        <Text style={{ marginLeft: 10 }}>{modalText}</Text>
                    </View>
                </View>
            </Modal>
            <View style={{ width: '80%' }}>
                <Text style={styles.heading}>Change email</Text>
                <Text style={{ color: 'gray' }}>
                    If you'd like to change your email, enter a new one below.
                </Text>
                <TextInput
                    placeholder='Enter email here...'
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize='none'
                />
                {success ? (
                    <Text style={styles.success}>Email updated successfully!</Text>
                ) : null}
                <TouchableOpacity
                    onPress={handleButton}
                    style={styles.button}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator />
                    ) : (
                        <Text style={styles.buttonText}>Update</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ChangeEmailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 30,
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 15,
        marginTop: 15,
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#0074cb',
        width: '100%',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 16,
    },
    heading: {
        fontSize: 20,
        fontWeight: '700',
        paddingBottom: 15,
    },
    success: {
        color: 'green',
        marginBottom: 15,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalView: {
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: 5,
        padding: 20,
        marginBottom: 100,
        width: '80%',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});
