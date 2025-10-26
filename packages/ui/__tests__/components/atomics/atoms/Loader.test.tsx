import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loader from '@repo/ui/components/atomics/atoms/Loader'

describe('Loader Component', () => {
  it('should render with default props', () => {
    render(<Loader />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    const loadingText = screen.getByText('Loading...')

    expect(status).toBeInTheDocument()
    expect(svg).toBeInTheDocument()
    expect(loadingText).toBeInTheDocument()
  })

  it('should have default size class', () => {
    render(<Loader />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveClass('w-8', 'h-8')
  })

  it('should accept custom size prop', () => {
    render(<Loader size="16" />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveClass('w-16', 'h-16')
  })

  it('should accept all size options', () => {
    const sizes = ['4', '8', '12', '16', '24', '32'] as const
    
    sizes.forEach(size => {
      const { unmount } = render(<Loader size={size} />)
      const status = screen.getByRole('status')
      const svg = status.querySelector('svg')
      expect(svg).toHaveClass(`w-${size}`, `h-${size}`)
      unmount()
    })
  })

  it('should accept custom className', () => {
    render(<Loader className="custom-class" />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveClass('custom-class')
  })

  it('should accept divClassName', () => {
    render(<Loader divClassName="custom-div-class" />)
    const status = screen.getByRole('status')
    expect(status).toHaveClass('custom-div-class')
  })

  it('should have animate-spin class', () => {
    render(<Loader />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveClass('animate-spin')
  })

  it('should have correct fill and text colors', () => {
    render(<Loader />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveClass('fill-blue-600', 'text-gray-200', 'dark:text-gray-600')
  })

  it('should have correct viewBox', () => {
    render(<Loader />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 100 101')
  })

  it('should have accessibility attributes', () => {
    render(<Loader />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    const loadingText = screen.getByText('Loading...')
    
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(loadingText).toHaveClass('sr-only')
  })

  it('should contain two path elements', () => {
    render(<Loader />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    const paths = svg?.querySelectorAll('path')
    
    expect(paths).toHaveLength(2)
  })

  it('should work with combined props', () => {
    render(
      <Loader 
        size="24" 
        className="custom-svg-class" 
        divClassName="custom-div-class" 
      />
    )
    
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    
    expect(status).toHaveClass('custom-div-class')
    expect(svg).toHaveClass('w-24', 'h-24', 'custom-svg-class')
  })
})
