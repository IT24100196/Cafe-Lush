const PX_TO_MM = 25.4 / 96

function waitForDocumentReady(windowRef) {
  const { document } = windowRef
  if (document.readyState === 'complete') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    windowRef.addEventListener('load', resolve, { once: true })
  })
}

function waitForImageLoad(image) {
  return new Promise((resolve) => {
    if (image.complete) {
      resolve()
      return
    }

    image.addEventListener('load', resolve, { once: true })
    image.addEventListener('error', resolve, { once: true })
  })
}

function waitForLayout(windowRef) {
  return new Promise((resolve) => {
    const raf = windowRef.requestAnimationFrame || ((cb) => setTimeout(cb, 16))
    raf(() => raf(resolve))
  })
}

export async function finalizeThermalPrint(windowRef, {
  widthMm = 80,
  minHeightMm = 70,
  extraHeightMm = 8,
  selector = '.receipt',
} = {}) {
  const { document } = windowRef

  await waitForDocumentReady(windowRef)
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      // Ignore font readiness failures from the browser.
    }
  }
  await Promise.all(Array.from(document.images || []).map(waitForImageLoad))
  await waitForLayout(windowRef)

  const receipt = document.querySelector(selector)
  const pageSizeStyle = document.getElementById('receipt-page-size')

  if (receipt && pageSizeStyle) {
    const contentHeightPx = Math.ceil(Math.max(
      receipt.scrollHeight,
      receipt.offsetHeight,
      receipt.getBoundingClientRect().height
    ))
    const dynamicHeightMm = Math.ceil((contentHeightPx * PX_TO_MM) + extraHeightMm)
    const heightMm = Math.max(minHeightMm, dynamicHeightMm)
    pageSizeStyle.textContent = `@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`
  }

  await waitForLayout(windowRef)
  await new Promise((resolve) => setTimeout(resolve, 80))

  return new Promise((resolve) => {
    let finished = false

    const cleanup = () => {
      if (finished) return
      finished = true
      try {
        windowRef.close()
      } catch {
        // Ignore close errors from the browser.
      }
      resolve()
    }

    windowRef.addEventListener('afterprint', cleanup, { once: true })
    windowRef.focus()
    windowRef.print()
    setTimeout(cleanup, 4000)
  })
}
