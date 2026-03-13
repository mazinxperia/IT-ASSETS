import React from 'react';
import { Easing } from 'react-native';

import { createStackNavigator } from '@react-navigation/stack';

import AssetsHubScreen          from '../screens/main/AssetsHubScreen';
import AssetListScreen          from '../screens/main/AssetListScreen';
import AssetDetailScreen        from '../screens/main/AssetDetailScreen';
import AddAssetScreen           from '../screens/main/AddAssetScreen';
import EmployeeListScreen       from '../screens/main/EmployeeListScreen';
import EmployeeDetailScreen     from '../screens/main/EmployeeDetailScreen';
import AddEmployeeScreen        from '../screens/main/AddEmployeeScreen';
import SubscriptionListScreen   from '../screens/main/SubscriptionListScreen';
import SubscriptionDetailScreen from '../screens/main/SubscriptionDetailScreen';
import AddSubscriptionScreen    from '../screens/main/AddSubscriptionScreen';
import InventoryScreen          from '../screens/main/InventoryScreen';
import TransferScreen           from '../screens/main/TransferScreen';

const Stack = createStackNavigator();

const sharedOptions = {
  headerShown: false,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  gestureResponseDistance: 25,
  transitionSpec: {
    open:  { animation: 'timing', config: { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) } },
    close: { animation: 'timing', config: { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) } },
  },
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [{
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.width, 0],
        }),
      }],
    },
  }),
};

const AssetsStack = ({ tabIndex, onNavigatorReady }) => {
  return (
    <Stack.Navigator screenOptions={sharedOptions}>
      {/* Root screen — disable swipe-back so tab swipe works */}
      <Stack.Screen name="AssetsHub" options={{ gestureEnabled: false }}>
        {(props) => {
          if (onNavigatorReady) onNavigatorReady(props.navigation);
          return <AssetsHubScreen {...props} tabIndex={tabIndex} />;
        }}
      </Stack.Screen>
      <Stack.Screen name="AssetList"          component={AssetListScreen} />
      <Stack.Screen name="AssetDetail"        component={AssetDetailScreen} />
      <Stack.Screen name="AddAsset"           component={AddAssetScreen} />
      <Stack.Screen name="EmployeeList"       component={EmployeeListScreen} />
      <Stack.Screen name="EmployeeDetail"     component={EmployeeDetailScreen} />
      <Stack.Screen name="AddEmployee"        component={AddEmployeeScreen} />
      <Stack.Screen name="SubscriptionList"   component={SubscriptionListScreen} />
      <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
      <Stack.Screen name="AddSubscription"    component={AddSubscriptionScreen} />
      <Stack.Screen name="Inventory"          component={InventoryScreen} />
      <Stack.Screen name="Transfer"           component={TransferScreen} />
    </Stack.Navigator>
  );
};

export default AssetsStack;
