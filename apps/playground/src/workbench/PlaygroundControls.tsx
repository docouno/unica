import { useId } from 'react';
import type { ReactElement } from 'react';
import { evaluate, finiteDomain, ruleAffects, showValue } from './schema.js';
import type {
  ComponentDefinition,
  Constraint,
  PropDefinition,
  PropValue,
  Values,
} from './types.js';

function RuleReasons({ rules }: { readonly rules: readonly Constraint[] }): ReactElement | null {
  if (rules.length === 0) {
    return null;
  }
  return (
    <ul className="wb-control-reasons">
      {rules.map((rule, index) => (
        <li key={index} data-rule={rule.kind}>
          {rule.reason}
        </li>
      ))}
    </ul>
  );
}

interface ControlProps {
  readonly propKey: string;
  readonly prop: PropDefinition;
  readonly value: PropValue | undefined;
  readonly numberDraft: string | undefined;
  readonly assignment: Values;
  readonly constraints: ComponentDefinition['constraints'];
  readonly matches: readonly Constraint[];
  readonly onValue: (value: PropValue) => void;
  readonly onNumber: (text: string) => void;
}

function PropControl({
  propKey,
  prop,
  value,
  numberDraft,
  assignment,
  constraints,
  matches,
  onValue,
  onNumber,
}: ControlProps): ReactElement {
  const descriptionId = useId();
  const label = prop.label ?? propKey;
  if (prop.kind === 'action') {
    return (
      <div className="wb-control">
        <span className="wb-control-label">{label}</span>
        <span className="wb-control-description">{prop.description}</span>
      </div>
    );
  }

  const current = value ?? prop.default;
  const currentRules = matches.filter((rule) => ruleAffects(rule, propKey, current));
  const blockedFor = (candidate: PropValue): readonly Constraint[] =>
    candidate === current
      ? []
      : evaluate(constraints, { ...assignment, [propKey]: candidate }).matches.filter(
          (rule) => rule.kind === 'forbidden' && !matches.includes(rule),
        );
  const choices =
    prop.kind === 'enum' || prop.kind === 'slot'
      ? finiteDomain(prop).map((choice) => ({
          choice,
          label: showValue(prop, choice),
          blocked: blockedFor(choice),
        }))
      : [];
  const blockedToggle = prop.kind === 'boolean' ? blockedFor(!current) : [];
  const invalidNumber =
    prop.kind === 'number' && numberDraft !== undefined && numberDraft.trim() === '';
  const isInvalid = invalidNumber || currentRules.some((rule) => rule.kind === 'forbidden');
  const inputAttrs = { 'aria-describedby': descriptionId, 'aria-invalid': isInvalid || undefined };
  let input: ReactElement;
  if (prop.kind === 'boolean') {
    input = (
      <span className="wb-checkbox">
        <input
          {...inputAttrs}
          type="checkbox"
          checked={current === true}
          disabled={blockedToggle.length > 0}
          onChange={(event) => onValue(event.currentTarget.checked)}
        />
        <span className="wb-check-mark" aria-hidden="true" />
      </span>
    );
  } else if (prop.kind === 'enum' || prop.kind === 'slot') {
    input = (
      <select
        {...inputAttrs}
        className="wb-field"
        value={String(current)}
        onChange={(event) => onValue(event.currentTarget.value)}
      >
        {choices.map(({ choice, blocked, label: choiceLabel }) => (
          <option key={String(choice)} value={String(choice)} disabled={blocked.length > 0}>
            {choiceLabel}
          </option>
        ))}
      </select>
    );
  } else if (prop.kind === 'number') {
    input = (
      <input
        {...inputAttrs}
        className="wb-field"
        type="number"
        step="any"
        value={numberDraft ?? String(current)}
        onChange={(event) => onNumber(event.currentTarget.value)}
      />
    );
  } else {
    input = (
      <input
        {...inputAttrs}
        className="wb-field"
        type="text"
        value={String(current)}
        onChange={(event) => onValue(event.currentTarget.value)}
      />
    );
  }

  return (
    <div
      className="wb-control"
      data-ignored={currentRules.some((rule) => rule.kind !== 'forbidden') || undefined}
    >
      <label className="wb-control-field">
        <span className="wb-control-label">{label}</span>
        {input}
      </label>
      <div id={descriptionId} className="wb-control-description">
        <span className="wb-control-description">{prop.description}</span>
        {invalidNumber && <div>Enter a number.</div>}
        <RuleReasons rules={currentRules} />
        <RuleReasons rules={blockedToggle} />
        {choices
          .filter(({ blocked }) => blocked.length > 0)
          .map(({ choice, blocked, label: choiceLabel }) => (
            <div className="wb-control-disabled-option" key={String(choice)}>
              <span>{choiceLabel}</span>
              <RuleReasons rules={blocked} />
            </div>
          ))}
      </div>
    </div>
  );
}

export function PlaygroundControls({
  component,
  draft,
  numberDrafts,
  matches,
  onValue,
  onNumber,
  onReset,
}: {
  readonly component: ComponentDefinition;
  readonly draft: Values;
  readonly numberDrafts: Readonly<Record<string, string>>;
  readonly matches: readonly Constraint[];
  readonly onValue: (key: string, value: PropValue) => void;
  readonly onNumber: (key: string, text: string) => void;
  readonly onReset: () => void;
}): ReactElement | null {
  const groups = new Map<string, [string, PropDefinition][]>();
  for (const entry of Object.entries(component.props)) {
    const [, prop] = entry;
    const group = groups.get(prop.group) ?? [];
    group.push(entry);
    groups.set(prop.group, group);
  }
  if (groups.size === 0) {
    return null;
  }

  return (
    <section className="wb-inspector-controls" aria-label="Component controls">
      <header className="wb-inspector-panel-heading">
        <h2>Controls</h2>
        <button type="button" className="wb-action-btn" onClick={onReset}>
          Reset props
        </button>
      </header>
      <div className="wb-control-groups">
        {[...groups].map(([group, props]) => (
          <fieldset className="wb-control-group" key={group}>
            <legend>{group}</legend>
            {props.map(([key, prop]) => (
              <PropControl
                key={key}
                propKey={key}
                prop={prop}
                value={draft[key]}
                numberDraft={numberDrafts[key]}
                assignment={draft}
                constraints={component.constraints}
                matches={matches}
                onValue={(value) => onValue(key, value)}
                onNumber={(text) => onNumber(key, text)}
              />
            ))}
          </fieldset>
        ))}
      </div>
    </section>
  );
}
