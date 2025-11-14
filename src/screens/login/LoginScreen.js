import {
    KeyboardAvoidingView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import supabase from '../../supabase/client';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const mounted = useRef(true);

    const handleSignIn = async () => {
        if (loading) {
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                Alert.alert('Error al iniciar sesión', error.message);
            }
        } catch (error) {
            Alert.alert('Error al iniciar sesión', error.message);
        } finally {
            if (mounted.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    return (
        <KeyboardAvoidingView style={styles.container} behavior='padding'>
            <View style={styles.logoContainer}>
                <Image
                    style={styles.logo}
                    source={require('../../../assets/bdalogo.png')}
                />
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder='Email'
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                    style={styles.input}
                    autoCapitalize='none'
                    autoComplete='email'
                    autoCorrect={false}
                />
                <TextInput
                    placeholder='Clave'
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                    style={styles.input}
                    autoCapitalize='none'
                    autoComplete='password'
                    autoCorrect={false}
                    secureTextEntry
                />
                <TouchableOpacity onPress={handleSignIn} style={styles.button}>
                    {loading ? (
                        <ActivityIndicator color='white' />
                    ) : (
                        <Text style={styles.buttonText}>Iniciar sesión</Text>
                    )}
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                onPress={() => {
                    navigation.navigate('ResetPassword');
                }}
                style={styles.forgotPassword}
            >
                <Text style={styles.hyperlink}>Olvidar la contraseña</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    inputContainer: {
        width: '80%',
    },
    logoContainer: {
        marginBottom: 40,
    },
    logo: {
        width: 170,
        height: 175,
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 15,
        marginTop: 10,
    },
    buttonContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
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
    hyperlink: {
        color: '#0c4484',
        fontWeight: '700',
    },
    forgotPassword: {
        marginTop: 15,
        textAlign: 'center',
    },
});
