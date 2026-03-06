import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Pressable } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import { adminService } from '../services/admin.service';

interface UserSearchResult {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

interface UserSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: UserSearchResult) => void;
  placeholder?: string;
}

export function UserSearchSheet({ isOpen, onClose, onSelect, placeholder }: UserSearchSheetProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%'], []);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const { data, error } = await adminService.searchUsersForAssignment(text.trim());
      if (data && !error) {
        setResults(data as UserSearchResult[]);
      }
      setIsSearching(false);
    }, 300);
  }, []);

  const handleSelect = useCallback((user: UserSearchResult) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    onClose();
  }, [onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
    >
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder ?? t('admin.programAdmin.team.searchUsers')}
          placeholderTextColor={lightTheme.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
      </View>

      <BottomSheetFlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.length >= 2 && !isSearching ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('common.noResults')}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => handleSelect(item)}
            accessibilityRole="button"
            accessibilityLabel={item.full_name}
          >
            <Avatar
              source={item.avatar_url ?? undefined}
              name={item.full_name}
              size="sm"
            />
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>{item.full_name}</Text>
              <Text style={styles.rowEmail} numberOfLines={1}>{item.email}</Text>
            </View>
            <Badge label={item.role} variant="default" size="sm" />
          </Pressable>
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.border,
  },
  searchInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    backgroundColor: lightTheme.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightTheme.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: normalize(44),
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  rowEmail: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
