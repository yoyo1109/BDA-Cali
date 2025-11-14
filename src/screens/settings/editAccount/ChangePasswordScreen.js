import {
    KeyboardAvoidingView,
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import { Formik } from 'formik';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../../firebase/config';

const ChangePasswordScreen = ({ route, navigation }) => {
    const [loading, setLoading] = useState(false);

    const changePassword = async (newPassword) => {
        setLoading(true);

        updatePassword(auth.currentUser, newPassword)
            .then(() => {
                // Update successful
                alert('Password changed successfully!');
                navigation.goBack();
            })
            .catch((error) => {
                alert(error);
            });

        setLoading(false);
    };

    return (
        <KeyboardAvoidingView style={styles.container}>
            <View style={styles.box}>
                <Text style={styles.heading}>Change password</Text>
                <Text style={{ color: 'gray' }}>
                    To change your password, enter a new password below.
                </Text>
                <Formik
                    initialValues={{ pass: '', confirmPass: '' }}
                    onSubmit={(values) => {
                        changePassword(values.pass);
                    }}
                    validate={(values) => {
                        const errors = {};
                        if (!values.pass && !values.confirmPass) {
                            errors.empty = true;
                        } else {
                            if (values.pass !== values.confirmPass) {
                                errors.passwordMatch = 'Passwords must match.';
                            }
                            if (!values.pass) {
                                errors.pass = 'Pass err';
                            }
                            if (!values.confirmPass) {
                                errors.confirmPass = 'Confirm pass err';
                            }
                        }
                        return errors;
                    }}
                >
                    {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        values,
                        errors,
                        touched,
                    }) => (
                        <View style={styles.formContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    touched.pass && errors.pass
                                        ? styles.inputError
                                        : '',
                                ]}
                                placeholder='New password'
                                onChangeText={handleChange('pass')}
                                onBlur={handleBlur('pass')}
                                value={values.pass}
                                autoCapitalize='none'
                                autoCorrect={false}
                                secureTextEntry
                            />
                            <TextInput
                                style={[
                                    styles.input,
                                    touched.confirmPass && errors.confirmPass
                                        ? styles.inputError
                                        : '',
                                ]}
                                placeholder='Confirm password'
                                onChangeText={handleChange('confirmPass')}
                                onBlur={handleBlur('confirmPass')}
                                value={values.confirmPass}
                                autoCapitalize='none'
                                autoCorrect={false}
                                secureTextEntry
                            />
                            {errors.passwordMatch ? (
                                <Text style={styles.errorText}>
                                    {errors.passwordMatch}
                                </Text>
                            ) : null}
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                            >
                                {loading ? (
                                    <ActivityIndicator color='white' />
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        Change my password
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </Formik>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 30,
    },
    box: {
        width: '80%',
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
        marginTop: 18,
        width: '100%',
    },
    inputError: {
        borderColor: '#df0b37',
        borderStyle: 'solid',
        borderWidth: 1,
    },
    submitButton: {
        backgroundColor: '#0074cb',
        width: '100%',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 16,
    },
});
