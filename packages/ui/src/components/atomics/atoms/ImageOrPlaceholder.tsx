import Image, { ImageProps } from 'next/image'
import React from 'react'

const ImageOrPlaceholder: React.FC<
    Omit<ImageProps, 'src' | 'alt'> & {
        src?: ImageProps['src'] | null
        alt?: ImageProps['alt'] | null
        render?: (props: ImageProps) => React.ReactNode
    }
> = ({ src, alt, render, ...props }) => {
    if (src) {
        return typeof render === 'function' ? (
            render({ src, alt: alt ?? 'image', ...props })
        ) : (
            <Image src={src} alt={alt ?? 'image'} {...props} />
        )
    }
    return (
        <img
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            src={require('../../../assets/images/placeholder.svg') as string}
            alt={'Placeholder Image'}
            {...props}
        />
    )
}

export default ImageOrPlaceholder
