import React from "react";
import {NodeData} from "../../node_list";
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

  function getZipkinLink(id: string) {
    return 'http://127.0.0.1:9411/zipkin/traces/' + id;
  }

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
        data.data.client && (
          <>
            <p>
              <EuiLink href={getZipkinLink(data.data.client.id)} external>
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
        />function
      </p>
      <EuiSpacer size="s" />
      <EuiText>
        <pre>{JSON.stringify(data.data, undefined, 4)}</pre>
      </EuiText>
    </>
  );
}
