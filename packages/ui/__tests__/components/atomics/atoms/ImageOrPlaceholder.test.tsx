import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ImageOrPlaceholder from '@repo/ui/components/atomics/atoms/ImageOrPlaceholder'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }) => 
    <img src={src} alt={alt} {...props} data-testid="next-image" />
  )
}))

// Mock asset imports - make sure to return just the filename
vi.mock('../../../assets/images/placeholder.svg', () => ({
  default: 'placeholder.svg'
}))

describe('ImageOrPlaceholder Component', () => {
  it('should render Next.js Image when src is provided', () => {
    render(
      <ImageOrPlaceholder 
        src="/test-image.jpg" 
        alt="Test image" 
        width={100} 
        height={100} 
      />
    )
    
    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test-image.jpg')
    expect(image).toHaveAttribute('alt', 'Test image')
  })

  it('should render placeholder when src is null', () => {
    render(<ImageOrPlaceholder src={null} width={100} height={100} />)
    
    const placeholder = screen.getByAltText('Placeholder Image')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder.getAttribute('src')).toContain('placeholder.svg')
  })

  it('should render placeholder when src is undefined', () => {
    render(<ImageOrPlaceholder width={100} height={100} />)
    
    const placeholder = screen.getByAltText('Placeholder Image')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder.getAttribute('src')).toContain('placeholder.svg')
  })

  it('should use default alt text when alt is not provided', () => {
    render(<ImageOrPlaceholder src="/test-image.jpg" width={100} height={100} />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('alt', 'image')
  })

  it('should use default alt text when alt is null', () => {
    render(
      <ImageOrPlaceholder 
        src="/test-image.jpg" 
        alt={null} 
        width={100} 
        height={100} 
      />
    )
    
    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('alt', 'image')
  })

  it('should use custom render function when provided', () => {
    const customRender = vi.fn(({ src, alt, ...props }) => (
      <div data-testid="custom-render">
        Custom: {src} - {alt}
      </div>
    ))

    render(
      <ImageOrPlaceholder 
        src="/test-image.jpg" 
        alt="Test image"
        width={100} 
        height={100}
        render={customRender}
      />
    )
    
    const customElement = screen.getByTestId('custom-render')
    expect(customElement).toBeInTheDocument()
    expect(customElement).toHaveTextContent('Custom: /test-image.jpg - Test image')
    expect(customRender).toHaveBeenCalledWith({
      src: '/test-image.jpg',
      alt: 'Test image',
      width: 100,
      height: 100
    })
  })

  it('should pass through additional props to Next.js Image', () => {
    render(
      <ImageOrPlaceholder 
        src="/test-image.jpg"
        width={100} 
        height={100}
        className="test-class"
        loading="lazy"
      />
    )
    
    const image = screen.getByTestId('next-image')
    expect(image).toHaveClass('test-class')
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('should pass through additional props to placeholder img', () => {
    render(
      <ImageOrPlaceholder 
        src={null}
        width={100} 
        height={100}
        className="test-class"
        loading="lazy"
      />
    )
    
    const placeholder = screen.getByAltText('Placeholder Image')
    expect(placeholder).toHaveClass('test-class')
    expect(placeholder).toHaveAttribute('loading', 'lazy')
  })
})
