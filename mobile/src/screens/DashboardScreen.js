import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getTransactions(1, 5);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.log('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const ActionButton = ({ title, icon, onPress, color = '#8B5CF6', special = false }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: color },
        special && styles.specialButton
      ]}
      onPress={onPress}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
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
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Olá,</Text>
              <Text style={styles.userName}>{user?.nome_completo?.split(' ')[0]}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('UserSettings')}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Saldo Principal</Text>
              <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                <Text style={styles.eyeIcon}>
                  {showBalance ? '👁️' : '🙈'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.balanceAmount}>
              {showBalance ? formatCurrency(user?.saldo || 0) : 'R$ •••••'}
            </Text>
            
            <Text style={styles.balanceSubtext}>Disponível para uso</Text>
            
            {user?.premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>👑 Premium</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <View style={styles.actionsRow}>
              <ActionButton
                title="Adicionar"
                icon="➕"
                onPress={() => Alert.alert('Info', 'Função em desenvolvimento')}
              />
              <ActionButton
                title="PIX"
                icon="🔄"
                color="#00BFA5"
                special={true}
                onPress={() => Alert.alert('PIX', 'Integração PIX em desenvolvimento')}
              />
              <ActionButton
                title="Enviar"
                icon="↗️"
                onPress={() => Alert.alert('Info', 'Função em desenvolvimento')}
              />
            </View>
            
            <View style={styles.actionsRow}>
              <ActionButton
                title="Sacar"
                icon="↙️"
                onPress={() => Alert.alert('Info', 'Função em desenvolvimento')}
              />
              <ActionButton
                title="Cartões"
                icon="💳"
                onPress={() => navigation.navigate('Cards')}
              />
              <ActionButton
                title="Histórico"
                icon="🕐"
                onPress={() => Alert.alert('Info', 'Histórico em desenvolvimento')}
              />
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsContainer}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.transactionsTitle}>Transações Recentes</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            
            {transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Text style={styles.transactionIconText}>
                      {transaction.tipo === 'deposito' ? '⬇️' :
                       transaction.tipo === 'pix' ? '🔄' : '⬆️'}
                    </Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {transaction.descricao}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.valor > 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {formatCurrency(Math.abs(transaction.valor))}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noTransactions}>
                <Text style={styles.noTransactionsText}>
                  Nenhuma transação recente
                </Text>
              </View>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  eyeIcon: {
    fontSize: 20,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  premiumBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  specialButton: {
    backgroundColor: '#00BFA5',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  transactionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  noTransactions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noTransactionsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;