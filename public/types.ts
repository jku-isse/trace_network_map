import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface TraceNetworkMapPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TraceNetworkMapPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
