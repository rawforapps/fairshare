import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  QrCode,
  Users,
  Eye,
  EyeOff,
  Dices,
  PieChart,
  ArrowRight,
  Download,
  Trash2,
  Tag,
} from 'lucide-react-native';
import { useLedgerStore, CurrencyConfig } from '../../src/stores/useLedgerStore';
import { QRCodeModal } from '../../src/components/QRCodeModal';
import { generateLedgerCSV } from '../../src/core/export/csvExporter';

const AVAILABLE_CURRENCIES: CurrencyConfig[] = [
  { code: 'PKR', symbol: 'Rs' },
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'AED', symbol: 'AED' },
  { code: 'SAR', symbol: 'SAR' },
];

export default function DashboardScreen() {
  const router = useRouter();

  // Store bindings
  const {
    groups,
    activeGroupId,
    isPrivacyMode,
    currency,
    language,
    expenses,
    setCurrency,
    setLanguage,
    addMemberToGroup,
    deleteMemberFromGroup,
    deleteExpense,
    togglePrivacyMode,
    getGroupBalances,
    topUpKitty,
    spinCoffeeRoulette,
  } = useLedgerStore();

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const groupExpenses = expenses[activeGroup.id] || [];

  // Modals state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [rouletteModalVisible, setRouletteModalVisible] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Compute Overall Net Balance across all groups
  let totalNetCents = 0n;
  for (const g of groups) {
    const balances = getGroupBalances(g.id);
    const myBalance = balances.find((b) => b.memberId === 'user_me');
    if (myBalance) totalNetCents += myBalance.netBalanceCents;
  }

  const isPositive = totalNetCents >= 0n;
  const isZeroBalance = totalNetCents === 0n;
  const formattedTotal = (Math.abs(Number(totalNetCents)) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const displayTotal = isPrivacyMode
    ? `${currency.symbol}••••••`
    : isZeroBalance
    ? `${currency.symbol}0.00`
    : `${isPositive ? '+' : '-'}${currency.symbol}${formattedTotal}`;

  // Kitty Pool formatting
  const formattedKitty = (Number(activeGroup?.kittyBalanceCents || 0n) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const displayKitty = isPrivacyMode ? `${currency.symbol}••••••` : `${currency.symbol}${formattedKitty}`;

  // Roulette action
  const handleSpinRoulette = () => {
    setIsSpinning(true);
    setTimeout(() => {
      const winner = spinCoffeeRoulette(activeGroup.id);
      setRouletteWinner(winner ? winner.name : 'You');
      setIsSpinning(false);
    }, 1200);
  };

  const handleExportCSV = () => {
    generateLedgerCSV(activeGroup.name, groupExpenses.map((exp) => ({
      date: new Date(exp.createdAt).toLocaleDateString(),
      description: exp.description,
      category: exp.category,
      totalAmount: `${currency.symbol}${(Number(exp.amountCents) / 100).toFixed(2)}`,
      currency: currency.code,
      paidBy: exp.payerMode === 'single' ? 'You' : 'Multi-Payer',
      yourShare: `${currency.symbol}${(Number(exp.amountCents) / 100 / Math.max(1, exp.splitWithMemberIds.length)).toFixed(2)}`,
    })));
    Alert.alert('Excel CSV Exported', 'Ledger exported successfully with zero paywalls!');
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    addMemberToGroup(activeGroup.id, newMemberName.trim());
    Alert.alert('Member Added 🎉', `"${newMemberName.trim()}" added to ${activeGroup.name}!`);
    setNewMemberName('');
    setAddMemberModalVisible(false);
  };

  const handleDeleteMember = (memberId: string, name: string) => {
    Alert.alert('Remove Member', `Remove "${name}" from this group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteMemberFromGroup(activeGroup.id, memberId),
      },
    ]);
  };

  const handleDeleteExpense = (expId: string, title: string) => {
    Alert.alert('Delete Bill', `Delete "${title}" from the ledger?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteExpense(activeGroup.id, expId),
      },
    ]);
  };

  // Language dictionary
  const isUrdu = language === 'UR';
  const t = {
    subtitle: isUrdu ? '100% Muft • Koi Limit Nahi' : '100% Free • Zero Limits',
    totalStatus: isUrdu ? 'Kul Hisab Kitab' : 'Total Status',
    statusZero: isUrdu ? 'Sab hisab barabar hai!' : 'All settled up! No active debts.',
    statusPos: isUrdu ? '🎉 Doston ne aapko paise dene hain!' : '🎉 Friends owe you this money!',
    statusNeg: isUrdu ? '⚠️ Doston ko paise wapas karne hain!' : 'You need to pay friends back!',
    paidTitle: isUrdu ? 'Mene Kharcha\nKiya' : 'I Paid For\nSomething',
    settleTitle: isUrdu ? 'Udhar Wapas\nKarein' : 'Pay Someone\nBack',
    kittyTitle: isUrdu ? 'Sanjha Kitty Pool' : 'Shared Kitty Pool',
    kittySub: isUrdu ? 'Chaye & snacks ke liye common cash' : 'Common money for snacks & tea',
    addKitty: isUrdu ? '+ 500 Dalein' : '+ Add 500',
    whoPays: isUrdu ? 'Kon Dega?' : 'Who Pays?',
    spinWheel: isUrdu ? 'Quraandazi karein!' : 'Spin the wheel!',
    charts: isUrdu ? 'Kharchay' : 'Charts',
    chartsSub: isUrdu ? 'Paisa kahan kharch hua' : 'Where money went',
    mealTitle: isUrdu ? 'Kisne Kya Khaya?' : 'Who Ate What?',
    mealSub: isUrdu ? 'Restaurant ka bill bina math ke baantein' : 'Split restaurant meals without doing math',
    recentBillsTitle: isUrdu ? 'Haal He Ke Bills' : 'Recent Bills',
    noBillsMsg: isUrdu ? 'Abhi koi bill add nahi hua. "Mene Kharcha Kiya" tap karein!' : 'No bills added yet. Tap "I Paid For Something" to add one!',
    groupsTitle: isUrdu ? 'Group Members' : 'Group Members',
    addMemberBtn: isUrdu ? '+ Dost Shamil' : '+ Add Member',
  };

  const groupBalances = getGroupBalances(activeGroup.id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🤝</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>FairShare</Text>
            <Text style={styles.brandSubtitle}>{t.subtitle}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Currency Pill */}
          <TouchableOpacity
            style={styles.currencyPill}
            onPress={() => setCurrencyModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.currencyPillText}>{currency.symbol} {currency.code}</Text>
          </TouchableOpacity>

          {/* Language Toggle */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLanguage(language === 'EN' ? 'UR' : 'EN')}
            activeOpacity={0.7}
          >
            <Text style={styles.langPillText}>{language === 'EN' ? '🇺🇸 EN' : '🇵🇰 اردو'}</Text>
          </TouchableOpacity>

          {/* Privacy Eye Toggle */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={togglePrivacyMode}
            activeOpacity={0.7}
          >
            {isPrivacyMode ? <EyeOff color="#10B981" size={18} /> : <Eye color="#94A3B8" size={18} />}
          </TouchableOpacity>

          {/* QR Code */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.7}
          >
            <QrCode color="#F8FAFC" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={activeGroup.members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollList}
        ListHeaderComponent={
          <>
            {/* Total Balance Card */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>{t.totalStatus}</Text>
              <Text
                style={[
                  styles.heroAmount,
                  { color: isZeroBalance ? '#F8FAFC' : isPositive ? '#10B981' : '#F43F5E' },
                ]}
              >
                {displayTotal}
              </Text>
              <Text style={styles.heroStatus}>
                {isZeroBalance ? t.statusZero : isPositive ? t.statusPos : t.statusNeg}
              </Text>
            </View>

            {/* 2 Big Action Buttons with Styled Matching Slate/White Icons */}
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.paidBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/expense/add')}
              >
                <View style={styles.btnIconBadgePaid}>
                  <Plus color="#090D16" size={24} strokeWidth={3} />
                </View>
                <Text style={styles.paidBtnText}>{t.paidTitle}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settleBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/balances')}
              >
                <View style={styles.btnIconBadgeSettle}>
                  <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.8} />
                </View>
                <Text style={styles.settleBtnText}>{t.settleTitle}</Text>
              </TouchableOpacity>
            </View>

            {/* Shared Kitty Pool Card */}
            <View style={styles.kittyCard}>
              <View style={styles.kittyLeft}>
                <Text style={styles.kittyIcon}>💰</Text>
                <View>
                  <View style={styles.kittyTitleRow}>
                    <Text style={styles.kittyTitle}>{t.kittyTitle}</Text>
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>ACTIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.kittySubtitle}>{t.kittySub}</Text>
                </View>
              </View>

              <View style={styles.kittyRight}>
                <Text style={styles.kittyAmount}>{displayKitty}</Text>
                <TouchableOpacity
                  onPress={() => {
                    topUpKitty(activeGroup.id, 50000n); // +500
                    Alert.alert('Kitty Pool', `+${currency.symbol}500.00 added to the shared pot!`);
                  }}
                >
                  <Text style={styles.kittyAddText}>{t.addKitty}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Shortcuts Row: Coffee Roulette & Spending Charts */}
            <View style={styles.shortcutGrid}>
              <TouchableOpacity
                style={styles.rouletteCard}
                activeOpacity={0.8}
                onPress={() => setRouletteModalVisible(true)}
              >
                <Text style={styles.shortcutEmoji}>🎲</Text>
                <View>
                  <Text style={styles.rouletteTitle}>{t.whoPays}</Text>
                  <Text style={styles.shortcutSub}>{t.spinWheel}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chartsCard}
                activeOpacity={0.8}
                onPress={() => router.push('/charts')}
              >
                <Text style={styles.shortcutEmoji}>📊</Text>
                <View>
                  <Text style={styles.chartsTitle}>{t.charts}</Text>
                  <Text style={styles.shortcutSub}>{t.chartsSub}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Meal Splitter Banner */}
            <TouchableOpacity
              style={styles.mealCard}
              activeOpacity={0.8}
              onPress={() => router.push('/expense/who-ate')}
            >
              <Text style={styles.mealEmoji}>🍕</Text>
              <View style={styles.mealTextWrap}>
                <Text style={styles.mealTitle}>{t.mealTitle}</Text>
                <Text style={styles.mealSub}>{t.mealSub}</Text>
              </View>
              <ArrowRight color="#C084FC" size={18} />
            </TouchableOpacity>

            {/* RECENT BILLS SECTION (Live & Reactive) */}
            <View style={styles.billsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.recentBillsTitle}</Text>
                <Text style={styles.billsCountBadge}>{groupExpenses.length} Bills</Text>
              </View>

              {groupExpenses.length === 0 ? (
                <View style={styles.emptyBillsCard}>
                  <Text style={styles.emptyBillsText}>{t.noBillsMsg}</Text>
                </View>
              ) : (
                groupExpenses.map((b) => {
                  const amtStr = (Number(b.amountCents) / 100).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  let payersStr = '';
                  if (b.payerMode === 'kitty') {
                    payersStr = 'Paid from Shared Kitty Pool';
                  } else if (b.multiPayers && b.multiPayers.length > 0) {
                    payersStr = 'Multi-Payer (' + b.multiPayers.map((p) => {
                      const mObj = activeGroup.members.find((m) => m.id === p.memberId);
                      const name = mObj ? mObj.name : 'Someone';
                      return `${name}: ${currency.symbol}${(Number(p.amountCents) / 100).toFixed(0)}`;
                    }).join(', ') + ')';
                  } else {
                    const payerObj = activeGroup.members.find((m) => m.id === b.paidByMemberId);
                    payersStr = `Paid by ${payerObj ? payerObj.name : 'You'}`;
                  }

                  let splitDesc = '';
                  if (b.splitMode === 'loan') {
                    const benObj = activeGroup.members.find((m) => m.id === b.loanBeneficiaryId);
                    splitDesc = `🎯 100% Loan for ${benObj ? benObj.name : 'You'}`;
                  } else {
                    splitDesc = `Split ${b.splitWithMemberIds.length} ways`;
                  }

                  return (
                    <View key={b.id} style={styles.billItemCard}>
                      <View style={styles.billItemLeft}>
                        <View style={styles.billItemIconBadge}>
                          <Text style={styles.billItemEmoji}>{b.description.toLowerCase().includes('loan') ? '💰' : '🏷️'}</Text>
                        </View>
                        <View style={styles.billItemInfo}>
                          <Text style={styles.billItemTitle}>{b.description}</Text>
                          <Text style={styles.billItemPayers}>{payersStr}</Text>
                          <Text style={styles.billItemDate}>
                            {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {splitDesc}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.billItemRight}>
                        <Text style={styles.billItemAmount}>
                          {isPrivacyMode ? `${currency.symbol}••••••` : `${currency.symbol}${amtStr}`}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteExpense(b.id, b.description)}
                          style={styles.billDeleteBtn}
                        >
                          <Trash2 color="#64748B" size={14} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Group Members Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.groupsTitle}</Text>
              <View style={styles.groupHeaderActions}>
                <TouchableOpacity onPress={() => setAddMemberModalVisible(true)} style={styles.addMemberHeaderBtn}>
                  <Text style={styles.addMemberHeaderText}>{t.addMemberBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleExportCSV}>
                  <Text style={styles.exportText}>📥 Excel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const bal = groupBalances.find((b) => b.memberId === item.id);
          const net = bal ? Number(bal.netBalanceCents) / 100 : 0;
          const isPos = net >= 0;
          const isZero = Math.abs(net) < 0.01;

          return (
            <View style={styles.memberCard}>
              <View style={styles.memberLeft}>
                <View style={[styles.memberDot, { backgroundColor: item.isCurrentUser ? '#10B981' : '#A855F7' }]} />
                <View>
                  <Text style={styles.memberName}>{item.name} {item.isCurrentUser ? '(You)' : ''}</Text>
                  <Text style={styles.memberSub}>
                    {isZero ? 'Settled' : isPos ? 'Gets back' : 'Owes group'}
                  </Text>
                </View>
              </View>

              <View style={styles.memberRight}>
                <Text
                  style={[
                    styles.memberAmount,
                    { color: isZero ? '#64748B' : isPos ? '#10B981' : '#F43F5E' },
                  ]}
                >
                  {isPrivacyMode
                    ? `${currency.symbol}••••••`
                    : isZero
                    ? `${currency.symbol}0.00`
                    : `${isPos ? '+' : '-'}${currency.symbol}${Math.abs(net).toFixed(2)}`}
                </Text>

                {!item.isCurrentUser && (
                  <TouchableOpacity
                    onPress={() => handleDeleteMember(item.id, item.name)}
                    style={styles.memberDeleteBtn}
                  >
                    <Trash2 color="#64748B" size={13} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Currency Switcher Modal */}
      <Modal visible={currencyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Select Currency</Text>
            <Text style={styles.dialogSub}>Supports PK, India, US, UK, EU and GCC rails</Text>

            <View style={styles.currencyGrid}>
              {AVAILABLE_CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.currencyOption, currency.code === c.code && styles.activeCurrencyOption]}
                  onPress={() => {
                    setCurrency(c);
                    setCurrencyModalVisible(false);
                  }}
                >
                  <Text style={[styles.currencyOptionCode, currency.code === c.code && styles.activeCurrencyCode]}>
                    {c.symbol} {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.dialogCloseBtn} onPress={() => setCurrencyModalVisible(false)}>
              <Text style={styles.dialogCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={addMemberModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Add Friend to Group</Text>
            <Text style={styles.dialogSub}>Add anyone by name (e.g. Arslan, Irfan)</Text>

            <TextInput
              style={styles.dialogInput}
              placeholder="Friend's Name"
              placeholderTextColor="#64748B"
              value={newMemberName}
              onChangeText={setNewMemberName}
            />

            <TouchableOpacity style={styles.dialogPrimaryBtn} onPress={handleAddMember}>
              <Text style={styles.dialogPrimaryBtnText}>+ Add Friend</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dialogCloseBtn} onPress={() => setAddMemberModalVisible(false)}>
              <Text style={styles.dialogCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      {activeGroup && (
        <QRCodeModal
          visible={qrModalVisible}
          groupName={activeGroup.name}
          inviteToken={activeGroup.inviteToken}
          onClose={() => setQrModalVisible(false)}
        />
      )}

      {/* Coffee Roulette Modal */}
      <Modal visible={rouletteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.rouletteModalCard}>
            <Text style={styles.rouletteModalTag}>🎲 Coffee Roulette</Text>
            <Text style={styles.rouletteModalEmoji}>{isSpinning ? '🎰' : '☕'}</Text>
            <Text style={styles.rouletteWinner}>
              {rouletteWinner || 'Who will pay?'}
            </Text>
            <Text style={styles.rouletteModalSub}>
              {isSpinning ? 'Spinning...' : 'Tap spin to randomly pick today’s payer!'}
            </Text>

            <TouchableOpacity
              style={styles.spinBtn}
              activeOpacity={0.8}
              onPress={handleSpinRoulette}
              disabled={isSpinning}
            >
              <Text style={styles.spinBtnText}>🎰 Spin the Wheel!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setRouletteModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  logoEmoji: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencyPill: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  currencyPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  langPill: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  langPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  headerBtn: {
    backgroundColor: '#131B2E',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scrollList: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#131B2E',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 4,
    letterSpacing: -1,
  },
  heroStatus: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  paidBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconBadgePaid: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 13, 22, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  paidBtnText: {
    color: '#090D16',
    fontWeight: '900',
    fontSize: 13,
    textAlign: 'center',
  },
  settleBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconBadgeSettle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  settleBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    textAlign: 'center',
  },
  kittyCard: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 12,
  },
  kittyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kittyIcon: {
    fontSize: 22,
  },
  kittyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kittyTitle: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '800',
  },
  activeTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
  },
  kittySubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  kittyRight: {
    alignItems: 'flex-end',
  },
  kittyAmount: {
    color: '#10B981',
    fontWeight: '900',
    fontSize: 15,
  },
  kittyAddText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  shortcutGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  rouletteCard: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartsCard: {
    flex: 1,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shortcutEmoji: {
    fontSize: 20,
  },
  rouletteTitle: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '800',
  },
  chartsTitle: {
    color: '#D8B4FE',
    fontSize: 12,
    fontWeight: '800',
  },
  shortcutSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  mealCard: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.25)',
    marginBottom: 16,
    gap: 10,
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealTextWrap: {
    flex: 1,
  },
  mealTitle: {
    color: '#E9D5FF',
    fontSize: 13,
    fontWeight: '800',
  },
  mealSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  billsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  billsCountBadge: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBillsCard: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyBillsText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  billItemCard: {
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  billItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  billItemIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  billItemEmoji: {
    fontSize: 18,
  },
  billItemInfo: {
    flex: 1,
  },
  billItemTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  billItemPayers: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  billItemDate: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 2,
  },
  billItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  billItemAmount: {
    color: '#10B981',
    fontWeight: '900',
    fontSize: 14,
  },
  billDeleteBtn: {
    padding: 3,
  },
  groupHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addMemberHeaderBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  addMemberHeaderText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '800',
  },
  exportText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  memberCard: {
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  memberSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  memberDeleteBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: '#131B2E',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  dialogSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  currencyOption: {
    backgroundColor: '#090D16',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  activeCurrencyOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  currencyOptionCode: {
    color: '#CBD5E1',
    fontWeight: '800',
    fontSize: 12,
  },
  activeCurrencyCode: {
    color: '#10B981',
  },
  dialogInput: {
    backgroundColor: '#090D16',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
    fontSize: 14,
    marginBottom: 12,
  },
  dialogPrimaryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dialogPrimaryBtnText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '900',
  },
  dialogCloseBtn: {
    marginTop: 10,
    alignItems: 'center',
  },
  dialogCloseText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  rouletteModalCard: {
    backgroundColor: '#131B2E',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  rouletteModalTag: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rouletteModalEmoji: {
    fontSize: 48,
    marginVertical: 14,
  },
  rouletteWinner: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
  },
  rouletteModalSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  spinBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  spinBtnText: {
    color: '#090D16',
    fontWeight: '900',
    fontSize: 15,
  },
  closeModalBtn: {
    marginTop: 12,
    padding: 8,
  },
  closeModalText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
});
