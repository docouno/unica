import type { ReactElement } from 'react';
import { UsersIcon } from '@phosphor-icons/react';
import { Avatar } from '../avatar/avatar.proto.js';
import { Badge } from '../badge/badge.proto.js';
import { Text, Title } from '@docouno/unica';
import './hover-card.examples.css';

// Shared entity content keeps scenes independent of the specimen's study controls.
export function TeamPreview(): ReactElement {
  return (
    <>
      <div className="hover-demo-identity">
        <Avatar name="Database reliability" alt="" size="m" fallback={<UsersIcon size="1em" />} />
        <div className="hover-demo-heading">
          <Title dir="auto" as="h3" size="body-m">
            Database reliability
          </Title>
          <Text dir="auto" size="body-s" color="secondary">
            Core Infrastructure
          </Text>
        </div>
      </div>
      <Text dir="auto" size="body-s" color="secondary">
        Maintains the systems that keep production data available.
      </Text>
      <div className="hover-demo-facts">
        <Badge status="accent" size="s" dot>
          On-call
        </Badge>
        <Text dir="auto" size="caption-l" color="secondary">
          28 runbooks · UTC+1
        </Text>
      </div>
    </>
  );
}
