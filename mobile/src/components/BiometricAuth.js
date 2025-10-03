import React, { useState, useEffect } from 'react';
import { View, Alert, Platform } from 'react-native';
// import TouchID from 'react-native-touch-id';
// import ReactNativeBiometrics from 'react-native-biometrics';

const BiometricAuth = ({ onSuccess, onError }) => {
  const [biometryType, setBiometryType] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Placeholder para verificação de suporte biométrico
      // Quando integrar as bibliotecas reais, implementar aqui
      
      /* 
      // Exemplo com react-native-touch-id
      const biometryType = await TouchID.isSupported();
      setBiometryType(biometryType);
      setIsSupported(true);
      
      // Ou com react-native-biometrics
      const { available, biometryType } = await ReactNativeBiometrics.isSensorAvailable();
      setIsSupported(available);
      setBiometryType(biometryType);
      */
      
      // Por enquanto, simular suporte em desenvolvimento
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        setIsSupported(true);
        setBiometryType(Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint');
      }
    } catch (error) {
      console.log('Biometria não suportada:', error);
      setIsSupported(false);
    }
  };

  const authenticateWithBiometrics = async () => {
    if (!isSupported) {
      onError && onError('Biometria não suportada neste dispositivo');
      return;
    }

    try {
      // Placeholder para autenticação biométrica
      // Quando integrar as bibliotecas reais, implementar aqui
      
      /*
      // Exemplo com react-native-touch-id
      const result = await TouchID.authenticate('Autenticar com biometria', {
        title: 'VornexZPay',
        subTitle: 'Use sua biometria para acessar',
        imageColor: '#8B5CF6',
        imageErrorColor: '#EF4444',
        sensorDescription: 'Toque no sensor',
        sensorErrorDescription: 'Falhou',
        cancelText: 'Cancelar',
        fallbackLabel: 'Usar senha',
      });
      
      // Ou com react-native-biometrics
      const { success } = await ReactNativeBiometrics.simplePrompt({
        promptMessage: 'Confirme sua identidade',
      });
      */

      // Por enquanto, simular sucesso em desenvolvimento
      Alert.alert(
        'Biometria',
        'Autenticação biométrica simulada com sucesso! (Função será implementada na versão final)',
        [
          {
            text: 'OK',
            onPress: () => onSuccess && onSuccess(),
          },
        ]
      );
    } catch (error) {
      console.log('Erro na autenticação biométrica:', error);
      
      let errorMessage = 'Erro na autenticação biométrica';
      
      if (error.name === 'UserCancel') {
        errorMessage = 'Autenticação cancelada pelo usuário';
      } else if (error.name === 'UserFallback') {
        errorMessage = 'Usuário escolheu usar senha';
      } else if (error.name === 'BiometryNotAvailable') {
        errorMessage = 'Biometria não disponível';
      } else if (error.name === 'BiometryNotEnrolled') {
        errorMessage = 'Nenhuma biometria cadastrada';
      } else if (error.name === 'BiometryLockout') {
        errorMessage = 'Biometria bloqueada temporariamente';
      }
      
      onError && onError(errorMessage);
    }
  };

  const getBiometryIcon = () => {
    switch (biometryType) {
      case 'FaceID':
        return '👤';
      case 'TouchID':
      case 'Fingerprint':
        return '👆';
      default:
        return '🔒';
    }
  };

  const getBiometryName = () => {
    switch (biometryType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Fingerprint':
        return 'Impressão Digital';
      default:
        return 'Biometria';
    }
  };

  return {
    isSupported,
    biometryType,
    authenticateWithBiometrics,
    getBiometryIcon,
    getBiometryName,
  };
};

// Hook para usar biometria
export const useBiometricAuth = () => {
  return BiometricAuth({});
};

export default BiometricAuth;