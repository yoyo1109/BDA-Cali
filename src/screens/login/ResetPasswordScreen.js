import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    KeyboardAvoidingView,
    TextInput,
    Alert,
} from 'react-native';
import React, { useState } from 'react';
import { auth } from '../../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ResetPasswordScreen = ({ route, navigation }) => {
    const [email, setEmail] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalText, setModalText] = useState('');

    const errorModal = (error) => {
        // if (error === 'auth/wrong-password') {
        //     setModalText('Incorrect password. Please try again.');
        // } else if (error === 'auth/user-not-found') {
        //     setModalText('Email could not be found.');
        // } else if (error === 'auth/invalid-email') {
        //     setModalText('Email is invalid.');
        // } else if (error === 'auth/internal-error') {
        //     setModalText('Something went wrong. Please try again.');
        // } else if (error === 'auth/too-many-requests') {
        //     setModalText('Too many attempts. Please try again later.');
        // } else {
        //     setModalText(error);
        // }
        setModalText(error);
        setModalVisible(true);
        setTimeout(() => {
            setModalVisible(false);
        }, 3 * 1000);
    };

    const handleEmailSubmit = () => {
        sendPasswordResetEmail(auth, email)
            .then(() => {
                // Password reset email sent
                Alert.alert(
                    'Email sent',
                    'Please check your email for instructions to reset your password.'
                );
                navigation.goBack();
            })
            .catch((error) => {
                errorModal(error.code);
            });
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior='padding'>
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
                <View style={{ paddingBottom: 30 }}>
                    <Text style={styles.heading}>Reset your password</Text>
                    <Text style={{ color: 'gray' }}>
                        Enter the email tied to your account and we will send
                        your password reset instructions.
                    </Text>
                </View>
                <Text>Email</Text>
                <TextInput
                    placeholder='name@foodbank.com'
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                    style={styles.input}
                    autoCapitalize='none'
                    autoCorrect={false}
                />
                <TouchableOpacity
                    onPress={handleEmailSubmit}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Send reset link</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 30,
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
        marginBottom: 40,
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
    heading: {
        fontSize: 20,
        fontWeight: '700',
        paddingBottom: 15,
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 15,
        marginTop: 10,
    },
    button: {
        backgroundColor: '#0c4484',
        width: '100%',
        marginTop: 30,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 16,
    },
});
