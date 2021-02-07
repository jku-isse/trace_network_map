import React from "react";
import {NodeData} from "../../node/data";
import {EuiButtonGroup, EuiFormRow, EuiLink, EuiSpacer, EuiText, EuiTitle } from "@elastic/eui";
import { FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';

interface NodeDetailsProps {
  data: NodeData,
  hasChildren: boolean,
  childrenVisible: boolean|undefined,
  onChildVisibilityChange: CallableFunction,
}

export const NodeDetails = ({ data, hasChildren, childrenVisible, onChildVisibilityChange }: NodeDetailsProps) => {
  const toggleButtons = [
    {
      id: `childrenVisible`,
      label: i18n.translate('traceNetworkMap.visible', {defaultMessage: 'visible'}),
    },
    {
      id: `childrenHidden`,
      label: i18n.translate('traceNetworkMap.visible', {defaultMessage: 'hidden'}),
    },
  ];

  const zipkinLink = data.getZipkinLink();

  return (
    <>
      <EuiTitle>
        <h2>
          <FormattedMessage
            id="traceNetworkMap.selectedNodeDataHeader"
            defaultMessage="Selected node"
          />
        </h2>
      </EuiTitle>
      <EuiSpacer size="m" />
      {
        hasChildren && (
          <EuiFormRow
            label={i18n.translate('traceNetworkMap.children', {defaultMessage: 'Children'})}>
            <EuiButtonGroup
              options={toggleButtons}
              idSelected={childrenVisible ? 'childrenVisible' : 'childrenHidden'}
              onChange={(id) => onChildVisibilityChange(id === 'childrenVisible')}
            />
          </EuiFormRow>
        )
      }
      <EuiSpacer size="m" />
      {
        zipkinLink && (
          <>
            <p>
              <EuiLink href={zipkinLink} external>
                <FormattedMessage id="traceNetworkMap.traceServerTimeline" defaultMessage="Zipkin timeline" />
              </EuiLink>
            </p>
            <EuiSpacer size="m" />
          </>
        )
      }
      <p>
        <FormattedMessage
          id="traceNetworkMap.traceData"
          defaultMessage="Trace data"
        />
      </p>
      <EuiSpacer size="s" />
      <EuiText>
        <pre>{JSON.stringify(data.getTraceData(), undefined, 4)}</pre>
      </EuiText>
    </>
  );
}
