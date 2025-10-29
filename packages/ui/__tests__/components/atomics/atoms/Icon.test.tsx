import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { AlertCircle, Spinner } from '../../../../src/components/atomics/atoms/Icon'

describe('Icon Components', () => {
  describe('Spinner', () => {
    it('should render a spinning icon', () => {
      render(<Spinner />)
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('animate-spin')
    })

    it('should have correct dimensions', () => {
      render(<Spinner />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveClass('h-4', 'w-4')
    })

    it('should have correct stroke properties', () => {
      render(<Spinner />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
      expect(svg).toHaveAttribute('stroke-width', '2')
    })

    it('should have correct viewBox', () => {
      render(<Spinner />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })
  })

  describe('AlertCircle', () => {
    it('should render with default props', () => {
      render(<AlertCircle className="test-class" />)
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('test-class')
    })

    it('should have correct stroke properties', () => {
      render(<AlertCircle className="test-class" />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
      expect(svg).toHaveAttribute('stroke-width', '2')
    })

    it('should contain circle and line elements', () => {
      render(<AlertCircle className="test-class" />)
      const svg = document.querySelector('svg')
      const circle = svg?.querySelector('circle')
      const lines = svg?.querySelectorAll('line')
      
      expect(circle).toBeInTheDocument()
      expect(lines).toHaveLength(2)
    })

    it('should accept custom className', () => {
      render(<AlertCircle className="custom-class" />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveClass('custom-class')
    })

    it('should have correct viewBox', () => {
      render(<AlertCircle className="test-class" />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })

    it('should have correct dimensions', () => {
      render(<AlertCircle className="test-class" />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('width', '24')
      expect(svg).toHaveAttribute('height', '24')
    })
  })
})
