export async function extractPrimaryColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      try {
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        let r = 0,
          g = 0,
          b = 0
        let count = 0

        // Sample pixels (step by 5 for performance)
        for (let i = 0; i < data.length; i += 4 * 10) {
          // Ignore transparent pixels or very white/black pixels if needed
          const alpha = data[i + 3]
          if (alpha < 200) continue

          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }

        if (count === 0) {
          resolve(null)
          return
        }

        r = Math.floor(r / count)
        g = Math.floor(g / count)
        b = Math.floor(b / count)

        // Convert to hex
        const toHex = (c: number) => {
          const hex = c.toString(16)
          return hex.length === 1 ? '0' + hex : hex
        }

        const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`
        resolve(hexColor)
      } catch (e) {
        console.error('Error extracting color', e)
        resolve(null)
      }
    }

    img.onerror = (e) => {
      console.error('Error loading image for color extraction', e)
      resolve(null)
    }
  })
}
