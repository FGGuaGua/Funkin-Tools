<template>
  <div class="logo-container">
    <svg
      viewBox="0 -70 320 120"
      width="320"
      height="120"
      role="img"
      aria-label="Funkin Tools Logo"
    >
      <filter id="groupStroke" x="-5%" y="0%" width="110%" height="110%">

        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="alpha"
        />

        <feMorphology
          in="alpha"
          operator="dilate"
          radius="13"
          result="dilateOuter"
        />
        <feGaussianBlur in="dilateOuter" stdDeviation="6" result="blurOuter" />
        <feColorMatrix
          in="blurOuter"
          type="matrix"
          values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 100 -50
          "
          result="strokeOuter"
        />

        <feFlood flood-color="#3841BB" flood-opacity="1" result="colorOuter" />
        <feComposite in="colorOuter" in2="strokeOuter" operator="in" result="coloredOuter" />

        <feMorphology
          in="alpha"
          operator="dilate"
          radius="6"
          result="dilateInner"
        />
        <feGaussianBlur in="dilateInner" stdDeviation="3" result="blurInner" />
        <feColorMatrix
          in="blurInner"
          type="matrix"
          values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 100 -50
          "
          result="strokeInner"
        />
        <feFlood flood-color="#000000" flood-opacity="1" result="colorInner" />
        <feComposite in="colorInner" in2="strokeInner" operator="in" result="coloredInner" />

        <feMerge>
          <feMergeNode in="coloredOuter" />
          <feMergeNode in="coloredInner" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <g filter="url(#groupStroke)" font-family="Arial, Helvetica, sans-serif">
        <text class="logo-text" x="8" y="0" font-size="68" font-weight="800" fill="#F7339A" translate="no">
          Funkin'
        </text>
        <text class="logo-text" x="170" y="32" font-size="52" font-style="oblique" font-weight="600" fill="#FFFFFF" translate="no">
          Tools
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
  .logo-container {
    display: flex;
    justify-content: center;
    padding: 10px;
    min-height: 140px;
  }

  .logo-container svg {
    display: block;
    max-width: 100%;
    height: auto;
    filter: drop-shadow(0 0 0.6em #2f55a0);
    transition: filter 0.3s ease;
  }
  .logo-container svg:hover {
    filter: drop-shadow(0 0 1em #2f55a0);
  }
  .logo-text {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -user-select: none;
  }
</style>