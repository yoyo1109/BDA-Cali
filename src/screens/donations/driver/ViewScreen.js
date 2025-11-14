import {
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import React, { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Button, CheckBox } from 'react-native-elements';
import { app, db } from '../../../firebase/config';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Formik } from 'formik';
import SignatureScreen from 'react-native-signature-canvas';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import LoadingModal from '../../../../components/LoadingModal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import openMap from 'react-native-open-maps';

const ViewScreen = ({ route, navigation }) => {
    const params = route.params;
    const data = params.data;

    const [hasReceipt, setHasReceipt] = useState('yes');
    const [image, setImage] = useState(null);
    const [signature, setSignature] = useState(null);
    const [loading, setLoading] = useState(false);
    const [signatureVisible, setSignatureVisible] = useState(false);

    const askForPermissions = async (type) => {
        if (Platform.OS !== 'web') {
            if (type === 'camera') {
                const { status } =
                    await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    alert('Please allow camera permissions.');
                }
            }
            if (type === 'cameraroll') {
                const { status } =
                    await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    alert('Please allow camera roll permissions.');
                }
            }
        }
    };

    const uploadImagesAsync = async () => {
        const storage = getStorage(app);

        // receipt
        if (image !== null) {
            const receiptImgID = `receipts/${uuidv4()}`;
            const receiptImgRef = ref(storage, receiptImgID);

            const receiptImg = await fetch(image);
            const receiptBytes = await receiptImg.blob();
            await uploadBytes(receiptImgRef, receiptBytes);

            params.data.pickup.receiptImage = receiptImgID;
        }

        // signature
        if (signature !== null) {
            console.log('signature is not null');
            const signatureImgID = `signatures/${signature.split('/').pop()}`;
            const signatureImgRef = ref(storage, signatureImgID);

            const signatureImg = await fetch(signature);
            const signatureBytes = await signatureImg.blob();
            await uploadBytes(signatureImgRef, signatureBytes);

            params.data.pickup.signatureImage = signatureImgID;
        }
    };

    const pickImage = async () => {
        askForPermissions('cameraroll');

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.cancelled) {
            setImage(result.uri);
        }
    };

    const takePhoto = async () => {
        askForPermissions('camera');

        let result = await ImagePicker.launchCameraAsync({
            aspect: [4, 3],
        });

        if (!result.cancelled) {
            setImage(result.uri);
        }
    };

    const handleDonationSubmit = async (values) => {
        setLoading(true);

        const donationRef = doc(db, 'pickedup', params.id);
        let data = params.data;

        if (hasReceipt === 'no' && values.noReceiptReason) {
            data.pickup.noReceiptReason = values.noReceiptReason;
        }

        await uploadImagesAsync();
        await setDoc(donationRef, params.data);
        await deleteDoc(doc(db, 'accepted', params.id));

        setLoading(false);

        navigation.navigate('List', {
            refresh: true,
        });
    };

    const formatName = (indiv) => {
        return `${indiv.name.first} ${indiv.name.last1}${
            indiv.name.last2 !== null ? ` ${indiv.name.last2}` : ''
        }`;
    };

    const SignatureModal = () => {
        const ref = useRef();

        const handleCancel = () => {
            setSignatureVisible(false);
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT_UP
            );
        };

        const handleOK = (signature) => {
            const uuid = uuidv4();
            setSignatureVisible(false);
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT_UP
            );

            setLoading(true);

            const path = FileSystem.cacheDirectory + `${uuid}.png`;
            FileSystem.writeAsStringAsync(
                path,
                signature.split('data:image/png;base64,')[1],
                { encoding: FileSystem.EncodingType.Base64 }
            )
                .then(() => {
                    FileSystem.getInfoAsync(path, {
                        size: true,
                        md5: true,
                    }).then(() => {
                        setSignature(path);
                    });
                })
                .catch((error) => {
                    console.error(error);
                });

            setLoading(false);
        };

        const handleConfirm = () => {
            ref.current.readSignature();
        };

        const handleClear = () => {
            ref.current.clearSignature();
        };

        return (
            <Modal
                visible={signatureVisible}
                supportedOrientations={['portrait', 'landscape']}
            >
                <SignatureScreen
                    ref={ref}
                    onOK={handleOK}
                    webStyle={`
                            .m-signature-pad--footer {
                                display: none;
                                margin: 0px;
                            }
                        `}
                />
                <View
                    style={{
                        height: '23%',
                        justifyContent: 'center',
                        borderTopWidth: 1,
                        borderTopColor: '#dbdbdb',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Button
                            title='Cancel'
                            icon={{
                                name: 'arrow-left',
                                type: 'material-community',
                                color: 'white',
                            }}
                            buttonStyle={{
                                backgroundColor: '#df0b37',
                                marginLeft: 40,
                            }}
                            onPress={handleCancel}
                        />
                        <View style={{ flexDirection: 'row' }}>
                            <Button
                                title='Clear'
                                onPress={handleClear}
                                buttonStyle={{
                                    backgroundColor: 'grey',
                                    marginRight: 20,
                                }}
                            />
                            <Button
                                title='Submit'
                                onPress={handleConfirm}
                                buttonStyle={{ marginRight: 40 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View>
            <LoadingModal visible={loading} />
            <SignatureModal />
            <Formik
                initialValues={{ noReceiptReason: '' }}
                onSubmit={(values) => {
                    Alert.alert(
                        'Confirm',
                        'Are you sure you want to submit this donation?',
                        [
                            {
                                text: 'Submit',
                                onPress: () => {
                                    handleDonationSubmit(values);
                                },
                            },
                            {
                                text: 'Cancel',
                                onPress: () => {},
                                style: 'cancel',
                            },
                        ]
                    );
                }}
                validateOnChange={false}
                validateOnBlur={false}
                validate={(values) => {
                    const errors = {};
                    if (hasReceipt === 'no' && !values.noReceiptReason) {
                        errors.noReceiptReason = 'Missing receipt reason';
                    }
                    if (hasReceipt === 'yes' && image === null) {
                        errors.receiptPicture = 'Receipt photo required';
                    }

                    if (Object.keys(errors).length !== 0) {
                        let missing = '';
                        let i = 0;
                        for (const error in errors) {
                            missing += `- ${errors[error]}`;
                            if (i !== Object.keys(errors).length - 1) {
                                missing += '\n';
                            }
                            i++;
                        }
                        Alert.alert('Missing information', `${missing}`);
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
                }) => (
                    <KeyboardAvoidingView
                        style={{
                            height: '100%',
                            justifyContent: 'space-between',
                        }}
                    >
                        <ScrollView>
                            <View>
                                <TouchableOpacity
                                    style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginTop: 24,
                                        backgroundColor: 'white',
                                        marginHorizontal: '15%',
                                        paddingVertical: 24,
                                        borderRadius: 10,
                                        borderWidth: 2,
                                        borderColor: '#0074cb',
                                    }}
                                    onPress={() => {
                                        openMap({
                                            end: data.client.address.formatted,
                                            // provider: 'google',
                                        });
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            marginBottom: 5,
                                        }}
                                    >
                                        <Icon
                                            name='map-marker'
                                            color='#0074cb'
                                            size={30}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 24,
                                                fontWeight: '700',
                                                color: '#0074cb',
                                                marginLeft: 5,
                                            }}
                                        >
                                            Navigate
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            marginHorizontal: 12,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontWeight: '600',
                                                fontSize: 14,
                                                color: 'gray',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {data.indiv !== undefined
                                                ? `${data.indiv.name.first} ${
                                                      data.indiv.name.last1
                                                  }${
                                                      data.indiv.name.last2 !==
                                                      null
                                                          ? ` ${data.indiv.name.last2}`
                                                          : ''
                                                  }`
                                                : data.org.name}
                                        </Text>
                                        <Text
                                            style={{
                                                color: 'gray',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {data.client.address.formatted}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <View
                                    style={{
                                        width: '90%',
                                        borderWidth: 1,
                                        borderColor: 'rgba(0, 0, 0, 0.15)',
                                        marginHorizontal: '5%',
                                        marginTop: 32,
                                    }}
                                />
                                <Text style={styles.header}>
                                    Does the donor have a receipt?{' '}
                                    <Text style={{ color: 'red' }}>*</Text>
                                </Text>
                                <View style={{ alignItems: 'center' }}>
                                    <CheckBox
                                        title='Yes'
                                        checked={hasReceipt === 'yes'}
                                        onPress={() => setHasReceipt('yes')}
                                        checkedIcon='dot-circle-o'
                                        uncheckedIcon='circle-o'
                                        containerStyle={{ width: '80%' }}
                                    />
                                    <CheckBox
                                        title='No'
                                        checked={hasReceipt === 'no'}
                                        onPress={() => setHasReceipt('no')}
                                        checkedIcon='dot-circle-o'
                                        uncheckedIcon='circle-o'
                                        containerStyle={{ width: '80%' }}
                                    />
                                </View>
                                {hasReceipt === 'yes' ? (
                                    <>
                                        <View style={styles.imageContainer}>
                                            {image !== null && (
                                                <Image
                                                    source={{
                                                        uri: image,
                                                    }}
                                                    style={{
                                                        width: '80%',
                                                        height: 350,
                                                    }}
                                                />
                                            )}
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-evenly',
                                                marginTop: 15,
                                            }}
                                        >
                                            <View style={{ width: '35%' }}>
                                                <Button
                                                    buttonStyle={[
                                                        { width: '100%' },
                                                        errors.receiptPicture
                                                            ? styles.buttonError
                                                            : '',
                                                    ]}
                                                   title='Subir'
                                                    title='Upload'
                                                    onPress={pickImage}
                                                    icon={{
                                                        name: 'image',
                                                        type: 'material-community',
                                                        color: 'white',
                                                    }}
                                                />
                                            </View>
                                            <View style={{ width: '35%' }}>
                                                <Button
                                                    buttonStyle={[
                                                        { width: '100%' },
                                                        errors.receiptPicture
                                                            ? styles.buttonError
                                                            : '',
                                                    ]}
                                                   title='Captura'
                                                    title='Capture'
                                                    onPress={takePhoto}
                                                    icon={{
                                                        name: 'camera',
                                                        type: 'material-community',
                                                        color: 'white',
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    </>
                                ) : (
                                    <View
                                        style={{
                                            marginTop: 18,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View style={{ width: '80%' }}>
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Missing receipt reason:{' '}
                                                <Text style={{ color: 'red' }}>
                                                    *
                                                </Text>
                                            </Text>
                                            <TextInput
                                                onChangeText={handleChange(
                                                    'noReceiptReason'
                                                )}
                                                onBlur={handleBlur(
                                                    'noReceiptReason'
                                                )}
                                                value={values.noReceiptReason}
                                                multiline
                                                style={[
                                                    styles.input,
                                                    errors.noReceiptReason
                                                        ? styles.error
                                                        : '',
                                                ]}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                            <View
                                style={{
                                    width: '90%',
                                    borderWidth: 1,
                                    borderColor: 'rgba(0, 0, 0, 0.15)',
                                    marginHorizontal: '5%',
                                    marginTop: 32,
                                }}
                            />
                            <View
                                style={{
                                    alignItems: 'center',
                                    marginBottom: 32,
                                }}
                            >
                                <Text style={styles.header}>
                                    Donor signature
                                </Text>
                                {signature !== null && (
                                    <TouchableOpacity
                                        style={{
                                            width: '70%',
                                            height: 100,
                                            marginBottom: 24,
                                            backgroundColor: 'white',
                                            borderRadius: 5,
                                            borderWidth: 2,
                                            borderColor: '#0074cb',
                                        }}
                                        onPress={() => {
                                            setSignatureVisible(true);
                                            ScreenOrientation.lockAsync(
                                                ScreenOrientation
                                                    .OrientationLock
                                                    .LANDSCAPE_RIGHT
                                            );
                                        }}
                                    >
                                        <Image
                                            source={{ uri: signature }}
                                            style={styles.signatureBox}
                                        />
                                    </TouchableOpacity>
                                )}
                                <View style={{ width: '50%' }}>
                                    <Button
                                        title='Open signature pad'
                                        onPress={() => {
                                            setSignatureVisible(true);
                                            ScreenOrientation.lockAsync(
                                                ScreenOrientation
                                                    .OrientationLock
                                                    .LANDSCAPE_RIGHT
                                            );
                                        }}
                                    />
                                </View>
                            </View>
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text style={{ color: 'white', fontSize: 24 }}>
                                PICKED UP
                            </Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                )}
            </Formik>
        </View>
    );
};

export default ViewScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContainer: {
        width: '100%',
    },
    header: {
        fontSize: 24,
        textAlign: 'center',
        marginVertical: 24,
    },
    uploadButtons: {
        flexDirection: 'row',
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: 15,
        borderRadius: 15,
        marginTop: 10,
        textAlignVertical: 'center',
    },
    error: {
        borderColor: '#df0b37',
        borderStyle: 'solid',
        borderWidth: 2,
    },
    buttonError: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '#df0b37',
        borderRadius: 5,
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    signatureBox: {
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 5,
        overflow: 'hidden',
    },
    submitButton: {
        width: '100%',
        backgroundColor: '#0074cb',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
});
