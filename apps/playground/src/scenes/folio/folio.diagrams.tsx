import type { ReactElement } from 'react';
import { ArrowRightIcon, DatabaseIcon, GlobeIcon } from '@phosphor-icons/react';
import { Icon } from '../../prototypes/icon/icon.proto.js';

export function DatabaseTopology(): ReactElement {
  return (
    <div
      className="folio-topology"
      role="img"
      aria-label="Primary PostgreSQL writer replicates to a synchronous replica and a standby replica"
    >
      <div className="folio-topology-node">
        <Icon icon={DatabaseIcon} />
        <strong>Primary</strong>
        <span>writer · RW</span>
      </div>
      <div className="folio-topology-connector">
        <Icon icon={ArrowRightIcon} size="s" />
      </div>
      <div className="folio-topology-branches">
        <div className="folio-topology-node" data-health="healthy">
          <strong>Replica A</strong>
          <span>sync · 0 ms</span>
        </div>
        <div className="folio-topology-node">
          <strong>Replica B</strong>
          <span>standby</span>
        </div>
      </div>
    </div>
  );
}

export function IngressTopology(): ReactElement {
  return (
    <div
      className="folio-topology folio-topology-ingress"
      role="img"
      aria-label="Global ingress sends all traffic to eu-west-1 while us-east-1 drains"
    >
      <div className="folio-topology-node" data-health="healthy">
        <Icon icon={GlobeIcon} />
        <strong>eu-west-1</strong>
        <span>100%</span>
      </div>
      <div className="folio-topology-connector">
        <Icon icon={ArrowRightIcon} size="s" />
      </div>
      <div className="folio-topology-node">
        <Icon icon={GlobeIcon} />
        <strong>us-east-1</strong>
        <span>0% · drain</span>
      </div>
    </div>
  );
}
