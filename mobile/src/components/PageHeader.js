import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../constants/theme';

const PageHeader = ({ title, colors }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 54,
    letterSpacing: -1.5,
    lineHeight: 60,
  },
});

export default PageHeader;
