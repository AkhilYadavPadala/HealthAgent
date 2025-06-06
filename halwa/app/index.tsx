import { registerRootComponent } from 'expo';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Layout from './_layout';

const App = () => {
  return (
    <NavigationContainer>
      <Layout />
    </NavigationContainer>
  );
};

registerRootComponent(App);
