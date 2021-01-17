import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from 'kibana/public';
import { AppPluginStartDependencies } from './types';
import { TraceNetworkMapApp } from './components/app';

export const renderApp = (
  { notifications }: CoreStart,
  { navigation, data }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <TraceNetworkMapApp
      basename={appBasePath}
      notifications={notifications}
      navigation={navigation}
      data={data}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
