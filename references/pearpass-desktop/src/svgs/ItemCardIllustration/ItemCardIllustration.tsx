import React from 'react'

type ItemCardIllustrationProps = {
  // Pass `null` to omit the width attribute and let the browser derive it from
  // the viewBox aspect ratio (useful when only height is clamped).
  width?: number | string | null
  height?: number | string
}

export const ItemCardIllustration = ({
  width = 361,
  height = 190
}: ItemCardIllustrationProps) => (
  <svg
    width={width ?? undefined}
    height={height}
    viewBox="0 0 361 190"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMin slice"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        id="itemCardBg"
        x1="181.419"
        y1="8.957"
        x2="181.419"
        y2="469.427"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#212814" />
        <stop offset="0.495" stopColor="#15180E" />
      </linearGradient>
      <linearGradient
        id="itemCardFade"
        x1="180.5"
        y1="0"
        x2="180.5"
        y2="190"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.467" stopColor="#15180E" stopOpacity="0" />
        <stop offset="1" stopColor="#15180E" />
      </linearGradient>
      <clipPath id="itemCardClip">
        <rect width="361" height="190" rx="10.5371" />
      </clipPath>
    </defs>
    <g clipPath="url(#itemCardClip)">
      <rect
        x="75.521"
        y="8.957"
        width="211.795"
        height="460.47"
        rx="24.72"
        fill="url(#itemCardBg)"
      />

      <rect
        x="83.688"
        y="45.998"
        width="195.461"
        height="37.104"
        rx="5.3"
        fill="#2C3618"
      />
      <rect
        x="91.639"
        y="53.949"
        width="21.203"
        height="21.203"
        rx="5.3"
        fill="#37431D"
      />
      <rect
        x="120.792"
        y="55.273"
        width="76.197"
        height="8.614"
        rx="4.307"
        fill="#37431D"
      />
      <rect
        x="120.792"
        y="65.213"
        width="51.019"
        height="8.614"
        rx="4.307"
        fill="#37431D"
      />

      <rect
        x="83.688"
        y="88.371"
        width="195.461"
        height="37.104"
        rx="5.3"
        fill="#2C3618"
      />
      <rect
        x="91.639"
        y="96.322"
        width="21.203"
        height="21.203"
        rx="5.3"
        fill="#37431D"
      />
      <rect
        x="120.792"
        y="97.647"
        width="65.596"
        height="8.614"
        rx="4.307"
        fill="#37431D"
      />
      <rect
        x="120.792"
        y="107.586"
        width="59.632"
        height="8.614"
        rx="4.307"
        fill="#37431D"
      />

      <rect
        x="83.688"
        y="130.744"
        width="195.461"
        height="37.104"
        rx="5.3"
        fill="#2C3618"
      />
      <rect
        x="91.639"
        y="138.695"
        width="21.203"
        height="21.203"
        rx="5.3"
        fill="#37431D"
      />
      <rect
        x="120.792"
        y="140.02"
        width="88.123"
        height="8.614"
        rx="4.307"
        fill="#37431D"
      />
      <rect
        x="120.792"
        y="149.959"
        width="73.547"
        height="8.614"
        rx="4.307"
        fill="#37431D"
      />

      <rect
        x="83.688"
        y="173.117"
        width="195.461"
        height="37.104"
        rx="5.3"
        fill="#2C3618"
      />
      <rect
        x="91.639"
        y="181.068"
        width="21.203"
        height="21.203"
        rx="5.3"
        fill="#37431D"
      />
      <rect
        x="120.792"
        y="182.393"
        width="76.197"
        height="8.614"
        rx="4.307"
        fill="#37431D"
      />

      <rect
        x="-71.86"
        y="0"
        width="504.72"
        height="190"
        fill="url(#itemCardFade)"
      />
    </g>
  </svg>
)
