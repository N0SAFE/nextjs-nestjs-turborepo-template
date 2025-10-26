import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import VideoOrPlaceholder from '@repo/ui/components/atomics/atoms/VideoOrPlaceholder'

// Mock asset imports
vi.mock('../../../assets/video/placeholder.mp4', () => ({
  default: 'placeholder.mp4'
}))

describe('VideoOrPlaceholder Component', () => {
  it('should render video with src when src is provided', () => {
    render(
      <VideoOrPlaceholder 
        src="/test-video.mp4" 
        alt="Test video"
        controls
      />
    )
    
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', '/test-video.mp4')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveTextContent('Test video')
  })

  it('should render placeholder video when src is null', () => {
    render(<VideoOrPlaceholder src={null} alt="Placeholder video" />)
    
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video?.getAttribute('src')).toContain('placeholder.mp4')
    expect(video).toHaveTextContent('Placeholder video')
  })

  it('should render placeholder video when src is undefined', () => {
    render(<VideoOrPlaceholder />)
    
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video?.getAttribute('src')).toContain('placeholder.mp4')
  })

  it('should render with children', () => {
    render(
      <VideoOrPlaceholder src="/test-video.mp4">
        <track kind="captions" src="/captions.vtt" />
      </VideoOrPlaceholder>
    )
    
    const video = document.querySelector('video')
    const track = video?.querySelector('track')
    expect(track).toBeInTheDocument()
    expect(track).toHaveAttribute('kind', 'captions')
    expect(track).toHaveAttribute('src', '/captions.vtt')
  })

  it('should pass through video attributes', () => {
    render(
      <VideoOrPlaceholder 
        src="/test-video.mp4"
        controls
        autoPlay
        muted
        loop
        className="test-class"
      />
    )
    
    const video = document.querySelector('video')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('autoplay')
    expect(video).toHaveProperty('muted', true)
    expect(video).toHaveAttribute('loop')
    expect(video).toHaveClass('test-class')
  })

  it('should handle both children and alt text', () => {
    render(
      <VideoOrPlaceholder src="/test-video.mp4" alt="Video description">
        <track kind="captions" src="/captions.vtt" />
      </VideoOrPlaceholder>
    )
    
    const video = document.querySelector('video')
    const track = video?.querySelector('track')
    
    expect(track).toBeInTheDocument()
    expect(video).toHaveTextContent('Video description')
  })

  it('should render placeholder with alt text when src is null', () => {
    render(<VideoOrPlaceholder src={null} alt="Custom alt text" />)
    
    const video = document.querySelector('video')
    expect(video?.getAttribute('src')).toContain('placeholder.mp4')
    expect(video).toHaveTextContent('Custom alt text')
  })

  it('should work without alt text', () => {
    render(<VideoOrPlaceholder src="/test-video.mp4" />)
    
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', '/test-video.mp4')
  })
})
