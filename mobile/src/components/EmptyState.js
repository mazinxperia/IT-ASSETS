import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PackageOpen, Users, Archive, ArrowLeftRight, CreditCard } from 'lucide-react-native';
import { FONTS, SPACING } from '../constants/theme';

const ICONS = {
  assets: PackageOpen,
  employees: Users,
  inventory: Archive,
  transfers: ArrowLeftRight,
  subscriptions: CreditCard,
  default: PackageOpen,
};

const EmptyState = ({
  type = 'default',
  title = 'Nothing here yet',
  message = 'Add some items to get started.',
  actionLabel,
  onAction,
  colors,
}) => {
  const Icon = ICONS[type] || ICONS.default;

  return (
    <View style={styles.container} testID="empty-state">
      <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
        <Icon size={36} color={colors.accent} strokeWidth={1.5} />
      </View>
      <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.accent }]}
          onPress={onAction}
          testID="empty-state-action"
        >
          <Text style={[styles.btnText, { fontFamily: FONTS.semiBold }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});

export default EmptyState;
