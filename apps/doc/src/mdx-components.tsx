import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { createElement, isValidElement } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { DocMeta } from './components/docs/DocMeta';
import { DocCallout } from './components/docs/DocCallout';
import { DocChecklist } from './components/docs/DocChecklist';
import { MermaidDiagram } from './components/docs/MermaidDiagram';
import { DocCard, DocCardGrid } from './components/docs/DocCardGrid';
import { DocStepFlow } from './components/docs/DocStepFlow';

interface NodeProps {
  className?: string;
  children?: ReactNode;
}

function flattenText(node: ReactNode): string | null {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return null;

  if (Array.isArray(node)) {
    const parts = node
      .map(flattenText)
      .filter((part): part is string => typeof part === 'string' && part.length > 0);

    return parts.length > 0 ? parts.join('') : null;
  }

  if (isValidElement<NodeProps>(node)) {
    return flattenText(node.props.children);
  }

  return null;
}

function extractMermaidChart(node: ReactNode): string | null {
  if (!node) return null;

  if (Array.isArray(node)) {
    const children = node as ReactNode[];
    for (const child of children) {
      const found = extractMermaidChart(child);
      if (found) return found;
    }
    return null;
  }

  if (!isValidElement<NodeProps>(node)) return null;

  const className = typeof node.props.className === 'string' ? node.props.className : '';
  if (className.includes('language-mermaid')) {
    return flattenText(node.props.children);
  }

  return extractMermaidChart(node.props.children);
}

type MermaidPreProps = ComponentProps<'pre'> & {
  children?: ReactNode;
  'data-language'?: unknown;
  lang?: unknown;
};

function hasMermaidLanguage(props: MermaidPreProps): boolean {
  const className = typeof props.className === 'string' ? props.className : '';
  const dataLanguage = typeof props['data-language'] === 'string' ? props['data-language'] : '';
  const lang = typeof props.lang === 'string' ? props.lang : '';

  return (
    className.includes('language-mermaid')
    || dataLanguage.toLowerCase() === 'mermaid'
    || lang.toLowerCase() === 'mermaid'
  );
}

function MermaidAwarePre(props: MermaidPreProps) {
  const chart = hasMermaidLanguage(props)
    ? flattenText(props.children)
    : extractMermaidChart(props.children);

  if (chart) {
    return <MermaidDiagram chart={chart} />;
  }

  return createElement(defaultMdxComponents.pre as never, props as never);
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    DocMeta,
    DocCallout,
    DocChecklist,
    DocCard,
    DocCardGrid,
    DocStepFlow,
    Mermaid: MermaidDiagram,
    pre: MermaidAwarePre,
    ...components,
  };
}
