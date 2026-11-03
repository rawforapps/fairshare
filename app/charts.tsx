import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, PieChart, TrendingUp, DollarSign, Users, Award } from 'lucide-react-native';
import { useLedgerStore } from '../src/stores/useLedgerStore';

export default function ChartsScreen() {
  const router = useRouter();
  const { groups, activeGroupId, expenses, isPrivacyMode, currency } = useLedgerStore();

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const groupExpenses = expenses[activeGroup.id] || [];

  // Total Spent in cents
  let totalSpentCents = 0n;
  const categoryTotals: Record<string, bigint> = {};
  const memberPaidTotals: Record<string, bigint> = {};

  // Initialize members
  activeGroup.members.forEach((m) => {
    memberPaidTotals[m.id] = 0n;
  });

  for (const exp of groupExpenses) {
    totalSpentCents += exp.amountCents;

    // Category aggregation
    const cat = exp.category || 'General';
    categoryTotals[cat] = (categoryTotals[cat] || 0n) + exp.amountCents;

    // Payer aggregation
    if (exp.payerMode === 'multi' && exp.multiPayers) {
      for (const p of exp.multiPayers) {
        memberPaidTotals[p.memberId] = (memberPaidTotals[p.memberId] || 0n) + p.amountCents;
      }
    } else if (exp.paidByMemberId) {
      memberPaidTotals[exp.paidByMemberId] =
        (memberPaidTotals[exp.paidByMemberId] || 0n) + exp.amountCents;
    }
  }

  const totalSpentDollars = Number(totalSpentCents) / 100;
  const budgetDollars = Number(activeGroup.budgetTotalCents) / 100;
  const budgetPercent = budgetDollars > 0 ? Math.min(100, Math.round((totalSpentDollars / budgetDollars) * 100)) : 0;

  // Category List sorted descending
  const categoryList = Object.entries(categoryTotals)
    .map(([cat, cents]) => {
      const dollars = Number(cents) / 100;
      const pct = totalSpentDollars > 0 ? Math.round((dollars / totalSpentDollars) * 100) : 0;
      return { category: cat, dollars, pct };
    })
    .sort((a, b) => b.dollars - a.dollars);

  // Top Spender
  let topSpenderId = '';
  let maxPaid = -1n;
  for (const [mId, paid] of Object.entries(memberPaidTotals)) {
    if (paid > maxPaid) {
      maxPaid = paid;
      topSpenderId = mId;
    }
  }
  const topSpender = activeGroup.members.find((m) => m.id === topSpenderId);

  const formatAmount = (dollars: number) => {
    if (isPrivacyMode) return `${currency.symbol}••••••`;
    return `${currency.symbol}${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const palette = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Spending Analytics</Text>
          <Text style={styles.headerSubtitle}>{activeGroup.name}</Text>
        </View>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>100% Free</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Total Spending & Budget Burn Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSub}>Total Group Spend</Text>
          <Text style={styles.heroAmount}>{formatAmount(totalSpentDollars)}</Text>

          {/* Budget Bar */}
          <View style={styles.budgetRow}>
            <View style={styles.budgetBarTrack}>
              <View
                style={[
                  styles.budgetBarFill,
                  {
                    width: `${budgetPercent}%`,
                    backgroundColor: budgetPercent > 90 ? '#F43F5E' : '#10B981',
                  },
                ]}
              />
            </View>
            <Text style={styles.budgetPercentText}>{budgetPercent}%</Text>
          </View>
          <View style={styles.budgetLegend}>
            <Text style={styles.budgetSpentText}>
              Spent {formatAmount(totalSpentDollars)} of {formatAmount(budgetDollars)} budget
            </Text>
          </View>
        </View>

        {/* Highlight Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <TrendingUp color="#10B981" size={20} />
            <Text style={styles.statLabel}>Total Bills</Text>
            <Text style={styles.statVal}>{groupExpenses.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Award color="#F59E0B" size={20} />
            <Text style={styles.statLabel}>Top Spender</Text>
            <Text style={styles.statVal} numberOfLines={1}>
              {topSpender ? topSpender.name : 'None'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Users color="#3B82F6" size={20} />
            <Text style={styles.statLabel}>Members</Text>
            <Text style={styles.statVal}>{activeGroup.members.length}</Text>
          </View>
        </View>

        {/* Category Breakdown Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <Text style={styles.sectionSub}>Where the group's money went</Text>
          </View>

          {categoryList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No expenses logged yet in this group.</Text>
            </View>
          ) : (
            categoryList.map((item, idx) => {
              const color = palette[idx % palette.length];
              return (
                <View key={item.category} style={styles.catItem}>
                  <View style={styles.catTopRow}>
                    <View style={styles.catNameWrap}>
                      <View style={[styles.catColorDot, { backgroundColor: color }]} />
                      <Text style={styles.catName}>{item.category}</Text>
                    </View>
                    <View style={styles.catAmtWrap}>
                      <Text style={styles.catAmount}>{formatAmount(item.dollars)}</Text>
                      <Text style={styles.catPct}>{item.pct}%</Text>
                    </View>
                  </View>

                  {/* Percentage Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${item.pct}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Member Contribution Breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Member Contributions</Text>
            <Text style={styles.sectionSub}>Who funded what portion so far</Text>
          </View>

          {activeGroup.members.map((m) => {
            const paidDollars = Number(memberPaidTotals[m.id] || 0n) / 100;
            const pct = totalSpentDollars > 0 ? Math.round((paidDollars / totalSpentDollars) * 100) : 0;

            return (
              <View key={m.id} style={styles.memberContribRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>{m.name[0]}</Text>
                </View>
                <View style={styles.memberDetails}>
                  <View style={styles.memberTop}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberPaidAmount}>{formatAmount(paidDollars)}</Text>
                  </View>
                  <View style={styles.memberProgressBarTrack}>
                    <View
                      style={[
                        styles.memberProgressBarFill,
                        { width: `${pct}%`, backgroundColor: '#3B82F6' },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
    padding: 6,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 1,
  },
  freeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  freeBadgeText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 10,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#131B2E',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    alignItems: 'center',
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroAmount: {
    color: '#F8FAFC',
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 6,
    letterSpacing: -0.5,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  budgetBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  budgetPercentText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
  },
  budgetLegend: {
    marginTop: 8,
  },
  budgetSpentText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  statVal: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#131B2E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  emptyWrap: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  catItem: {
    marginBottom: 14,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  catAmtWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catAmount: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  catPct: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  memberContribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  memberInitial: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 14,
  },
  memberDetails: {
    flex: 1,
  },
  memberTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  memberPaidAmount: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  memberProgressBarTrack: {
    height: 5,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  memberProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
