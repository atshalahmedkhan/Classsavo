import type { TFootnoteElement } from '@platejs/footnote';
import { FootnoteReferencePlugin } from '@platejs/footnote/react';
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from 'platejs/react';
import { cn } from '@/lib/utils';

export function FootnoteReferenceElement(
  props: PlateElementProps<TFootnoteElement>,
) {
  const { editor, element } = props;
  const readOnly = useReadOnly();
  const identifier = element.identifier ?? '';
  const footnoteTransforms = editor.getTransforms(FootnoteReferencePlugin).footnote;
  const footnoteApi = editor.getApi(FootnoteReferencePlugin).footnote;
  const isResolved = identifier ? footnoteApi.isResolved({ identifier }) : false;

  return (
    <PlateElement {...props} as="span" className="inline">
      <sup
        data-testid="footnote-reference"
        contentEditable={false}
        className={cn(
          'cursor-pointer text-xs font-medium text-[#c2622a] underline decoration-[#c2622a]/40 underline-offset-2',
          !isResolved && 'text-[#9a8b82]',
        )}
        onMouseDown={(event) => {
          event.preventDefault();
          if (readOnly || !identifier) return;
          if (isResolved) {
            footnoteTransforms.focusDefinition({ identifier });
          } else {
            footnoteTransforms.createDefinition({ identifier, focus: true });
          }
        }}
      >
        [{identifier}]
      </sup>
      {props.children}
    </PlateElement>
  );
}

export function FootnoteDefinitionElement(
  props: PlateElementProps<TFootnoteElement>,
) {
  const { element } = props;
  const identifier = element.identifier ?? '';

  return (
    <PlateElement {...props} className="my-1 flex gap-2 border-t border-[#e8ddd0] pt-2 text-sm text-[#6b5c52]">
      <div data-testid="footnote-definition" className="flex min-w-0 flex-1 gap-2">
        <span
          className="shrink-0 font-medium text-[#c2622a]"
          contentEditable={false}
        >
          {identifier}.
        </span>
        <div className="min-w-0 flex-1">{props.children}</div>
      </div>
    </PlateElement>
  );
}
