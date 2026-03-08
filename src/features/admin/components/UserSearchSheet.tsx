import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import { adminService } from '../services/admin.service';

export interface UserSearchResult {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

interface UserSearchSheetProps {
  onSelect: (user: UserSearchResult) => void;
  placeholder?: string;
}

export const UserSearchSheet = forwardRef<BottomSheetModal, UserSearchSheetProps>(
  ({ onSelect, placeholder }, ref) => {
    const { t } = useTranslation();
    const snapPoints = useMemo(() => ['75%'], []);
    const [query, setQuery] = useState('');

    const trimmed = query.trim();
    const { data: users = [], isLoading } = useQuery({
      queryKey: ['user-search', trimmed],
      queryFn: async () => {
        const { data, error } = await adminService.searchUsersForAssignment(trimmed);
        if (error) throw error;
        return (data ?? []) as UserSearchResult[];
      },
      enabled: trimmed.length === 0 || trimmed.length >= 2,
    });

    const handleSelect = useCallback((user: UserSearchResult) => {
      onSelect(user);
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [onSelect, ref]);

    const resetState = useCallback(() => {
      setQuery('');
    }, []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={resetState}
        enableDynamicSizing={false}
        enablePanDownToClose
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={lightTheme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder ?? t('admin.programAdmin.team.searchUsers')}
              placeholderTextColor={lightTheme.textSecondary}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={lightTheme.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
          </View>
        ) : (
          <BottomSheetFlatList<UserSearchResult>
            data={users}
            keyExtractor={(item: UserSearchResult) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('common.noResults')}</Text>
              </View>
            }
            renderItem={({ item }: { item: UserSearchResult }) => (
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
                  <Text style={styles.rowRole} numberOfLines={1}>
                    {item.role.replace('_', ' ')}
                  </Text>
                </View>
                <Badge label={item.role} variant="default" size="sm" />
              </Pressable>
            )}
          />
        )}
      </BottomSheetModal>
    );
  },
);

UserSearchSheet.displayName = 'UserSearchSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
  },
  handleIndicator: {
    backgroundColor: colors.neutral[300],
    width: normalize(36),
    height: normalize(4),
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightTheme.border,
    paddingHorizontal: spacing.md,
    height: normalize(44),
  },
  searchInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
    height: '100%',
  },
  loadingContainer: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
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
  rowRole: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textTransform: 'capitalize',
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
