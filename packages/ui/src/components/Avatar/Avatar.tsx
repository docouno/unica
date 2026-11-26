import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { defineGlyph } from '../../core/glyph.js';
import { nonBlank, pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { UserGlyph } from '../../internal/glyphs/index.js';
import { Icon } from '../Icon/index.js';
import type { AvatarProps } from './types.js';
import './avatar.css';

const personIcon = /* @__PURE__ */ defineGlyph(UserGlyph, 'native');
let graphemes: Intl.Segmenter | undefined;

function firstGrapheme(text: string): string {
  graphemes ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return graphemes.segment(text).containing(0)?.segment ?? '';
}

function initial(word: string): string {
  return firstGrapheme(firstGrapheme(word).toUpperCase());
}

function initialsFor(name: string | undefined, compact: boolean): string {
  const words = nonBlank(name)?.split(/\s+/u);
  if (!words?.[0]) {
    return '';
  }
  return initial(words[0]) + (compact || words.length === 1 ? '' : initial(words.at(-1) ?? ''));
}

function AvatarImage({
  src,
  srcSet,
  sizes,
  imagePosition,
}: Pick<AvatarProps, 'src' | 'srcSet' | 'sizes' | 'imagePosition'>): ReactElement {
  const [ready, setReady] = useState(false);
  const captureImage = useCallback((image: HTMLImageElement | null) => {
    if (image) {
      setReady(image.complete && image.naturalWidth > 0);
    }
  }, []);

  return (
    <img
      className="unica-avatar-image"
      ref={captureImage}
      sizes={sizes}
      srcSet={srcSet}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-unica-avatar-image-ready={dataFlag(ready)}
      style={imagePosition ? { objectPosition: imagePosition } : undefined}
      onLoad={(event) => setReady(event.currentTarget.naturalWidth > 0)}
      onError={() => setReady(false)}
    />
  );
}

export function AvatarFrame({
  alt,
  name,
  size = 'm',
  compact,
  src,
  srcSet,
  sizes,
  imagePosition,
  fallback,
  id,
  className,
  dir,
  lang,
  hidden,
  inert,
  style,
  ref,
  ...rest
}: AvatarProps & { readonly compact: boolean }): ReactElement {
  const label = nonBlank(alt);
  const source = nonBlank(src);
  const candidates = nonBlank(srcSet);
  const sourceSizes = nonBlank(sizes);
  const customMark = typeof fallback === 'string' && !nonBlank(fallback) ? undefined : fallback;
  const mark =
    customMark ?? (initialsFor(name, compact) || <Icon icon={personIcon} usage="slot" />);

  return (
    <span
      {...pickConsumerDataAttributes(rest, 'data-unica-avatar-')}
      id={id}
      className={cx('unica-avatar', className)}
      dir={dir}
      lang={lang}
      hidden={hidden}
      inert={inert}
      style={style}
      ref={ref}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-unica-avatar-size={size}
    >
      <span className="unica-avatar-fallback" inert aria-hidden="true">
        {typeof mark === 'string' ? (
          <bdi className="unica-avatar-initials" dir="auto">
            {mark}
          </bdi>
        ) : (
          mark
        )}
      </span>
      {(source || candidates) && (
        // Each candidate set owns its image node and readiness from the first commit.
        <AvatarImage
          key={JSON.stringify([source, candidates, sourceSizes])}
          src={source}
          srcSet={candidates}
          sizes={sourceSizes}
          imagePosition={imagePosition}
        />
      )}
    </span>
  );
}

/** A passive identity frame with a native portrait and a predictable fallback. */
export function Avatar(props: AvatarProps): ReactElement {
  return <AvatarFrame {...props} compact={props.size === '2xs'} />;
}
