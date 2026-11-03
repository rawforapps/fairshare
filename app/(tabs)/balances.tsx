import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, CheckCircle, ExternalLink } from 'lucide-react-native';
import { useLedgerStore } from '../../src/stores/useLedgerStore';
import { generateWhatsAppLink } from '../../src/core/notifications/nudge';
import { generatePaymentDeepLink } from '../../src/core/payments/deeplink';

export default function BalancesScreen() {
  const router = useRouter();
  const {
    activeGroupId,
    groups,
    isPrivacyMode,
    currency,
    getSimplifiedSettlements,
    markDebtSettled,
  } = useLedgerStore();

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const settlements = getSimplifiedSettlements(activeGroup.id);

  const handleWhatsAppNudge = (toMemberName: string, amountCents: bigint) => {
    const link = generateWhatsAppLink({
      recipientName: toMemberName,
      groupName: activeGroup.name,
      amountCents,
      currency: currency.code,
      tone: 'CASUAL',
    });
    Linking.openURL(link).catch(() => {
      Alert.alert('Notice', 'Could not open WhatsApp. Please ensure WhatsApp is installed.');
    });
  };

  const handleOpenPayment = (method: 'VENMO' | 'CASH_APP' | 'REVOLUT' | 'UPI', handle: string, amountCents: bigint) => {
    const url = generatePaymentDeepLink({
      method,
      recipientHandle: handle,
      amountCents,
      currency: 'USD',
      note: `${activeGroup.name} settlement`,
    });
    Linking.openURL(url).catch(() => {
      Alert.alert('Payment App', `Opening ${method} link: ${url}`);
    });
  };

  const handleMarkSettled = (fromId: string, toId: string, amountCents: bigint) => {
    markDebtSettled(activeGroup.id, fromId, toId, amountCents);
    Alert.alert('Settled! 🎉', 'Debt marked as paid and cleared from the ledger.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Balances & Settle Up</Text>
        <View style={styles.groupBadge}>
          <Text style={styles.groupBadgeText}>{activeGroup.name}</Text>
        </View>
      </View>

      <FlatList
        data={settlements}
        keyExtractor={(item, index) => `${item.fromMemberId}_${item.toMemberId}_${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.bannerBox}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>Min-Cash-Flow Active</Text>
            </View>
            <Text style={styles.bannerTitle}>Optimized Payment Plan</Text>
            <Text style={styles.bannerSubtitle}>
              Transitive debts have been simplified to the minimum number of direct transfers!
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>All Settled Up!</Text>
            <Text style={styles.emptySub}>Nobody in this group owes anything right now.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const fromMember = activeGroup.members.find((m) => m.id === item.fromMemberId);
          const toMember = activeGroup.members.find((m) => m.id === item.toMemberId);
          const fromName = fromMember ? fromMember.name : 'Someone';
          const toName = toMember ? toMember.name : 'Someone';

          const dollars = (Number(item.amountCents) / 100).toFixed(2);
          const displayAmount = isPrivacyMode ? `${currency.symbol}••••••` : `${currency.symbol}${dollars}`;

          return (
            <View style={styles.settleCard}>
              <View style={styles.settleTopRow}>
                <View>
                  <Text style={styles.fromText}>{fromName}</Text>
                  <Text style={styles.owesLabel}>needs to pay {toName}</Text>
                </View>
                <Text style={styles.settleAmount}>{displayAmount}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.nudgeBtn}
                  activeOpacity={0.8}
                  onPress={() => handleWhatsAppNudge(fromName, item.amountCents)}
                >
                  <MessageSquare color="#10B981" size={14} />
                  <Text style={styles.nudgeBtnText}>Remind on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.paidBtn}
                  activeOpacity={0.8}
                  onPress={() => handleMarkSettled(item.fromMemberId, item.toMemberId, item.amountCents)}
                >
                  <CheckCircle color="#F8FAFC" size={14} />
                  <Text style={styles.paidBtnText}>Mark Paid</Text>
                </TouchableOpacity>
              </View>

              {/* 1-Tap Deep Link Rails */}
              <View style={styles.deepLinksRow}>
                <TouchableOpacity
                  style={styles.pillBtn}
                  onPress={() => handleOpenPayment('VENMO', fromName.toLowerCase(), item.amountCents)}
                >
                  <Text style={styles.pillText}>Venmo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pillBtn}
                  onPress={() => handleOpenPayment('CASH_APP', fromName.toLowerCase(), item.amountCents)}
                >
                  <Text style={styles.pillText}>Cash App</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pillBtn}
                  onPress={() => handleOpenPayment('REVOLUT', fromName.toLowerCase(), item.amountCents)}
                >
                  <Text style={styles.pillText}>Revolut</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pillBtn}
                  onPress={() => handleOpenPayment('UPI', `${fromName.toLowerCase()}@okaxis`, item.amountCents)}
                >
                  <Text style={styles.pillText}>UPI</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  groupBadge: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  groupBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
  },
  bannerBox: {
    backgroundColor: '#131B2E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  badgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
  },
  bannerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: '#131B2E',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  settleCard: {
    backgroundColor: '#131B2E',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  settleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fromText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  owesLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  settleAmount: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  nudgeBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  nudgeBtnText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 12,
  },
  paidBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paidBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 12,
  },
  deepLinksRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  pillBtn: {
    flex: 1,
    backgroundColor: '#090D16',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
});
