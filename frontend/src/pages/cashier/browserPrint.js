export async function finalizeBrowserPrint(windowRef, options = {}) {
  const { document } = windowRef
  
  // Wait for everything to load
  await new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve()
    } else {
      windowRef.addEventListener('load', resolve, { once: true })
    }
  })
  
  // Wait for images
  await Promise.all(Array.from(document.images || []).map(img => {
    if (img.complete) return Promise.resolve()
    return new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
    })
  }))
  
  // Small delay for rendering
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return new Promise((resolve) => {
    let finished = false
    
    const cleanup = () => {
      if (finished) return
      finished = true
      try {
        windowRef.close()
      } catch (e) {
        // Ignore close errors
      }
      resolve()
    }
    
    windowRef.addEventListener('afterprint', cleanup, { once: true })
    windowRef.focus()
    windowRef.print()
    setTimeout(cleanup, 5000)
  })
}
