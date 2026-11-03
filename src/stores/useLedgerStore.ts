import { create } from 'zustand';
import { simplifyDebts, MemberBalance, SimplifiedTransaction, calculateMultiPayerNetDeltas } from '../core/math/debt_simplifier';
import { OfflineSyncQueue } from '../db/syncQueue';

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  isCurrentUser?: boolean;
  phone?: string;
  email?: string;
}

export interface ExpenseRecord {
  id: string;
  groupId: string;
  description: string;
  category: string;
  amountCents: bigint;
  payerMode: 'single' | 'multi' | 'kitty';
  splitMode?: 'equal' | 'loan';
  loanBeneficiaryId?: string;
  paidByMemberId?: string;
  multiPayers?: { memberId: string; amountCents: bigint }[];
  splitWithMemberIds: string[];
  createdAt: number;
}

export interface GroupRecord {
  id: string;
  name: string;
  icon: string;
  inviteToken: string;
  budgetTotalCents: bigint;
  kittyBalanceCents: bigint;
  members: Member[];
}

export interface CategoryTag {
  name: string;
  icon: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
}

interface LedgerState {
  currentUserId: string;
  isPrivacyMode: boolean;
  activeGroupId: string;
  currency: CurrencyConfig;
  language: 'EN' | 'UR' | 'HI' | 'ES';
  groups: GroupRecord[];
  expenses: Record<string, ExpenseRecord[]>; // groupId -> expenses
  categories: CategoryTag[];
  syncQueue: OfflineSyncQueue;
  simplifyDebts: boolean;
  isAppLocked: boolean;
  isOffline: boolean;
  deletedExpenses: (ExpenseRecord & { groupId: string; originalIndex: number })[];

  // Actions
  toggleSimplifyDebts: () => void;
  lockApp: () => void;
  unlockApp: () => void;
  toggleNetworkMode: () => void;
  undoLastDelete: () => void;
  setCurrency: (currency: CurrencyConfig) => void;
  setLanguage: (lang: 'EN' | 'UR' | 'HI' | 'ES') => void;
  addMemberToGroup: (groupId: string, name: string) => void;
  deleteMemberFromGroup: (groupId: string, memberId: string) => void;
  deleteExpense: (groupId: string, expenseId: string) => void;
  togglePrivacyMode: () => void;
  setActiveGroup: (groupId: string) => void;
  topUpKitty: (groupId: string, amountCents: bigint) => void;
  addCustomTag: (name: string, icon?: string) => void;
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  getGroupBalances: (groupId: string) => MemberBalance[];
  getSimplifiedSettlements: (groupId: string) => SimplifiedTransaction[];
  switchActiveUser: (memberId: string) => void;
  updateMemberProfile: (groupId: string, memberId: string, profile: Partial<Member>) => void;
  markDebtSettled: (groupId: string, fromId: string, toId: string, amountCents: bigint) => void;
  spinCoffeeRoulette: (groupId: string) => Member | null;
}

export const useLedgerStore = create<LedgerState>((set, get) => {
  const syncQueue = new OfflineSyncQueue();

  return {
    currentUserId: 'user_me',
    isPrivacyMode: false,
    activeGroupId: 'g_trip',
    currency: { code: 'PKR', symbol: 'Rs' },
    language: 'UR',
    syncQueue,
    simplifyDebts: true,
    isAppLocked: false,
    isOffline: false,
    deletedExpenses: [],

    toggleSimplifyDebts: () => set((state) => ({ simplifyDebts: !state.simplifyDebts })),
    lockApp: () => set({ isAppLocked: true }),
    unlockApp: () => set({ isAppLocked: false }),
    toggleNetworkMode: () => set((state) => ({ isOffline: !state.isOffline })),

    undoLastDelete: () => {
      const state = get();
      if (state.deletedExpenses.length === 0) return;
      const last = state.deletedExpenses[0];
      const rest = state.deletedExpenses.slice(1);
      const groupExps = state.expenses[last.groupId] || [];
      const restored = [...groupExps];
      restored.splice(last.originalIndex, 0, last);
      set({
        expenses: {
          ...state.expenses,
          [last.groupId]: restored,
        },
        deletedExpenses: rest,
      });
    },

    categories: [
      { name: 'Loan', icon: '💰' },
      { name: 'Burgers', icon: '🍔' },
      { name: 'Pizza', icon: '🍕' },
      { name: 'Groceries', icon: '🛒' },
      { name: 'Uber / Taxi', icon: '🚕' },
      { name: 'Coffee', icon: '☕' },
      { name: 'Movie / Cinema', icon: '🎬' },
      { name: 'Badminton / Sports', icon: '🏸' },
      { name: 'Hotel / Stay', icon: '🏨' },
    ],

    groups: [
      {
        id: 'g_trip',
        name: 'Friends Group 🤝',
        icon: '🤝',
        inviteToken: 'fairshare-group-2026',
        budgetTotalCents: 50000000n, // Rs 500,000.00
        kittyBalanceCents: 0n,
        members: [
          { id: 'user_me', name: 'You', isCurrentUser: true, phone: '+92 300 1234567', email: 'you@fairshare.app' },
          { id: 'user_arslan', name: 'arslan', phone: '+92 312 9876543', email: 'arslan@gmail.com' },
          { id: 'user_irfan', name: 'Irfan', phone: '+92 333 5551234', email: 'irfan@gmail.com' },
        ],
      },
    ],

    expenses: {
      g_trip: [
        {
          id: 'exp_loan_1000k',
          groupId: 'g_trip',
          description: 'Loan',
          category: 'Loan',
          amountCents: 100000000n, // Rs 1,000,000.00
          payerMode: 'multi',
          multiPayers: [
            { memberId: 'user_arslan', amountCents: 40000000n },
            { memberId: 'user_irfan', amountCents: 60000000n },
          ],
          splitMode: 'loan',
          loanBeneficiaryId: 'user_me',
          splitWithMemberIds: ['user_me'],
          createdAt: Date.now(),
        },
      ],
    },

    togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),

    setCurrency: (currency) => set({ currency }),

    setLanguage: (language) => set({ language }),

    addMemberToGroup: (groupId, name) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      const newMember: Member = {
        id: `user_${Date.now()}`,
        name: cleanName,
      };
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId
            ? { ...g, members: [...g.members, newMember] }
            : g
        ),
      }));
    },

    deleteMemberFromGroup: (groupId, memberId) => {
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId
            ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
            : g
        ),
      }));
    },

    deleteExpense: (groupId, expenseId) => {
      const state = get();
      const groupExps = state.expenses[groupId] || [];
      const idx = groupExps.findIndex((e) => e.id === expenseId);
      if (idx === -1) return;
      const deletedItem = { ...groupExps[idx], groupId, originalIndex: idx };
      set({
        expenses: {
          ...state.expenses,
          [groupId]: groupExps.filter((e) => e.id !== expenseId),
        },
        deletedExpenses: [deletedItem, ...state.deletedExpenses],
      });
    },

    setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

    switchActiveUser: (memberId) => set({ currentUserId: memberId }),

    updateMemberProfile: (groupId, memberId, profile) => {
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                members: g.members.map((m) =>
                  m.id === memberId ? { ...m, ...profile } : m
                ),
              }
            : g
        ),
      }));
    },

    topUpKitty: (groupId, amountCents) => {
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId
            ? { ...g, kittyBalanceCents: g.kittyBalanceCents + amountCents }
            : g
        ),
      }));
    },

    addCustomTag: (name, icon = '🏷️') => {
      set((state) => {
        const exists = state.categories.some(
          (c) => c.name.toLowerCase() === name.toLowerCase().trim()
        );
        if (exists) return state;
        return {
          categories: [{ name: name.trim(), icon }, ...state.categories],
        };
      });
    },

    addExpense: (expenseData) => {
      const newExpense: ExpenseRecord = {
        ...expenseData,
        id: `exp_${Date.now()}`,
        createdAt: Date.now(),
      };

      set((state) => {
        // If paid from Kitty, deduct from group's kitty balance
        let updatedGroups = state.groups;
        if (expenseData.payerMode === 'kitty') {
          updatedGroups = state.groups.map((g) =>
            g.id === expenseData.groupId
              ? {
                  ...g,
                  kittyBalanceCents:
                    g.kittyBalanceCents > expenseData.amountCents
                      ? g.kittyBalanceCents - expenseData.amountCents
                      : 0n,
                }
              : g
          );
        }

        const groupExp = state.expenses[expenseData.groupId] || [];
        return {
          groups: updatedGroups,
          expenses: {
            ...state.expenses,
            [expenseData.groupId]: [newExpense, ...groupExp],
          },
        };
      });

      // Background offline sync queue
      get().syncQueue.enqueue('expenses', 'INSERT', {
        id: newExpense.id,
        group_id: newExpense.groupId,
        description: newExpense.description,
        total_amount_cents: Number(newExpense.amountCents),
      });
    },

    getGroupBalances: (groupId) => {
      const state = get();
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) return [];

      const groupExpenses = state.expenses[groupId] || [];
      const balanceMap = new Map<string, bigint>();

      // Initialize all members with 0
      group.members.forEach((m) => balanceMap.set(m.id, 0n));

      for (const exp of groupExpenses) {
        // If paid from kitty, nobody owes anyone personally
        if (exp.payerMode === 'kitty') continue;

        const total = exp.amountCents;

        // 1. Credit payers
        if (exp.payerMode === 'multi' && exp.multiPayers) {
          for (const payer of exp.multiPayers) {
            balanceMap.set(payer.memberId, (balanceMap.get(payer.memberId) || 0n) + payer.amountCents);
          }
        } else {
          const payer = exp.paidByMemberId || 'user_me';
          balanceMap.set(payer, (balanceMap.get(payer) || 0n) + total);
        }

        // 2. Debit shares / debt
        if (exp.splitMode === 'loan' && exp.loanBeneficiaryId) {
          // Direct Loan: the beneficiary alone owes the full 100% amount!
          balanceMap.set(exp.loanBeneficiaryId, (balanceMap.get(exp.loanBeneficiaryId) || 0n) - total);
        } else {
          // Equal split among participants
          const participants = exp.splitWithMemberIds;
          if (participants.length > 0) {
            const share = total / BigInt(participants.length);
            for (const partId of participants) {
              balanceMap.set(partId, (balanceMap.get(partId) || 0n) - share);
            }
          }
        }
      }

      return Array.from(balanceMap.entries()).map(([memberId, netBalanceCents]) => ({
        memberId,
        netBalanceCents,
      }));
    },

    getSimplifiedSettlements: (groupId) => {
      const balances = get().getGroupBalances(groupId);
      return simplifyDebts(balances);
    },

    markDebtSettled: (groupId, fromId, toId, amountCents) => {
      get().addExpense({
        groupId,
        description: 'Settlement Payment',
        category: 'Settlement',
        amountCents,
        payerMode: 'single',
        paidByMemberId: fromId,
        splitWithMemberIds: [toId],
      });
    },

    spinCoffeeRoulette: (groupId) => {
      const group = get().groups.find((g) => g.id === groupId);
      if (!group || group.members.length === 0) return null;
      const idx = Math.floor(Math.random() * group.members.length);
      return group.members[idx];
    },
  };
});
