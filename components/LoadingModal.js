import { StyleSheet, Text, View, Modal, ActivityIndicator } from 'react-native';
import React from 'react';

/**
 * Usage:
 * <LoadingModal visible={loading} />
 */

const LoadingModal = (props) => {
    console.log('[LoadingModal] Rendered with visible:', props.visible);
    return (
        <Modal visible={props.visible} animationType='fade' transparent>
            <View style={styles.modalContainer}>
                <View style={styles.modalView}>
                    <ActivityIndicator size='large' color='white' />
                    <Text style={styles.loadingText}>Cargando...</Text>
                </View>
            </View>
        </Modal>
    );
};

export default LoadingModal;

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: 100,
        backgroundColor: '#626b79',
        borderRadius: 10,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    loadingText: {
        color: 'white',
        marginTop: 8,
    },
});
