import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@repo/ui/components/atomics/molecules/Card'

describe('Card Component', () => {
  const defaultProps = {
    title: 'Test Card',
    href: 'https://example.com',
    children: 'This is a test card description',
  }

  it('should render with title and children', () => {
    render(<Card {...defaultProps} />)
    
    const title = screen.getByRole('heading', { level: 2 })
    const description = screen.getByText('This is a test card description')
    
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Test Card')
    expect(description).toBeInTheDocument()
  })

  it('should render as a link with correct href', () => {
    render(<Card {...defaultProps} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com?utm_source=create-turbo&utm_medium=with-tailwind&utm_campaign=create-turbo"')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should have correct CSS classes', () => {
    render(<Card {...defaultProps} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveClass(
      'group',
      'rounded-lg',
      'border',
      'border-transparent',
      'px-5',
      'py-4',
      'transition-colors',
      'hover:border-neutral-700',
      'hover:bg-neutral-800/30'
    )
  })

  it('should have correct title styling', () => {
    render(<Card {...defaultProps} />)
    
    const title = screen.getByRole('heading', { level: 2 })
    expect(title).toHaveClass('mb-3', 'text-2xl', 'font-semibold')
  })

  it('should have arrow indicator in title', () => {
    render(<Card {...defaultProps} />)
    
    const arrow = screen.getByText('->')
    expect(arrow).toBeInTheDocument()
    expect(arrow).toHaveClass(
      'inline-block',
      'transition-transform',
      'group-hover:translate-x-1',
      'motion-reduce:transform-none'
    )
  })

  it('should have correct description styling', () => {
    render(<Card {...defaultProps} />)
    
    const description = screen.getByText('This is a test card description')
    expect(description.tagName).toBe('P')
    expect(description).toHaveClass('m-0', 'max-w-[30ch]', 'text-sm', 'opacity-50')
  })

  it('should render with different children content', () => {
    render(
      <Card 
        title="Another Card" 
        href="https://another.com" 
      >
        Different description content
      </Card>
    )
    
    const title = screen.getByText('Another Card')
    const description = screen.getByText('Different description content')
    
    expect(title).toBeInTheDocument()
    expect(description).toBeInTheDocument()
  })

  it('should handle complex children content', () => {
    render(
      <Card 
        title="Complex Card" 
        href="https://complex.com"
      >
        <span>Complex</span> content with <strong>markup</strong>
      </Card>
    )
    
    const complexSpan = screen.getByText('Complex')
    const strongText = screen.getByText('markup')
    
    expect(complexSpan).toBeInTheDocument()
    expect(strongText).toBeInTheDocument()
    expect(strongText.tagName).toBe('STRONG')
  })

  it('should append UTM parameters to href correctly', () => {
    render(<Card title="UTM Test" href="https://test.com/path">Test</Card>)
    
    const link = screen.getByRole('link')
    const href = link.getAttribute('href')
    
    expect(href).toContain('utm_source=create-turbo')
    expect(href).toContain('utm_medium=with-tailwind')
    expect(href).toContain('utm_campaign=create-turbo')
  })
})
