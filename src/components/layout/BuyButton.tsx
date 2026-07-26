import React from 'react'

interface ButtonPreviewProps {
  text: string
  variant: 'solid' | 'outline' | 'filled'
  isLoading: boolean
  isSuccess: boolean
  onClick: () => void
}

export const BuyButton: React.FC<ButtonPreviewProps> = ({
  text,
  variant,
  isLoading,
  isSuccess,
  onClick
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return 'bg-white text-black hover:bg-gray-200 active:scale-95 shadow-white/10'
      case 'outline':
        return 'bg-transparent border-2 border-white/40 text-white hover:bg-white/10 active:scale-95'
      case 'filled':
        return 'bg-[#BB4D0F] text-white hover:bg-[#d15611] border border-white/10 active:scale-95'
      default:
        return ''
    }
  }

  const getGlowStyles = () => {
    switch (variant) {
      case 'solid':
        return 'bg-white'
      case 'filled':
        return 'bg-[#BB4D0F]'
      case 'outline':
        return 'bg-white/40'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className='group relative'>
      <button
        onClick={onClick}
        disabled={isLoading || isSuccess}
        className={`font-google-sans relative flex h-[74px] min-w-[260px] items-center justify-center overflow-hidden rounded-[28px] px-[42px] text-xl font-bold tracking-tight shadow-2xl transition-all duration-300 disabled:cursor-default ${getVariantStyles()} `}
      >
        {/* Loading Spinner Overlay */}
        {isLoading && (
          <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-[2px]'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-current/30 border-t-current'></div>
          </div>
        )}

        <div className='flex items-center gap-3'>
          <span className='truncate'>
            {isLoading ?
              'Behandler...'
            : isSuccess ?
              'Fullført'
            : text}
          </span>
        </div>
      </button>
      <div
        className={`absolute -inset-1 -z-10 rounded-[28px] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20 ${getGlowStyles()} `}
      />
    </div>
  )
}
