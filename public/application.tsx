import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { TraceNetworkMapApp } from './components/app';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation, data }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <TraceNetworkMapApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
      data={data}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
