import {Core} from "cytoscape";
import React from "react";
import {EuiButton, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import { MutableRefObject } from "react";
import { FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';

interface ZoomProps {
  cyRef:MutableRefObject<Core|undefined>,
}

export const Zoom = ({ cyRef }: ZoomProps) => {
  const rate = .5;

  function onZoomInCLick() {
    cyRef.current?.zoom(cyRef.current.zoom() + rate);
  }

  function onZoomOutClick() {
    cyRef.current?.zoom(cyRef.current.zoom() - rate);
  }

  return (
    <EuiFlexGroup alignItems="baseline" justifyContent="flexStart">
      <EuiFlexItem grow={false}>
        <FormattedMessage
          id="traceNetworkMap.zoom"
          defaultMessage="Zoom"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton
          onClick={onZoomInCLick}
          title={i18n.translate('traceNetworkMap.zoomIn', {defaultMessage: 'zoom in'})}>
          +
        </EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton
          onClick={onZoomOutClick}
          title={i18n.translate('traceNetworkMap.zoomOut', {defaultMessage: 'zoom out'})}>
          -
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
