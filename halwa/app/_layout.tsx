import React from 'react';
import { Provider } from 'react-native-paper';
import DrawerNavigator from './navigation/DrawerNavigator';

const Layout = () => {
  return (
    <Provider>
      <DrawerNavigator />
    </Provider>
  );
};

export default Layout;
