import type { ReactElement } from 'react';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { Icon } from '@docouno/unica';

export function DatabaseTopology(): ReactElement {
  return (
    <div
      className="folio-topology"
      role="img"
      aria-label="Primary PostgreSQL writer replicates to a synchronous replica and a standby replica; recovery time under 30 seconds"
    >
      <div className="folio-topology-caption">
        <strong>POSTGRES · TIER-0</strong>
        <span>RTO &lt; 30s</span>
      </div>
      <div className="folio-topology-chain">
        <div className="folio-topology-node" data-primary>
          <strong>Primary</strong>
          <span>writer · RW</span>
        </div>
        <Icon usage="slot" icon={ArrowRightIcon} directional />
        <div className="folio-topology-node">
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
      className="folio-topology"
      role="img"
      aria-label="Global ingress sends all traffic to eu-west-1 while us-east-1 drains, with zero percent dropped traffic"
    >
      <div className="folio-topology-caption">
        <strong>INGRESS · GLOBAL</strong>
        <span>0% drop</span>
      </div>
      <div className="folio-topology-traffic">
        <div className="folio-topology-route" data-active>
          <span className="folio-topology-dot" />
          <span>eu-west-1</span>
          <span className="folio-topology-track">
            <span />
          </span>
          <span>100%</span>
        </div>
        <div className="folio-topology-route">
          <span className="folio-topology-dot" />
          <span>us-east-1</span>
          <span className="folio-topology-track" />
          <span>0% · drain</span>
        </div>
      </div>
    </div>
  );
}
