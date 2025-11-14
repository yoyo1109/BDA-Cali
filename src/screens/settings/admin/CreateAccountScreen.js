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
import supabase from '../../../supabase/client';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const CreateAccountScreen = () => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName1, setLastName1] = useState('');
    const [lastName2, setLastName2] = useState('');
    const [accountType, setAccountType] = useState('driver');
    const [isLoading, setIsLoading] = useState(false);

    const types = {
        admin: 'Administrador',
        warehouse: 'Depósito',
        driver: 'Conductor',
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

    const createAccount = async () => {
        if (isLoading) {
            return;
        }
        setIsLoading(true);

        if (!inputsValid()) {
            return;
        }

        const pass = generatePassword();

        try {
            const {
                data: { session: previousSession },
            } = await supabase.auth.getSession();

            const { data, error } = await supabase.auth.signUp({
                email,
                password: pass,
            });

            if (error) {
                throw error;
            }

            const newUser = data.user;

            const { error: profileError } = await supabase.from('staff_profiles').insert({
                id: newUser.id,
                email: newUser.email,
                name: {
                    first: firstName,
                    last1: lastName1,
                    last2: lastName2 === '' ? null : lastName2,
                },
                role: accountType,
            });

            if (profileError) {
                throw profileError;
            }

            Alert.alert(
                '¡Usuario creado!',
                `Tipo: ${accountType}\nEmail: ${newUser.email}\nContraseña: ${pass}`
            );
            clearFields();

            if (data.session && previousSession) {
                await supabase.auth.setSession({
                    access_token: previousSession.access_token,
                    refresh_token: previousSession.refresh_token,
                });
            }
        } catch (error) {
            const message = error.message ?? 'Algo salió mal, inténtalo nuevamente.';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
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
            return <Text style={styles.buttonText}>Crear</Text>;
        }
    }

    function Dropdown() {
        const platform = Platform.OS;

        if (platform === 'ios') {
            const buttons = [
                'Cancelar',
                'Administrador',
                'Depósito',
                'Conductor',
            ];
            return (
                <TouchableOpacity
                    style={styles.actionSheetButton}
                    onPress={() => {
                        ActionSheetIOS.showActionSheetWithOptions(
                            { options: buttons, cancelButtonIndex: 0 },
                            (buttonIndex) => {
                                if (buttonIndex !== 0) {
                                    setAccountType(types[buttons[buttonIndex]]);
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
                    <Text style={styles.heading}>Tipo de Cuenta</Text>
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
                        <Picker.Item label='Administrador' value='admin' />
                        <Picker.Item label='Depósito' value='warehouse' />
                        <Picker.Item label='Conductor' value='driver' />
                    </Picker>
                </View>
                <View style={styles.section}>
                    <Text style={styles.heading}>Name</Text>
                    <Text>
                        Primer nombre <Text style={{ color: 'red' }}>*</Text>
                    </Text>
                    <TextInput
                        placeholder='Adrian'
                        value={firstName}
                        onChangeText={setFirstName}
                        style={styles.input}
                    />
                    <Text>
                        Primer apellido <Text style={{ color: 'red' }}>*</Text>
                    </Text>
                    <TextInput
                        placeholder='Ramirez'
                        value={lastName1}
                        onChangeText={setLastName1}
                        style={styles.input}
                    />
                    <Text>Segundo apellido</Text>
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
                        placeholder='nombre@bdacali.com'
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        autoCapitalize='none'
                    />
                </View>
                <View style={styles.passwordAdvisory}>
                    <Text style={styles.passwordAdvisoryText}>
                        Se genera automáticamente una contraseña con las
                        primeras tres letras del nombre y las primeras cuatro
                        letras de los apellidos.
                        {'\n\n'}
                        Ejemplo:
                        {'\n\n'}
                        Nombre: Adrian Ramirez Lopez
                        {'\n'}
                        Contraseña: AdrRamiLope
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
