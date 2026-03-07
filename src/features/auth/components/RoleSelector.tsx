import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { lightTheme, spacing, fontSize, fontWeight, radius, primary } from '@/theme';
import type { UserRole } from '@/types/common.types';

interface RoleSelectorProps {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  allowedRoles?: UserRole[];
}

interface RoleOption {
  role: UserRole;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
}

const ALL_ROLE_OPTIONS: RoleOption[] = [
  { role: 'student', icon: 'school-outline', labelKey: 'auth.role.student' },
  { role: 'teacher', icon: 'person-outline', labelKey: 'auth.role.teacher' },
  { role: 'parent', icon: 'people-outline', labelKey: 'auth.role.parent' },
  { role: 'supervisor', icon: 'eye-outline', labelKey: 'auth.role.supervisor' },
  { role: 'program_admin', icon: 'briefcase-outline', labelKey: 'auth.role.program_admin' },
  { role: 'master_admin', icon: 'shield-outline', labelKey: 'auth.role.master_admin' },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange, allowedRoles }) => {
  const { t } = useTranslation();

  const visibleOptions = allowedRoles
    ? ALL_ROLE_OPTIONS.filter((option) => allowedRoles.includes(option.role))
    : ALL_ROLE_OPTIONS;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.selectRole')}</Text>
      <View style={styles.grid}>
        {visibleOptions.map((option) => {
          const isSelected = value === option.role;

          return (
            <Pressable
              key={option.role}
              onPress={() => onChange(option.role)}
              style={styles.cardWrapper}
              accessibilityLabel={t(option.labelKey)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Card
                style={
                  isSelected
                    ? { ...styles.card, ...styles.cardSelected }
                    : styles.card
                }
              >
                <View style={styles.cardContent}>
                  <Ionicons
                    name={option.icon}
                    size={32}
                    color={isSelected ? lightTheme.primary : lightTheme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.roleLabel,
                      isSelected && styles.roleLabelSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: lightTheme.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  cardWrapper: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderWidth: 2,
    borderColor: lightTheme.border,
    borderRadius: radius.md,
  },
  cardSelected: {
    borderColor: lightTheme.primary,
    backgroundColor: primary[50],
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: lightTheme.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  roleLabelSelected: {
    color: lightTheme.primary,
    fontWeight: fontWeight.semiBold,
  },
});
