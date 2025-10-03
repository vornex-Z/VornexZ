import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { cardsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const { width, height } = Dimensions.get('window');

const CardsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      // Por enquanto, usar dados mock até integrar com API real
      setCards([]);
    } catch (error) {
      console.log('Erro ao carregar cartões:', error);
    } finally {
      setLoading(false);
    }
  };

  const cardOptions = [
    {
      id: 'virtual_free',
      title: '💳 Cartão Virtual Grátis',
      subtitle: 'Compras online seguras',
      description: 'Perfeito para compras online e assinaturas',
      benefits: [
        '✅ Sem anuidade',
        '✅ Criação instantânea',
        '✅ Compras online seguras',
        '✅ Controle total pelo app',
        '✅ Bloqueio temporário',
      ],
      cost: 'Gratuito',
      action: () => handleCreateVirtualCard(),
    },
    {
      id: 'physical',
      title: '🚚 Cartão Físico',
      subtitle: 'Para usar em qualquer lugar',
      description: 'Cartão físico para uso em lojas e caixas eletrônicos',
      benefits: [
        '✅ Aceito em todo o Brasil',
        '✅ Saque em caixas eletrônicos',
        '✅ Compras presenciais',
        '✅ Tecnologia contactless',
        '✅ Entrega em casa',
      ],
      cost: 'R$ 15,00 (taxa de entrega)',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
      action: () => handleRequestPhysicalCard(),
    },
    {
      id: 'premium',
      title: '👑 Cartão Premium',
      subtitle: 'Benefícios exclusivos',
      description: 'Cartão premium com benefícios únicos e cashback especial',
      benefits: [
        '✅ 2% de cashback sem limite',
        '✅ Anuidade diferenciada',
        '✅ Acesso a salas VIP',
        '✅ Seguro viagem incluso',
        '✅ Concierge 24/7',
        '✅ Design exclusivo',
      ],
      cost: 'R$ 12,00/mês',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop&sat=-100&bright=1.2',
      action: () => handleRequestPremiumCard(),
    },
  ];

  const handleCreateVirtualCard = () => {
    Alert.alert(
      '💳 Cartão Virtual',
      'Deseja criar um cartão virtual gratuito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Criar', 
          onPress: () => {
            Alert.alert(
              'Sucesso!', 
              'Cartão virtual criado com sucesso! Em breve, a integração com gateway de pagamento será implementada.',
              [{ text: 'OK' }]
            );
          }
        },
      ]
    );
  };

  const handleRequestPhysicalCard = () => {
    Alert.alert(
      '🚚 Cartão Físico',
      'Deseja solicitar um cartão físico? Taxa de entrega: R$ 15,00',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Solicitar', 
          onPress: () => {
            Alert.alert(
              'Solicitação enviada!', 
              'Seu cartão físico será enviado em até 10 dias úteis. Taxa de R$ 15,00 será cobrada.',
              [{ text: 'OK' }]
            );
          }
        },
      ]
    );
  };

  const handleRequestPremiumCard = () => {
    Alert.alert(
      '👑 Cartão Premium',
      'Deseja solicitar o cartão Premium? Mensalidade: R$ 12,00',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Solicitar', 
          onPress: () => {
            Alert.alert(
              'Premium ativado!', 
              'Seu cartão Premium foi ativado! Mensalidade de R$ 12,00 será cobrada.',
              [{ text: 'OK' }]
            );
          }
        },
      ]
    );
  };

  const openCardDetails = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const CardDetailsModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedCard?.title}</Text>
            <TouchableOpacity 
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedCard?.image && (
              <Image 
                source={{ uri: selectedCard.image }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}

            <Text style={styles.modalDescription}>
              {selectedCard?.description}
            </Text>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Benefícios:</Text>
              {selectedCard?.benefits?.map((benefit, index) => (
                <Text key={index} style={styles.benefitItem}>
                  {benefit}
                </Text>
              ))}
            </View>

            <View style={styles.costContainer}>
              <Text style={styles.costLabel}>Custo:</Text>
              <Text style={styles.costValue}>{selectedCard?.cost}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                setShowModal(false);
                selectedCard?.action();
              }}
            >
              <Text style={styles.modalActionButtonText}>
                {selectedCard?.id === 'virtual_free' ? 'Criar Cartão' :
                 selectedCard?.id === 'physical' ? 'Solicitar' : 'Ativar Premium'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMyCards = () => (
    <View style={styles.myCardsContainer}>
      <Text style={styles.sectionTitle}>💳 Meus Cartões</Text>
      
      {cards.length > 0 ? (
        cards.map((card, index) => (
          <View key={index} style={styles.cardItem}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNumber}>**** {card.lastFour}</Text>
              <Text style={styles.cardType}>{card.type}</Text>
              <Text style={styles.cardStatus}>Status: {card.status}</Text>
            </View>
            <TouchableOpacity style={styles.cardActionButton}>
              <Text style={styles.cardActionText}>Gerenciar</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.noCardsContainer}>
          <Text style={styles.noCardsIcon}>💳</Text>
          <Text style={styles.noCardsTitle}>Você ainda não tem cartões</Text>
          <Text style={styles.noCardsSubtitle}>
            Escolha uma das opções abaixo para solicitar seu primeiro cartão
          </Text>
        </View>
      )}
    </View>
  );

  const renderCardOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.sectionTitle}>🎯 Tipos de Cartão</Text>
      
      {cardOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={styles.optionCard}
          onPress={() => openCardDetails(option)}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            <Text style={styles.optionCost}>{option.cost}</Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ImageBackground
      source={{
        uri: 'https://customer-assets.emergentagent.com/job_pix-wallet/artifacts/vzhkwips_Imagem%20do%20WhatsApp%20de%202025-09-26%20%C3%A0%28s%29%2010.23.59_37d4cfaa.jpg'
      }}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Cartões</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {renderMyCards()}
            {renderCardOptions()}
            
            {/* Informações importantes */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>ℹ️ Informações Importantes</Text>
              <Text style={styles.infoText}>
                • Todos os cartões são da bandeira Mastercard{'\n'}
                • Aceitos em milhões de estabelecimentos{'\n'}
                • Função débito e crédito disponível{'\n'}
                • Tecnologia de segurança avançada{'\n'}
                • Suporte 24/7 pelo app
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      <CardDetailsModal />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  myCardsContainer: {
    marginBottom: 24,
  },
  noCardsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noCardsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noCardsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  noCardsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  cardType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  cardStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  cardActionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  optionCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  optionArrow: {
    fontSize: 20,
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  benefitItem: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    lineHeight: 20,
  },
  costContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  modalActionButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CardsScreen;