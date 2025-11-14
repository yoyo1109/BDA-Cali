import {
    StyleSheet,
    Text,
    View,
    Platform,
    ActionSheetIOS,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { db, auth } from '../../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { setDoc, doc } from 'firebase/firestore';

const CreateAccountScreen = () => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName1, setLastName1] = useState('');
    const [lastName2, setLastName2] = useState('');
    const [accountType, setAccountType] = useState('driver');
    const [isLoading, setIsLoading] = useState(false);

    const types = {
        admin: 'Administrator',
        warehouse: 'Warehouse',
        driver: 'Driver',
    };

    const generatePassword = () => {
        let p = firstName.substring(0, 3);
        p += lastName1.substring(0, 4);
        if (lastName2 !== '') {
            p += lastName2.substring(0, 4);
        }
        // p += Math.floor(Math.random() * (9999 - 1000) + 1000);
        return p;
    };

    const inputsValid = () => {
        if (firstName === '' || email === '') {
            alert('Please fill out all required fields.');
            setIsLoading(false);
            return false;
        }
        return true;
    };

    const createAccount = () => {
        setIsLoading(true);
        if (inputsValid()) {
            const pass = generatePassword();
            createUserWithEmailAndPassword(auth, email, pass)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        name: {
                            first: firstName,
                            last1: lastName1,
                            last2: lastName2 === '' ? null : lastName2,
                        },
                        type: accountType,
                    });
                    setIsLoading(false);
                    Alert.alert(
                        'User created!',
                        `Type: ${accountType}\nEmail: ${user.email}\nPassword: ${pass}`
                    );
                    clearFields();
                    // auth.currentUser gets changed to the user that was just created here
                    // we have to make sure that the user stays the same after creation
                })
                .catch((error) => {
                    let errText = '';
                    if (error.code === 'auth/email-already-in-use') {
                        errText += 'An account with this email already exists.';
                    } else if (error.code === 'auth/internal-error') {
                        errText += 'Something went wrong, please try again.';
                    } else {
                        errText += error.code;
                    }
                    Alert.alert('Error', errText);
                    setIsLoading(false);
                });
        }
    };

    const clearFields = () => {
        setFirstName('');
        setLastName1('');
        setLastName2('');
        setEmail('');
    };

    function CreateButton() {
        if (isLoading) {
            return <ActivityIndicator color='white' />;
        } else {
            return <Text style={styles.buttonText}>Create</Text>;
        }
    }

    function Dropdown() {
        const platform = Platform.OS;

        if (platform === 'ios') {
            const options = ['Cancel', types.admin, types.warehouse, types.driver];
            const values = ['admin', 'warehouse', 'driver'];
            return (
                <TouchableOpacity
                    style={styles.actionSheetButton}
                    onPress={() => {
                        ActionSheetIOS.showActionSheetWithOptions(
                            { options, cancelButtonIndex: 0 },
                            (buttonIndex) => {
                                if (buttonIndex > 0) {
                                    setAccountType(values[buttonIndex - 1]);
                                }
                            }
                        );
                    }}
                >
                    <Text>{types[accountType]}</Text>
                    <Icon name='menu-down' size={20} />
                </TouchableOpacity>
            );
        }
        return null;
    }

    return (
        <KeyboardAwareScrollView>
            <View style={styles.container} behavior='padding'>
                <View style={styles.section}>
                    <Text style={styles.heading}>Account Type</Text>
                    <Dropdown />
                    {/* Picker is here because Android was glitchy when conditionally
                        rendering Picker in Dropdown(), so if platform is Android, we
                        return null */}
                    <Picker
                        selectedValue={accountType}
                        onValueChange={(itemValue, itemIndex) => {
                            setAccountType(itemValue);
                        }}
                        style={Platform.OS === 'ios' ? { display: 'none' } : {}}
                    >
                        <Picker.Item label='Administrator' value='admin' />
                        <Picker.Item label='Warehouse' value='warehouse' />
                        <Picker.Item label='Driver' value='driver' />
                    </Picker>
                </View>
                <View style={styles.section}>
                    <Text style={styles.heading}>Name</Text>
                    <Text>
                        First name <Text style={{ color: 'red' }}>*</Text>
                    </Text>
                    <TextInput
                        placeholder='Adrian'
                        value={firstName}
                        onChangeText={setFirstName}
                        style={styles.input}
                    />
                    <Text>
                        First last name <Text style={{ color: 'red' }}>*</Text>
                    </Text>
                    <TextInput
                        placeholder='Ramirez'
                        value={lastName1}
                        onChangeText={setLastName1}
                        style={styles.input}
                    />
                    <Text>Second last name</Text>
                    <TextInput
                        placeholder='Lopez'
                        value={lastName2}
                        onChangeText={setLastName2}
                        style={styles.input}
                    />
                </View>
                <View style={styles.section}>
                    <Text style={styles.heading}>
                        Email <Text style={{ color: 'red' }}>*</Text>
                    </Text>
                    <TextInput
                        placeholder='name@bdacali.com'
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        autoCapitalize='none'
                    />
                </View>
                <View style={styles.passwordAdvisory}>
                    <Text style={styles.passwordAdvisoryText}>
                        A password is automatically generated using the first
                        three letters of the first name and the first four
                        letters of the last names.
                        {'\n\n'}
                        Example:
                        {'\n\n'}
                        Name: Adrian Ramirez Lopez
                        {'\n'}
                        Password: AdrRamiLope
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={createAccount}
                    style={styles.button}
                    disabled={isLoading}
                >
                    <CreateButton />
                </TouchableOpacity>
            </View>
        </KeyboardAwareScrollView>
    );
};

export default CreateAccountScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingBottom: 30,
    },
    actionSheetButton: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 15,
        backgroundColor: 'white',
        padding: 15,
    },
    section: {
        width: '80%',
        marginTop: 20,
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
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#0074cb',
        width: '80%',
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
    passwordAdvisory: {
        width: '80%',
        paddingTop: 20,
    },
    passwordAdvisoryText: {
        textAlign: 'center',
        color: 'darkgray',
    },
});
