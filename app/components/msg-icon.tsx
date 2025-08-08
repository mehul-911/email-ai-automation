'use client'

interface MSGIconProps {
  className?: string
  size?: number
}

export default function MSGIcon({ className = "w-8 h-8", size }: MSGIconProps) {
  return (
    <svg 
      version="1.2" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1573 1571" 
      width={size || undefined}
      height={size || undefined}
      className={className}
    >
      <defs>
        <linearGradient id="msgGradient" x1="148.8" y1="1420.2" x2="1473.2" y2="98.7" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor"/>
          <stop offset="1" stopColor="currentColor"/>
        </linearGradient>
      </defs>
      <g clipPath="url(#cp1)">
        <g>
          <path 
            fillRule="evenodd" 
            fill="url(#msgGradient)" 
            d="m0.3 0.3h1572v1570.6h-1572zm95.9 1236.6l1089.6-981.2q-63.9 0-124.9 5.8l-964.7 647.4zm0 217.7h723.5l528.9-1178.6q-72.7-14.5-142.4-17.4l-1110 1091.5zm0-621.2l935.6-569c-159.8 26.1-360.3 119-360.3 119l-575.3 258.4zm863 621.2h494v-1149.6q-46.5-14.5-90.1-23.2z"
          />
        </g>
      </g>
      <defs>
        <clipPath id="cp1">
          <path d="m0 0h1573v1571h-1573z"/>
        </clipPath>
      </defs>
    </svg>
  )
}